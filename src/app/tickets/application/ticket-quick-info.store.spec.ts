import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { TicketQuickInfoStore } from './ticket-quick-info.store';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { TicketDetail } from '../entities/ticket';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { TicketSlaStatus } from '../entities/ticket-sla-status';
import { TicketSla } from '../entities/ticket-sla';

/** Prazo do dono ainda aberto (o relógio dos testes nunca chega lá). */
const FAR_FUTURE = '2999-01-01T00:00:00Z';

describe('TicketQuickInfoStore', () => {
  const sla: TicketSla = { serverNowUtc: '2026-01-01T12:00:00Z', plan: { policyId: null, policyName: '', policyVersion: 1, calendarId: '', calendarName: '', isLegacy: false }, objectives: [] };
  const ticket: TicketDetail = {
    id: 't1', title: 'Impressora não funciona', description: 'Não imprime.',
    priority: TicketPriority.Medium, status: TicketStatus.Open,
    openedByUserId: 'u1', openedByName: 'Maria Souza', canCancel: true, ownerCancelDeadlineUtc: FAR_FUTURE, assignedToUserId: null, assignedToName: null,
    sectorId: 's1', sectorName: 'Suporte',
    createdAtUtc: '2026-01-01T12:00:00Z', dueAtUtc: '2026-01-02T12:00:00Z', slaWarningAtUtc: '2026-01-02T06:00:00Z',
    resolvedAtUtc: null, slaStatus: TicketSlaStatus.OnTime, sla
  };

  let store: InstanceType<typeof TicketQuickInfoStore>;
  let dataService: jasmine.SpyObj<TicketDataService>;

  beforeEach(() => {
    dataService = jasmine.createSpyObj('TicketDataService', ['getById']);
    dataService.getById.and.returnValue(of(ticket));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TicketQuickInfoStore,
        { provide: TicketDataService, useValue: dataService }
      ]
    });
    store = TestBed.inject(TicketQuickInfoStore);
  });

  it('does not call the API before a ticket is selected', () => {
    expect(dataService.getById).not.toHaveBeenCalled();
  });

  it('fetches the full detail of the selected ticket', async () => {
    store.select('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getById).toHaveBeenCalledWith('t1');
    expect(store.ticket()).toEqual(ticket);
  });

  it('clears the selection without triggering a new fetch', async () => {
    store.select('t1');
    await TestBed.inject(ApplicationRef).whenStable();
    dataService.getById.calls.reset();

    store.select(undefined);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getById).not.toHaveBeenCalled();
    expect(store.ticket()).toBeUndefined();
  });

  it('exposes a specific message when the ticket does not exist (404)', async () => {
    dataService.getById.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

    store.select('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.state().error).toBe('Não encontramos esse chamado — ele pode ter sido removido.');
  });

  it('exposes a specific message when permission is missing (403)', async () => {
    dataService.getById.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    store.select('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.state().error).toBe('Você não tem acesso a este chamado.');
  });

  it('fetches the description of the selected ticket again after a failure', async () => {
    dataService.getById.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    store.select('t1');
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.state().error).toBeTruthy();

    dataService.getById.and.returnValue(of(ticket));
    store.reload();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getById).toHaveBeenCalledTimes(2);
    expect(store.state().error).toBeNull();
    expect(store.ticket()).toEqual(ticket);
  });
});
