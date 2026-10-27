import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { DashboardGuideComponent } from './dashboard-guide.component';

const STORAGE_KEY = 'tickest.dashboardGuide.open';

describe('DashboardGuideComponent', () => {
  beforeEach(async () => {
    localStorage.removeItem(STORAGE_KEY);

    await TestBed.configureTestingModule({
      imports: [DashboardGuideComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  it('explica o que cada card de estatística e o gráfico representam', async () => {
    const fixture = TestBed.createComponent(DashboardGuideComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Total de Chamados');
    expect(text).toContain('Em Aberto');
    expect(text).toContain('Em Andamento');
    expect(text).toContain('Resolvidos');
    expect(text).toContain('Dia, Semana ou Mês');
  });

  it('explica "em risco" e "atrasado" só pra quem vê os Alertas de SLA', async () => {
    const fixture = TestBed.createComponent(DashboardGuideComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).not.toContain('Alertas de SLA');

    fixture.componentRef.setInput('showSla', true);
    await fixture.whenStable();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Alertas de SLA');
    expect(text).toContain('Em risco:');
    expect(text).toContain('Atrasado:');
  });

  it('lembra a preferência aberto/fechado na chave própria da tela', async () => {
    const fixture = TestBed.createComponent(DashboardGuideComponent);
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('.guide-toggle') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
  });
});
