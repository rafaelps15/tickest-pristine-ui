import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NEVER, of, throwError, Subject } from 'rxjs';
import { TicketSummaryStore } from './ticket-summary.store';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { TicketStatusCounts } from '../entities/ticket-status-counts';
import { TicketSlaStatus } from '../entities/ticket-sla-status';
import { TicketSortOrder } from '../entities/ticket-sort-order';
import { TicketMonitorItem } from '../entities/ticket-monitor-item';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { PagedResponse, SessionService } from '../../shared';
import { TicketAssignee } from '../entities/ticket-assignee';

/** Página de candidatos a responsável como GET /tickets/assignees devolve. */
function assigneePage(items: TicketAssignee[]): PagedResponse<TicketAssignee> {
  return { items, page: 1, pageSize: 8, totalCount: items.length, totalPages: 1, hasPreviousPage: false, hasNextPage: false };
}


describe('TicketSummaryStore', () => {
  let store: InstanceType<typeof TicketSummaryStore>;
  let dataService: jasmine.SpyObj<TicketDataService>;
  let sessionService: jasmine.SpyObj<SessionService>;

  const statusCounts: TicketStatusCounts = {
    totalCount: 10, openCount: 3, inProgressCount: 2, resolvedCount: 4, closedCount: 1, canceledCount: 0
  };

  const criticalTicket: TicketMonitorItem = {
    id: 't1', title: 'Chamado urgente', priority: TicketPriority.High, status: TicketStatus.InProgress,
    requesterId: 'r1', requesterName: 'Fulano', requesterEmail: 'fulano@empresa.com',
    assignedToUserId: 'u1', assignedToName: 'Atendente', sectorId: 's1', sectorName: 'TI',
    createdAtUtc: '2026-01-01T12:00:00Z', dueAtUtc: '2026-01-02T12:00:00Z', slaWarningAtUtc: '2026-01-02T06:00:00Z',
    resolvedAtUtc: null, slaStatus: TicketSlaStatus.AtRisk
  };

  const breachedTicket: TicketMonitorItem = {
    ...criticalTicket, id: 't0', title: 'Chamado já vencido', dueAtUtc: '2026-01-01T09:00:00Z', slaStatus: TicketSlaStatus.Breached
  };

  /** Injeta o store (disparando a busca inicial com o retorno já configurado no spy) e espera estabilizar. */
  async function createStore(): Promise<InstanceType<typeof TicketSummaryStore>> {
    const created = TestBed.inject(TicketSummaryStore);
    await TestBed.inject(ApplicationRef).whenStable();
    return created;
  }

  beforeEach(async () => {
    dataService = jasmine.createSpyObj('TicketDataService', ['getStatusCounts', 'getVolume', 'getAll', 'getSlaSummary', 'assignTicket', 'getAssignees']);
    // Servidor 2 minutos à frente do navegador — o prazo relativo do card deve seguir o servidor.
    dataService.getSlaSummary.and.callFake(() => of({
      activeCount: 0, onTimeCount: 0, atRiskCount: 0, breachedCount: 0,
      serverNowUtc: new Date(Date.now() + 120_000).toISOString()
    }));
    dataService.getStatusCounts.and.returnValue(of(statusCounts));
    dataService.getVolume.and.returnValue(of([
      { periodStart: '2026-01-05', count: 2 },
      { periodStart: '2026-01-06', count: 5 }
    ]));
    // Responde conforme o filtro de SLA pedido: 1 em risco (t1) e 1 vencido (t0, prazo mais antigo), de um total de 7 vencidos.
    dataService.getAll.and.callFake(filters => of(filters.slaStatus === TicketSlaStatus.Breached
      ? { items: [breachedTicket], page: 1, pageSize: 5, totalCount: 7, totalPages: 2, hasPreviousPage: false, hasNextPage: true }
      : { items: [criticalTicket], page: 1, pageSize: 5, totalCount: 1, totalPages: 1, hasPreviousPage: false, hasNextPage: false }));

    sessionService = jasmine.createSpyObj('SessionService', ['hasPermission']);
    sessionService.hasPermission.and.returnValue(true);

    configure();
    store = await createStore();
  });

  /** Configura o TestBed com os falsos atuais (o store lê a permissão ao ser criado). */
  function configure(): void {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TicketSummaryStore,
        { provide: TicketDataService, useValue: dataService },
        { provide: SessionService, useValue: sessionService }
      ]
    });
  }

  it('whoever serves the queue requests the company volume (chart), but not the totals by status: they come in the operation aggregate', () => {
    expect(dataService.getStatusCounts).not.toHaveBeenCalled();
    expect(dataService.getVolume).toHaveBeenCalledWith('Day');
    expect(store.volumeHasValue()).toBeTrue();
  });

  it('a totals error remains in effect while the retry loads (the Angular resource keeps the error on reload)', async () => {
    TestBed.resetTestingModule();
    sessionService.hasPermission.and.callFake((code: string) => code !== 'tickets:manage');
    dataService.getStatusCounts.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    configure();
    store = await createStore();
    expect(store.statusCountsFailed()).toBeTrue();

    // A nova tentativa fica pendurada (nunca responde): o erro anterior continua.
    dataService.getStatusCounts.and.returnValue(NEVER);
    store.load();
    TestBed.tick();
    expect(store.statusCountsLoading()).toBeTrue();
    expect(store.statusCountsFailed()).toBeTrue();
  });

  describe('company view for whoever does not serve the queue (RN-35)', () => {
    beforeEach(async () => {
      TestBed.resetTestingModule();
      sessionService.hasPermission.and.callFake((code: string) => code !== 'tickets:manage');
      configure();
      store = await createStore();
    });

    it('fetches the totals by status and the volume (grouped by day, by default) of the whole company', () => {
      expect(dataService.getStatusCounts).toHaveBeenCalled();
      expect(dataService.getVolume).toHaveBeenCalledWith('Day');
    });

    it('exposes the company totals by status', () => {
      expect(store.statusCounts()).toEqual(statusCounts);
    });

    it('exposes the volume points returned by the API', () => {
      expect(store.volume()).toEqual([
        { periodStart: '2026-01-05', count: 2 },
        { periodStart: '2026-01-06', count: 5 }
      ]);
    });

    it('redoes the volume fetch with the new grouping when the period changes', async () => {
      store.setGroupBy('Month');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(dataService.getVolume).toHaveBeenCalledWith('Month');
    });

    it('exposes an error message when the totals by status fetch fails', async () => {
      dataService.getStatusCounts.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      store.load();
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.summaryError()).toBe('Erro ao carregar o resumo dos chamados');
      expect(store.statusCountsFailed()).toBeTrue();
      expect(store.volumeFailed()).toBeFalse();
      // Os totais em erro não podem lançar — a tela os lê sempre, mostrando "—".
      expect(store.statusCounts()).toBeNull();
    });

    it('without permission (403), states the reason instead of the generic message', async () => {
      dataService.getStatusCounts.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

      store.load();
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.summaryError()).toBe('Você não tem permissão para ver os números da empresa.');
    });

    it('does not flag any fetch as failed when both respond', () => {
      expect(store.statusCountsFailed()).toBeFalse();
      expect(store.volumeFailed()).toBeFalse();
    });

    it('exposes an error message when the volume fetch fails', async () => {
      dataService.getVolume.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      store.load();
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.summaryError()).toBe('Erro ao carregar o volume de chamados');
      expect(store.volumeFailed()).toBeTrue();
      expect(store.statusCountsFailed()).toBeFalse();
      expect(store.volume()).toEqual([]);
    });
  });

  it('in the "Com filtros" scope, the alerts follow the cut (sectors, priority, no assignee and period); an identical cut does not refetch', async () => {
    dataService.getAll.calls.reset();
    store.setCriticalScope({ sectorIds: ['s1', 's2'], priority: TicketPriority.Urgent, assignee: 'none', from: '2026-10-01', to: '2026-10-28' });
    await TestBed.inject(ApplicationRef).whenStable();

    const expected = { sectorIds: ['s1', 's2'], priority: TicketPriority.Urgent, unassignedOnly: true, createdFrom: '2026-10-01', createdTo: '2026-10-28' };
    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ ...expected, slaStatus: TicketSlaStatus.Breached }));
    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ ...expected, slaStatus: TicketSlaStatus.AtRisk }));

    dataService.getAll.calls.reset();
    store.setCriticalScope({ sectorIds: ['s1', 's2'], priority: TicketPriority.Urgent, assignee: 'none', from: '2026-10-01', to: '2026-10-28' });
    await TestBed.inject(ApplicationRef).whenStable();
    expect(dataService.getAll).not.toHaveBeenCalled();
  });

  it('with the Alertas cut not yet safe, the list is not requested; setCriticalScope releases it already with the right cut', async () => {
    dataService.getAll.calls.reset();
    store.holdCriticalScope();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(dataService.getAll).not.toHaveBeenCalled();

    store.setCriticalScope({ sectorIds: ['s9'] });
    await TestBed.inject(ApplicationRef).whenStable();
    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ sectorIds: ['s9'], slaStatus: TicketSlaStatus.Breached }));
    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ sectorIds: ['s9'], slaStatus: TicketSlaStatus.AtRisk }));
  });

  it('fetches the tickets with overdue and at-risk SLA, sorted by due date, for whoever has chamados:manage', () => {
    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({
      slaStatus: TicketSlaStatus.Breached, sort: TicketSortOrder.DueDate, page: 1, pageSize: 5, sectorIds: undefined
    }));
    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({
      slaStatus: TicketSlaStatus.AtRisk, sort: TicketSortOrder.DueDate, page: 1, pageSize: 5, sectorIds: undefined
    }));
    // O vencido (prazo mais antigo) vem primeiro.
    expect(store.criticalTickets()).toEqual([breachedTicket, criticalTicket]);
  });

  it('measures the difference between the server clock and the browser clock, to anchor the relative due date', () => {
    expect(dataService.getSlaSummary).toHaveBeenCalled();
    // ~120s, com folga pro tempo que o teste leva entre o fake e o recebimento.
    expect(store.clockOffsetMs()).toBeGreaterThan(115_000);
    expect(store.clockOffsetMs()).toBeLessThan(125_000);
  });

  it('exposes the company total of overdue and at-risk tickets, not only the listed ones', () => {
    expect(store.breachedCount()).toBe(7);
    expect(store.atRiskCount()).toBe(1);
  });

  describe('slots of the list (5: up to 3 overdue + up to 2 at risk)', () => {
    /** Faz a API devolver `breached` vencidos e `atRisk` em risco, ids b0.. / r0.., já ordenados por prazo. */
    async function respondWith(breached: number, atRisk: number): Promise<string[]> {
      const many = (prefix: string, count: number, status: TicketSlaStatus) => Array.from({ length: count }, (_, i) => ({
        ...criticalTicket, id: `${prefix}${i}`, slaStatus: status, dueAtUtc: `2026-01-0${i + 1}T12:00:00Z`
      }));
      dataService.getAll.and.callFake(filters => {
        const isBreached = filters.slaStatus === TicketSlaStatus.Breached;
        const items = isBreached ? many('b', breached, TicketSlaStatus.Breached) : many('r', atRisk, TicketSlaStatus.AtRisk);
        return of({ items, page: 1, pageSize: 5, totalCount: items.length, totalPages: 1, hasPreviousPage: false, hasNextPage: false });
      });
      store.load();
      await TestBed.inject(ApplicationRef).whenStable();
      return store.criticalTickets().map(t => t.id);
    }

    it('with many of both, reserves 3 slots for overdue and 2 for at risk (which can still be saved)', async () => {
      expect(await respondWith(5, 5)).toEqual(['b0', 'b1', 'b2', 'r0', 'r1']);
    });

    it('with no at-risk tickets, the overdue ones take all 5 slots', async () => {
      expect(await respondWith(5, 0)).toEqual(['b0', 'b1', 'b2', 'b3', 'b4']);
    });

    it('with few overdue, the at-risk ones take the leftover', async () => {
      expect(await respondWith(1, 5)).toEqual(['b0', 'r0', 'r1', 'r2', 'r3']);
    });

    it('with only 1 at risk, the leftover slot goes back to the overdue', async () => {
      expect(await respondWith(5, 1)).toEqual(['b0', 'b1', 'b2', 'b3', 'r0']);
    });
  });

  it('reloads only the SLA alerts with reloadCritical(), without redoing totals or volume', async () => {
    dataService.getStatusCounts.calls.reset();
    dataService.getVolume.calls.reset();
    dataService.getAll.calls.reset();

    store.reloadCritical();
    expect(store.criticalTicketsRefreshing()).toBeTrue();
    expect(store.criticalTicketsLoading()).toBeFalse(); // a lista atual continua na tela
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledTimes(2);
    expect(dataService.getStatusCounts).not.toHaveBeenCalled();
    expect(dataService.getVolume).not.toHaveBeenCalled();
    expect(store.criticalTicketsRefreshing()).toBeFalse();
  });

  it('exposes when the SLA alerts arrived, for the card "Atualizado às"', () => {
    const loadedAt = store.criticalTicketsLoadedAtMs();
    expect(loadedAt).not.toBeNull();
    expect(Math.abs(Date.now() - loadedAt!)).toBeLessThan(5_000);
  });

  it('redoes the fetch of critical SLA tickets when calling load()', async () => {
    store.load();
    await TestBed.inject(ApplicationRef).whenStable();

    // 2 chamadas na carga inicial (vencidos + em risco) e mais 2 no reload.
    expect(dataService.getAll).toHaveBeenCalledTimes(4);
  });

  it('exposes an error message when the fetch of at-risk SLA tickets fails', async () => {
    dataService.getAll.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.load();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.criticalTicketsError()).toBe('Erro ao carregar os alertas de SLA');
    expect(store.criticalTicketsLoading()).toBeFalse();
    // Ler os derivados em erro não pode lançar (o template os lê sempre, mesmo mostrando o erro).
    expect(store.criticalTickets()).toEqual([]);
    expect(store.breachedCount()).toBe(0);
    expect(store.clockOffsetMs()).toBe(0);
  });

  describe('assigning an assignee to an SLA alert', () => {
    const candidate: TicketAssignee = { id: 'u9', fullName: 'Ana Lima', sectorId: null, sectorName: null };

    it('fetches the eligible assignees by the typed text and exposes the list', async () => {
      dataService.getAssignees.and.returnValue(of({ items: [candidate], page: 1, pageSize: 8, totalCount: 1, totalPages: 1, hasPreviousPage: false, hasNextPage: false }));

      store.searchAssignees('  ana ');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(dataService.getAssignees).toHaveBeenCalledWith('ana', undefined, 1, 8);
      expect(store.assigneeCandidates()).toEqual([candidate]);
      expect(store.searchingAssignees()).toBeFalse();
    });

    it('does not fetch with empty text and clears the list', () => {
      store.searchAssignees('   ');

      expect(dataService.getAssignees).not.toHaveBeenCalled();
      expect(store.assigneeCandidates()).toEqual([]);
    });

    it('exposes its own error message when the search is denied (403)', async () => {
      dataService.getAssignees.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

      store.searchAssignees('ana');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.assigneeSearchError()).toBe('Você não tem permissão para buscar responsáveis.');
      expect(store.assigneeCandidates()).toEqual([]);
    });

    it('cancels the previous search when another one starts: only the response of the last term is shown', async () => {
      const first = new Subject<PagedResponse<TicketAssignee>>();
      const second = new Subject<PagedResponse<TicketAssignee>>();
      const late: TicketAssignee = { ...candidate, id: 'u-late', fullName: 'Joana Dias' };
      dataService.getAssignees.and.returnValues(first, second);

      store.searchAssignees('jo');
      TestBed.tick();
      expect(store.searchingAssignees()).toBeTrue();
      store.searchAssignees('joão');
      TestBed.tick();

      expect(first.observed).withContext('a primeira busca é cancelada').toBeFalse();
      second.next(assigneePage([candidate]));
      second.complete();
      first.next(assigneePage([late]));
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.assigneeCandidates()).toEqual([candidate]);
      expect(store.searchingAssignees()).toBeFalse();
      expect(dataService.getAssignees.calls.allArgs()).toEqual([['jo', undefined, 1, 8], ['joão', undefined, 1, 8]]);
    });

    it('assigns, reloads only the alerts and calls onSuccess', async () => {
      dataService.assignTicket.and.returnValue(of(undefined));
      dataService.getAll.calls.reset();
      dataService.getStatusCounts.calls.reset();
      const onSuccess = jasmine.createSpy('onSuccess');

      store.assignResponsible('t1', 'u9', onSuccess);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(dataService.assignTicket).toHaveBeenCalledWith('t1', 'u9');
      expect(dataService.getAll).toHaveBeenCalledTimes(2); // vencidos + em risco
      expect(dataService.getStatusCounts).not.toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
      expect(store.assigning()).toBeFalse();
    });

    it('keeps the assignment error (409) for the dialog, without calling onSuccess', async () => {
      dataService.assignTicket.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
      const onSuccess = jasmine.createSpy('onSuccess');

      store.assignResponsible('t1', 'u9', onSuccess);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.assignError()).toContain('o chamado pode já ter outro responsável');
      expect(onSuccess).not.toHaveBeenCalled();
      expect(store.assigning()).toBeFalse();

      store.clearAssignError();
      expect(store.assignError()).toBeNull();
    });
  });

  describe('without the tickets:manage permission', () => {
    beforeEach(async () => {
      sessionService.hasPermission.and.returnValue(false);
      dataService.getAll.calls.reset();
      dataService.getSlaSummary.calls.reset();

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          TicketSummaryStore,
          { provide: TicketDataService, useValue: dataService },
          { provide: SessionService, useValue: sessionService }
        ]
      });
      store = await createStore();
    });

    it('does not fetch the at-risk SLA tickets, and the list stays empty', () => {
      expect(dataService.getAll).not.toHaveBeenCalled();
      expect(dataService.getSlaSummary).not.toHaveBeenCalled();
      expect(store.criticalTickets()).toEqual([]);
      expect(store.clockOffsetMs()).toBe(0);
    });
  });
});
