import { Component, inject, OnInit, ElementRef, PLATFORM_ID, ChangeDetectionStrategy, signal, computed, effect, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../../application/services/auth.service';
import { TicketsService } from '../../../application/services/tickets.service';
import { Router, RouterLink } from '@angular/router';
import type { Chart as ChartInstance } from 'chart.js';
import { TicketPriority, TICKET_PRIORITY_LABELS } from '../../../domain/enums/ticket-priority.enum';
import { TicketStatus, TICKET_STATUS_LABELS } from '../../../domain/enums/ticket-status.enum';

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

const CHART_SURFACE = '#fcfcfb';

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

/** UI da área restrita. */
@Component({
    selector: 'app-dashboard',
    imports: [RouterLink],
    templateUrl: './dashboard.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly ticketsService = inject(TicketsService);

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
          this.ticketsService.tickets().filter(t => t.priority === priority && t.status === status).length)));

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

  ngOnInit() {
    this.ticketsService.loadForCurrentUser();
  }

  toggleTable(): void {
    this.showTable.update(show => !show);
  }

  protected rowTotal(row: number[]): number {
    return row.reduce((sum, count) => sum + count, 0);
  }

  private async renderChart(canvasRef: ElementRef<HTMLCanvasElement>, matrix: number[][]) {
    const { Chart } = await loadChart();
    const ctx = canvasRef.nativeElement.getContext('2d');

    this.chart?.destroy();

    this.chart = new Chart(ctx!, {
      type: 'bar',
      data: {
        labels: this.priorityLabels,
        datasets: STATUS_ORDER.map((status, statusIndex) => ({
          label: TICKET_STATUS_LABELS[status],
          data: matrix.map(row => row[statusIndex]),
          backgroundColor: STATUS_COLORS[status],
          borderColor: CHART_SURFACE,
          borderWidth: 2,
          stack: 'tickets'
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            grid: { display: false }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        },
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { mode: 'index', intersect: false }
        }
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
