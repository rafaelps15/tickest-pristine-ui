import { TICKET_LIST_DUE_DISPLAY, TICKET_LIST_DUE_LEGEND, currentTicketDue } from './ticket-list-due';
import { Ticket } from '../entities/ticket';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { TicketSlaStatus } from '../entities/ticket-sla-status';

describe('currentTicketDue', () => {
  /** Chamado resolvido no prazo, nunca reaberto: o ciclo vigente é o primeiro. */
  const ticket: Ticket = {
    id: 't1', title: 'Monitor com defeito', description: 'Tela piscando.',
    priority: TicketPriority.Low, status: TicketStatus.Resolved, openedByUserId: 'u1', assignedToUserId: 'u2',
    assignedToName: 'Ana Souza', sectorId: 's2', sectorName: 'Infraestrutura', createdAtUtc: '2026-01-02T12:00:00Z',
    dueAtUtc: '2026-01-03T12:00:00Z', slaStatus: TicketSlaStatus.Met,
    currentDueAtUtc: '2026-01-03T12:00:00Z', currentSlaStatus: TicketSlaStatus.Met,
    lastActivityAtUtc: '2026-01-02T15:00:00Z', canCancel: false, ownerCancelDeadlineUtc: '2026-01-02T12:15:00Z'
  };

  it('on a reopened ticket, uses the due date and status of the current cycle, not those of the closed first cycle', () => {
    const reopened: Ticket = {
      ...ticket, status: TicketStatus.Open, slaStatus: TicketSlaStatus.Missed,
      currentDueAtUtc: '2026-01-05T18:30:00Z', currentSlaStatus: TicketSlaStatus.OnTime
    };
    expect(currentTicketDue(reopened)).toEqual({
      dueAtUtc: '2026-01-05T18:30:00Z', slaStatus: TicketSlaStatus.OnTime, display: TICKET_LIST_DUE_DISPLAY[TicketSlaStatus.OnTime]
    });
  });

  it('on a ticket that was never reopened, shows its only cycle', () => {
    expect(currentTicketDue(ticket)).toEqual({
      dueAtUtc: '2026-01-03T12:00:00Z', slaStatus: TicketSlaStatus.Met, display: TICKET_LIST_DUE_DISPLAY[TicketSlaStatus.Met]
    });
  });

  it('shows every status the back end sends for the current cycle with its own display, with no fallback text', () => {
    for (const status of TICKET_LIST_DUE_LEGEND) {
      expect(currentTicketDue({ ...ticket, status: TicketStatus.Open, currentSlaStatus: status }).display)
        .toBe(TICKET_LIST_DUE_DISPLAY[status]);
    }
  });

  it('requires the current cycle fields, which spec 024 always sends', () => {
    const withoutCurrentCycle: Omit<Ticket, 'currentDueAtUtc' | 'currentSlaStatus'> = {
      id: ticket.id, title: ticket.title, description: ticket.description, priority: ticket.priority,
      status: ticket.status, openedByUserId: ticket.openedByUserId, assignedToUserId: ticket.assignedToUserId,
      assignedToName: ticket.assignedToName, sectorId: ticket.sectorId, sectorName: ticket.sectorName,
      createdAtUtc: ticket.createdAtUtc, dueAtUtc: ticket.dueAtUtc, slaStatus: ticket.slaStatus,
      lastActivityAtUtc: ticket.lastActivityAtUtc, canCancel: ticket.canCancel, ownerCancelDeadlineUtc: ticket.ownerCancelDeadlineUtc
    };
    // @ts-expect-error: sem o prazo e a situação do ciclo vigente não é um Ticket (a spec 024 sempre os manda).
    const incomplete: Ticket = withoutCurrentCycle;
    expect(incomplete.currentSlaStatus).toBeUndefined();
  });

  it('says what the date is: "até" when on time, "venceu em" when overdue and "prazo era" on a resolved one', () => {
    expect(TICKET_LIST_DUE_DISPLAY[TicketSlaStatus.OnTime].datePrefix).toBe('até');
    expect(TICKET_LIST_DUE_DISPLAY[TicketSlaStatus.Breached].datePrefix).toBe('venceu em');
    expect(TICKET_LIST_DUE_DISPLAY[TicketSlaStatus.Met].datePrefix).toBe('prazo era');
  });
});
