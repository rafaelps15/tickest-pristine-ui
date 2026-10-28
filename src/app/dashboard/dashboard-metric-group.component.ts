import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { StatCardComponent, StatTone } from '../shared/ui/stat-card/stat-card.component';
import { EmptyStateComponent } from '../shared/ui/data-state/data-state.components';

/** Um indicador do grupo: um número com rótulo, ícone e o destino do drill-down. */
export interface DashboardMetric {
  /** Identificador estável do indicador. */
  key: string;
  /** Rótulo do card. */
  label: string;
  /** Ícone Boxicons (a cor nunca é o único sinal: o rótulo diz o que é). */
  icon: string;
  /** Tom do card. */
  tone: StatTone;
  /** Número, ou null quando ainda não há resposta. */
  value: number | null;
  /** Como o número se lê em voz alta ("chamados atrasados"). */
  ariaNoun: string;
  /** Linha de apoio abaixo do número. */
  hint?: string;
  /** Query params do Monitor pro drill-down; null quando o indicador não leva a lugar nenhum. */
  queryParams: Params | null;
}

/**
 * Grupo de indicadores do Início (Volume, SLA, Central de atenção) com os quatro estados por
 * conta própria: carregando (esqueleto), erro (mensagem + "Tentar novamente"), vazio (diz por quê)
 * e sucesso. Um grupo falhar não derruba os outros. Componente de apresentação: recebe os números
 * por `input()` e só avisa o "Tentar novamente".
 */
@Component({
  selector: 'app-dashboard-metric-group',
  imports: [RouterLink, StatCardComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mb-4" [attr.aria-labelledby]="headingId()" [attr.aria-busy]="loading() || null">
      <div class="mb-2">
        <h2 [id]="headingId()" class="h6 section-label mb-0">{{ title() }}</h2>
        @if (description()) {
          <p class="text-muted small mb-0">{{ description() }}</p>
        }
      </div>

      <!-- Resumo pro leitor de tela quando os números chegam ou mudam com os filtros. -->
      <p class="visually-hidden" aria-live="polite">{{ liveSummary() }}</p>

      @if (error()) {
        <div class="alert alert-danger border-0 shadow-sm d-flex align-items-center justify-content-between gap-3 mb-0" role="alert">
          <span><i class="bx bx-error-circle me-1" aria-hidden="true"></i>{{ error() }}</span>
          <button type="button" class="btn btn-sm btn-outline-danger flex-shrink-0" (click)="retry.emit()">Tentar novamente</button>
        </div>
      } @else if (loading() && !hasValues()) {
        <div class="row g-3" role="status">
          <span class="visually-hidden">Carregando {{ title() }}…</span>
          @for (metric of metrics(); track metric.key) {
            <div [class]="columnClass()">
              <div class="card metric-skeleton" aria-hidden="true">
                <span class="skeleton-line skeleton-label"></span>
                <span class="skeleton-line skeleton-value"></span>
              </div>
            </div>
          }
        </div>
      } @else if (isEmpty()) {
        <div class="card">
          <app-empty-state icon="bx-filter-alt" [title]="emptyTitle()" [hint]="emptyHint()" />
        </div>
      } @else {
        <div class="row g-3" [class.metric-refreshing]="loading()">
          @for (metric of metrics(); track metric.key) {
            <div [class]="columnClass()">
              <app-stat-card [label]="metric.label" [icon]="metric.icon" [tone]="metric.tone" [value]="metric.value"
                             [hint]="metric.hint ?? ''" [linked]="metric.queryParams !== null">
                <!-- Dois @if separados: um nó por bloco, pra o "Ver na fila" cair no slot [statHint] do card. -->
                @if (metric.queryParams !== null) {
                  <span statHint class="kpi-cta">Ver na fila <i class="bx bx-chevron-right" aria-hidden="true"></i></span>
                }
                @if (metric.queryParams !== null) {
                  <a class="stretched-link" routerLink="/tickets/monitorar" [queryParams]="metric.queryParams"
                     [attr.aria-label]="'Ver ' + (metric.value ?? '') + ' ' + metric.ariaNoun + ' na fila de monitoramento'"></a>
                }
              </app-stat-card>
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: `
    /* "Ver na fila": mesmo índigo escuro dos KPIs do Início (4.5:1 sobre o card claro). */
    .kpi-cta {
      color: var(--tk-primary-dark);
      font-weight: 500;
    }

    :host-context([data-bs-theme="dark"]) .kpi-cta {
      color: var(--tk-primary);
    }

    .metric-skeleton {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1.25rem;
      min-height: 7rem;
    }

    .skeleton-line {
      display: block;
      border-radius: var(--tk-radius-sm);
      background: linear-gradient(90deg, var(--tk-border) 25%, var(--tk-page-bg) 50%, var(--tk-border) 75%);
      background-size: 200% 100%;
      animation: metric-shimmer 1.4s ease-in-out infinite;
    }

    .skeleton-label {
      width: 55%;
      height: 0.75rem;
    }

    .skeleton-value {
      width: 30%;
      height: 1.75rem;
    }

    @keyframes metric-shimmer {
      from { background-position: 100% 0; }
      to { background-position: -100% 0; }
    }

    /* Movimento reduzido: o esqueleto fica parado, sem brilho correndo. */
    @media (prefers-reduced-motion: reduce) {
      .skeleton-line {
        animation: none;
      }
    }

    /* Recarga com números na tela (troca de filtro): esmaece em vez de piscar o esqueleto. */
    .metric-refreshing {
      opacity: 0.6;
      transition: opacity 150ms ease;
    }
  `
})
export class DashboardMetricGroupComponent {
  /** Título do grupo ("Volume"). */
  readonly title = input.required<string>();
  /** Linha de contexto abaixo do título. */
  readonly description = input('');
  /** Indicadores, na ordem em que aparecem. */
  readonly metrics = input.required<DashboardMetric[]>();
  /** Se a leitura está em andamento. */
  readonly loading = input(false);
  /** Mensagem de erro da leitura, ou null. */
  readonly error = input<string | null>(null);
  /** Título do estado vazio (todos os indicadores zerados). */
  readonly emptyTitle = input('Nenhum chamado neste recorte.');
  /** Dica do estado vazio. */
  readonly emptyHint = input('Ajuste ou limpe os filtros acima para ver mais chamados.');
  /** Classe da coluna de cada card (o grid se reorganiza por tamanho de tela). */
  readonly columnClass = input('col-12 col-sm-6 col-xl-4');

  /** "Tentar novamente" depois de um erro. */
  readonly retry = output<void>();

  /** Id do título, pra `aria-labelledby` da seção. */
  readonly headingId = computed(() => 'metric-group-' + this.title().toLowerCase().replace(/[^a-z0-9]+/g, '-'));

  /** Se todos os indicadores já têm número. */
  readonly hasValues = computed(() => this.metrics().every(metric => metric.value !== null));

  /** Vazio: todos os números chegaram e são zero. */
  readonly isEmpty = computed(() => this.hasValues() && this.metrics().every(metric => metric.value === 0));

  /** Frase lida pelo leitor de tela quando os números chegam ("Volume: 12 no total, 5 no backlog."). */
  readonly liveSummary = computed(() => {
    if (!this.hasValues() || this.loading() || this.error()) return '';
    return `${this.title()}: ` + this.metrics().map(metric => `${metric.value} ${metric.ariaNoun}`).join(', ') + '.';
  });
}
