import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';

/** Item da janela de páginas: número de uma página, ou "…" marcando um salto. */
export type PageWindowItem = number | '…';

/**
 * Janela de números de página do rodapé: sempre mostra a primeira, a última e as vizinhas da
 * atual, com "…" nos saltos — pra não listar 1 botão por página quando há muitas (ex.: 50).
 */
export function pageWindow(current: number, total: number): PageWindowItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const kept = new Set([1, total, current - 1, current, current + 1]);
  const sorted = Array.from(kept).filter(page => page >= 1 && page <= total).sort((a, b) => a - b);

  const result: PageWindowItem[] = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) {
      result.push('…');
    }
    result.push(page);
    previous = page;
  }
  return result;
}

/** Contador pra gerar ids únicos do seletor "Por página" (o `<label for>` aponta pra ele). */
let nextPaginationId = 0;

/**
 * Rodapé de paginação das listas (Meus Chamados, Monitorar Chamados, Usuários): "Exibindo X–Y de
 * N {noun}", Anterior / números / Próxima (no celular só "Página X de Y") e o seletor "Por página".
 * Vai dentro do card da tabela, depois dela. Antes eram 3 cópias idênticas do markup e da lógica.
 */
@Component({
  selector: 'app-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'card-footer d-flex flex-wrap align-items-center justify-content-between gap-3 py-3' },
  template: `
    <span class="text-muted small">Exibindo {{ rangeStart() }}–{{ rangeEnd() }} de {{ total() }} {{ noun() }}</span>

    @if (totalPages() > 1) {
      <nav class="pagination-group d-flex align-items-center gap-2" aria-label="Paginação">
        <button type="button" class="btn btn-sm btn-page btn-outline-secondary" [disabled]="page() <= 1 || disabled()" (click)="pageChange.emit(page() - 1)">
          Anterior
        </button>

        <!-- No celular os números de página não cabem numa linha: só "Página X de Y" entre Anterior/Próxima. -->
        <span class="page-indicator small text-muted text-nowrap">Página {{ page() }} de {{ totalPages() }}</span>

        @for (pageNumber of pageNumbers(); track $index) {
          @if (pageNumber === '…') {
            <span class="page-ellipsis px-1 text-muted" aria-hidden="true">…</span>
          } @else {
            <button type="button" class="btn btn-sm btn-page btn-page-number" [class.btn-primary]="pageNumber === page()" [class.btn-outline-secondary]="pageNumber !== page()"
                    [attr.aria-current]="pageNumber === page() ? 'page' : null"
                    (click)="pageChange.emit(pageNumber)">
              {{ pageNumber }}
            </button>
          }
        }

        <button type="button" class="btn btn-sm btn-page btn-outline-secondary" [disabled]="page() >= totalPages() || disabled()" (click)="pageChange.emit(page() + 1)">
          Próxima
        </button>
      </nav>
    }

    <div class="d-flex align-items-center gap-2">
      <label class="form-label small mb-0" [for]="pageSizeId">Por página</label>
      <select [id]="pageSizeId" class="form-select form-select-sm w-auto" [value]="pageSize()" (change)="pageSizeChange.emit(+$any($event.target).value)">
        @for (size of pageSizeOptions(); track size) {
          <option [value]="size" [selected]="size === pageSize()">{{ size }}</option>
        }
      </select>
    </div>
  `
})
export class PaginationComponent {
  /** Página atual (começa em 1). */
  readonly page = input.required<number>();
  /** Quantidade total de páginas. */
  readonly totalPages = input.required<number>();
  /** Quantidade total de itens, em todas as páginas. */
  readonly total = input.required<number>();
  /** Itens por página. */
  readonly pageSize = input.required<number>();
  /** Opções do seletor "Por página". */
  readonly pageSizeOptions = input<readonly number[]>([10, 20, 50]);
  /** Nome dos itens no plural, pro texto "Exibindo X–Y de N {noun}" (ex.: "chamados"). */
  readonly noun = input.required<string>();
  /** Trava Anterior/Próxima enquanto uma página carrega. */
  readonly disabled = input(false);

  /** Pede pra ir a outra página (1-based). */
  readonly pageChange = output<number>();
  /** Pede pra trocar a quantidade de itens por página. */
  readonly pageSizeChange = output<number>();

  /** Id do seletor "Por página". */
  protected readonly pageSizeId = `page-size-${nextPaginationId++}`;

  /** Índice (1-based) do primeiro item exibido na página atual. */
  readonly rangeStart = computed(() => this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1);
  /** Índice (1-based) do último item exibido na página atual. */
  readonly rangeEnd = computed(() => Math.min(this.page() * this.pageSize(), this.total()));
  /** Janela de números de página exibida entre Anterior e Próxima. */
  readonly pageNumbers = computed(() => pageWindow(this.page(), this.totalPages()));
}
