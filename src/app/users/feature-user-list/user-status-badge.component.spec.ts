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

  it('mostra o rótulo e o tom de cada situação, com o ponto decorativo escondido do leitor de tela', async () => {
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

  it('deriva a situação dos campos da API: inativo vence, ativo sem senha é convite pendente', () => {
    expect(userStatusKind({ isActive: false, pendingActivation: true })).toBe('inactive');
    expect(userStatusKind({ isActive: true, pendingActivation: true })).toBe('pending');
    expect(userStatusKind({ isActive: true, pendingActivation: false })).toBe('active');
  });
});
