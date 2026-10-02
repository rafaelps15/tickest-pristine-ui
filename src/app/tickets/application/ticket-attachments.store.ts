import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { finalize, of } from 'rxjs';
import { TicketAttachment } from '../entities/ticket-attachment';
import { TicketAttachmentDataService } from '../infrastructure/ticket-attachment.data.service';
import { extractErrorMessage } from '../../shared';

/** Store dos anexos de um ticket: listagem, upload, download e exclusão. */
export const TicketAttachmentsStore = signalStore(
  { providedIn: 'root' },
  withState({
    ticketId: undefined as string | undefined,
    mutationError: null as string | null,
    uploading: false,
    uploadError: null as string | null,
    downloading: false,
    downloadError: null as string | null,
    deleting: false
  }),
  withProps(() => ({
    _ticketAttachmentDataService: inject(TicketAttachmentDataService)
  })),
  withProps((store) => ({
    _listResource: rxResource({
      params: () => store.ticketId(),
      stream: ({ params }) => params !== undefined
        ? store._ticketAttachmentDataService.getAll(params)
        : of([])
    })
  })),
  withComputed((store) => ({
    /** Anexos do ticket atual, do mais antigo pro mais novo (ordem já aplicada pelo back-end). */
    attachments: computed(() => store._listResource.value() ?? []),
    listState: computed(() => {
      const resourceError = store._listResource.error() as HttpErrorResponse | undefined;
      return {
        loading: store._listResource.isLoading(),
        error: store.mutationError() ?? (resourceError
          ? extractErrorMessage(resourceError, {
              403: 'Você não tem permissão para ver os anexos deste ticket.'
            }, 'Erro ao carregar anexos')
          : null)
      };
    })
  })),
  withMethods((store) => ({
    /** Define o ticket cujos anexos devem ser carregados, disparando o resource. */
    loadForTicket(ticketId: string): void {
      patchState(store, { ticketId, mutationError: null });
    },

    /** Envia um novo anexo e recarrega a listagem em caso de sucesso. */
    upload(file: File, onSuccess?: () => void): void {
      const ticketId = store.ticketId();
      if (!ticketId) return;

      patchState(store, { uploading: true, uploadError: null });

      store._ticketAttachmentDataService.upload(ticketId, file).pipe(
        finalize(() => patchState(store, { uploading: false }))
      ).subscribe({
        next: () => {
          store._listResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, {
            uploadError: extractErrorMessage(err, {
              403: 'Você não tem permissão para anexar arquivos a este ticket.'
            }, 'Erro ao enviar o anexo.')
          });
        }
      });
    },

    /** Baixa um anexo e dispara o download no navegador. */
    download(attachment: TicketAttachment): void {
      patchState(store, { downloading: true, downloadError: null });

      store._ticketAttachmentDataService.download(attachment.id).pipe(
        finalize(() => patchState(store, { downloading: false }))
      ).subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = attachment.fileName;
          link.click();
          URL.revokeObjectURL(url);
        },
        error: (err: HttpErrorResponse) => {
          // 404 aqui é de propósito: o back-end não distingue "não existe" de "sem acesso", pra não revelar a um usuário sem permissão que o anexo existe.
          patchState(store, {
            downloadError: err.status === 404
              ? 'Anexo não encontrado ou sem acesso.'
              : 'Erro ao baixar o anexo.'
          });
        }
      });
    },

    /** Exclui um anexo e recarrega a listagem em caso de sucesso. */
    delete(attachmentId: string, onSuccess?: () => void): void {
      patchState(store, { mutationError: null, deleting: true });

      store._ticketAttachmentDataService.delete(attachmentId).pipe(
        finalize(() => patchState(store, { deleting: false }))
      ).subscribe({
        next: () => {
          patchState(store, { mutationError: null });
          store._listResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, {
            mutationError: extractErrorMessage(err, {
              403: 'Você não tem permissão para excluir este anexo.',
              404: 'Anexo não encontrado — pode já ter sido removido.'
            }, 'Erro ao excluir o anexo.')
          });
        }
      });
    }
  }))
);
