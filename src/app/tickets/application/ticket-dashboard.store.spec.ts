import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { TicketDashboardStore } from './ticket-dashboard.store';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { TicketCountQuery } from '../entities/ticket-count-query';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketSlaStatus } from '../entities/ticket-sla-status';
import { TicketStatus } from '../entities/ticket-status';
import { SessionService } from '../../shared';

describe('TicketDashboardStore', () => {
  let dataService: jasmine.SpyObj<TicketDataService>;
  let permissions: Set<string>;

  /** Cada recorte devolve um número diferente, pra o teste saber qual contagem caiu em qual campo. */
  function countFor(query: TicketCountQuery): number {
    if (query.slaStatus === TicketSlaStatus.Met) return 7;
    if (query.slaStatus === TicketSlaStatus.Breached) return 2;
    if (query.slaStatus === TicketSlaStatus.AtRisk) return 1;
    if (query.priority === TicketPriority.Urgent) return 4;
    if (query.unassignedOnly) return 3;
    if (query.statuses?.length === 2) return 5;
    if (query.statuses?.[0] === TicketStatus.InProgress) return 2;
    if (query.statuses?.[0] === TicketStatus.Resolved) return 6;
    if (query.statuses?.[0] === TicketStatus.Closed) return 1;
    return 20;
  }

  /** Cria o Store com o Data Service falso e as permissões do teste. */
  function createStore() {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: TicketDataService, useValue: dataService },
        { provide: SessionService, useValue: { userId: signal('u-me'), hasPermission: (code: string) => permissions.has(code) } }
      ]
    });
    return TestBed.inject(TicketDashboardStore);
  }

  beforeEach(() => {
    dataService = jasmine.createSpyObj('TicketDataService', ['count']);
    dataService.count.and.callFake((query: TicketCountQuery) => of(countFor(query)));
    permissions = new Set(['tickets:manage']);
  });

  it('monta Volume, SLA e Central de atenção a partir do totalCount do servidor', async () => {
    const store = createStore();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.volume()).toEqual({ total: 20, backlog: 5, inProgress: 2, resolved: 6, closed: 1 });
    expect(store.sla()).toEqual({ met: 7, breached: 2, atRisk: 1 });
    expect(store.attention()).toEqual({ overdue: 2, critical: 4, unassigned: 3 });
  });

  it('conta o backlog como Aberto + Em Andamento e os críticos como urgentes ativos', async () => {
    createStore();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.count).toHaveBeenCalledWith(jasmine.objectContaining({ statuses: [TicketStatus.Open, TicketStatus.InProgress] }));
    expect(dataService.count).toHaveBeenCalledWith(jasmine.objectContaining({
      priority: TicketPriority.Urgent, statuses: [TicketStatus.Open, TicketStatus.InProgress]
    }));
  });

  it('leva o recorte (setor, prioridade, "meus") pra todas as contagens', async () => {
    const store = createStore();
    store.setScope({ sectorId: 's1', priority: TicketPriority.Urgent, assignee: 'me' });
    await TestBed.inject(ApplicationRef).whenStable();

    const queries = dataService.count.calls.allArgs().map(([query]) => query);
    const scoped = queries.filter(q => q.sectorId === 's1');
    expect(scoped.length).toBeGreaterThan(0);
    expect(scoped.every(q => q.assignedToUserId === 'u-me' || q.unassignedOnly)).toBeTrue();
  });

  it('respeita as interseções sem perguntar à API: outra prioridade não tem urgentes, "meus" não tem sem responsável', async () => {
    const store = createStore();
    store.setScope({ priority: TicketPriority.Low, assignee: 'me' });
    await TestBed.inject(ApplicationRef).whenStable();
    dataService.count.calls.reset();
    store.reloadAttention();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.attention()).toEqual({ overdue: 2, critical: 0, unassigned: 0 });
    // Só a contagem de atrasados foi à API.
    expect(dataService.count).toHaveBeenCalledTimes(1);
  });

  it('um widget com erro não derruba os outros', async () => {
    dataService.count.and.callFake((query: TicketCountQuery) =>
      query.slaStatus === TicketSlaStatus.Met ? throwError(() => new HttpErrorResponse({ status: 500 })) : of(countFor(query)));
    const store = createStore();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.sla()).toBeNull();
    expect(store.slaError()).toBe('Não foi possível carregar o SLA.');
    expect(store.volume()).not.toBeNull();
    expect(store.volumeError()).toBeNull();
    expect(store.attention()).not.toBeNull();
  });

  it('o "Tentar novamente" de um widget recarrega só ele', async () => {
    const store = createStore();
    await TestBed.inject(ApplicationRef).whenStable();
    dataService.count.calls.reset();

    store.reloadSla();
    await TestBed.inject(ApplicationRef).whenStable();

    // As 3 contagens do SLA, nenhuma do Volume nem da Central.
    expect(dataService.count).toHaveBeenCalledTimes(3);
  });

  it('recorte igual não refaz as contagens', async () => {
    const store = createStore();
    store.setScope({ sectorId: 's1' });
    await TestBed.inject(ApplicationRef).whenStable();
    dataService.count.calls.reset();

    store.setScope({ sectorId: 's1' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.count).not.toHaveBeenCalled();
  });

  it('sem tickets:manage, nem chama a API (evita um 403 certo)', async () => {
    permissions = new Set(['tickets:view-own']);
    const store = createStore();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.count).not.toHaveBeenCalled();
    expect(store.volume()).toBeNull();
    expect(store.volumeError()).toBeNull();
  });
});
