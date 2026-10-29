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

  it('formata minutos úteis sem converter pra dias', () => {
    expect(formatBusinessMinutes(45)).toBe('45 min');
    expect(formatBusinessMinutes(75)).toBe('1 h 15 min');
    expect(formatBusinessMinutes(120)).toBe('2 h');
    expect(formatBusinessMinutes(7230)).toBe('120 h');
  });

  it('mostra a mediana e a média quando há amostra, e "Dados insuficientes" abaixo do mínimo', async () => {
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
    expect(fixture.nativeElement.querySelector('[aria-live="polite"]').textContent)
      .toBe('Tempos de atendimento: primeira resposta, mediana de 1 h 15 min; resolução, dados insuficientes.');
  });

  it('recarregando com tempos na tela: mantém os cards como estão em vez de voltar ao carregamento', async () => {
    const fixture = TestBed.createComponent(DashboardTimesComponent);
    fixture.componentRef.setInput('times', {
      firstResponse: { averageMinutes: 160, medianMinutes: 75, sampleSize: 6 },
      resolution: { averageMinutes: 90, medianMinutes: 60, sampleSize: 6 },
      minimumSampleSize: 5
    });
    fixture.componentRef.setInput('loading', true);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('1 h 15 min');
    expect(fixture.nativeElement.querySelector('[aria-live="polite"]').textContent).toBe('');
  });

  it('mostra o erro com "Tentar novamente"', async () => {
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

  it('mostra o carregamento enquanto não há resposta', async () => {
    const fixture = TestBed.createComponent(DashboardTimesComponent);
    fixture.componentRef.setInput('loading', true);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Carregando os tempos de atendimento');
    expect(fixture.nativeElement.querySelectorAll('.times-skeleton').length).toBe(2);
  });
});
