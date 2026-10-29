import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { StatCardComponent, StatTone } from '../shared/ui/stat-card/stat-card.component';
import { EmptyStateComponent } from '../shared/ui/data-state/data-state.components';
import { DashboardNoticeComponent } from './dashboard-notice.component';

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

/** Número de destaque do grupo, acima dos indicadores (ex.: a taxa de SLA cumprido). */
export interface DashboardMetricLead {
  /** O número já formatado ("87%"). */
  value: string;
  /** O que ele significa ("resolvidos no prazo, 7 de 8"). */
  text: string;
  /** Comparação com o período anterior, quando há. */
  trend?: string | null;
}

/**
 * Grupo de indicadores do Início (Volume, SLA, Central de atenção) com os quatro estados por
 * conta própria: carregando (esqueleto), erro (mensagem + "Tentar novamente"), vazio (diz por quê)
 * e sucesso. Um grupo falhar não derruba os outros. Componente de apresentação: recebe os números
 * por `input()` e só avisa o "Tentar novamente".
 */
@Component({
  selector: 'app-dashboard-metric-group',
  imports: [DashboardNoticeComponent, RouterLink, StatCardComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [attr.aria-labelledby]="headingId()" [attr.aria-busy]="loading() || null">
      <div class="mb-2">
        <h2 [id]="headingId()" class="h5 card-title fw-bold mb-1">{{ title() }}</h2>
        @if (description()) {
          <p class="text-muted small mb-0">{{ description() }}</p>
        }
      </div>

      @if (lead(); as headline) {
        @if (!unavailable() && !error()) {
          <!-- O número que resume o grupo, antes dos detalhes. -->
          <p class="d-flex flex-wrap align-items-baseline gap-2 mb-2">
            <span class="fs-4 stat-value">{{ headline.value }}</span>
            <span class="text-muted">{{ headline.text }}</span>
            @if (headline.trend) {
              <span class="text-muted small">· {{ headline.trend }}</span>
            }
          </p>
        }
      }

      @if (unavailable()) {
        <!-- O aviso de erro (com "Tentar novamente") fica uma vez só, acima dos grupos que dependem da mesma leitura. -->
        <p class="text-muted small mb-0"><i class="bx bx-info-circle me-1" aria-hidden="true"></i>Indisponível no momento — veja o aviso acima.</p>
      } @else if (error()) {
        <!-- Falha técnica em tom neutro: vermelho fica pro risco operacional (SLA vencido). -->
        <div class="card px-3 py-2"><app-dashboard-notice kind="error" [text]="error()!" (retry)="retry.emit()" /></div>
      } @else if (loading() && !hasValues()) {
        <div class="row g-3" role="status">
          <span class="visually-hidden">Carregando {{ title() }}…</span>
          @for (metric of metrics(); track metric.key) {
            <div [class]="columnClass()">
              <div class="card metric-skeleton" aria-hidden="true">
                <span class="tk-skeleton skeleton-label"></span>
                <span class="tk-skeleton skeleton-value"></span>
              </div>
            </div>
          }
        </div>
      } @else if (isEmpty()) {
        <div class="card">
          <app-empty-state [icon]="emptyIcon()" [title]="emptyTitle()" [hint]="emptyHint()" />
        </div>
      } @else {
        <!-- Numa recarga, os números ficam como estão: o indicador de atualização é o do cabeçalho da tela. -->
        <div class="row g-3">
          @for (metric of metrics(); track metric.key) {
            <div [class]="columnClass()">
              <!-- Compactos: são o detalhe abaixo da faixa do topo e não podem ganhar dela na hierarquia. -->
              <app-stat-card [label]="metric.label" [icon]="metric.icon" [tone]="metric.tone" [value]="metric.value"
                             [hint]="cardHint(metric)" [linked]="metric.queryParams !== null" [compact]="true">
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
      min-height: 6rem;
    }

    .skeleton-label {
      display: block;
      width: 55%;
      height: 0.75rem;
    }

    .skeleton-value {
      display: block;
      width: 30%;
      height: 1.5rem;
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
  /** Número de destaque acima dos indicadores, ou null. */
  readonly lead = input<DashboardMetricLead | null>(null);
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

  /**
   * Nome do link do drill-down pro leitor de tela: rótulo, número e legenda do card, sem montar
   * plural ("Críticos: 1, urgentes, ainda ativos. Ver na fila de monitoramento").
   */
  linkLabel(metric: DashboardMetric): string {
    const hint = metric.hint ? `, ${metric.hint.charAt(0).toLowerCase()}${metric.hint.slice(1)}` : '';
    return `${metric.label}: ${metric.value ?? 'indisponível'}${hint}. Ver na fila de monitoramento`;
  }

  /** Legenda do stat-card: a dica do indicador (vazia sem dica). */
  cardHint(metric: DashboardMetric): string {
    return metric.hint ?? '';
  }
}
