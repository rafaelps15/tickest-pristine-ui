import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { UserListInsightsComponent } from './user-list-insights.component';

describe('UserListInsightsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserListInsightsComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  it('shows on one line the company total, active, pending invitations and inactive', async () => {
    const fixture = TestBed.createComponent(UserListInsightsComponent);
    fixture.componentRef.setInput('counts', { totalCount: 46, activeCount: 42, pendingActivationCount: 3, inactiveCount: 1 });
    await fixture.whenStable();

    const text = (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');
    expect(text).toContain('46 usuários');
    expect(text).toContain('42 ativos');
    expect(text).toContain('3 com convite pendente');
    expect(text).toContain('1 inativo (login bloqueado)');
  });

  it('omits pending invitations when there are none', async () => {
    const fixture = TestBed.createComponent(UserListInsightsComponent);
    fixture.componentRef.setInput('counts', { totalCount: 10, activeCount: 10, pendingActivationCount: 0, inactiveCount: 0 });
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('convite pendente');
  });

  it('shows "—" instead of 0 while loading or when it failed', async () => {
    const fixture = TestBed.createComponent(UserListInsightsComponent);
    fixture.componentRef.setInput('failed', true);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.insights-stat').textContent).toBe('—');
    expect(fixture.nativeElement.textContent).toContain('Resumo indisponível');
  });
});
