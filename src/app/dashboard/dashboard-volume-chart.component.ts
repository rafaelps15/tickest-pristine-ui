import { Component, inject, Injector, OnDestroy, ElementRef, PLATFORM_ID, ChangeDetectionStrategy, signal, computed, effect, input, output, viewChild, afterNextRender } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { Chart as ChartInstance } from 'chart.js';
import { TicketVolumeGrouping, TicketVolumePoint, TICKET_VOLUME_GROUPING_LABELS, TICKET_VOLUME_GROUPING_OPTIONS } from '../tickets';
import { formatIsoDate, loadChart } from '../shared';
import { EmptyStateComponent } from '../shared/ui/data-state/data-state.components';

/**
 * Paleta categórica (5 slots, validada com scripts/validate_palette.js do skill dataviz — PASS em
 * todos os checks de banda de luminosidade, piso de croma e separação CVD) — pedido explícito do
 * usuário em 2026-10-24 pra trazer de volta o colorido por barra (uma tentativa anterior de
 * "resolver" isso com um gradiente dentro do índigo, pra respeitar a One Accent Rule do
 * DESIGN.md, foi rejeitada: o usuário quer as cores de volta mesmo, laranja incluso). Reaproveitada
 * aqui puramente como ritmo visual entre as barras do volume por período — a cor não carrega
 * significado por status neste gráfico, é uma exceção deliberada à One Accent Rule.
 */
const CATEGORICAL_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'];

/** Quantos períodos o back-end devolve por agrupamento (GetTicketVolumeQueryHandler) — usado só sem dados. */
const VOLUME_DEFAULT_POINTS: Record<TicketVolumeGrouping, number> = { Day: 30, Week: 12, Month: 12 };

/** Nomes curtos dos meses em português, para rotular o gráfico quando o agrupamento é mensal. */
const MONTH_LABELS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/**
 * Gráfico do volume de chamados do Início — criados por período (e, com os resolvidos da spec 028,
 * Criados x Resolvidos), com o agrupamento Dia/Semana/Mês, a tabela acessível equivalente e os
 * estados de carregamento, erro, primeiro uso e vazio. Componente de apresentação: recebe os pontos
 * por `input()` e avisa a troca de agrupamento e o "Tentar novamente"; quem escolhe a fonte (empresa
 * toda ou recorte da operação) é a tela.
 */
