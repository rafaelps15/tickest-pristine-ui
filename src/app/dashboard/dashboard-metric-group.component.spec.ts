import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { DashboardMetric, DashboardMetricGroupComponent } from './dashboard-metric-group.component';

@Component({
  template: `<app-dashboard-metric-group title="SLA" [metrics]="metrics()" [loading]="loading()" [error]="error()" [unavailable]="unavailable()" (retry)="retried = true" />`,
  imports: [DashboardMetricGroupComponent]
})
class HostComponent {
  metrics = signal<DashboardMetric[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  unavailable = signal(false);
  retried = false;
}

describe('DashboardMetricGroupComponent', () => {
  /** Dois indicadores do SLA com os números informados. */
  function metrics(breached: number | null, met: number | null): DashboardMetric[] {
    return [
      { key: 'breached', label: 'Atrasados', icon: 'bx-error', tone: 'danger', value: breached, queryParams: { slaStatus: 3 } },
      { key: 'met', label: 'Cumpridos', icon: 'bx-check-circle', tone: 'success', value: met, queryParams: null }
    ];
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])]
    }).compileComponents();
  });

  it('carregando sem números: mostra o esqueleto, com aviso pro leitor de tela', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.metrics.set(metrics(null, null));
    fixture.componentInstance.loading.set(true);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('.metric-skeleton').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Carregando SLA…');
    expect(fixture.nativeElement.querySelector('section').getAttribute('aria-busy')).toBe('true');
  });

  it('erro: mostra a mensagem e o "Tentar novamente" avisa a tela', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.metrics.set(metrics(null, null));
    fixture.componentInstance.error.set('Não foi possível carregar o SLA.');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar o SLA.');
    // Falha técnica em tom neutro: vermelho é só pra risco operacional.
    expect(fixture.nativeElement.querySelector('.alert-danger, .btn-outline-danger')).toBeNull();
    (fixture.nativeElement.querySelector('[role="alert"] button') as HTMLButtonElement).click();
    expect(fixture.componentInstance.retried).toBeTrue();
  });

  it('indisponível: só uma linha neutra, sem repetir o alerta nem o "Tentar novamente"', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.metrics.set(metrics(null, null));
    fixture.componentInstance.unavailable.set(true);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Indisponível no momento');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('o nome do link não monta plural: rótulo, número e legenda ("Críticos: 1, urgentes…")', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.metrics.set([
      { key: 'critical', label: 'Críticos', icon: 'bx-error-alt', tone: 'danger', value: 1, hint: 'Urgentes, ainda ativos', queryParams: { priority: 4 } }
    ]);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('a.stretched-link').getAttribute('aria-label'))
      .toBe('Críticos: 1, urgentes, ainda ativos. Ver na fila de monitoramento');
  });

  it('mostra o número de destaque com a comparação com o período anterior, e a legenda do card no nome do link', async () => {
    TestBed.overrideComponent(HostComponent, { set: { template: `<app-dashboard-metric-group title="SLA" [metrics]="metrics()" [lead]="{ value: '87%', text: 'resolvidos no prazo (7 de 8)', trend: '5 pontos acima do período anterior' }" />` } });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.metrics.set([
      { key: 'met', label: 'Cumpridos', icon: 'bx-check-circle', tone: 'success', value: 7, hint: 'Resolvidos no prazo', queryParams: { slaStatus: 4 } }
    ]);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('87%');
    expect(fixture.nativeElement.textContent).toContain('resolvidos no prazo (7 de 8)');
    expect(fixture.nativeElement.textContent).toContain('5 pontos acima do período anterior');
    expect(fixture.nativeElement.querySelector('app-stat-card').textContent).toContain('Resolvidos no prazo');
    expect(fixture.nativeElement.querySelector('a.stretched-link').getAttribute('aria-label'))
      .toBe('Cumpridos: 7, resolvidos no prazo. Ver na fila de monitoramento');
  });

  it('vazio (tudo zero): explica por quê, em vez de cards zerados', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.metrics.set(metrics(0, 0));
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Nenhum chamado com estes filtros.');
    expect(fixture.nativeElement.querySelector('app-stat-card')).toBeNull();
  });

  it('sucesso: mostra os números e o link do drill-down, sem região de anúncio própria (a tela anuncia um resumo só)', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.metrics.set(metrics(2, 7));
    await fixture.whenStable();

    const links = fixture.nativeElement.querySelectorAll('a.stretched-link') as NodeListOf<HTMLAnchorElement>;
    expect(links.length).toBe(1);
    expect(links[0].getAttribute('href')).toBe('/tickets/monitorar?slaStatus=3');
    expect(links[0].getAttribute('aria-label')).toBe('Atrasados: 2. Ver na fila de monitoramento');
    expect(fixture.nativeElement.querySelector('[aria-live]')).toBeNull();
  });

  it('recarregando com números na tela: mantém os cards como estão, sem esqueleto nem esmaecer', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.metrics.set(metrics(2, 7));
    fixture.componentInstance.loading.set(true);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.metric-skeleton')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-stat-card')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[style*="opacity"], .metric-refreshing')).toBeNull();
  });
});
