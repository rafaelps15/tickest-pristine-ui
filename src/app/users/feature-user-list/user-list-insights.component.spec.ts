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

  it('mostra os totais de ativos e inativos da empresa', async () => {
    const fixture = TestBed.createComponent(UserListInsightsComponent);
    fixture.componentRef.setInput('activeCount', 42);
    fixture.componentRef.setInput('inactiveCount', 1);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('42');
    expect(text).toContain('usuários ativos');
    expect(text).toContain('inativo (login bloqueado)');
  });

  it('mostra "—" em vez de 0 enquanto carrega ou quando falhou', async () => {
    const fixture = TestBed.createComponent(UserListInsightsComponent);
    fixture.componentRef.setInput('failed', true);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.insights-stat').textContent).toBe('—');
    expect(fixture.nativeElement.textContent).toContain('Resumo indisponível');
  });
});
