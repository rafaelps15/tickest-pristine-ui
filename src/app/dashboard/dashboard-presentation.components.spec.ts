import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { DashboardStatusCompositionComponent } from './dashboard-status-composition.component';
import { DashboardNoticeComponent } from './dashboard-notice.component';
import { DashboardKpi, DashboardKpiStripComponent } from './dashboard-kpi-strip.component';
import { DashboardHeroChartComponent, edgeColor } from './dashboard-hero-chart.component';
import { statusComposition } from './dashboard-overview';

describe('presentation components of Início', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardStatusCompositionComponent, DashboardNoticeComponent, DashboardHeroChartComponent, DashboardKpiStripComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])]
    }).compileComponents();
  });

  describe('DashboardStatusCompositionComponent', () => {
    it('does not draw a slice for a status with no tickets (the minimum width would lie), but keeps the zero in the description', async () => {
      const fixture = TestBed.createComponent(DashboardStatusCompositionComponent);
      fixture.componentRef.setInput('composition', statusComposition({ totalCount: 5, openCount: 5, inProgressCount: 0, resolvedCount: 0, closedCount: 0, canceledCount: 0 }));
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelectorAll('.composition-segment').length).toBe(1);
      expect(fixture.nativeElement.querySelector('.composition-bar').getAttribute('aria-label')).toContain('em andamento 0 (0%)');
      expect(fixture.nativeElement.textContent).not.toContain('cancelado');
    });

    it('with no tickets in the bar (only cancelled), says so in text instead of an empty bar', async () => {
      const fixture = TestBed.createComponent(DashboardStatusCompositionComponent);
      fixture.componentRef.setInput('composition', statusComposition({ totalCount: 3, openCount: 0, inProgressCount: 0, resolvedCount: 0, closedCount: 0, canceledCount: 3 }));
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('.composition-bar')).toBeNull();
      expect(fixture.nativeElement.textContent).toContain('Nenhum chamado aberto, em andamento, resolvido ou fechado agora.');
      expect(fixture.nativeElement.textContent).toContain('+ 3 cancelados');
    });

    it('with no destination, the slice is text with an accessible name, not a link', async () => {
      const fixture = TestBed.createComponent(DashboardStatusCompositionComponent);
      fixture.componentRef.setInput('composition', statusComposition({ totalCount: 2, openCount: 1, inProgressCount: 1, resolvedCount: 0, closedCount: 0, canceledCount: 0 }));
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('.composition-segment a')).toBeNull();
      expect(fixture.nativeElement.querySelector('.composition-segment [role="img"]').getAttribute('aria-label')).toBe('Abertos: 1 chamados, 50%');
    });

    it('with a destination and a visibility notice, the accessible name says how many the person sees', async () => {
      const fixture = TestBed.createComponent(DashboardStatusCompositionComponent);
      fixture.componentRef.setInput('composition', statusComposition({ totalCount: 340, openCount: 340, inProgressCount: 0, resolvedCount: 0, closedCount: 0, canceledCount: 0 }));
      const link = { route: '/tickets', queryParams: {}, note: 'Você tem acesso a 12 dos 340 chamados' };
      fixture.componentRef.setInput('links', { open: link, inProgress: null, resolved: null, closed: null });
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('.composition-segment a').getAttribute('aria-label')).toContain('Você tem acesso a 12 dos 340 chamados');
    });
  });

  describe('DashboardNoticeComponent', () => {
    it('"em breve": neutral text, with no button or alert role', async () => {
      const fixture = TestBed.createComponent(DashboardNoticeComponent);
      fixture.componentRef.setInput('text', 'Disponível em breve.');
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
      expect(fixture.nativeElement.querySelector('button')).toBeNull();
      expect(fixture.nativeElement.querySelector('.text-danger, .alert-danger')).toBeNull();
    });

    it('error: announces it and the "Tentar novamente" warns whoever uses it', async () => {
      const fixture = TestBed.createComponent(DashboardNoticeComponent);
      fixture.componentRef.setInput('kind', 'error');
      fixture.componentRef.setInput('text', 'Falhou.');
      let retried = false;
      fixture.componentInstance.retry.subscribe(() => (retried = true));
      await fixture.whenStable();

      (fixture.nativeElement.querySelector('[role="alert"] button') as HTMLButtonElement).click();
      expect(retried).toBeTrue();
    });
  });

  describe('DashboardHeroChartComponent', () => {
    it('bar outline: the same darkened hue (≥3:1 against white), without changing the color', () => {
      expect(edgeColor('#ffab00')).toBe('rgb(140, 94, 0)');
      expect(edgeColor('#03c3ec')).toBe('rgb(2, 107, 130)');
      expect(edgeColor('rgb(1, 2, 3)')).toBe('rgb(1, 2, 3)');
    });

    it('a grouping that does not fit the period becomes unavailable, says the reason and does not switch', async () => {
      const fixture = TestBed.createComponent(DashboardHeroChartComponent);
      fixture.componentRef.setInput('groupBy', 'Week');
      fixture.componentRef.setInput('unavailableGroupings', ['Day']);
      const chosen: string[] = [];
      fixture.componentInstance.groupByChange.subscribe(groupBy => chosen.push(groupBy));
      await fixture.whenStable();

      const buttons = Array.from(fixture.nativeElement.querySelectorAll('[aria-label="Agrupar por dia, semana ou mês"] button') as NodeListOf<HTMLButtonElement>);
      expect(buttons[0].getAttribute('aria-disabled')).toBe('true');
      expect(buttons[0].textContent).toContain('período longo demais');
      buttons[0].click();
      buttons[2].click();
      expect(chosen).toEqual(['Month']);
    });

    it('loading: skeletons with the final height, announced to the screen reader', async () => {
      const fixture = TestBed.createComponent(DashboardHeroChartComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelectorAll('[role="status"]').length).toBe(2);
      expect(fixture.nativeElement.querySelector('.flow-chart .skeleton-block')).not.toBeNull();
    });

    it('with the resolved ones (spec 028), the table gains the "Resolvidos" column', async () => {
      const fixture = TestBed.createComponent(DashboardHeroChartComponent);
      fixture.componentRef.setInput('flowState', 'ready');
      fixture.componentRef.setInput('points', [{ periodStart: '2026-10-27', count: 3, resolvedCount: 2 }]);
      await fixture.whenStable();
      fixture.componentInstance.toggleTable();
      await fixture.whenStable();

      const headers = Array.from(fixture.nativeElement.querySelectorAll('th[scope="col"]') as NodeListOf<HTMLElement>).map(th => th.textContent?.trim());
      expect(headers).toContain('Resolvidos');
      expect(fixture.nativeElement.querySelector('.hero-footnote').textContent).not.toContain('Resolvidos por período');
    });

    it('in "Com filtros", the footer says the flow follows the filters and shows the period of the selection', async () => {
      const fixture = TestBed.createComponent(DashboardHeroChartComponent);
      fixture.componentRef.setInput('scope', 'filtered');
      fixture.componentRef.setInput('flowState', 'ready');
      fixture.componentRef.setInput('range', { from: '2026-10-01', to: '2026-10-28' });
      fixture.componentRef.setInput('points', [{ periodStart: '2026-10-27', count: 3, resolvedCount: 2 }]);
      await fixture.whenStable();

      const footnote = fixture.nativeElement.querySelector('.hero-footnote').textContent;
      expect(footnote).toContain('Chamados com os filtros · De 01/10/2026 a 28/10/2026');
      expect(footnote).not.toContain('o fluxo ainda é o da empresa toda');
    });
  });

  describe('DashboardHeroChartComponent — footer in each state of the flow', () => {
    /** Texto do rodapé, com os espaços do template juntados. */
    const footnote = (fixture: { nativeElement: HTMLElement }) =>
      (fixture.nativeElement.querySelector('.hero-footnote') as HTMLElement).textContent?.replace(/\s+/g, ' ').trim();

    /** Sete dias (de terça a segunda) com os resolvidos, como o back-end manda desde a spec 028. */
    const week = Array.from({ length: 7 }, (_, i) => ({ periodStart: `2026-10-2${i}`, count: 3, resolvedCount: 2 }));

    it('first load: only what the chart covers, with no "em breve"', async () => {
      const fixture = TestBed.createComponent(DashboardHeroChartComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('.flow-area [role="status"]')?.textContent).toContain('Carregando os chamados por período…');
      expect(footnote(fixture)).toBe('Todos os chamados da empresa · Últimos 30 dias');
    });

    it('changing the grouping: while the new grouping loads, the footer says its range, with no "em breve"', async () => {
      const fixture = TestBed.createComponent(DashboardHeroChartComponent);
      fixture.componentRef.setInput('flowState', 'ready');
      fixture.componentRef.setInput('points', week);
      await fixture.whenStable();

      fixture.componentRef.setInput('groupBy', 'Week');
      fixture.componentRef.setInput('points', []);
      fixture.componentRef.setInput('flowState', 'loading');
      await fixture.whenStable();

      expect(footnote(fixture)).toBe('Todos os chamados da empresa · Últimas 12 semanas');
    });

    it('changing the scope: while the volume of the selection loads, the footer says it follows the filters, with no "em breve"', async () => {
      const fixture = TestBed.createComponent(DashboardHeroChartComponent);
      fixture.componentRef.setInput('flowState', 'ready');
      fixture.componentRef.setInput('points', week);
      await fixture.whenStable();

      fixture.componentRef.setInput('scope', 'filtered');
      fixture.componentRef.setInput('points', []);
      fixture.componentRef.setInput('flowState', 'loading');
      await fixture.whenStable();

      expect(footnote(fixture)).toBe('Chamados com os filtros · Últimos 30 dias');
    });

    it('flow error: the error stays in the flow area and the footer keeps only the coverage, with no "em breve"', async () => {
      const fixture = TestBed.createComponent(DashboardHeroChartComponent);
      fixture.componentRef.setInput('flowState', 'error');
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('.flow-area [role="alert"]')?.textContent).toContain('Não foi possível carregar os chamados por período.');
      expect(footnote(fixture)).toBe('Todos os chamados da empresa · Últimos 30 dias');
    });

    it('no tickets in the period: the empty state in the flow area and the coverage in the footer, with no "em breve"', async () => {
      const fixture = TestBed.createComponent(DashboardHeroChartComponent);
      fixture.componentRef.setInput('flowState', 'empty');
      fixture.componentRef.setInput('points', week.map(point => ({ ...point, count: 0, resolvedCount: 0 })));
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('.flow-area')?.textContent).toContain('Nenhum chamado no período.');
      expect(footnote(fixture)).toBe('Todos os chamados da empresa · Últimos 7 dias');
    });

    it('flow ready: the coverage and the legend of the references, never a promise of a future feature', async () => {
      const fixture = TestBed.createComponent(DashboardHeroChartComponent);
      fixture.componentRef.setInput('flowState', 'ready');
      fixture.componentRef.setInput('points', week);
      await fixture.whenStable();

      expect(footnote(fixture)).toBe('Todos os chamados da empresa · Últimos 7 dias · Tracejado: média dos períodos completos; faixas claras: sábados e domingos');
    });
  });

  describe('DashboardKpiStripComponent', () => {
    /** Cria a faixa com os indicadores e o estado dados. */
    async function strip(kpis: DashboardKpi[], state: 'ready' | 'loading' | 'error' = 'ready') {
      const fixture = TestBed.createComponent(DashboardKpiStripComponent);
      fixture.componentRef.setInput('kpis', kpis);
      fixture.componentRef.setInput('state', state);
      await fixture.whenStable();
      return fixture;
    }
    const link = { route: '/tickets/monitorar', queryParams: { status: 2 } };

    it('a card with a destination shows the click hint; without a destination, it does not', async () => {
      const fixture = await strip([
        { key: 'a', label: 'Em andamento', value: 3, link },
        { key: 'b', label: 'Total', value: 9, link: null }
      ]);
      const cards = fixture.nativeElement.querySelectorAll('.kpi-card');
      expect(cards[0].querySelector('.kpi-go')).not.toBeNull();
      expect(cards[1].querySelector('.kpi-go')).toBeNull();
      expect(cards[0].querySelector('a').getAttribute('aria-label')).toBe('Em andamento: 3. Ver a lista');
    });

    it('the support text goes into the accessible name (on touch and screen readers there is no title)', async () => {
      const fixture = await strip([{ key: 'a', label: 'Na fila', value: 5, hint: 'abertos e em andamento', link }]);
      expect(fixture.nativeElement.querySelector('.kpi-card a').getAttribute('aria-label')).toBe('Na fila: 5 (abertos e em andamento). Ver a lista');
    });

    it('risk in red only above zero', async () => {
      const fixture = await strip([
        { key: 'a', label: 'Atrasados', value: 4, risk: 'danger', link },
        { key: 'b', label: 'Atrasados', value: 0, risk: 'danger', link }
      ]);
      const values = fixture.nativeElement.querySelectorAll('.kpi-value');
      expect(values[0].classList).toContain('kpi-risk');
      expect(values[1].classList).not.toContain('kpi-risk');
    });

    it('an indicator from another source loads on its own, with no link and no made-up number', async () => {
      const fixture = await strip([{ key: 'a', label: 'Atrasados', value: null, loading: true, link }]);
      const card = fixture.nativeElement.querySelector('.kpi-card');
      expect(card.querySelector('.kpi-skeleton')).not.toBeNull();
      expect(card.querySelector('a')).toBeNull();
      expect(card.classList).not.toContain('kpi-linked');
    });

    it('source error: a single neutral notice, with "Tentar novamente"', async () => {
      const fixture = await strip([{ key: 'a', label: 'Total', value: null, link: null }], 'error');
      let retried = false;
      fixture.componentInstance.retry.subscribe(() => (retried = true));
      expect(fixture.nativeElement.querySelectorAll('[role="alert"]').length).toBe(1);
      (fixture.nativeElement.querySelector('[role="alert"] button') as HTMLButtonElement).click();
      expect(retried).toBeTrue();
    });
  });

  describe('DashboardHeroChartComponent — totals error already announced in the indicators', () => {
    it('the composition says it is unavailable, without a second alert', async () => {
      const fixture = TestBed.createComponent(DashboardHeroChartComponent);
      fixture.componentRef.setInput('compositionState', 'error');
      fixture.componentRef.setInput('flowState', 'ready');
      fixture.componentRef.setInput('points', [{ periodStart: '2026-10-27', count: 3, resolvedCount: 2 }]);
      await fixture.whenStable();

      const composition = fixture.nativeElement.querySelector('.hero-composition') as HTMLElement;
      expect(composition.textContent).toContain('Situação atual indisponível. Use “Tentar novamente” nos indicadores acima.');
      expect(composition.querySelector('[role="alert"]')).toBeNull();
    });

    it('the table adjusts the colspan of the state rows to the columns that exist', async () => {
      const fixture = TestBed.createComponent(DashboardHeroChartComponent);
      fixture.componentRef.setInput('flowState', 'empty');
      await fixture.whenStable();
      fixture.componentInstance.toggleTable();
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('tbody td').getAttribute('colspan')).toBe('2');
    });
  });

  describe('DashboardHeroChartComponent — keyboard and chart references', () => {
    /** Três dias (sexta, sábado e domingo) com o drill-down ligado. */
    async function heroWithPoints() {
      const fixture = TestBed.createComponent(DashboardHeroChartComponent);
      fixture.componentRef.setInput('flowState', 'ready');
      fixture.componentRef.setInput('points', [
        { periodStart: '2026-10-23', count: 2 },
        { periodStart: '2026-10-24', count: 4 },
        { periodStart: '2026-10-25', count: 1 }
      ]);
      fixture.componentRef.setInput('bucketLink', (periodStart: string) => ({ route: '/tickets/monitorar', queryParams: { createdFrom: periodStart, createdTo: periodStart } }));
      await fixture.whenStable();
      return fixture;
    }

    /** Aperta uma tecla na área do gráfico. */
    function press(fixture: { nativeElement: HTMLElement }, key: string): KeyboardEvent {
      const event = new KeyboardEvent('keydown', { key, cancelable: true, bubbles: true });
      (fixture.nativeElement.querySelector('.chart-focus') as HTMLElement).dispatchEvent(event);
      return event;
    }

    /** O que o leitor de tela ouviu por último. */
    const announced = (fixture: { nativeElement: HTMLElement }) =>
      Array.from(fixture.nativeElement.querySelectorAll('[aria-live="polite"]') as NodeListOf<HTMLElement>).map(el => el.textContent?.trim()).join(' | ');

    it('the chart area enters the Tab order and says how to navigate', async () => {
      const fixture = await heroWithPoints();
      const area = fixture.nativeElement.querySelector('.chart-focus') as HTMLElement;
      expect(area.getAttribute('tabindex')).toBe('0');
      expect(area.getAttribute('aria-label')).toBe('Gráfico de chamados criados por período. Use as setas pra percorrer os períodos e Enter pra abrir a lista do período.');
    });

    it('arrows, Home and End walk through the periods and announce each one; Esc removes the highlight', async () => {
      const fixture = await heroWithPoints();

      expect(press(fixture, 'ArrowRight').defaultPrevented).toBeTrue();
      await fixture.whenStable();
      expect(announced(fixture)).toContain('sexta, 23/10/2026: 2 chamados criados.');

      press(fixture, 'ArrowRight');
      await fixture.whenStable();
      expect(announced(fixture)).toContain('sábado, 24/10/2026: 4 chamados criados.');

      press(fixture, 'End');
      await fixture.whenStable();
      expect(announced(fixture)).toContain('domingo, 25/10/2026: 1 chamado criado.');

      press(fixture, 'Home');
      await fixture.whenStable();
      expect(announced(fixture)).toContain('sexta, 23/10/2026');

      press(fixture, 'Escape');
      await fixture.whenStable();
      expect(announced(fixture)).not.toContain('sexta, 23/10/2026');
    });

    it('Enter opens the list of the highlighted period', async () => {
      const fixture = await heroWithPoints();
      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

      press(fixture, 'Enter');
      expect(navigate).not.toHaveBeenCalled();

      press(fixture, 'ArrowLeft');
      press(fixture, 'Enter');
      expect(navigate).toHaveBeenCalledWith(['/tickets/monitorar'], { queryParams: { createdFrom: '2026-10-25', createdTo: '2026-10-25' } });
    });

    it('other keys are not captured (Tab still leaves the chart)', async () => {
      const fixture = await heroWithPoints();
      expect(press(fixture, 'Tab').defaultPrevented).toBeFalse();
    });

    it('the footer explains the dashed average line and the weekend bands', async () => {
      const fixture = await heroWithPoints();
      const footnote = fixture.nativeElement.querySelector('.hero-footnote').textContent;
      expect(footnote).toContain('Tracejado: média dos períodos completos; faixas claras: sábados e domingos');
    });

    it('with no basis for the average (fewer than two complete periods), the footer does not mention it', async () => {
      const fixture = TestBed.createComponent(DashboardHeroChartComponent);
      fixture.componentRef.setInput('flowState', 'ready');
      fixture.componentRef.setInput('points', [{ periodStart: '2026-10-27', count: 3 }, { periodStart: '2026-10-28', count: 1 }]);
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('.hero-footnote').textContent).not.toContain('Tracejado');
    });
  });

  describe('DashboardHeroChartComponent — resolved series, with the chart actually drawn', () => {
    /** Três dias com poucos criados e muitos resolvidos (a escala mostra a série dos resolvidos). */
    const points = [
      { periodStart: '2026-10-26', count: 2, resolvedCount: 40 },
      { periodStart: '2026-10-27', count: 3, resolvedCount: 50 },
      { periodStart: '2026-10-28', count: 1, resolvedCount: 45 }
    ];

    /** Cria o gráfico na página e espera o Chart.js desenhar (o canvas está num `@defer (on idle)`). */
    async function drawn() {
      const fixture = TestBed.createComponent(DashboardHeroChartComponent);
      document.body.appendChild(fixture.nativeElement);
      fixture.componentRef.setInput('flowState', 'ready');
      fixture.componentRef.setInput('points', points);
      fixture.componentRef.setInput('bucketLink', (periodStart: string) => ({ route: '/tickets/monitorar', queryParams: { createdFrom: periodStart, createdTo: periodStart } }));
      for (let attempt = 0; attempt < 60 && !fixture.componentInstance['chart']; attempt++) {
        await fixture.whenStable();
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      const chart = fixture.componentInstance['chart'];
      if (!chart) fail('o gráfico não foi desenhado');
      return { fixture, chart: chart! };
    }

    afterEach(() => document.querySelectorAll('app-dashboard-hero-chart').forEach(element => element.remove()));

    it('with the resolved ones in the response: both series, with legend, and the scale covers the resolved ones', async () => {
      const { chart } = await drawn();
      expect(chart.data.datasets.map(dataset => dataset.label)).toEqual(['Criados', 'Resolvidos']);
      expect(chart.options.plugins?.legend?.display).toBeTrue();
      expect(chart.scales['y'].max).toBeGreaterThanOrEqual(50);
    });

    it('Tab reaches the chart area, the arrows highlight both bars of the period and the announcement says created and resolved; Enter opens the list', async () => {
      const { fixture, chart } = await drawn();
      const area = fixture.nativeElement.querySelector('.chart-focus') as HTMLElement;
      expect(area.tabIndex).toBe(0);
      expect(area.getAttribute('aria-label')).toContain('criados e resolvidos');
      area.focus();
      expect(document.activeElement).toBe(area);

      area.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
      await fixture.whenStable();
      expect(chart.getActiveElements().map(element => element.datasetIndex)).toEqual([0, 1]);
      const announcement = Array.from(fixture.nativeElement.querySelectorAll('[aria-live="polite"]') as NodeListOf<HTMLElement>).map(el => el.textContent).join(' ');
      expect(announcement).toContain('segunda, 26/10/2026: 2 chamados criados, 40 resolvidos.');

      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      area.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      expect(navigate).toHaveBeenCalledWith(['/tickets/monitorar'], { queryParams: { createdFrom: '2026-10-26', createdTo: '2026-10-26' } });
    });
  });
});
