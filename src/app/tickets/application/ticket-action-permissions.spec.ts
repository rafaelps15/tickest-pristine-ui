import { TicketStatus } from '../entities/ticket-status';
import { canAssignTicketToOthers, canAssignTicketToSelf, canEditTicketDescription, canReopenTicket } from './ticket-action-permissions';

/** Monta a consulta de permissão a partir dos códigos que o usuário tem. */
function having(...codes: string[]): (code: string) => boolean {
  return code => codes.includes(code);
}

describe('ticket-action-permissions', () => {
  describe('canEditTicketDescription', () => {
    it('allows the owner with tickets:update-own on an active ticket', () => {
      expect(canEditTicketDescription(TicketStatus.Open, true, having('tickets:update-own'))).toBeTrue();
    });

    it('allows whoever has tickets:manage even without being the owner', () => {
      expect(canEditTicketDescription(TicketStatus.InProgress, false, having('tickets:manage'))).toBeTrue();
    });

    it('rejects the owner without tickets:update-own and a non-owner with only tickets:update-own', () => {
      expect(canEditTicketDescription(TicketStatus.Open, true, having())).toBeFalse();
      expect(canEditTicketDescription(TicketStatus.Open, false, having('tickets:update-own'))).toBeFalse();
    });

    it('rejects anyone on an inactive ticket', () => {
      expect(canEditTicketDescription(TicketStatus.Resolved, true, having('tickets:update-own', 'tickets:manage'))).toBeFalse();
    });
  });

  describe('canReopenTicket', () => {
    it('allows the owner with tickets:reopen-own and whoever has tickets:manage, on an inactive ticket', () => {
      expect(canReopenTicket(TicketStatus.Closed, true, having('tickets:reopen-own'))).toBeTrue();
      expect(canReopenTicket(TicketStatus.Canceled, false, having('tickets:manage'))).toBeTrue();
    });

    it('rejects a non-owner with only tickets:reopen-own', () => {
      expect(canReopenTicket(TicketStatus.Resolved, false, having('tickets:reopen-own'))).toBeFalse();
    });

    it('like ReopenTicketCommandHandler, the owner reopens only with tickets:reopen-own: tickets:manage does not count for their own ticket', () => {
      expect(canReopenTicket(TicketStatus.Resolved, true, having('tickets:manage'))).toBeFalse();
      expect(canReopenTicket(TicketStatus.Resolved, true, having('tickets:manage', 'tickets:reopen-own'))).toBeTrue();
    });

    it('rejects reopening a ticket that is still active', () => {
      expect(canReopenTicket(TicketStatus.Open, true, having('tickets:reopen-own', 'tickets:manage'))).toBeFalse();
    });
  });

  describe('canAssignTicketToOthers', () => {
    it('requires tickets:manage and tickets:assign, with the ticket active', () => {
      expect(canAssignTicketToOthers(TicketStatus.Open, having('tickets:manage', 'tickets:assign'))).toBeTrue();
      expect(canAssignTicketToOthers(TicketStatus.Open, having('tickets:manage'))).toBeFalse();
      expect(canAssignTicketToOthers(TicketStatus.Open, having('tickets:assign'))).toBeFalse();
      expect(canAssignTicketToOthers(TicketStatus.Resolved, having('tickets:manage', 'tickets:assign'))).toBeFalse();
    });
  });

  describe('canAssignTicketToSelf', () => {
    it('allows whoever has tickets:manage, even without tickets:assign, on an active ticket without assignee', () => {
      expect(canAssignTicketToSelf(TicketStatus.Open, null, having('tickets:manage'))).toBeTrue();
      expect(canAssignTicketToSelf(TicketStatus.InProgress, null, having('tickets:manage', 'tickets:assign'))).toBeTrue();
    });

    it('rejects without tickets:manage, on a ticket that already has an assignee, or on an inactive ticket', () => {
      expect(canAssignTicketToSelf(TicketStatus.Open, null, having('tickets:assign'))).toBeFalse();
      expect(canAssignTicketToSelf(TicketStatus.Open, 'u2', having('tickets:manage'))).toBeFalse();
      expect(canAssignTicketToSelf(TicketStatus.Resolved, null, having('tickets:manage'))).toBeFalse();
    });
  });
});
