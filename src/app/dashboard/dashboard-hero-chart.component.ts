import { Component, inject, Injector, OnDestroy, ElementRef, PLATFORM_ID, ChangeDetectionStrategy, DestroyRef, signal, computed, effect, input, output, viewChild, afterNextRender } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import type { Chart as ChartInstance, ChartDataset, Plugin } from 'chart.js';
import { TicketDashboardChartScope, TicketVolumeGrouping, TicketVolumePoint, TICKET_VOLUME_GROUPING_LABELS, TICKET_VOLUME_GROUPING_OPTIONS } from '../tickets';
import { formatIsoDate, loadChart } from '../shared';
import { EmptyStateComponent } from '../shared/ui/data-state/data-state.components';
import { DashboardNoticeComponent } from './dashboard-notice.component';
import { DashboardLink, DashboardStatusCompositionComponent } from './dashboard-status-composition.component';
import { AVERAGE_UNIT_LABELS, DashboardStatusComposition, DashboardStatusGroup, DashboardWidgetState, bucketLongLabel, bucketShortLabel, formatAverage, formatCompactCount, formatFullCount, periodAverage, weekendIndexes } from './dashboard-overview';

/** Quantos períodos o back-end devolve por agrupamento (GetTicketVolumeQueryHandler) — usado só sem dados. */
const VOLUME_DEFAULT_POINTS: Record<TicketVolumeGrouping, number> = { Day: 30, Week: 12, Month: 12 };

/**
 * O mesmo matiz escurecido (55% da cor + preto, como os tokens `--tk-status-*-edge`), pro contorno
 * das barras ter ≥3:1 contra o fundo (WCAG 1.4.11). O canvas não resolve `color-mix`, por isso a
 * conta é feita aqui a partir do hex do token.
 */
export function edgeColor(hex: string): string {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!match) return hex;
  const [r, g, b] = match.slice(1).map(part => Math.round(parseInt(part, 16) * 0.55));
  return `rgb(${r}, ${g}, ${b})`;
}

/** Celular: o gráfico vira a versão simples (uma série só), não o de desktop espremido. */
const COMPACT_QUERY = '(max-width: 575.98px)';

/**
 * Gráfico principal do Início — a visão de como a operação inteira está andando, que qualquer pessoa
 * lê em dois segundos: a frase de destaque, a composição atual por status (barra empilhada com
 * números e percentuais) e o fluxo por período (criados e, com a spec 028, resolvidos), com
 * Dia/Semana/Mês, tabela acessível equivalente, drill-down por status e por período, e os estados
 * de cada parte (carregando, erro, vazio, primeiro uso, disponível em breve) independentes.
 * Componente de apresentação: recebe tudo por `input()`; a tela decide fontes e destinos.
 */
