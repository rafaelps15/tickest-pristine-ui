import { Component, ChangeDetectionStrategy, computed, input, output, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs';
import { DialogComponent } from '../dialog/dialog.component';

/**
 * Responsável elegível que o diálogo lista: os campos de GET /tickets/assignees que ele mostra.
 * Estrutural, pra `shared` não depender do domínio de chamados; o `TicketAssignee` já satisfaz.
 */
export interface AssigneeCandidate {
  /** Id do usuário. */
  id: string;
  /** Nome completo. */
  fullName: string;
  /** Setor do usuário, ou `null` sem setor. */
  sectorName: string | null;
}

/**
 * Diálogo "Atribuir/Alterar responsável" de um chamado — o mesmo no detalhe e no Monitorar
 * Chamados (antes o Monitorar atribuía no primeiro clique, sem confirmar, e o detalhe pedia
 * seleção + confirmação). Busca os elegíveis (com debounce), lista os candidatos como listbox
 * navegável por setas, marca um e só atribui no botão de confirmar, avisando quando substitui o
 * responsável atual. Componente burro: quem usa liga `search`/`confirm` ao Store certo.
 */
@Component({
  selector: 'app-ticket-assign-dialog',
  imports: [DialogComponent],
  templateUrl: './ticket-assign-dialog.component.html',
  styleUrl: './ticket-assign-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketAssignDialogComponent {
  /** Título do chamado, como contexto no cabeçalho. */
  readonly ticketTitle = input.required<string>();
  /** Nome do responsável atual (`null` numa primeira atribuição). */
  readonly currentName = input<string | null>(null);
  /** Id do responsável atual, pra marcar "Atual" na lista. */
  readonly currentUserId = input<string | null>(null);
  /** Candidatos encontrados pela última busca. */
  readonly candidates = input<AssigneeCandidate[]>([]);
  /** A busca de candidatos está em andamento. */
  readonly searching = input(false);
  /** Erro da busca de candidatos. */
  readonly searchError = input<string | null>(null);
  /** A atribuição está em andamento — trava confirmar e fechar. */
  readonly saving = input(false);
  /** Erro da última tentativa de atribuir. */
  readonly error = input<string | null>(null);

  /** Pede a busca de candidatos pelo termo digitado (já com debounce de 300ms). */
  readonly search = output<string>();
  /** Confirma a atribuição do candidato escolhido (id e nome, pro aviso de sucesso). */
  readonly confirm = output<{ userId: string; name: string }>();
  /** Pede pra fechar sem atribuir. */
  readonly closed = output<void>();
  /** A seleção mudou — a tela pode limpar o erro de uma tentativa anterior. */
  readonly selectionChange = output<void>();

  /** Texto digitado na busca, antes do debounce. */
  protected readonly searchText = signal('');
  /** Candidato marcado, antes de confirmar. */
  protected readonly selectedId = signal<string | null>(null);
  /** Índice do candidato com foco (tabindex circulante do listbox). */
  protected readonly focusedIndex = signal(0);

  /** Título do diálogo, conforme já haja ou não um responsável. */
  protected readonly title = computed(() => this.currentName() ? 'Alterar responsável' : 'Atribuir responsável');
  /** Nome do candidato marcado. */
  protected readonly selectedName = computed(() => {
    const candidate = this.candidates().find(c => c.id === this.selectedId());
    return candidate ? candidate.fullName : null;
  });

  constructor() {
    toObservable(this.searchText).pipe(
      skip(1),
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed()
    ).subscribe(term => {
      this.focusedIndex.set(0);
      this.search.emit(term);
    });
  }

  /** Atualiza o texto da busca. */
  protected onSearchInput(term: string): void {
    this.searchText.set(term);
  }

  /** Marca (ou desmarca, clicando de novo) um candidato. */
  protected select(userId: string, index: number): void {
    this.selectedId.update(current => current === userId ? null : userId);
    this.focusedIndex.set(index);
    this.selectionChange.emit();
  }

  /** Setas pra cima/baixo movem o foco entre os candidatos (padrão ARIA Listbox). */
  protected onListKeydown(event: KeyboardEvent, list: HTMLElement): void {
    const count = this.candidates().length;
    if (count === 0) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      this.focusedIndex.update(i => (i + step + count) % count);
      list.querySelectorAll<HTMLElement>('[role="option"]')[this.focusedIndex()]?.focus();
    }
  }

  /** Confirma o candidato marcado. */
  protected onConfirm(): void {
    const userId = this.selectedId();
    const name = this.selectedName();
    if (userId && name) this.confirm.emit({ userId, name });
  }
}
