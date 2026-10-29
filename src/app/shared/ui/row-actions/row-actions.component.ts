import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { DropdownFixedPositionDirective } from '../directives/dropdown-fixed-position.directive';

/**
 * Menu "⋮" de ações de uma linha de tabela (ou de um card de lista): botão circular com rótulo
 * acessível e o dropdown do Bootstrap com posição `fixed` (não é cortado pelo `overflow` da
 * tabela). Os itens vêm projetados como `<li><button class="dropdown-item">…</button></li>`.
 *
 * `rowKey` vira `data-row-actions` no botão, pra a tela devolver o foco a ele depois que um item do
 * menu some (ex.: a confirmação abre por código e o item clicado deixou de existir).
 */
@Component({
  selector: 'app-row-actions',
  imports: [DropdownFixedPositionDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'dropdown d-inline-block' },
  template: `
    <button type="button" class="btn btn-sm btn-outline-secondary btn-icon btn-row-actions rounded-circle"
            data-bs-toggle="dropdown" aria-expanded="false" appDropdownFixedPosition
            [attr.data-row-actions]="rowKey()" [attr.aria-label]="label()">
      @if (busy()) {
        <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      } @else {
        <i class="bx bx-dots-vertical-rounded" aria-hidden="true"></i>
      }
    </button>
    <ul class="dropdown-menu dropdown-menu-end">
      <ng-content />
    </ul>
  `
})
export class RowActionsComponent {
  /** Rótulo do botão pra leitor de tela (ex.: "Ações para o chamado Impressora parada"). */
  readonly label = input.required<string>();
  /** Troca o ícone por um spinner enquanto uma ação da linha está em andamento. */
  readonly busy = input(false);
  /** Chave da linha (ex.: id), exposta como `data-row-actions` pra devolver o foco ao botão. */
  readonly rowKey = input<string | null>(null);
}
