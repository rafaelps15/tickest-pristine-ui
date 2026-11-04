import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { DashboardTimesComponent, formatBusinessMinutes } from './dashboard-times.component';

describe('DashboardTimesComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardTimesComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  it('formats business minutes without converting to days', () => {
    expect(formatBusinessMinutes(45)).toBe('45 min');
    expect(formatBusinessMinutes(75)).toBe('1 h 15 min');
    expect(formatBusinessMinutes(120)).toBe('2 h');
    expect(formatBusinessMinutes(7230)).toBe('120 h');
  });

  it('shows the median and the average when there is a sample, and "Dados insuficientes" below the minimum', async () => {
    const fixture = TestBed.createComponent(DashboardTimesComponent);
    fixture.componentRef.setInput('times', {
      firstResponse: { averageMinutes: 160, medianMinutes: 75, sampleSize: 6 },
      resolution: { averageMinutes: null, medianMinutes: null, sampleSize: 4 },
      minimumSampleSize: 5
    });
    await fixture.whenStable();

    const cards = Array.from(fixture.nativeElement.querySelectorAll('.card') as NodeListOf<HTMLElement>);
    expect(cards[0].textContent).toContain('1 h 15 min');
    expect(cards[0].textContent).toContain('Média 2 h 40 min · 6 chamados');
    expect(cards[1].textContent).toContain('Dados insuficientes');
    expect(cards[1].textContent).toContain('Só 4 chamados entraram na conta');
    expect(cards[1].textContent).toContain('pelo menos 5');
    // Sem região de anúncio própria: a tela anuncia um resumo só.
    expect(fixture.nativeElement.querySelector('[aria-live]')).toBeNull();
  });

  it('when reloading with times on screen: keeps the cards as they are instead of going back to loading', async () => {
    const fixture = TestBed.createComponent(DashboardTimesComponent);
    fixture.componentRef.setInput('times', {
      firstResponse: { averageMinutes: 160, medianMinutes: 75, sampleSize: 6 },
      resolution: { averageMinutes: 90, medianMinutes: 60, sampleSize: 6 },
      minimumSampleSize: 5
    });
    fixture.componentRef.setInput('loading', true);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('1 h 15 min');
  });

  it('shows the error with "Tentar novamente"', async () => {
    const fixture = TestBed.createComponent(DashboardTimesComponent);
    fixture.componentRef.setInput('error', 'Não foi possível carregar os tempos de atendimento.');
    let retried = false;
    fixture.componentInstance.retry.subscribe(() => retried = true);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar os tempos de atendimento.');
    // Falha técnica em tom neutro: vermelho é só pra risco operacional.
    expect(fixture.nativeElement.querySelector('.alert-danger, .btn-outline-danger')).toBeNull();
    (fixture.nativeElement.querySelector('[role="alert"] button') as HTMLButtonElement).click();
    expect(retried).toBeTrue();
  });

  it('shows the loading state while there is no response', async () => {
    const fixture = TestBed.createComponent(DashboardTimesComponent);
    fixture.componentRef.setInput('loading', true);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Carregando os tempos de atendimento');
    expect(fixture.nativeElement.querySelectorAll('.times-skeleton').length).toBe(2);
  });
});
