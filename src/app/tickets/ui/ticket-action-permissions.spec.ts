import { TicketStatus } from '../entities/ticket-status';
import { canAssignTicketToOthers, canEditTicketDescription, canReopenTicket } from './ticket-action-permissions';

/** Monta a consulta de permissão a partir dos códigos que o usuário tem. */
function having(...codes: string[]): (code: string) => boolean {
  return code => codes.includes(code);
}

describe('ticket-action-permissions', () => {
  describe('canEditTicketDescription', () => {
    it('libera o dono com tickets:update-own num chamado ativo', () => {
      expect(canEditTicketDescription(TicketStatus.Open, true, having('tickets:update-own'))).toBeTrue();
    });

    it('libera quem tem tickets:manage mesmo sem ser o dono', () => {
      expect(canEditTicketDescription(TicketStatus.InProgress, false, having('tickets:manage'))).toBeTrue();
    });

    it('recusa o dono sem tickets:update-own e quem não é dono só com tickets:update-own', () => {
      expect(canEditTicketDescription(TicketStatus.Open, true, having())).toBeFalse();
      expect(canEditTicketDescription(TicketStatus.Open, false, having('tickets:update-own'))).toBeFalse();
    });

    it('recusa qualquer um num chamado inativo', () => {
      expect(canEditTicketDescription(TicketStatus.Resolved, true, having('tickets:update-own', 'tickets:manage'))).toBeFalse();
    });
  });

  describe('canReopenTicket', () => {
    it('libera o dono com tickets:reopen-own e quem tem tickets:manage, num chamado inativo', () => {
      expect(canReopenTicket(TicketStatus.Closed, true, having('tickets:reopen-own'))).toBeTrue();
      expect(canReopenTicket(TicketStatus.Canceled, false, having('tickets:manage'))).toBeTrue();
    });

    it('recusa quem não é dono só com tickets:reopen-own', () => {
      expect(canReopenTicket(TicketStatus.Resolved, false, having('tickets:reopen-own'))).toBeFalse();
    });

    it('recusa reabrir um chamado ainda ativo', () => {
      expect(canReopenTicket(TicketStatus.Open, true, having('tickets:reopen-own', 'tickets:manage'))).toBeFalse();
    });
  });

  describe('canAssignTicketToOthers', () => {
    it('exige tickets:manage e tickets:assign, com o chamado ativo', () => {
      expect(canAssignTicketToOthers(TicketStatus.Open, having('tickets:manage', 'tickets:assign'))).toBeTrue();
      expect(canAssignTicketToOthers(TicketStatus.Open, having('tickets:manage'))).toBeFalse();
      expect(canAssignTicketToOthers(TicketStatus.Open, having('tickets:assign'))).toBeFalse();
      expect(canAssignTicketToOthers(TicketStatus.Resolved, having('tickets:manage', 'tickets:assign'))).toBeFalse();
    });
  });
});
