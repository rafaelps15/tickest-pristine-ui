import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { updateWithFreshState } from './ticket-fresh-update';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { TicketDetail } from '../entities/ticket';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { TicketSlaStatus } from '../entities/ticket-sla-status';

/** O chamado t1 relido pelo GET /tickets/{id}: alguém mudou a descrição e assumiu o chamado depois da carga da tela. */
const freshTicket: TicketDetail = {
  id: 't1', title: 'Impressora não funciona', description: 'Descrição mudada por outra pessoa depois da carga.',
  priority: TicketPriority.Medium, status: TicketStatus.InProgress,
  openedByUserId: 'u1', openedByName: 'Maria Souza', assignedToUserId: 'u2', assignedToName: 'João Pedro', sectorId: 's1', sectorName: 'Helpdesk',
  createdAtUtc: '2026-01-01T12:00:00Z', dueAtUtc: '2026-01-02T12:00:00Z', slaWarningAtUtc: '2026-01-02T06:00:00Z', resolvedAtUtc: null,
  slaStatus: TicketSlaStatus.OnTime, canCancel: true, ownerCancelDeadlineUtc: '2026-01-01T12:15:00Z',
  sla: { serverNowUtc: '2026-01-01T12:05:00Z', plan: { policyId: 'p1', policyName: 'Padrão', policyVersion: 1, calendarId: 'c1', calendarName: 'Expediente', isLegacy: false }, objectives: [] }
};

describe('updateWithFreshState', () => {
  let dataService: jasmine.SpyObj<TicketDataService>;

  beforeEach(() => {
    dataService = jasmine.createSpyObj('TicketDataService', ['getById', 'update']);
    dataService.getById.and.returnValue(of(freshTicket));
    dataService.update.and.returnValue(of(undefined));
  });

  it('re-reads the ticket before the PUT and sends the re-read description, changing only the status', () => {
    const complete = jasmine.createSpy('complete');

    updateWithFreshState(dataService, 't1', { status: TicketStatus.Canceled }).subscribe({ complete });

    expect(dataService.getById).toHaveBeenCalledBefore(dataService.update);
    expect(dataService.getById).toHaveBeenCalledOnceWith('t1');
    expect(dataService.update).toHaveBeenCalledOnceWith('t1', { description: freshTicket.description, status: TicketStatus.Canceled });
    expect(complete).toHaveBeenCalled();
  });

  it('keeps the re-read status when only the description changes', () => {
    updateWithFreshState(dataService, 't1', { description: 'Texto novo.' }).subscribe();

    expect(dataService.update).toHaveBeenCalledOnceWith('t1', { description: 'Texto novo.', status: TicketStatus.InProgress });
  });

  it('does not send the PUT when the re-read fails, and hands the error to whoever subscribes', () => {
    const failure = new HttpErrorResponse({ status: 404 });
    dataService.getById.and.returnValue(throwError(() => failure));
    const error = jasmine.createSpy('error');

    updateWithFreshState(dataService, 't1', { status: TicketStatus.Canceled }).subscribe({ error });

    expect(dataService.update).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledOnceWith(failure);
  });

  it('hands the failure of the PUT itself to whoever subscribes', () => {
    const failure = new HttpErrorResponse({ status: 409 });
    dataService.update.and.returnValue(throwError(() => failure));
    const error = jasmine.createSpy('error');

    updateWithFreshState(dataService, 't1', { status: TicketStatus.Canceled }).subscribe({ error });

    expect(error).toHaveBeenCalledOnceWith(failure);
  });
});
