import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardStatusGroup, DashboardWidgetState, formatCount, formatFullCount } from './dashboard-overview';
import { DashboardLink } from './dashboard-status-composition.component';
import { DashboardNoticeComponent } from './dashboard-notice.component';

/** Um indicador da faixa do topo do Início. */
export interface DashboardKpi {
  /** Identificador estável. */
  key: string;
  /** Rótulo ("Na fila"). */
  label: string;
  /** Número, ou null sem resposta. */
  value: number | null;
  /** Texto do valor quando não é uma contagem ("87%"); sem ele, a contagem é formatada. */
  display?: string | null;
  /** Grupo de status do número — dá a cor do marcador, a mesma da barra e do gráfico. */
  group?: DashboardStatusGroup | null;
  /** Apoio curto ao lado do número ("abertos + em andamento"). */
  hint?: string | null;
  /** Comparação com o período anterior, quando o back-end manda. */
  trend?: string | null;
  /** Drill-down; null quando o número não leva a uma lista. */
  link: DashboardLink | null;
  /** O back-end ainda não entrega este número: o card diz "Disponível em breve". */
  unavailable?: boolean;
  /** Este número vem de outra fonte, ainda carregando (esqueleto só nele). */
  loading?: boolean;
  /** Risco operacional (ex.: chamados atrasados): o número fica no vermelho de alerta quando passa de zero. */
  risk?: boolean;
}

/**
 * Faixa compacta de indicadores do topo do Início (total, na fila, em andamento, resolvidos,
 * fechados e SLA cumprido): um card denso por número, com o mesmo marcador de cor por status da
 * barra de composição e do gráfico, e o card inteiro levando à lista filtrada. Carregando: esqueleto
 * do mesmo tamanho (a tela não pula); numa recarga, os números anteriores ficam. Erro: um aviso só,
 * neutro, com "Tentar novamente".
 */
