import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

/**
 * Card de filtros das listas (Monitorar Chamados, Usuários, Departamentos, Meus Chamados): rótulo
 * "Filtros", os campos projetados numa `row g-3 align-items-end` (cada campo traz a sua `col-*`) e,
 * no rodapé, os extras (`[filterExtras]`, ex.: um switch) à esquerda e "Limpar filtros" à direita.
 * Mais discreto que o card do conteúdo (borda fina, sem sombra) — antes era markup e CSS copiados.
 */
@Component({
  selector: 'app-filter-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block mb-3' },
  template: `
    <div class="card filters-card">
      <div class="card-body p-3">
        <div class="filters-label mb-3">
          <i class="bx bx-filter-alt" aria-hidden="true"></i>
          {{ label() }}
        </div>
        <div class="row g-3 align-items-end">
          <ng-content />
        </div>
        <div class="filters-footer">
          <ng-content select="[filterExtras]" />
          @if (clearable()) {
            <button type="button" class="btn btn-link btn-clear-filters text-decoration-none px-0 ms-auto" (click)="clear.emit()">
              <i class="bx bx-x me-1" aria-hidden="true"></i>{{ clearLabel() }}
            </button>
          }
        </div>
      </div>
    </div>
  `
})
export class FilterBarComponent {
  /** Rótulo do card (ex.: "Filtros", "Busca"). */
  readonly label = input('Filtros');
  /** Texto do botão de limpar. */
  readonly clearLabel = input('Limpar filtros');
  /** Mostra o botão de limpar — some quando não há nada aplicado pra limpar, se a tela quiser. */
  readonly clearable = input(true);

  /** Pede pra tela voltar todos os filtros ao padrão. */
  readonly clear = output<void>();
}
