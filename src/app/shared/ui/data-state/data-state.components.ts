import { Component, ChangeDetectionStrategy, input } from '@angular/core';

/**
 * Estado vazio de uma lista ou bloco: ícone, frase em negrito, dica de uma linha e a próxima ação
 * projetada (botão/link). Vai dentro da célula `<td colspan>` de uma tabela ou de um card. Sempre
 * com uma saída: "Novo X" no primeiro uso, "Limpar filtros" quando foi o filtro que esvaziou.
 */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'empty-state d-block text-center py-5' },
  template: `
    <i class="bx {{ icon() }} display-6 empty-state-icon d-block mb-2" aria-hidden="true"></i>
    <p class="fw-semibold mb-1">{{ title() }}</p>
    @if (hint()) {
      <p class="text-muted small mb-3">{{ hint() }}</p>
    }
    <ng-content />
  `
})
export class EmptyStateComponent {
  /** Classe do ícone Boxicons (ex.: `bx-group`). */
  readonly icon = input('bx-info-circle');
  /** Frase principal, dizendo o que está vazio. */
  readonly title = input.required<string>();
  /** Dica de uma linha sobre o que fazer a seguir. */
  readonly hint = input<string | null>(null);
}

/**
 * Carregamento de uma lista ou bloco: spinner com o texto visível ao lado (não só pra leitor de
 * tela) — "Carregando usuários…", nunca um spinner mudo no meio da tela.
 */
@Component({
  selector: 'app-loading-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-flex align-items-center justify-content-center gap-2 py-5 text-muted small', role: 'status' },
  template: `
    <span class="spinner-border spinner-border-sm text-primary" aria-hidden="true"></span>
    <span>{{ label() }}</span>
  `
})
export class LoadingStateComponent {
  /** O que está carregando (ex.: "Carregando usuários…"). */
  readonly label = input('Carregando…');
}