@Component({
  selector: 'app-dashboard-kpi-strip',
  imports: [RouterLink, DashboardNoticeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (state() === 'error') {
      <div class="card px-3 py-2">
        <app-dashboard-notice kind="error" [text]="errorText()" (retry)="retry.emit()" />
      </div>
    } @else {
      <ul class="list-unstyled kpi-strip mb-0" [attr.aria-busy]="state() === 'loading' || null">
        @for (kpi of kpis(); track kpi.key) {
          <li class="card kpi-card" [class.kpi-linked]="!!kpi.link && !kpi.unavailable && state() !== 'loading' && !kpi.loading">
            <span class="kpi-label">
              @if (kpi.group) {
                <span class="status-dot status-fill-{{ kpi.group }}" aria-hidden="true"></span>
              }
              <span class="kpi-label-text">{{ kpi.label }}</span>
              <!-- Pista de que o card inteiro abre a lista (mais forte no hover/foco). -->
              @if (kpi.link && !kpi.unavailable) {
                <i class="bx bx-chevron-right kpi-go" aria-hidden="true"></i>
              }
            </span>
            @if (kpi.unavailable) {
              <span class="kpi-soon">Disponível em breve</span>
            } @else if (state() === 'loading' || kpi.loading) {
              <span class="tk-skeleton kpi-skeleton" aria-hidden="true"></span>
              <span class="visually-hidden">Carregando {{ kpi.label }}…</span>
            } @else {
              <span class="kpi-value-row">
                <span class="kpi-value stat-value" [class.kpi-risk]="kpi.risk && (kpi.value ?? 0) > 0"
                      [attr.title]="kpi.value !== null ? full(kpi.value) : null">{{ valueText(kpi) }}</span>
                @if (kpi.hint || kpi.trend) {
                  <span class="kpi-hint" [attr.title]="hintText(kpi)">{{ hintText(kpi) }}</span>
                }
              </span>
              @if (kpi.link?.note; as note) {
                <span class="kpi-note">{{ note }}</span>
              }
              @if (kpi.link; as link) {
                <a class="stretched-link" [routerLink]="link.route" [queryParams]="link.queryParams" [attr.aria-label]="linkLabel(kpi)"></a>
              }
            }
          </li>
        }
      </ul>
    }
  `,
  styles: `
    :host { display: block; }

    .kpi-strip {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
    }

    @media (min-width: 768px) {
      .kpi-strip { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }

    @media (min-width: 1200px) {
      .kpi-strip { grid-template-columns: repeat(6, minmax(0, 1fr)); }
    }

    .kpi-card {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      min-height: 4.5rem;
      padding: 0.625rem 1rem;
      min-width: 0;
      container-type: inline-size;
    }

    .kpi-linked:hover,
    .kpi-linked:focus-within {
      box-shadow: var(--tk-shadow-md);
    }

    .kpi-linked:focus-within {
      outline: 2px solid var(--tk-primary);
      outline-offset: 2px;
    }

    .kpi-label {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      color: var(--tk-text-secondary);
      font-size: 0.875rem;
      line-height: 1.25;
      white-space: nowrap;
    }

    .kpi-label-text {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .kpi-go {
      margin-left: auto;
      line-height: 1;
      color: var(--tk-text-muted);
      transition: color var(--tk-transition), transform var(--tk-transition);
    }

    .kpi-linked:hover .kpi-go,
    .kpi-linked:focus-within .kpi-go {
      color: var(--tk-primary-text);
      transform: translateX(2px);
    }

    /* Movimento reduzido: a seta só muda de cor, sem andar. */
    @media (prefers-reduced-motion: reduce) {
      .kpi-go { transition: none; }
      .kpi-linked:hover .kpi-go,
      .kpi-linked:focus-within .kpi-go { transform: none; }
    }

    /* Atrasados acima de zero: risco operacional, o único vermelho da faixa. */
    .kpi-risk { color: var(--tk-danger-text); }

    /* Número e apoio numa linha só (o apoio corta com reticências e fica inteiro no title): a altura do card não muda com o dado. */
    .kpi-value-row {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      min-width: 0;
    }

    .kpi-value {
      font-size: 1.5rem;
      line-height: 1.2;
      font-variant-numeric: tabular-nums;
    }

    .kpi-hint,
    .kpi-note {
      color: var(--tk-text-muted);
      font-size: 0.75rem;
    }

    /* O apoio só aparece quando cabe inteiro (cortado com reticências, lia mal); sempre no title e no nome acessível. */
    .kpi-hint {
      display: none;
      white-space: nowrap;
    }

    @container (width >= 12.5rem) { .kpi-hint { display: inline; } }

    .kpi-soon {
      color: var(--tk-text-secondary);
      font-size: 0.875rem;
      line-height: 1.8rem;
    }

    .kpi-skeleton {
      display: block;
      width: 45%;
      height: 1.8rem;
    }
  `
})
export class DashboardKpiStripComponent {
  /** Indicadores, na ordem da faixa. */
  readonly kpis = input.required<DashboardKpi[]>();
  /** Estado da fonte dos números (os indisponíveis um a um vêm marcados no próprio indicador). */
  readonly state = input.required<DashboardWidgetState>();
  /** Mensagem do erro da fonte. */
  readonly errorText = input('Não foi possível carregar os números.');
  /** "Tentar novamente" do erro. */
  readonly retry = output<void>();

  /** Texto do número no card ("1.240", "12,3 mil", "87%"). */
  protected valueText(kpi: DashboardKpi): string {
    if (kpi.display) return kpi.display;
    return kpi.value === null ? '—' : formatCount(kpi.value);
  }

  /** Apoio e comparação numa frase só ("abertos + em andamento · 3 a mais que no período anterior"). */
  protected hintText(kpi: DashboardKpi): string {
    return [kpi.hint, kpi.trend].filter(Boolean).join(' · ');
  }

  /** Número completo ("12.345"), no `title`. */
  protected full(value: number): string {
    return formatFullCount(value);
  }

  /** Nome acessível do link do card: rótulo, número completo, apoio, aviso de visibilidade e destino. */
  protected linkLabel(kpi: DashboardKpi): string {
    const value = kpi.display ?? (kpi.value === null ? 'indisponível' : formatFullCount(kpi.value));
    const hint = this.hintText(kpi);
    const note = kpi.link?.note ? `. ${kpi.link.note}` : '';
    return `${kpi.label}: ${value}${hint ? ` (${hint})` : ''}${note}. Ver a lista`;
  }
}
