import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
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
});
