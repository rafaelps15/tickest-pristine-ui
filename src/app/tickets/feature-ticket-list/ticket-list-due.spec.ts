import { TICKET_LIST_DUE_DISPLAY, TICKET_LIST_REOPENED_DUE_DISPLAY, currentTicketDue } from './ticket-list-due';
import { Ticket } from '../entities/ticket';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { TicketSlaStatus } from '../entities/ticket-sla-status';

describe('currentTicketDue', () => {
  /** Chamado resolvido no prazo no primeiro ciclo, sem os campos do ciclo vigente (back-end antes da spec 024). */
  const ticket: Ticket = {
    id: 't1', title: 'Monitor com defeito', description: 'Tela piscando.',
    priority: TicketPriority.Low, status: TicketStatus.Resolved, openedByUserId: 'u1', assignedToUserId: 'u2',
    assignedToName: 'Ana Souza', sectorId: 's2', sectorName: 'Infraestrutura', createdAtUtc: '2026-01-02T12:00:00Z',
    dueAtUtc: '2026-01-03T12:00:00Z', slaStatus: TicketSlaStatus.Met, lastActivityAtUtc: '2026-01-02T15:00:00Z',
    canCancel: false, ownerCancelDeadlineUtc: '2026-01-02T12:15:00Z'
  };

  it('uses the due date and status of the current cycle when the back end sends them', () => {
    const reopened: Ticket = { ...ticket, status: TicketStatus.Open, currentDueAtUtc: '2026-01-05T18:30:00Z', currentSlaStatus: TicketSlaStatus.OnTime };
    expect(currentTicketDue(reopened)).toEqual({
      dueAtUtc: '2026-01-05T18:30:00Z', slaStatus: TicketSlaStatus.OnTime, display: TICKET_LIST_DUE_DISPLAY[TicketSlaStatus.OnTime]
    });
  });

  it('without the current cycle fields, falls back to the due date and status of the first cycle', () => {
    expect(currentTicketDue(ticket)).toEqual({
      dueAtUtc: '2026-01-03T12:00:00Z', slaStatus: TicketSlaStatus.Met, display: TICKET_LIST_DUE_DISPLAY[TicketSlaStatus.Met]
    });
  });

  it('on an active ticket without the current cycle, does not show the "Resolvido" of the closed cycle; it says the new due date is on the ticket', () => {
    const reopenedWithoutCycle: Ticket = { ...ticket, status: TicketStatus.Open, slaStatus: TicketSlaStatus.Missed };
    expect(currentTicketDue(reopenedWithoutCycle).display).toBe(TICKET_LIST_REOPENED_DUE_DISPLAY);
  });

  it('on an active ticket without the current cycle but still in the first cycle, shows its status normally', () => {
    const open: Ticket = { ...ticket, status: TicketStatus.InProgress, slaStatus: TicketSlaStatus.Breached };
    expect(currentTicketDue(open).display).toBe(TICKET_LIST_DUE_DISPLAY[TicketSlaStatus.Breached]);
  });

  it('says what the date is: "até" when on time, "venceu em" when overdue and "prazo era" on a resolved one', () => {
    expect(TICKET_LIST_DUE_DISPLAY[TicketSlaStatus.OnTime].datePrefix).toBe('até');
    expect(TICKET_LIST_DUE_DISPLAY[TicketSlaStatus.Breached].datePrefix).toBe('venceu em');
    expect(TICKET_LIST_DUE_DISPLAY[TicketSlaStatus.Met].datePrefix).toBe('prazo era');
  });
});
