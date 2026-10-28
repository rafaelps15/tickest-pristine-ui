import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { DASHBOARD_STATUS_GROUP_LABELS, DashboardStatusComposition, DashboardStatusGroup, formatCount, formatFullCount } from './dashboard-overview';

/** Destino de um drill-down: rota e filtros da lista. */
export interface DashboardLink {
  /** Rota da lista (Monitorar ou Meus Chamados). */
  route: string;
  /** Filtros da lista. */
  queryParams: Params;
  /** Aviso de visibilidade quando a lista mostra menos que o número ("Você tem acesso a 12 dos 340 chamados"). */
  note?: string | null;
}

/**
 * Composição atual dos chamados por status numa barra horizontal empilhada (100%), com a legenda
 * dentro da própria barra: cada fatia diz o status, o número e o percentual quando cabe, só o
 * número quando é estreita, e tudo no tooltip e no nome acessível. Barra empilhada em vez de rosca:
 * quatro partes de um todo se comparam melhor lado a lado numa linha e ocupam 24px de altura.
 * Cancelados ficam fora da barra, à direita, pra a soma fechar com o total. Cada fatia é o link do
 * drill-down (foco pelo teclado).
 */
@Component({
  selector: 'app-dashboard-status-composition',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="composition">
      @if (composition().inBar === 0) {
        <!-- Sem chamado aberto, em andamento, resolvido ou fechado: uma barra vazia não diria nada. -->
        <p class="composition-empty mb-0">Nenhum chamado aberto, em andamento, resolvido ou fechado agora.</p>
      } @else {
      <ul class="list-unstyled composition-bar mb-0" [attr.aria-label]="summary()">
        @for (segment of visibleSegments(); track segment.group) {
          <li class="composition-segment status-fill-{{ segment.group }}" [style.flex-grow]="segment.count"
              [title]="labels[segment.group] + ': ' + full(segment.count) + ' (' + segment.percent + '%)'">
            @if (links()[segment.group]; as link) {
              <a class="segment-body" [routerLink]="link.route" [queryParams]="link.queryParams"
                 [attr.aria-label]="itemLabel(segment.group, segment.count, segment.percent, link.note, true)">
                <span class="segment-full" aria-hidden="true">{{ barLabels[segment.group] }} <strong>{{ short(segment.count) }}</strong> · {{ segment.percent }}%</span>
                <span class="segment-mid" aria-hidden="true">{{ barLabels[segment.group] }} <strong>{{ short(segment.count) }}</strong></span>
                <span class="segment-short" aria-hidden="true"><strong>{{ short(segment.count) }}</strong></span>
              </a>
            } @else {
              <span class="segment-body" [attr.aria-label]="itemLabel(segment.group, segment.count, segment.percent, null, false)" role="img">
                <span class="segment-full" aria-hidden="true">{{ barLabels[segment.group] }} <strong>{{ short(segment.count) }}</strong> · {{ segment.percent }}%</span>
                <span class="segment-mid" aria-hidden="true">{{ barLabels[segment.group] }} <strong>{{ short(segment.count) }}</strong></span>
                <span class="segment-short" aria-hidden="true"><strong>{{ short(segment.count) }}</strong></span>
              </span>
            }
          </li>
        }
      </ul>
      }
      @if (composition().canceled > 0) {
        <!-- Cancelado não é fila nem entrega: fica fora da barra, mas à vista, pra a soma bater com o total. -->
        <span class="composition-canceled">+ {{ short(composition().canceled) }} {{ composition().canceled === 1 ? 'cancelado' : 'cancelados' }}</span>
      }
    </div>

    <!--
      Telas estreitas (< 1200px): as fatias ficam pequenas demais pro nome do status, então uma legenda
      compacta numa linha diz o que é cada cor. Só texto (aria-hidden): os links e os nomes acessíveis
      continuam nas próprias fatias.
    -->
    <p class="composition-legend mb-0" aria-hidden="true">
      @for (segment of composition().segments; track segment.group) {
        <span class="legend-item"><span class="status-dot status-fill-{{ segment.group }}"></span>{{ labels[segment.group] }} {{ short(segment.count) }} · {{ segment.percent }}%</span>
      }
    </p>

  `,
  styles: `
    :host { display: block; }

    .composition {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    /* Fatias separadas por 2px do fundo do card, cada uma com o contorno escuro do próprio matiz (WCAG 1.4.11). */
    .composition-bar {
      display: flex;
      flex: 1 1 auto;
      gap: 2px;
      min-width: 0;
      height: 1.5rem;
    }

    .composition-segment {
      flex-basis: 0;
      min-width: 6px;
      container-type: inline-size;
      box-shadow: inset 0 0 0 1px var(--edge);
      color: var(--tk-status-label);
      transition: flex-grow var(--tk-transition);
    }

    /* A cor do texto de Fechado (claro sobre o cinza) vem do token; esta regra vence a cor padrão da fatia. */
    .composition-segment.status-fill-closed { color: var(--tk-status-closed-label); }

    .composition-segment:first-child { border-radius: 999px 0 0 999px; }
    .composition-segment:last-child { border-radius: 0 999px 999px 0; }
    .composition-segment:only-child { border-radius: 999px; }

    .segment-body {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 0 0.375rem;
      border-radius: inherit;
      color: inherit;
      font-size: 0.75rem;
      white-space: nowrap;
      overflow: hidden;
      text-decoration: none;
      font-variant-numeric: tabular-nums;
    }

    a.segment-body:hover { text-decoration: underline; }

    a.segment-body:focus-visible {
      outline: 2px solid var(--tk-primary);
      outline-offset: 2px;
    }

    /*
     * Rótulo pela largura da fatia: status, número e % quando é larga; status e número quando é média;
     * só o número quando é estreita (o nome fica no tooltip e no nome acessível); nada quando não cabe.
     */
    .segment-full,
    .segment-mid,
    .segment-short { display: none; }

    @container (width >= 2.5rem) { .segment-short { display: inline; } }
    @container (width >= 6rem) { .segment-mid { display: inline; } .segment-short { display: none; } }
    @container (width >= 10rem) { .segment-full { display: inline; } .segment-mid { display: none; } }

    .composition-legend {
      display: none;
      flex-wrap: wrap;
      gap: 0.125rem 0.875rem;
      margin-top: 0.375rem;
      color: var(--tk-text-secondary);
      font-size: 0.75rem;
    }

    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
    }

    @media (max-width: 1199.98px) {
      .composition-legend { display: flex; }
      .composition-bar { height: 1rem; }
      .segment-body { font-size: 0; }
    }

    .composition-empty {
      flex: 1 1 auto;
      color: var(--tk-text-secondary);
      font-size: 0.875rem;
    }

    .composition-canceled {
      flex-shrink: 0;
      color: var(--tk-text-muted);
      font-size: 0.75rem;
      white-space: nowrap;
    }

    @media (prefers-reduced-motion: reduce) {
      .composition-segment { transition: none; }
    }

    /* Toque: a barra fica com a altura de um alvo de dedo (44px). */
    @media (pointer: coarse) {
      .composition-bar { height: 2.75rem; }
    }
  `
})
export class DashboardStatusCompositionComponent {
  /** Composição atual, já com os percentuais do servidor arredondados. */
  readonly composition = input.required<DashboardStatusComposition>();
  /** Drill-down de cada grupo, ou null quando o grupo não leva a uma lista. */
  readonly links = input<Record<DashboardStatusGroup, DashboardLink | null>>({ open: null, inProgress: null, resolved: null, closed: null });

  /** Rótulos dos grupos. */
  protected readonly labels = DASHBOARD_STATUS_GROUP_LABELS;
  /**
   * Rótulos dentro da barra: "Andamento" no lugar de "Em andamento", que encostava nas bordas da fatia
   * a 1366px. O nome completo continua no tooltip, no nome acessível e na legenda abaixo de 1200px.
   */
  protected readonly barLabels: Record<DashboardStatusGroup, string> = { ...DASHBOARD_STATUS_GROUP_LABELS, inProgress: 'Andamento' };

  /** Só as fatias com chamados (uma fatia vazia com largura mínima mentiria). */
  protected readonly visibleSegments = computed(() => this.composition().segments.filter(segment => segment.count > 0));

  /** Descrição da barra inteira pro leitor de tela, com os status zerados e os cancelados. */
  protected readonly summary = computed(() => {
    const parts = this.composition().segments.map(s => `${this.labels[s.group].toLowerCase()} ${formatFullCount(s.count)} (${s.percent}%)`);
    const canceled = this.composition().canceled;
    return `Chamados por situação agora: ${parts.join(', ')}${canceled ? `; mais ${formatFullCount(canceled)} cancelados fora da barra` : ''}.`;
  });

  /** Número curto ("1.240", "12,3 mil"). */
  protected short(value: number): string {
    return formatCount(value);
  }

  /** Número completo ("12.345"). */
  protected full(value: number): string {
    return formatFullCount(value);
  }

  /** Nome acessível de uma fatia, com o aviso de visibilidade e o destino, quando há. */
  protected itemLabel(group: DashboardStatusGroup, count: number, percent: number, note: string | null | undefined, linked: boolean): string {
    const base = `${this.labels[group]}: ${formatFullCount(count)} chamados, ${percent}%`;
    const withNote = note ? `${base}. ${note}` : base;
    return linked ? `${withNote}. Ver a lista` : withNote;
  }
}