@Component({
  selector: 'app-dashboard-hero-chart',
  imports: [RouterLink, EmptyStateComponent, DashboardNoticeComponent, DashboardStatusCompositionComponent],
  templateUrl: './dashboard-hero-chart.component.html',
  styleUrl: './dashboard-hero-chart.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardHeroChartComponent implements OnDestroy {
  /** Plataforma: o gráfico só é desenhado no navegador (não no SSR). */
  private readonly platformId = inject(PLATFORM_ID);
  /** Navega pro drill-down ao clicar num período do gráfico. */
  private readonly router = inject(Router);
  /** Solta o ouvinte da largura da tela ao sair. */
  private readonly destroyRef = inject(DestroyRef);

  /** Escopo exibido: a empresa toda ou o recorte dos filtros. */
  readonly scope = input<TicketDashboardChartScope>('company');
  /**
   * O fluxo segue o escopo. Em "Com filtros" sem o volume do recorte (spec 028), os números seguem os
   * filtros e o fluxo continua o da empresa toda — o rodapé diz isso.
   */
  readonly flowFiltered = input(true);
  /**
   * A série "Resolvidos" pode aparecer (flag `volumeResolved`, spec 028 integrada). Desligada, o fluxo
   * mostra só os criados, mesmo que a resposta traga `resolvedCount`.
   */
  readonly resolvedEnabled = input(true);
  /** Frase de destaque, ou null (sem amostra suficiente, nenhuma frase). */
  readonly insight = input<string | null>(null);
  /** Composição atual por status, ou null sem resposta. */
  readonly composition = input<DashboardStatusComposition | null>(null);
  /** Estado da composição. */
  readonly compositionState = input<DashboardWidgetState>('loading');
  /** Drill-down de cada grupo de status. */
  readonly statusLinks = input<Record<DashboardStatusGroup, DashboardLink | null>>({ open: null, inProgress: null, resolved: null, closed: null });
  /** Pontos do fluxo, do mais antigo pro mais novo. */
  readonly points = input<TicketVolumePoint[]>([]);
  /** Agrupamento atual. */
  readonly groupBy = input<TicketVolumeGrouping>('Day');
  /** Agrupamentos que não cabem no período escolhido (ex.: dia a dia em mais de um ano) — o botão fica indisponível. */
  readonly unavailableGroupings = input<TicketVolumeGrouping[]>([]);
  /** Estado do fluxo. */
  readonly flowState = input<DashboardWidgetState>('loading');
  /** Drill-down de um período (o início dele), ou null quando a lista não filtra por data. */
  readonly bucketLink = input<((periodStart: string) => DashboardLink | null) | null>(null);
  /** A empresa ainda não tem nenhum chamado (o vazio vira convite pra próxima ação). */
  readonly firstUse = input(false);
  /** Quem vê pode cadastrar departamentos e setores (o convite do primeiro uso muda). */
  readonly canSetUpStructure = input(false);
  /** Período escolhido nos filtros (escopo "Com filtros"); com as duas pontas, o subtítulo mostra as datas. */
  readonly range = input<{ from?: string; to?: string } | null>(null);

  /** Troca de agrupamento (Dia/Semana/Mês). */
  readonly groupByChange = output<TicketVolumeGrouping>();
  /** "Tentar novamente" do fluxo. */
  readonly retryFlow = output<void>();

  /** Canvas do fluxo (montado no `@defer`). */
  private readonly flowCanvas = viewChild<ElementRef<HTMLCanvasElement>>('flowChart');
  /** Tabela acessível — recebe o foco quando o usuário troca o gráfico pela tabela. */
  private readonly flowTable = viewChild<ElementRef<HTMLTableElement>>('flowTable');
  /** Injector pro `afterNextRender` do foco na tabela. */
  private readonly injector = inject(Injector);
  /** Gráfico desenhado, reaproveitado nas recargas. */
  private chart: ChartInstance | null = null;
  /** Estrutura do gráfico desenhado (séries e versão), pra só recriar quando ela muda. */
  private chartShape = '';
  /** Último redesenho pedido — descarta o que terminar fora de ordem (o Chart.js carrega assíncrono). */
  private renderToken = 0;
  /** Tema do documento (`data-bs-theme`), acompanhado ao vivo: as cores do canvas são lidas dos tokens no desenho. */
  private readonly theme = signal('light');

  /** Mostra a tabela no lugar do gráfico. */
  readonly showTable = signal(false);
  /** Tela estreita (celular): uma série só. */
  protected readonly compact = signal(false);
  /** O Chart.js não carregou (chunk falhou): o fluxo mostra o erro com "Tentar novamente". */
  protected readonly drawFailed = signal(false);
  /** Muda a cada "Tentar novamente" do desenho, pra o efeito redesenhar. */
  private readonly drawAttempt = signal(0);

  /** Média de criados por período, só dos períodos completos (linha tracejada do gráfico); null sem base. */
  protected readonly average = computed(() => periodAverage(this.points()));

  /** Há sábados e domingos sombreados (só no agrupamento por dia). */
  protected readonly hasWeekends = computed(() => weekendIndexes(this.points(), this.groupBy()).length > 0);

  /** Período destacado pelo teclado (setas), ou null. */
  protected readonly activeIndex = signal<number | null>(null);

  /** O que o leitor de tela ouve ao andar pelos períodos com as setas. */
  protected readonly keyboardAnnouncement = computed(() => {
    const index = this.activeIndex();
    return index === null ? '' : this.describeBucket(index);
  });

  /** Nome acessível da área do gráfico, com o jeito de navegar pelo teclado. */
  protected readonly chartAriaLabel = computed(() =>
    `Gráfico de chamados criados${this.hasResolved() ? ' e resolvidos' : ''} por período. Use as setas pra percorrer os períodos${this.bucketLink() ? ' e Enter pra abrir a lista do período' : ''}.`);

  /** Colunas da tabela (o colspan das linhas de estado acompanha). */
  protected readonly tableColumns = computed(() => 2 + (this.hasResolved() ? 1 : 0) + (this.bucketLink() ? 1 : 0));

  /**
   * Resumo da série pro leitor de tela (o canvas é aria-hidden): o total do intervalo e o período com
   * mais chamados. A tabela continua tendo todos os números.
   */
  protected readonly flowSummary = computed(() => {
    const points = this.points();
    if (this.flowState() !== 'ready' || points.length === 0) return '';
    const total = points.reduce((sum, point) => sum + point.count, 0);
    const peak = points.reduce((best, point) => (point.count > best.count ? point : best), points[0]);
    return `${formatFullCount(total)} chamados criados em ${this.rangeLabel().toLowerCase()}; o maior período foi ${this.longLabel(peak.periodStart)}, com ${formatFullCount(peak.count)}.`;
  });

  /** Agrupamentos, na ordem dos botões. */
  protected readonly groupByOptions = TICKET_VOLUME_GROUPING_OPTIONS;
  /** Rótulo de cada agrupamento ("Dia", "Semana", "Mês"). */
  protected readonly groupByLabels = TICKET_VOLUME_GROUPING_LABELS;

  /** Intervalo coberto pelo fluxo, dito no subtítulo. */
  protected readonly rangeLabel = computed(() => {
    const groupBy = this.groupBy();
    const range = this.range();
    if (this.scope() === 'filtered' && this.flowFiltered() && range?.from && range.to) return `De ${formatIsoDate(range.from)} a ${formatIsoDate(range.to)}`;
    const points = this.points().length || VOLUME_DEFAULT_POINTS[groupBy];
    switch (groupBy) {
      case 'Week': return `Últimas ${points} semanas`;
      case 'Month': return `Últimos ${points} meses`;
      default: return `Últimos ${points} dias`;
    }
  });

  /** Rótulos curtos dos períodos (eixo e tabela). */
  protected readonly periodLabels = computed(() => this.points().map(point => bucketShortLabel(point.periodStart, this.groupBy())));

  /**
   * O fluxo vira Criados x Resolvidos: com a série liberada ({@link resolvedEnabled}) e o back-end
   * mandando os resolvidos por período (spec 028).
   */
  protected readonly hasResolved = computed(() => {
    const points = this.points();
    return this.resolvedEnabled() && points.length > 0 && points.every(point => point.resolvedCount !== undefined);
  });

  /** Destinos de cada período, na ordem dos pontos (null quando não há drill-down). */
  protected readonly bucketLinks = computed(() => {
    const linkFor = this.bucketLink();
    return this.points().map(point => (linkFor ? linkFor(point.periodStart) : null));
  });

  /** Acompanha a largura da tela (versão do celular) e redesenha o fluxo quando os dados mudam. */
  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const query = window.matchMedia(COMPACT_QUERY);
      this.compact.set(query.matches);
      const onChange = (event: MediaQueryListEvent) => this.compact.set(event.matches);
      query.addEventListener('change', onChange);
      this.destroyRef.onDestroy(() => query.removeEventListener('change', onChange));

      // Trocar o tema com a tela aberta redesenha o gráfico com as cores novas (antes, só na próxima carga).
      const root = document.documentElement;
      this.theme.set(root.getAttribute('data-bs-theme') ?? 'light');
      const observer = new MutationObserver(() => this.theme.set(root.getAttribute('data-bs-theme') ?? 'light'));
      observer.observe(root, { attributes: true, attributeFilter: ['data-bs-theme'] });
      this.destroyRef.onDestroy(() => observer.disconnect());
    }

    // Redesenha o fluxo quando os pontos, o agrupamento, a versão (celular), o tema ou o canvas mudam.
    effect(() => {
      const points = this.points();
      const canvasRef = this.flowCanvas();
      const labels = this.periodLabels();
      const resolved = this.hasResolved() && !this.compact();
      this.theme();
      this.drawAttempt();
      if (!isPlatformBrowser(this.platformId)) return;
      if (canvasRef) {
        void this.renderChart(canvasRef, points, labels, resolved);
      } else if (this.chart) {
        // O canvas saiu (carregando, vazio ou erro): libera o gráfico e o observador de tamanho dele.
        this.chart.destroy();
        this.chart = null;
      }
    });
  }

  /** Libera o gráfico ao sair da tela — o Chart.js não limpa sozinho ao desmontar o canvas. */
  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  /** Alterna entre o gráfico e a tabela acessível; ao abrir a tabela, o foco vai pra ela. */
  toggleTable(): void {
    this.showTable.update(show => !show);
    if (this.showTable()) {
      afterNextRender(() => this.flowTable()?.nativeElement.focus(), { injector: this.injector });
    }
  }

  /** "Tentar novamente" do desenho do gráfico (o Chart.js não tinha carregado). */
  protected retryDraw(): void {
    this.drawFailed.set(false);
    this.drawAttempt.update(attempt => attempt + 1);
  }

  /** Clique num agrupamento: um que não cabe no período não faz nada (está `aria-disabled`). */
  protected chooseGroupBy(option: TicketVolumeGrouping): void {
    if (this.unavailableGroupings().includes(option) || option === this.groupBy()) return;
    this.groupByChange.emit(option);
  }

  /**
   * Teclado na área do gráfico: setas andam pelos períodos (destacando a barra e abrindo o tooltip),
   * Home/End vão pras pontas, Enter abre a lista do período e Esc tira o destaque.
   */
  protected onChartKeydown(event: KeyboardEvent): void {
    const last = this.points().length - 1;
    if (last < 0) return;
    const current = this.activeIndex();
    let next: number | null = current;
    switch (event.key) {
      case 'ArrowRight': next = current === null ? 0 : Math.min(last, current + 1); break;
      case 'ArrowLeft': next = current === null ? last : Math.max(0, current - 1); break;
      case 'Home': next = 0; break;
      case 'End': next = last; break;
      case 'Escape': next = null; break;
      case 'Enter': {
        const link = current === null ? null : this.bucketLinks()[current];
        if (link) void this.router.navigate([link.route], { queryParams: link.queryParams });
        return;
      }
      default: return;
    }
    event.preventDefault();
    this.highlight(next);
  }

  /** Ao sair da área do gráfico, o destaque do teclado some. */
  protected clearActive(): void {
    this.highlight(null);
  }

  /** Destaca (ou tira o destaque de) um período no gráfico, como o hover do mouse faria. */
  private highlight(index: number | null): void {
    this.activeIndex.set(index);
    const chart = this.chart;
    if (!chart) return;
    const active = index === null ? [] : chart.data.datasets.map((_, datasetIndex) => ({ datasetIndex, index }));
    chart.setActiveElements(active);
    const element = index === null ? null : chart.getDatasetMeta(0).data[index];
    chart.tooltip?.setActiveElements(active, element ? { x: element.x, y: element.y } : { x: 0, y: 0 });
    chart.update('none');
  }

  /** Um período em texto, pro leitor de tela ("sábado, 25/10/2026: 4 chamados criados, 3 resolvidos"). */
  private describeBucket(index: number): string {
    const point = this.points()[index];
    if (!point) return '';
    const created = `${formatFullCount(point.count)} ${point.count === 1 ? 'chamado criado' : 'chamados criados'}`;
    const resolved = this.hasResolved() ? `, ${formatFullCount(point.resolvedCount ?? 0)} ${point.resolvedCount === 1 ? 'resolvido' : 'resolvidos'}` : '';
    return `${this.longLabel(point.periodStart)}: ${created}${resolved}.`;
  }

  /** Rótulo completo de um período (tabela e tooltip). */
  protected longLabel(periodStart: string): string {
    return bucketLongLabel(periodStart, this.groupBy());
  }

  /** Número completo ("12.345"). */
  protected full(value: number | undefined): string {
    return formatFullCount(value ?? 0);
  }

  /**
   * Desenha o fluxo: barras de criados (índigo, a cor da marca — não é um status) e, com a spec 028,
   * de resolvidos (o verde de Resolvido). Numa recarga com a mesma estrutura, só troca os dados sem
   * animar (números que "pulam" a cada 2 min chamam atenção à toa). Cores lidas dos tokens no
   * momento do desenho, pra seguir o tema claro/escuro.
   */
  private async renderChart(canvasRef: ElementRef<HTMLCanvasElement>, points: TicketVolumePoint[], labels: string[], withResolved: boolean): Promise<void> {
    const token = ++this.renderToken;
    let Chart: Awaited<ReturnType<typeof loadChart>>['Chart'];
    try {
      ({ Chart } = await loadChart());
      // O canvas não se redesenha quando a fonte termina de carregar: espera a Public Sans antes do primeiro desenho.
      await document.fonts?.ready;
    } catch {
      // Chunk do gráfico não veio (rede caiu, deploy novo): erro com "Tentar novamente", não um branco.
      if (token === this.renderToken) this.drawFailed.set(true);
      return;
    }
    if (token !== this.renderToken) return;
    this.drawFailed.set(false);

    const rootStyle = getComputedStyle(document.documentElement);
    const color = (name: string) => rootStyle.getPropertyValue(name).trim();
    const textColor = color('--tk-text-secondary');
    const gridColor = color('--tk-border');

    const strongText = color('--tk-text-primary');
    const labelFontPx = (parseFloat(rootStyle.fontSize) || 16) * 0.75;
    // A barra destacada (hover ou teclado) ganha o contorno do texto principal: o estado selecionado fica claro.
    const bar = (label: string, data: number[], token: string): ChartDataset<'bar', number[]> =>
      ({ label, data, backgroundColor: color(token), borderColor: edgeColor(color(token)), borderWidth: 1, borderRadius: 3, maxBarThickness: 28,
        hoverBorderColor: strongText, hoverBorderWidth: 2 });
    const datasets = [bar('Criados', points.map(point => point.count), '--tk-primary')];
    if (withResolved) {
      datasets.push(bar('Resolvidos', points.map(point => point.resolvedCount ?? 0), '--tk-status-resolved'));
    }

    const shape = `${datasets.length}|${document.documentElement.getAttribute('data-bs-theme') ?? 'light'}`;
    if (this.chart && this.chart.canvas === canvasRef.nativeElement && shape === this.chartShape) {
      this.chart.data.labels = labels;
      this.chart.data.datasets.forEach((dataset, index) => (dataset.data = datasets[index].data));
      this.chart.update('none');
      return;
    }

    // Sábados e domingos em faixa clara atrás das barras (só por dia): o fim de semana explica os vales.
    const weekendsPlugin: Plugin<'bar'> = {
      id: 'tkWeekends',
      beforeDatasetsDraw: chart => {
        const indexes = weekendIndexes(this.points(), this.groupBy());
        const x = chart.scales['x'];
        if (!indexes.length || !x) return;
        const count = chart.data.labels?.length ?? 0;
        const step = count > 1 ? Math.abs(x.getPixelForValue(1) - x.getPixelForValue(0)) : x.width;
        const { top, bottom } = chart.chartArea;
        const ctx = chart.ctx;
        ctx.save();
        ctx.fillStyle = gridColor;
        ctx.globalAlpha = 0.5;
        for (const index of indexes) ctx.fillRect(x.getPixelForValue(index) - step / 2, top, step, bottom - top);
        ctx.restore();
      }
    };
    // A média dos períodos completos (linha tracejada, com rótulo) e o valor do maior período acima da barra.
    const referencePlugin: Plugin<'bar'> = {
      id: 'tkReference',
      afterDatasetsDraw: chart => {
        const y = chart.scales['y'];
        if (!y) return;
        const ctx = chart.ctx;
        const { left, right } = chart.chartArea;
        ctx.save();
        // Acompanha o tamanho de fonte escolhido por quem usa (12px no padrão de 16px).
        ctx.font = `600 ${Math.round(labelFontPx)}px ${Chart.defaults.font.family}`;
        ctx.fillStyle = textColor;
        const average = this.average();
        if (average !== null) {
          const lineY = Math.round(y.getPixelForValue(average)) + 0.5;
          ctx.strokeStyle = textColor;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(left, lineY);
          ctx.lineTo(right, lineY);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`Média ${formatAverage(average)} ${AVERAGE_UNIT_LABELS[this.groupBy()]}`, right - 4, lineY - 3);
        }
        const counts = this.points().map(point => point.count);
        const peak = Math.max(0, ...counts);
        const element = peak > 0 ? chart.getDatasetMeta(0).data[counts.indexOf(peak)] : undefined;
        if (element) {
          ctx.fillStyle = strongText;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(formatFullCount(peak), element.x, element.y - 4);
        }
        ctx.restore();
      }
    };

    this.chart?.destroy();
    this.chartShape = shape;
    const ctx = canvasRef.nativeElement.getContext('2d');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.chart = new Chart(ctx!, {
      type: 'bar',
      data: { labels, datasets },
      plugins: [weekendsPlugin, referencePlugin],
      options: {
        responsive: true,
        // Folga no topo pro valor do maior período não encostar na borda.
        layout: { padding: { top: 18 } },
        maintainAspectRatio: false,
        animation: reducedMotion ? false : { duration: 250, easing: 'easeOutQuart' },
        color: textColor,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor, maxRotation: 0, autoSkipPadding: 8 } },
          y: {
            beginAtZero: true,
            grace: '5%',
            grid: { color: gridColor },
            border: { display: false },
            ticks: { precision: 0, color: textColor, callback: value => formatCompactCount(Number(value)) }
          }
        },
        plugins: {
          // Legenda clicável (esconde/mostra a série) só com duas séries; com uma, o título já diz o que é.
          legend: { display: datasets.length > 1, position: 'top', align: 'end', labels: { color: textColor, boxWidth: 10, boxHeight: 10, useBorderRadius: true, borderRadius: 2 } },
          tooltip: {
            callbacks: {
              title: items => (items.length ? this.longLabel(this.points()[items[0].dataIndex]?.periodStart ?? '') : ''),
              label: item => `${item.dataset.label}: ${formatFullCount(Number(item.raw))}`
            }
          }
        },
        // No toque, o primeiro toque num período só mostra os números dele; o segundo, no mesmo período, abre a lista.
        onClick: (_event, elements) => {
          const index = elements[0]?.index;
          if (index === undefined) return;
          if (window.matchMedia('(pointer: coarse)').matches && this.activeIndex() !== index) {
            this.highlight(index);
            return;
          }
          const link = this.bucketLinks()[index];
          if (link) void this.router.navigate([link.route], { queryParams: link.queryParams });
        },
        onHover: (event, elements) => {
          const target = event.native?.target as HTMLElement | undefined;
          if (target) target.style.cursor = elements.length && this.bucketLink() ? 'pointer' : 'default';
        }
      }
    });
  }
}
