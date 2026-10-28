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
      @if (announce()) {
        <p class="visually-hidden" aria-live="polite">{{ liveSummary() }}</p>
      }

      @if (unavailable()) {
        <!-- O aviso de erro (com "Tentar novamente") fica uma vez só, acima dos grupos que dependem da mesma leitura. -->
        <p class="text-muted small mb-0"><i class="bx bx-info-circle me-1" aria-hidden="true"></i>Indisponível no momento — veja o aviso acima.</p>
      } @else if (error()) {
        <div class="alert alert-danger border-0 shadow-sm d-flex align-items-center justify-content-between gap-3 mb-0" role="alert">
          <span><i class="bx bx-error-circle me-1" aria-hidden="true"></i>{{ error() }}</span>
          <button type="button" class="btn btn-sm btn-outline-danger flex-shrink-0" (click)="retry.emit()">Tentar novamente</button>
        </div>
      } @else if (loading() && !hasValues() && variant() === 'strip') {
        <!-- Esqueleto no formato da faixa: a tela não pula quando os números chegam. -->
        <div class="card metric-strip-card" role="status">
          <span class="visually-hidden">Carregando {{ title() }}…</span>
          <ul class="list-unstyled d-flex flex-wrap mb-0 metric-strip" aria-hidden="true">
            @for (metric of metrics(); track metric.key) {
              <li class="metric-strip-item">
                <span class="metric-strip-link">
                  <span class="skeleton-line skeleton-label"></span>
                  <span class="skeleton-line skeleton-value"></span>
                </span>
              </li>
            }
          </ul>
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
          <app-empty-state [icon]="emptyIcon()" [title]="emptyTitle()" [hint]="emptyHint()" />
        </div>
      } @else if (variant() === 'strip') {
        <!-- Faixa: números de contexto numa linha só, sem ícone nem card por número — menos peso que os grupos de ação. -->
        <div class="card metric-strip-card" [class.metric-refreshing]="loading()">
          <ul class="list-unstyled d-flex flex-wrap mb-0 metric-strip">
            @for (metric of metrics(); track metric.key) {
              <li class="metric-strip-item">
                @if (metric.queryParams !== null) {
                  <a class="metric-strip-link" routerLink="/tickets/monitorar" [queryParams]="metric.queryParams"
                     [attr.aria-label]="linkLabel(metric)">
                    <span class="text-muted small">{{ metric.label }}</span>
                    <span class="fs-4 stat-value">{{ metric.value ?? '—' }}</span>
                    @if (metric.hint) {
                      <span class="text-muted small">{{ metric.hint }}</span>
                    }
                  </a>
                } @else {
                  <span class="metric-strip-link">
                    <span class="text-muted small">{{ metric.label }}</span>
                    <span class="fs-4 stat-value">{{ metric.value ?? '—' }}</span>
                  </span>
                }
              </li>
            }
          </ul>
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
                     [attr.aria-label]="linkLabel(metric)"></a>
                }
              </app-stat-card>
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: `
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
    /*
     * Fio entre os números: todo item tem o fio à esquerda e a lista sobra 1px pra fora do card, que
     * corta o excesso — o primeiro de cada linha nunca fica com fio solto, em qualquer quebra.
     */
    .metric-strip-card {
      overflow: hidden;
    }

    .metric-strip {
      margin-left: -1px;
    }

    .metric-strip-item {
      flex: 1 1 9rem;
      min-width: 0;
      border-left: 1px solid var(--tk-border);
    }

    .metric-strip-link {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      min-height: 2.75rem;
      height: 100%;
      padding: 0.875rem 1.25rem;
      color: var(--tk-text-primary);
      text-decoration: none;
      transition: background-color var(--tk-transition);
    }

    a.metric-strip-link:hover,
    a.metric-strip-link:focus-visible {
      background-color: rgba(var(--tk-primary-rgb), 0.06);
    }

    a.metric-strip-link:focus-visible {
      outline: 2px solid var(--tk-primary);
      outline-offset: -2px;
    }

    /* Celular: dois por linha. */
    @media (max-width: 575.98px) {
      .metric-strip-item {
        flex-basis: 50%;
      }
    }

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
  /**
   * Os números deste grupo não chegaram por um erro que a tela já mostra num aviso único (vários
   * grupos vindos da mesma leitura) — aqui fica só uma linha neutra, sem repetir o alerta.
   */
  readonly unavailable = input(false);
  /**
   * Se o próprio grupo anuncia os números ao leitor de tela. A tela desliga quando vários grupos
   * mudam juntos (troca de filtro) e anuncia um resumo só, em vez de uma frase por grupo.
   */
  readonly announce = input(true);
  /**
   * Forma do grupo: `cards` (um stat-card por número, pros grupos de ação) ou `strip` (uma faixa
   * compacta, pros números de contexto como o Volume — menos peso visual, mesmo drill-down).
   */
  readonly variant = input<'cards' | 'strip'>('cards');
  /** Título do estado vazio (todos os indicadores zerados). */
  readonly emptyTitle = input('Nenhum chamado com estes filtros.');
  /** Dica do estado vazio. */
  readonly emptyHint = input('Ajuste ou limpe os filtros acima para ver mais chamados.');
  /** Ícone do estado vazio: funil quando a culpa é do filtro; outro desenho quando o vazio é uma boa notícia. */
  readonly emptyIcon = input('bx-filter-alt');
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

  /** Frase lida pelo leitor de tela quando os números chegam ("Volume: 12 no total, 5 na fila."). */
  readonly liveSummary = computed(() => {
    if (!this.hasValues() || this.loading() || this.error() || this.unavailable()) return '';
    return `${this.title()}: ` + this.metrics().map(metric => `${metric.label.toLowerCase()} ${metric.value}`).join(', ') + '.';
  });

  /**
   * Nome do link do drill-down pro leitor de tela: rótulo, número e legenda do card, sem montar
   * plural ("Críticos: 1, urgentes, ainda ativos. Ver na fila de monitoramento").
   */
  linkLabel(metric: DashboardMetric): string {
    const hint = metric.hint ? `, ${metric.hint.charAt(0).toLowerCase()}${metric.hint.slice(1)}` : '';
    return `${metric.label}: ${metric.value ?? 'indisponível'}${hint}. Ver na fila de monitoramento`;
  }
}
