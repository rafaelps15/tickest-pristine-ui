import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { DashboardStatusCompositionComponent } from './dashboard-status-composition.component';
import { DashboardNoticeComponent } from './dashboard-notice.component';
import { DashboardKpi, DashboardKpiStripComponent } from './dashboard-kpi-strip.component';
import { DashboardHeroChartComponent, edgeColor } from './dashboard-hero-chart.component';
import { statusComposition } from './dashboard-overview';

describe('componentes de apresentação do Início', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardStatusCompositionComponent, DashboardNoticeComponent, DashboardHeroChartComponent, DashboardKpiStripComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])]
    }).compileComponents();
  });

  describe('DashboardStatusCompositionComponent', () => {
    it('não desenha fatia pra status sem chamado (a largura mínima mentiria), mas mantém o zero na descrição', async () => {
      const fixture = TestBed.createComponent(DashboardStatusCompositionComponent);
      fixture.componentRef.setInput('composition', statusComposition({ totalCount: 5, openCount: 5, inProgressCount: 0, resolvedCount: 0, closedCount: 0, canceledCount: 0 }));
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelectorAll('.composition-segment').length).toBe(1);
      expect(fixture.nativeElement.querySelector('.composition-bar').getAttribute('aria-label')).toContain('em andamento 0 (0%)');
      expect(fixture.nativeElement.textContent).not.toContain('cancelado');
    });

    it('sem chamado na barra (só cancelados), diz isso em texto em vez de uma barra vazia', async () => {
      const fixture = TestBed.createComponent(DashboardStatusCompositionComponent);
      fixture.componentRef.setInput('composition', statusComposition({ totalCount: 3, openCount: 0, inProgressCount: 0, resolvedCount: 0, closedCount: 0, canceledCount: 3 }));
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('.composition-bar')).toBeNull();
      expect(fixture.nativeElement.textContent).toContain('Nenhum chamado aberto, em andamento, resolvido ou fechado agora.');
      expect(fixture.nativeElement.textContent).toContain('+ 3 cancelados');
    });

    it('sem destino, a fatia é texto com nome acessível, não link', async () => {
      const fixture = TestBed.createComponent(DashboardStatusCompositionComponent);
      fixture.componentRef.setInput('composition', statusComposition({ totalCount: 2, openCount: 1, inProgressCount: 1, resolvedCount: 0, closedCount: 0, canceledCount: 0 }));
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('.composition-segment a')).toBeNull();
      expect(fixture.nativeElement.querySelector('.composition-segment [role="img"]').getAttribute('aria-label')).toBe('Abertos: 1 chamados, 50%');
    });

    it('com destino e aviso de visibilidade, o nome acessível diz quantos a pessoa vê', async () => {
      const fixture = TestBed.createComponent(DashboardStatusCompositionComponent);
      fixture.componentRef.setInput('composition', statusComposition({ totalCount: 340, openCount: 340, inProgressCount: 0, resolvedCount: 0, closedCount: 0, canceledCount: 0 }));
      const link = { route: '/tickets', queryParams: {}, note: 'Você tem acesso a 12 dos 340 chamados' };
      fixture.componentRef.setInput('links', { open: link, inProgress: null, resolved: null, closed: null });
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('.composition-segment a').getAttribute('aria-label')).toContain('Você tem acesso a 12 dos 340 chamados');
    });
  });

  describe('DashboardNoticeComponent', () => {
    it('"em breve": texto neutro, sem botão nem papel de alerta', async () => {
      const fixture = TestBed.createComponent(DashboardNoticeComponent);
      fixture.componentRef.setInput('text', 'Disponível em breve.');
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
      expect(fixture.nativeElement.querySelector('button')).toBeNull();
      expect(fixture.nativeElement.querySelector('.text-danger, .alert-danger')).toBeNull();
    });

    it('erro: anuncia e o "Tentar novamente" avisa quem usa', async () => {
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
    it('contorno das barras: o mesmo matiz escurecido (≥3:1 contra o branco), sem trocar a cor', () => {
      expect(edgeColor('#ffab00')).toBe('rgb(140, 94, 0)');
      expect(edgeColor('#03c3ec')).toBe('rgb(2, 107, 130)');
      expect(edgeColor('rgb(1, 2, 3)')).toBe('rgb(1, 2, 3)');
    });

    it('um agrupamento que não cabe no período fica indisponível, diz o motivo e não troca', async () => {
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

    it('cada parte indisponível vira "em breve", sem esqueleto e sem repetir o "em breve" dos resolvidos no rodapé', async () => {
      const fixture = TestBed.createComponent(DashboardHeroChartComponent);
      fixture.componentRef.setInput('compositionState', 'unavailable');
      fixture.componentRef.setInput('flowState', 'unavailable');
      await fixture.whenStable();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Situação atual dos chamados: disponível em breve.');
      expect(text).toContain('Chamados por período: disponível em breve.');
      expect(fixture.nativeElement.querySelector('.skeleton-block')).toBeNull();
      expect(fixture.nativeElement.querySelector('.hero-footnote').textContent).not.toContain('Resolvidos por período');
    });

    it('carregando: esqueletos com a altura final, anunciados ao leitor de tela', async () => {
      const fixture = TestBed.createComponent(DashboardHeroChartComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelectorAll('[role="status"]').length).toBe(2);
      expect(fixture.nativeElement.querySelector('.flow-chart .skeleton-block')).not.toBeNull();
    });

    it('com os resolvidos (spec 028), a tabela ganha a coluna e a nota de "em breve" some', async () => {
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

    it('com a série de resolvidos desligada, mostra só os criados mesmo que a resposta traga resolvedCount', async () => {
      const fixture = TestBed.createComponent(DashboardHeroChartComponent);
      fixture.componentRef.setInput('flowState', 'ready');
      fixture.componentRef.setInput('resolvedEnabled', false);
      fixture.componentRef.setInput('points', [{ periodStart: '2026-10-27', count: 3, resolvedCount: 2 }]);
      await fixture.whenStable();
      fixture.componentInstance.toggleTable();
      await fixture.whenStable();

      const headers = Array.from(fixture.nativeElement.querySelectorAll('th[scope="col"]') as NodeListOf<HTMLElement>).map(th => th.textContent?.trim());
      expect(headers).not.toContain('Resolvidos');
      expect(fixture.nativeElement.querySelector('caption').textContent).not.toContain('resolvidos');
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

    it('card com destino mostra a pista de clique; sem destino, não', async () => {
      const fixture = await strip([
        { key: 'a', label: 'Em andamento', value: 3, link },
        { key: 'b', label: 'Total', value: 9, link: null }
      ]);
      const cards = fixture.nativeElement.querySelectorAll('.kpi-card');
      expect(cards[0].querySelector('.kpi-go')).not.toBeNull();
      expect(cards[1].querySelector('.kpi-go')).toBeNull();
      expect(cards[0].querySelector('a').getAttribute('aria-label')).toBe('Em andamento: 3. Ver a lista');
    });

    it('o apoio entra no nome acessível (no toque e no leitor de tela não existe title)', async () => {
      const fixture = await strip([{ key: 'a', label: 'Na fila', value: 5, hint: 'abertos e em andamento', link }]);
      expect(fixture.nativeElement.querySelector('.kpi-card a').getAttribute('aria-label')).toBe('Na fila: 5 (abertos e em andamento). Ver a lista');
    });

    it('risco em vermelho só acima de zero', async () => {
      const fixture = await strip([
        { key: 'a', label: 'Atrasados', value: 4, risk: 'danger', link },
        { key: 'b', label: 'Atrasados', value: 0, risk: 'danger', link }
      ]);
      const values = fixture.nativeElement.querySelectorAll('.kpi-value');
      expect(values[0].classList).toContain('kpi-risk');
      expect(values[1].classList).not.toContain('kpi-risk');
    });

    it('um indicador de outra fonte carrega sozinho, sem link nem número inventado', async () => {
      const fixture = await strip([{ key: 'a', label: 'Atrasados', value: null, loading: true, link }]);
      const card = fixture.nativeElement.querySelector('.kpi-card');
      expect(card.querySelector('.kpi-skeleton')).not.toBeNull();
      expect(card.querySelector('a')).toBeNull();
      expect(card.classList).not.toContain('kpi-linked');
    });

    it('erro da fonte: um aviso neutro só, com "Tentar novamente"', async () => {
      const fixture = await strip([{ key: 'a', label: 'Total', value: null, link: null }], 'error');
      let retried = false;
      fixture.componentInstance.retry.subscribe(() => (retried = true));
      expect(fixture.nativeElement.querySelectorAll('[role="alert"]').length).toBe(1);
      (fixture.nativeElement.querySelector('[role="alert"] button') as HTMLButtonElement).click();
      expect(retried).toBeTrue();
    });
  });

  describe('DashboardHeroChartComponent — erro dos totais já avisado nos indicadores', () => {
    it('a composição diz que está indisponível, sem um segundo alerta', async () => {
      const fixture = TestBed.createComponent(DashboardHeroChartComponent);
      fixture.componentRef.setInput('compositionState', 'error');
      fixture.componentRef.setInput('flowState', 'unavailable');
      await fixture.whenStable();

      const composition = fixture.nativeElement.querySelector('.hero-composition') as HTMLElement;
      expect(composition.textContent).toContain('Situação atual indisponível. Use “Tentar novamente” nos indicadores acima.');
      expect(composition.querySelector('[role="alert"]')).toBeNull();
    });

    it('a tabela ajusta o colspan das linhas de estado às colunas que existem', async () => {
      const fixture = TestBed.createComponent(DashboardHeroChartComponent);
      fixture.componentRef.setInput('flowState', 'empty');
      await fixture.whenStable();
      fixture.componentInstance.toggleTable();
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('tbody td').getAttribute('colspan')).toBe('2');
    });
  });

  describe('DashboardHeroChartComponent — teclado e referências do gráfico', () => {
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

    it('a área do gráfico entra na ordem do Tab e diz como navegar', async () => {
      const fixture = await heroWithPoints();
      const area = fixture.nativeElement.querySelector('.chart-focus') as HTMLElement;
      expect(area.getAttribute('tabindex')).toBe('0');
      expect(area.getAttribute('aria-label')).toBe('Gráfico de chamados criados por período. Use as setas pra percorrer os períodos e Enter pra abrir a lista do período.');
    });

    it('setas, Home e End andam pelos períodos e anunciam cada um; Esc tira o destaque', async () => {
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

    it('Enter abre a lista do período destacado', async () => {
      const fixture = await heroWithPoints();
      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

      press(fixture, 'Enter');
      expect(navigate).not.toHaveBeenCalled();

      press(fixture, 'ArrowLeft');
      press(fixture, 'Enter');
      expect(navigate).toHaveBeenCalledWith(['/tickets/monitorar'], { queryParams: { createdFrom: '2026-10-25', createdTo: '2026-10-25' } });
    });

    it('outras teclas não são capturadas (Tab continua saindo do gráfico)', async () => {
      const fixture = await heroWithPoints();
      expect(press(fixture, 'Tab').defaultPrevented).toBeFalse();
    });

    it('o rodapé explica o tracejado da média e as faixas de fim de semana', async () => {
      const fixture = await heroWithPoints();
      const footnote = fixture.nativeElement.querySelector('.hero-footnote').textContent;
      expect(footnote).toContain('Tracejado: média dos períodos completos; faixas claras: sábados e domingos');
    });

    it('sem base pra média (menos de dois períodos completos), o rodapé não fala dela', async () => {
      const fixture = TestBed.createComponent(DashboardHeroChartComponent);
      fixture.componentRef.setInput('flowState', 'ready');
      fixture.componentRef.setInput('points', [{ periodStart: '2026-10-27', count: 3 }, { periodStart: '2026-10-28', count: 1 }]);
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('.hero-footnote').textContent).not.toContain('Tracejado');
    });
  });

  describe('DashboardHeroChartComponent — série de resolvidos desligada, com o gráfico desenhado de verdade', () => {
    /** Três dias com poucos criados e muitos resolvidos (a escala denunciaria a série escondida). */
    const points = [
      { periodStart: '2026-10-26', count: 2, resolvedCount: 40 },
      { periodStart: '2026-10-27', count: 3, resolvedCount: 50 },
      { periodStart: '2026-10-28', count: 1, resolvedCount: 45 }
    ];

    /** Cria o gráfico na página e espera o Chart.js desenhar (o canvas está num `@defer (on idle)`). */
    async function drawn(resolvedEnabled: boolean) {
      const fixture = TestBed.createComponent(DashboardHeroChartComponent);
      document.body.appendChild(fixture.nativeElement);
      fixture.componentRef.setInput('flowState', 'ready');
      fixture.componentRef.setInput('resolvedEnabled', resolvedEnabled);
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

    it('desligada: uma série só, sem legenda, e a escala segue só os criados', async () => {
      const { chart } = await drawn(false);
      expect(chart.data.datasets.map(dataset => dataset.label)).toEqual(['Criados']);
      expect(chart.options.plugins?.legend?.display).toBeFalse();
      expect(chart.scales['y'].max).toBeLessThan(10);
    });

    it('ligada: as duas séries, com legenda, e a escala cobre os resolvidos (comportamento de antes)', async () => {
      const { chart } = await drawn(true);
      expect(chart.data.datasets.map(dataset => dataset.label)).toEqual(['Criados', 'Resolvidos']);
      expect(chart.options.plugins?.legend?.display).toBeTrue();
      expect(chart.scales['y'].max).toBeGreaterThanOrEqual(50);
    });

    it('desligada: Tab chega na área do gráfico, as setas destacam só a barra de criados e o anúncio não cita resolvidos; Enter abre a lista', async () => {
      const { fixture, chart } = await drawn(false);
      const area = fixture.nativeElement.querySelector('.chart-focus') as HTMLElement;
      expect(area.tabIndex).toBe(0);
      expect(area.getAttribute('aria-label')).not.toContain('resolvidos');
      area.focus();
      expect(document.activeElement).toBe(area);

      area.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
      await fixture.whenStable();
      expect(chart.getActiveElements().map(element => element.datasetIndex)).toEqual([0]);
      const announcement = Array.from(fixture.nativeElement.querySelectorAll('[aria-live="polite"]') as NodeListOf<HTMLElement>).map(el => el.textContent).join(' ');
      expect(announcement).toContain('segunda, 26/10/2026: 2 chamados criados.');
      expect(announcement).not.toContain('resolvido');

      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      area.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      expect(navigate).toHaveBeenCalledWith(['/tickets/monitorar'], { queryParams: { createdFrom: '2026-10-26', createdTo: '2026-10-26' } });
    });
  });
});