@Component({
  selector: 'app-dashboard-volume-chart',
  imports: [RouterLink, EmptyStateComponent],
  templateUrl: './dashboard-volume-chart.component.html',
  styleUrl: './dashboard-volume-chart.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardVolumeChartComponent implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  /** Pontos do volume, do mais antigo pro mais novo. */
  readonly points = input<TicketVolumePoint[]>([]);
  /** Agrupamento atual. */
  readonly groupBy = input<TicketVolumeGrouping>('Day');
  /** Carregando. */
  readonly loading = input(false);
  /** A leitura falhou. */
  readonly failed = input(false);
  /** A empresa ainda não tem nenhum chamado (o vazio vira convite pra próxima ação). */
  readonly firstUse = input(false);
  /** Quem vê pode cadastrar departamentos e setores (o convite do primeiro uso muda). */
  readonly canSetUpStructure = input(false);
  /** Período escolhido nos filtros; com as duas pontas, o subtítulo mostra as datas. */
  readonly range = input<{ from?: string; to?: string } | null>(null);
  /** O gráfico segue os filtros da operação (o subtítulo avisa). */
  readonly filtered = input(false);

  /** Troca de agrupamento (Dia/Semana/Mês). */
  readonly groupByChange = output<TicketVolumeGrouping>();
  /** "Tentar novamente" depois de um erro. */
  readonly retry = output<void>();

  /** Query de view como signal (Angular 17.3+) — substitui @ViewChild, sem `!` nem ngAfterViewInit. */
  private readonly volumeChartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('volumeChart');

  /** Tabela acessível do volume — recebe o foco quando o usuário troca o gráfico pela tabela. */
  private readonly volumeTable = viewChild<ElementRef<HTMLTableElement>>('volumeTable');

  /** Injector pro `afterNextRender` do foco na tabela (chamado fora do contexto de injeção). */
  private readonly injector = inject(Injector);

  private chart: ChartInstance | null = null;

  /**
   * Identificador do redesenho mais recente pedido. `renderChart` é assíncrono (`await
   * loadChart()`); se o efeito disparar de novo antes do primeiro `await` terminar, as duas
   * chamadas ficam em voo ao mesmo tempo — sem isso, a que resolve por último vence, não a que foi
   * pedida por último, podendo sobrescrever o gráfico com dado desatualizado.
   */
  private renderToken = 0;

  /** Alterna a tabela acessível que espelha os dados do gráfico (relief rule para o WARN de contraste). */
  readonly showTable = signal(false);

  protected readonly groupByOptions = TICKET_VOLUME_GROUPING_OPTIONS;
  protected readonly groupByLabels = TICKET_VOLUME_GROUPING_LABELS;

  /**
   * Intervalo coberto pelo gráfico, pra dizer no título o que antes só dava pra deduzir pelos
   * rótulos do eixo — conta os pontos recebidos; sem dados, usa a janela padrão do back-end
   * (30 dias, 12 semanas, 12 meses).
   */
  protected readonly rangeLabel = computed(() => {
      const groupBy = this.groupBy();
      const range = this.range();
      if (range?.from && range.to) return `De ${formatIsoDate(range.from)} a ${formatIsoDate(range.to)}`;
      const points = this.points().length || VOLUME_DEFAULT_POINTS[groupBy];
      switch (groupBy) {
          case 'Week': return `Últimas ${points} semanas`;
          case 'Month': return `Últimos ${points} meses`;
          default: return `Últimos ${points} dias`;
      }
  });

  /** Rótulos formatados do período atual (um por ponto do volume), para o eixo do gráfico e a tabela acessível. */
  protected readonly periodLabels = computed(() => {
      const groupBy = this.groupBy();
      return this.points().map(point => this.formatPeriodLabel(point.periodStart, groupBy));
  });

  /** O back-end mandou os resolvidos por período (spec 028): o gráfico vira Criados x Resolvidos. */
  protected readonly hasResolved = computed(() => {
      const points = this.points();
      return points.length > 0 && points.every(point => point.resolvedCount !== undefined);
  });

  constructor() {
    // Redesenha o gráfico sempre que o volume ou o agrupamento mudarem, ou o canvas for montado (@defer).
    effect(() => {
      const points = this.points();
      const canvasRef = this.volumeChartCanvas();

      if (isPlatformBrowser(this.platformId) && canvasRef) {
        const resolved = this.hasResolved() ? points.map(point => point.resolvedCount ?? 0) : null;
        void this.renderChart(canvasRef, points.map(point => point.count), resolved, this.periodLabels());
      }
    });
  }

  /** Libera o gráfico ao sair da tela — Chart.js não limpa sozinho ao desmontar o canvas. */
  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  /** Alterna entre exibir o gráfico e a tabela acessível equivalente. */
  toggleTable(): void {
    this.showTable.update(show => !show);
    // Ao abrir a tabela, o foco vai pra ela: o leitor de tela anuncia a legenda e quem usa teclado
    // já está nos dados, em vez de o conteúdo trocar em silêncio abaixo do botão.
    if (this.showTable()) {
      afterNextRender(() => this.volumeTable()?.nativeElement.focus(), { injector: this.injector });
    }
  }

  /**
   * Formata o início de um período (aaaa-mm-dd) para exibição — dd/mm para dia e semana (o início
   * da semana já vem como a segunda-feira), "mês/ano" abreviado para mês.
   */
  protected formatPeriodLabel(periodStart: string, groupBy: TicketVolumeGrouping): string {
    const [year, month, day] = periodStart.split('-');
    if (groupBy === 'Month') {
      return `${MONTH_LABELS[Number(month) - 1]}/${year.slice(2)}`;
    }
    return `${day}/${month}`;
  }

  /**
   * Desenha (ou redesenha) o gráfico de barras do volume de chamados criados por período — com
   * `resolved`, duas séries lado a lado (Criados x Resolvidos), cada uma com a sua cor e legenda.
   * Cores de texto/borda são lidas de `data-bs-theme` no momento do desenho — se o SO mudar de
   * tema enquanto o dashboard já está aberto, o gráfico só reflete isso no próximo redesenho
   * (novo volume ou reabertura da tela), não ao vivo.
   */
  private async renderChart(canvasRef: ElementRef<HTMLCanvasElement>, counts: number[], resolved: number[] | null, labels: string[]) {
    const token = ++this.renderToken;
    const { Chart } = await loadChart();

    // Chegou um pedido de redesenho mais novo enquanto este esperava o Chart.js carregar —
    // descarta este (dado desatualizado) em vez de sobrescrever o gráfico já correto.
    if (token !== this.renderToken) return;

    const ctx = canvasRef.nativeElement.getContext('2d');
    // Lê o valor computado de verdade de --tk-surface/--tk-text-secondary em vez de duplicar o
    // hex como literal: o Chart.js não lê custom properties no config, mas o navegador já resolveu
    // a cascata (claro/escuro) pra esse elemento — ler daqui acompanha o token automaticamente se
    // ele mudar de valor no CSS, sem precisar lembrar de atualizar uma cópia aqui (achado no
    // simplify de 2026-10-27).
    const rootStyle = getComputedStyle(document.documentElement);
    const surfaceColor = rootStyle.getPropertyValue('--tk-surface').trim();
    const textColor = rootStyle.getPropertyValue('--tk-text-secondary').trim();

    this.chart?.destroy();

    this.chart = new Chart(ctx!, {
      type: 'bar',
      data: {
        labels,
        // Uma série: cor por barra (ritmo visual). Duas séries: uma cor por série, pra comparar.
        datasets: resolved
          ? [
              { label: 'Criados', data: counts, backgroundColor: CATEGORICAL_COLORS[0], borderColor: surfaceColor, borderWidth: 2, borderRadius: 4 },
              { label: 'Resolvidos', data: resolved, backgroundColor: CATEGORICAL_COLORS[2], borderColor: surfaceColor, borderWidth: 2, borderRadius: 4 }
            ]
          : [{
              label: 'Chamados criados',
              data: counts,
              backgroundColor: counts.map((_, i) => CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]),
              borderColor: surfaceColor,
              borderWidth: 2,
              borderRadius: 4
            }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        // Entrada curta (o padrão do Chart.js, ~1s, parece lentidão numa tela de operação) e
        // nenhuma com prefers-reduced-motion — os dados aparecem direto.
        animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? false
          : { duration: 300, easing: 'easeOutQuart' },
        color: textColor,
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor }
          },
          y: {
            beginAtZero: true,
            ticks: { precision: 0, color: textColor }
          }
        },
        plugins: {
          legend: { display: !!resolved, labels: { color: textColor } },
          tooltip: { mode: 'index', intersect: false }
        }
      }
    });
  }
}
