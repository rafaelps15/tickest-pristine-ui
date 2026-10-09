import { Component, inject, OnInit, OnDestroy, ElementRef, PLATFORM_ID, ChangeDetectionStrategy, signal, computed, effect, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { Chart as ChartInstance } from 'chart.js';
import { TicketSummaryStore, TicketVolumeGrouping, TICKET_VOLUME_GROUPING_LABELS, TICKET_VOLUME_GROUPING_OPTIONS } from '../tickets';
import { SessionService, loadChart } from '../shared';

const CHART_SURFACE_LIGHT = '#fcfcfb';
const CHART_SURFACE_DARK = '#212529';
const CHART_TEXT_LIGHT = '#666';
const CHART_TEXT_DARK = '#adb5bd';

/**
 * Paleta categórica (5 slots, validada com scripts/validate_palette.js do skill dataviz — PASS em
 * todos os checks de banda de luminosidade, piso de croma e separação CVD) — a mesma do antigo
 * gráfico de Prioridade×Status. Reaproveitada aqui puramente como ritmo visual entre as barras do
 * volume por período (pedido explícito do usuário pelo visual "mais apresentável" do gráfico
 * anterior) — diferente do uso original, aqui a cor não carrega significado por status.
 */
const CATEGORICAL_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'];

/** Nomes curtos dos meses em português, para rotular o gráfico quando o agrupamento é mensal. */
const MONTH_LABELS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/**
 * Tela de dashboard: visão ao vivo dos tickets de toda a empresa (não filtrada por quem está
 * logado) — todo papel vê os mesmos números, para dar noção de volume de chamados abertos por
 * dia/semana/mês. Vive no shell (fora de qualquer domínio) porque é a tela que cruza dados de
 * mais de um domínio — hoje só tickets, mas é aqui que uma futura métrica de outro domínio
 * entraria, não dentro do domínio de tickets.
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

  /** Query de view como signal (Angular 17.3+) — substitui @ViewChild, sem `!` nem ngAfterViewInit. */
  private readonly volumeChartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('volumeChart');

  private chart: ChartInstance | null = null;

  /** Alterna a tabela acessível que espelha os dados do gráfico (relief rule para o WARN de contraste). */
  readonly showTable = signal(false);

  protected readonly groupByOptions = TICKET_VOLUME_GROUPING_OPTIONS;
  protected readonly groupByLabels = TICKET_VOLUME_GROUPING_LABELS;

  /** Rótulos formatados do período atual (um por ponto do volume), para o eixo do gráfico e a tabela acessível. */
  protected readonly periodLabels = computed(() =>
      this.store.volume().map(point => this.formatPeriodLabel(point.periodStart, this.store.groupBy())));

  constructor() {
    // Redesenha o gráfico sempre que o volume ou o agrupamento mudarem, ou o canvas for montado (@defer).
    effect(() => {
      const volume = this.store.volume();
      const canvasRef = this.volumeChartCanvas();

      if (isPlatformBrowser(this.platformId) && canvasRef) {
        void this.renderChart(canvasRef, volume.map(point => point.count), this.periodLabels());
      }
    });
  }

  /** Carrega os totais por status e o volume de tickets da empresa ao inicializar a tela. */
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

  /** Muda o agrupamento do gráfico de volume (dia/semana/mês). */
  setGroupBy(groupBy: TicketVolumeGrouping): void {
    this.store.setGroupBy(groupBy);
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
   * Desenha (ou redesenha) o gráfico de barras do volume de tickets abertos por período.
   * Cores de texto/borda são lidas de `data-bs-theme` no momento do desenho — se o SO mudar de
   * tema enquanto o dashboard já está aberto, o gráfico só reflete isso no próximo redesenho
   * (novo volume ou reabertura da tela), não ao vivo.
   */
  private async renderChart(canvasRef: ElementRef<HTMLCanvasElement>, counts: number[], labels: string[]) {
    const { Chart } = await loadChart();
    const ctx = canvasRef.nativeElement.getContext('2d');
    const isDarkTheme = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    const surfaceColor = isDarkTheme ? CHART_SURFACE_DARK : CHART_SURFACE_LIGHT;
    const textColor = isDarkTheme ? CHART_TEXT_DARK : CHART_TEXT_LIGHT;

    this.chart?.destroy();

    this.chart = new Chart(ctx!, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Tickets abertos',
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
          legend: { display: false },
          tooltip: { mode: 'index', intersect: false }
        }
      }
    });
  }
}
