import { currentTicketDue } from './ticket-list-due';
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

  it('usa o prazo e a situação do ciclo vigente quando o back-end manda', () => {
    const reopened: Ticket = { ...ticket, status: TicketStatus.Open, currentDueAtUtc: '2026-01-05T18:30:00Z', currentSlaStatus: TicketSlaStatus.OnTime };
    expect(currentTicketDue(reopened)).toEqual({ dueAtUtc: '2026-01-05T18:30:00Z', slaStatus: TicketSlaStatus.OnTime });
  });

  it('sem os campos do ciclo vigente, cai no prazo e na situação do primeiro ciclo', () => {
    expect(currentTicketDue(ticket)).toEqual({ dueAtUtc: '2026-01-03T12:00:00Z', slaStatus: TicketSlaStatus.Met });
  });
});
