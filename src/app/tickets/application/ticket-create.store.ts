import { signalStore, withState, withProps, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { CreateTicketData } from '../entities/ticket';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { extractErrorMessage } from '../../shared';

/** Store da abertura de chamado: só o envio (POST /tickets), sem ler a lista de "Meus Chamados". */
export const TicketCreateStore = signalStore(
  { providedIn: 'root' },
  withState({
    /** Envio em andamento — trava o botão de envio e evita duplo envio. */
    creating: false,
    /** Falha do último envio, mostrada acima do botão de envio. */
    mutationError: null as string | null
  }),
  withProps(() => ({
    _ticketDataService: inject(TicketDataService)
  })),
  withMethods((store) => ({
    /** Descarta a falha de um envio anterior — ao abrir a tela, que não deve mostrar o erro de outra visita. */
    clearMutationError(): void {
      patchState(store, { mutationError: null });
    },

    /** Abre o chamado e chama `onSuccess` em caso de sucesso; marca `creating` durante o envio. */
    create(data: CreateTicketData, onSuccess?: () => void): void {
      patchState(store, { mutationError: null, creating: true });

      store._ticketDataService.create(data).pipe(
        finalize(() => patchState(store, { creating: false }))
      ).subscribe({
        next: () => onSuccess?.(),
        error: (err: HttpErrorResponse) => {
          patchState(store, { mutationError: extractErrorMessage(err, {}, 'Erro ao abrir o chamado') });
        }
      });
    }
  }))
);
