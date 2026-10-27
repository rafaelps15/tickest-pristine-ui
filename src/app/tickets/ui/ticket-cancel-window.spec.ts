import { isCancelAvailable, ownerCancelHint, ownerCancelMinutesLeft, TicketCancelInfo } from './ticket-cancel-window';

describe('ticket-cancel-window', () => {
  const now = new Date('2026-01-01T12:00:00Z').getTime();

  /** Chamado com a janela do dono terminando às `deadline` (UTC). */
  function ticket(deadline: string, canCancel = true): TicketCancelInfo {
    return { canCancel, ownerCancelDeadlineUtc: deadline };
  }

  it('arredonda pra cima os minutos que faltam e dá 0 quando a janela terminou', () => {
    expect(ownerCancelMinutesLeft(ticket('2026-01-01T12:07:10Z'), now)).toBe(8);
    expect(ownerCancelMinutesLeft(ticket('2026-01-01T12:00:30Z'), now)).toBe(1);
    expect(ownerCancelMinutesLeft(ticket('2026-01-01T12:00:00Z'), now)).toBe(0);
    expect(ownerCancelMinutesLeft(ticket('2026-01-01T11:50:00Z'), now)).toBe(0);
  });

  it('só libera o cancelamento quando o back-end permite', () => {
    expect(isCancelAvailable(ticket('2026-01-01T12:10:00Z', false), now, false)).toBeFalse();
    expect(isCancelAvailable(ticket('2026-01-01T12:10:00Z', false), now, true)).toBeFalse();
  });

  it('pro dono, confere o relógio; com tickets:cancel, ignora o prazo', () => {
    expect(isCancelAvailable(ticket('2026-01-01T12:10:00Z'), now, false)).toBeTrue();
    expect(isCancelAvailable(ticket('2026-01-01T11:59:00Z'), now, false)).toBeFalse();
    expect(isCancelAvailable(ticket('2026-01-01T11:00:00Z'), now, true)).toBeTrue();
  });

  it('mostra a contagem só pro dono dentro da janela, com "1 min" no singular', () => {
    expect(ownerCancelHint(ticket('2026-01-01T12:08:00Z'), now, false)).toBe('por mais 8 min');
    expect(ownerCancelHint(ticket('2026-01-01T12:00:40Z'), now, false)).toBe('por mais 1 min');
    expect(ownerCancelHint(ticket('2026-01-01T11:59:00Z'), now, false)).toBeNull();
    expect(ownerCancelHint(ticket('2026-01-01T12:08:00Z'), now, true)).toBeNull();
  });
});
