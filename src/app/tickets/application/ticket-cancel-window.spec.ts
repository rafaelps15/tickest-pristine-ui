import { isCancelAvailable, ownerCancelHint, ownerCancelMinutesLeft, TicketCancelInfo } from './ticket-cancel-window';

describe('ticket-cancel-window', () => {
  const now = new Date('2026-01-01T12:00:00Z').getTime();

  /** Chamado com a janela do dono terminando às `deadline` (UTC). */
  function ticket(deadline: string, canCancel = true): TicketCancelInfo {
    return { canCancel, ownerCancelDeadlineUtc: deadline };
  }

  it('rounds up the remaining minutes and gives 0 when the window has ended', () => {
    expect(ownerCancelMinutesLeft(ticket('2026-01-01T12:07:10Z'), now)).toBe(8);
    expect(ownerCancelMinutesLeft(ticket('2026-01-01T12:00:30Z'), now)).toBe(1);
    expect(ownerCancelMinutesLeft(ticket('2026-01-01T12:00:00Z'), now)).toBe(0);
    expect(ownerCancelMinutesLeft(ticket('2026-01-01T11:50:00Z'), now)).toBe(0);
  });

  it('only allows cancellation when the back end permits it', () => {
    expect(isCancelAvailable(ticket('2026-01-01T12:10:00Z', false), now, false)).toBeFalse();
    expect(isCancelAvailable(ticket('2026-01-01T12:10:00Z', false), now, true)).toBeFalse();
  });

  it('for the owner, checks the clock; with tickets:cancel, ignores the deadline', () => {
    expect(isCancelAvailable(ticket('2026-01-01T12:10:00Z'), now, false)).toBeTrue();
    expect(isCancelAvailable(ticket('2026-01-01T11:59:00Z'), now, false)).toBeFalse();
    expect(isCancelAvailable(ticket('2026-01-01T11:00:00Z'), now, true)).toBeTrue();
  });

  it('shows the countdown only to the owner within the window, with "1 min" in the singular', () => {
    expect(ownerCancelHint(ticket('2026-01-01T12:08:00Z'), now, false)).toBe('por mais 8 min');
    expect(ownerCancelHint(ticket('2026-01-01T12:00:40Z'), now, false)).toBe('por mais 1 min');
    expect(ownerCancelHint(ticket('2026-01-01T11:59:00Z'), now, false)).toBeNull();
    expect(ownerCancelHint(ticket('2026-01-01T12:08:00Z'), now, true)).toBeNull();
  });
});
