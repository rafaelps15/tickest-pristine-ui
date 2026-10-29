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

  it('usa o prazo e a situação do ciclo vigente quando o back-end manda', () => {
    const reopened: Ticket = { ...ticket, status: TicketStatus.Open, currentDueAtUtc: '2026-01-05T18:30:00Z', currentSlaStatus: TicketSlaStatus.OnTime };
    expect(currentTicketDue(reopened)).toEqual({
      dueAtUtc: '2026-01-05T18:30:00Z', slaStatus: TicketSlaStatus.OnTime, display: TICKET_LIST_DUE_DISPLAY[TicketSlaStatus.OnTime]
    });
  });

  it('sem os campos do ciclo vigente, cai no prazo e na situação do primeiro ciclo', () => {
    expect(currentTicketDue(ticket)).toEqual({
      dueAtUtc: '2026-01-03T12:00:00Z', slaStatus: TicketSlaStatus.Met, display: TICKET_LIST_DUE_DISPLAY[TicketSlaStatus.Met]
    });
  });

  it('num chamado ativo sem o ciclo vigente, não mostra o "Resolvido" do ciclo encerrado — diz que o prazo novo está no chamado', () => {
    const reopenedWithoutCycle: Ticket = { ...ticket, status: TicketStatus.Open, slaStatus: TicketSlaStatus.Missed };
    expect(currentTicketDue(reopenedWithoutCycle).display).toBe(TICKET_LIST_REOPENED_DUE_DISPLAY);
  });

  it('num chamado ativo sem o ciclo vigente mas ainda no primeiro ciclo, mostra a situação dele normalmente', () => {
    const open: Ticket = { ...ticket, status: TicketStatus.InProgress, slaStatus: TicketSlaStatus.Breached };
    expect(currentTicketDue(open).display).toBe(TICKET_LIST_DUE_DISPLAY[TicketSlaStatus.Breached]);
  });

  it('diz o que a data é: "até" no prazo, "venceu em" atrasado e "prazo era" num resolvido', () => {
    expect(TICKET_LIST_DUE_DISPLAY[TicketSlaStatus.OnTime].datePrefix).toBe('até');
    expect(TICKET_LIST_DUE_DISPLAY[TicketSlaStatus.Breached].datePrefix).toBe('venceu em');
    expect(TICKET_LIST_DUE_DISPLAY[TicketSlaStatus.Met].datePrefix).toBe('prazo era');
  });
});
