import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { UserStatusBadgeComponent, userStatusKind } from './user-status-badge.component';

describe('UserStatusBadgeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserStatusBadgeComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  it('shows the label and tone of each status, with the decorative dot hidden from the screen reader', async () => {
    const fixture = TestBed.createComponent(UserStatusBadgeComponent);
    for (const [status, label, tone] of [
      ['active', 'Ativo', 'bg-label-success'],
      ['pending', 'Convite pendente', 'bg-label-warning'],
      ['inactive', 'Inativo', 'bg-label-secondary']
    ] as const) {
      fixture.componentRef.setInput('status', status);
      await fixture.whenStable();

      const badge = fixture.nativeElement.querySelector('.badge') as HTMLElement;
      expect(badge.textContent?.trim()).toBe(label);
      expect(badge.classList).toContain(tone);
      expect(badge.querySelector('.badge-dot')?.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('derives the status from the API fields: inactive wins, active without a password is a pending invite', () => {
    expect(userStatusKind({ isActive: false, pendingActivation: true })).toBe('inactive');
    expect(userStatusKind({ isActive: true, pendingActivation: true })).toBe('pending');
    expect(userStatusKind({ isActive: true, pendingActivation: false })).toBe('active');
  });
});
