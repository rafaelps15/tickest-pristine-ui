import { Component, inject, OnInit, ElementRef, PLATFORM_ID, ChangeDetectionStrategy, signal, computed, effect, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { Chart as ChartInstance } from 'chart.js';
import { TicketsStore, TicketPriority, TICKET_PRIORITY_LABELS, TicketStatus, TICKET_STATUS_LABELS } from '../tickets';
import { SessionService } from '../shared';

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
 * Carrega o Chart.js sob demanda (import dinâmico) em vez de embutido no chunk do dashboard —
 * a lib + registerables pesam ~450kB, então só valem a pena baixar quando o gráfico for
 * realmente exibido (ver @defer no template). Cacheado numa Promise para registrar uma única vez.
 */
let chartModulePromise: Promise<typeof import('chart.js')> | null = null;

function loadChart(): Promise<typeof import('chart.js')> {
    chartModulePromise ??= import('chart.js').then(module => {
        module.Chart.register(...module.registerables);
        return module;
    });
    return chartModulePromise;
}

/**
 * Tela de dashboard: agrega dados do domínio de tickets numa visão consolidada.
 * Vive no shell (fora de qualquer domínio) porque é justamente a tela que cruza dados
 * de mais de um domínio — hoje só tickets, mas é aqui que uma futura métrica de outro
 * domínio entraria, não dentro do domínio de tickets.
 */
@Component({
    selector: 'app-dashboard',
    imports: [RouterLink],
    templateUrl: './dashboard.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly store = inject(TicketsStore);
  protected readonly sessionService = inject(SessionService);

  /** Query de view como signal (Angular 17.3+) — substitui @ViewChild, sem `!` nem ngAfterViewInit. */
  private readonly ticketChartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('ticketChart');

  private chart: ChartInstance | null = null;

  /** Alterna a tabela acessível que espelha os dados do gráfico (relief rule para o WARN de contraste). */
  readonly showTable = signal(false);

  protected readonly priorityLabels = PRIORITY_ORDER.map(priority => TICKET_PRIORITY_LABELS[priority]);
  protected readonly statusLabels = STATUS_ORDER.map(status => TICKET_STATUS_LABELS[status]);
  protected readonly statusColors = STATUS_ORDER.map(status => STATUS_COLORS[status]);

  /** Matriz Prioridade x Status (contagem), para o gráfico e para a tabela acessível. */
  protected readonly matrix = computed(() => PRIORITY_ORDER.map(priority =>
      STATUS_ORDER.map(status =>
          this.store.tickets().filter(t => t.priority === priority && t.status === status).length)));

  constructor() {
    // Redesenha o gráfico sempre que a lista de tickets mudar ou o canvas for montado (@defer).
    effect(() => {
      const matrix = this.matrix();
      const canvasRef = this.ticketChartCanvas();

      if (isPlatformBrowser(this.platformId) && canvasRef) {
        void this.renderChart(canvasRef, matrix);
      }
    });
  }

  /** Carrega os tickets do usuário logado ao inicializar a tela — só quando o papel dele de fato lida com tickets. */
  ngOnInit() {
    if (this.hasTicketAccess()) {
      this.store.loadForCurrentUser();
    }
  }

  /**
   * Indica se o usuário logado abre ou atende chamados (Agent/Requester) — mesmo que também
   * seja Admin. Um Admin Master puro (sem nenhuma dessas roles) não tem tickets próprios
   * (confirmado no PRODUCT.md), então a tela de boas-vindas dele não fala de "seus tickets".
   */
  protected hasTicketAccess(): boolean {
    const roles = this.sessionService.currentUser()?.roles ?? [];
    return roles.some(role => role.name === 'Agent' || role.name === 'Requester');
  }

  /** Alterna entre exibir o gráfico e a tabela acessível equivalente. */
  toggleTable(): void {
    this.showTable.update(show => !show);
  }

  /** Soma o total de uma linha da matriz Prioridade x Status. */
  protected rowTotal(row: number[]): number {
    return row.reduce((sum, count) => sum + count, 0);
  }

  /**
   * Desenha (ou redesenha) o gráfico de barras empilhadas de tickets por prioridade/status.
   * Cores de texto/borda são lidas de `data-bs-theme` no momento do desenho — se o SO mudar de
   * tema enquanto o dashboard já está aberto, o gráfico só reflete isso no próximo redesenho
   * (nova lista de tickets ou reabertura da tela), não ao vivo.
   */
  private async renderChart(canvasRef: ElementRef<HTMLCanvasElement>, matrix: number[][]) {
    const { Chart } = await loadChart();
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
