import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';

/** Tom semântico do número e do ícone — só cores de status, nunca decorativas. */
export type StatTone = 'primary' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Card de estatística (KPI) do Dashboard e do Monitorar Chamados: rótulo, número, legenda e ícone
 * em `.icon-tile`. O número é um `div.stat-value`, nunca um heading. Carregando: spinner no lugar
 * do número; falhou: "—" com "indisponível" pro leitor de tela, nunca o `0` de fallback.
 *
 * Interação (opcional), sempre cobrindo o card inteiro (`.stretched-link`):
 * - **Filtro da própria tela:** passe `pressed` (true/false) — vira um botão `aria-pressed` que
 *   emite `press` (Monitorar: filtra a tabela pelo SLA do card);
 * - **Navegação:** projete um `<a class="stretched-link" routerLink>` (Dashboard: abre a fila filtrada).
 */
@Component({
  selector: 'app-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'card card-stats h-100',
    '[class.card-stats-clickable]': 'clickable()',
    '[class.card-stats-pressed]': 'pressed() === true'
  },
  template: `
    <div class="card-body">
      <div class="d-flex align-items-start justify-content-between gap-2">
        <div class="min-w-0">
          <span class="text-muted">{{ label() }}</span>
          <div class="d-flex align-items-end mt-2">
            @if (loading()) {
              <span class="spinner-border spinner-border-sm {{ toneText() }}" role="status"><span class="visually-hidden">Carregando {{ label() }}…</span></span>
            } @else if (failed()) {
              <div class="mb-0 me-2 fs-3 stat-value text-muted"><span aria-hidden="true">—</span><span class="visually-hidden">indisponível</span></div>
            } @else {
              <div class="mb-0 me-2 fs-3 stat-value {{ toneValue() }}">{{ value() ?? '—' }}</div>
            }
          </div>
          <small class="text-muted stat-hint"><ng-content select="[statHint]" />{{ hint() }}</small>
        </div>
        <span class="badge rounded p-2 kpi-icon icon-tile icon-tile-lg bg-label-{{ tone() }}" aria-hidden="true">
          <i class="bx {{ icon() }} fs-3"></i>
        </span>
      </div>
    </div>
    @if (pressed() !== null) {
      <button type="button" class="stretched-link stat-press" [attr.aria-pressed]="pressed()"
              [attr.aria-label]="pressLabel() ?? label()" (click)="press.emit()"></button>
    }
    <ng-content />
  `
})
export class StatCardComponent {
  /** Rótulo do número (ex.: "Em Risco"). */
  readonly label = input.required<string>();
  /** O número exibido. `null`/`undefined` aparece como "—". */
  readonly value = input<number | null | undefined>(null);
  /** Linha de apoio abaixo do número (ex.: "Perto de vencer"). */
  readonly hint = input('');
  /** Classe Boxicons do ícone (ex.: `bx-error-circle`). */
  readonly icon = input('bx-receipt');
  /** Tom semântico: cor do ícone e, fora de `primary`, do número. */
  readonly tone = input<StatTone>('primary');
  /** Mostra o spinner no lugar do número. */
  readonly loading = input(false);
  /** Mostra "—"/indisponível no lugar do número. */
  readonly failed = input(false);
  /** `true`/`false` liga o modo filtro (botão `aria-pressed`); `null` deixa o card sem esse botão. */
  readonly pressed = input<boolean | null>(null);
  /** Nome acessível do botão de filtro (padrão: o rótulo). */
  readonly pressLabel = input<string | null>(null);
  /** Card navegável por um link projetado — ganha o realce de hover de card clicável. */
  readonly linked = input(false);

  /** Pedido de alternar o filtro deste card (modo `pressed`). */
  readonly press = output<void>();

  /** O card inteiro responde a clique (filtro ou link). */
  protected readonly clickable = computed(() => this.pressed() !== null || this.linked());
  /** Classe de cor do texto do tom (o tom `primary` mantém o número na cor de texto padrão). */
  protected readonly toneText = computed(() => this.tone() === 'primary' ? 'text-primary' : `text-${this.tone()}`);
  /** Cor do número: a do tom, exceto `primary`, que mantém a cor de texto padrão. */
  protected readonly toneValue = computed(() => this.tone() === 'primary' ? '' : `text-${this.tone()}`);
}
