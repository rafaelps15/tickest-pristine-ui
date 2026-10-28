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
      { key: 'breached', label: 'Atrasados', icon: 'bx-error', tone: 'danger', value: breached, ariaNoun: 'chamados atrasados', queryParams: { slaStatus: 3 } },
      { key: 'met', label: 'Cumpridos', icon: 'bx-check-circle', tone: 'success', value: met, ariaNoun: 'chamados cumpridos', queryParams: null }
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
    (fixture.nativeElement.querySelector('.alert button') as HTMLButtonElement).click();
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

  it('faixa: números numa linha só, cada um levando à fila, sem stat-card', async () => {
    TestBed.overrideComponent(HostComponent, { set: { template: `<app-dashboard-metric-group title="Volume" variant="strip" [metrics]="metrics()" />` } });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.metrics.set(metrics(4, 2));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('app-stat-card').length).toBe(0);
    const link = fixture.nativeElement.querySelector('a.metric-strip-link') as HTMLAnchorElement;
    expect(link.getAttribute('aria-label')).toBe('Ver 4 chamados atrasados na fila de monitoramento');
    expect(fixture.nativeElement.querySelectorAll('.metric-strip-item').length).toBe(2);
  });

  it('vazio (tudo zero): explica por quê, em vez de cards zerados', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.metrics.set(metrics(0, 0));
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Nenhum chamado com estes filtros.');
    expect(fixture.nativeElement.querySelector('app-stat-card')).toBeNull();
  });

  it('sucesso: mostra os números, o link do drill-down e o resumo pro leitor de tela', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.metrics.set(metrics(2, 7));
    await fixture.whenStable();

    const links = fixture.nativeElement.querySelectorAll('a.stretched-link') as NodeListOf<HTMLAnchorElement>;
    expect(links.length).toBe(1);
    expect(links[0].getAttribute('href')).toBe('/tickets/monitorar?slaStatus=3');
    expect(links[0].getAttribute('aria-label')).toBe('Ver 2 chamados atrasados na fila de monitoramento');
    expect(fixture.nativeElement.querySelector('[aria-live="polite"]').textContent).toContain('SLA: 2 chamados atrasados, 7 chamados cumpridos.');
  });

  it('recarregando com números na tela: mantém os cards (esmaecidos) em vez de voltar ao esqueleto', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.metrics.set(metrics(2, 7));
    fixture.componentInstance.loading.set(true);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.metric-skeleton')).toBeNull();
    expect(fixture.nativeElement.querySelector('.metric-refreshing')).not.toBeNull();
  });
});
