import { Component, inject, OnInit, OnDestroy, ElementRef, PLATFORM_ID, ChangeDetectionStrategy, signal, computed, effect, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { Chart as ChartInstance } from 'chart.js';
import { TicketSummaryStore, TicketPersonalSummaryStore, TicketPriority, TICKET_PRIORITY_LABELS, TicketStatus, TICKET_STATUS_LABELS } from '../tickets';
import { SessionService, loadChart } from '../shared';

/**
 * Paleta categórica (5 slots, validada com scripts/validate_palette.js do skill dataviz —
 * PASS em todos os checks de banda de luminosidade, piso de croma e separação CVD; a
 * checagem de contraste ficou em WARN, mitigado aqui pela legenda + tabela acessível).
 */
const STATUS_ORDER = [
    TicketStatus.Open,
    TicketStatus.InProgress,
    TicketStatus.Resolved,
    TicketStatus.Closed,
    TicketStatus.Canceled
] as const;

const STATUS_COLORS: Record<TicketStatus, string> = {
    [TicketStatus.Open]: '#2a78d6',
    [TicketStatus.InProgress]: '#eb6834',
    [TicketStatus.Resolved]: '#1baf7a',
    [TicketStatus.Closed]: '#eda100',
    [TicketStatus.Canceled]: '#e87ba4'
};

const PRIORITY_ORDER = [
    TicketPriority.Low,
    TicketPriority.Medium,
    TicketPriority.High,
    TicketPriority.Urgent
] as const;

const CHART_SURFACE_LIGHT = '#fcfcfb';
const CHART_SURFACE_DARK = '#212529';
const CHART_TEXT_LIGHT = '#666';
const CHART_TEXT_DARK = '#adb5bd';

/**
 * Tela de dashboard: cards de estatística da empresa inteira (todo papel vê os mesmos números) e
 * o gráfico de Prioridade x Status dos tickets do PRÓPRIO usuário logado — trazido de volta a
 * pedido do usuário, para comparar com o gráfico de volume por período que o substituiu, antes de
 * decidir qual fica. Vive no shell (fora de qualquer domínio) porque cruza dados de mais de um
 * domínio — hoje só tickets, mas é aqui que uma futura métrica de outro domínio entraria.
 */
@Component({
    selector: 'app-dashboard',
    imports: [RouterLink],
    templateUrl: './dashboard.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly store = inject(TicketSummaryStore);
  protected readonly sessionService = inject(SessionService);
  private readonly personalSummaryStore = inject(TicketPersonalSummaryStore);

  /** Query de view como signal (Angular 17.3+) — substitui @ViewChild, sem `!` nem ngAfterViewInit. */
  private readonly ticketChartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('ticketChart');

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

  /** Quantidades de tickets do próprio usuário logado, por prioridade e status. */
  private readonly counts = this.personalSummaryStore.counts;

  protected readonly priorityLabels = PRIORITY_ORDER.map(priority => TICKET_PRIORITY_LABELS[priority]);
  protected readonly statusLabels = STATUS_ORDER.map(status => TICKET_STATUS_LABELS[status]);
  protected readonly statusColors = STATUS_ORDER.map(status => STATUS_COLORS[status]);

  /** Matriz Prioridade x Status (contagem), para o gráfico e para a tabela acessível. */
  protected readonly matrix = computed(() => PRIORITY_ORDER.map(priority =>
      STATUS_ORDER.map(status =>
          this.countOf(priority, status))));

  constructor() {
    // Redesenha o gráfico sempre que o resumo dos tickets mudar ou o canvas for montado (@defer).
    effect(() => {
      const matrix = this.matrix();
      const canvasRef = this.ticketChartCanvas();

      if (isPlatformBrowser(this.platformId) && canvasRef) {
        void this.renderChart(canvasRef, matrix);
      }
    });
  }

  /** Carrega os totais por status da empresa (para os cards) ao inicializar a tela. */
  ngOnInit() {
    this.store.load();
  }

  /** Libera o gráfico ao sair da tela — Chart.js não limpa sozinho ao desmontar o canvas. */
  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  /** Alterna entre exibir o gráfico e a tabela acessível equivalente. */
  toggleTable(): void {
    this.showTable.update(show => !show);
  }

  /** Soma o total de uma linha da matriz Prioridade x Status. */
  protected rowTotal(row: number[]): number {
    return row.reduce((sum, count) => sum + count, 0);
  }

  /** Quantidade de tickets do usuário logado numa combinação de prioridade e status (zero quando não há nenhum). */
  private countOf(priority: TicketPriority, status: TicketStatus): number {
    return this.counts().find(count => count.priority === priority && count.status === status)?.count ?? 0;
  }

  /**
   * Desenha (ou redesenha) o gráfico de barras empilhadas de tickets por prioridade/status.
   * Cores de texto/borda são lidas de `data-bs-theme` no momento do desenho — se o SO mudar de
   * tema enquanto o dashboard já está aberto, o gráfico só reflete isso no próximo redesenho
   * (nova lista de tickets ou reabertura da tela), não ao vivo.
   */
  private async renderChart(canvasRef: ElementRef<HTMLCanvasElement>, matrix: number[][]) {
    const token = ++this.renderToken;
    const { Chart } = await loadChart();

    // Chegou um pedido de redesenho mais novo enquanto este esperava o Chart.js carregar —
    // descarta este (dado desatualizado) em vez de sobrescrever o gráfico já correto.
    if (token !== this.renderToken) return;

    const ctx = canvasRef.nativeElement.getContext('2d');
    const isDarkTheme = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    const surfaceColor = isDarkTheme ? CHART_SURFACE_DARK : CHART_SURFACE_LIGHT;
    const textColor = isDarkTheme ? CHART_TEXT_DARK : CHART_TEXT_LIGHT;

    this.chart?.destroy();

    this.chart = new Chart(ctx!, {
      type: 'bar',
      data: {
        labels: this.priorityLabels,
        datasets: STATUS_ORDER.map((status, statusIndex) => ({
          label: TICKET_STATUS_LABELS[status],
          data: matrix.map(row => row[statusIndex]),
          backgroundColor: STATUS_COLORS[status],
          borderColor: surfaceColor,
          borderWidth: 2,
          stack: 'tickets'
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        color: textColor,
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: textColor }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: { precision: 0, color: textColor }
          }
        },
        plugins: {
          legend: { position: 'bottom', labels: { color: textColor } },
          tooltip: { mode: 'index', intersect: false }
        }
      }
    });
  }
}
