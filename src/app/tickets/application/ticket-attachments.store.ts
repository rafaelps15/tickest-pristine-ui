import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { finalize, of } from 'rxjs';
import { TicketAttachment } from '../entities/ticket-attachment';
import { TicketAttachmentDataService } from '../infrastructure/ticket-attachment.data.service';
import { CursorPage, extractErrorMessage, valueOf } from '../../shared';

/** Página vazia, usada antes de um ticket ser definido. */
const EMPTY_PAGE: CursorPage<TicketAttachment> = { items: [], nextCursorDate: null, nextCursorId: null, hasNextPage: false };

/**
 * Store dos anexos de um ticket: listagem paginada por cursor ("carregar mais"), upload, download e exclusão.
 * O resource traz a primeira página; as seguintes são acumuladas em {@link olderAttachments}.
 */
export const TicketAttachmentsStore = signalStore(
  { providedIn: 'root' },
  withState({
    ticketId: undefined as string | undefined,
    mutationError: null as string | null,
    uploading: false,
    uploadError: null as string | null,
    downloading: false,
    downloadError: null as string | null,
    deleting: false,
    /** Anexos das páginas carregadas depois da primeira, na ordem em que chegaram. */
    olderAttachments: [] as TicketAttachment[],
    /** Última página carregada por "carregar mais" (nula enquanto só a primeira foi carregada). */
    lastPage: null as CursorPage<TicketAttachment> | null,
    loadingMore: false
  }),
  withProps(() => ({
    _ticketAttachmentDataService: inject(TicketAttachmentDataService)
  })),
  withProps((store) => ({
    _listResource: rxResource({
      params: () => store.ticketId(),
      stream: ({ params }) => params !== undefined
        ? store._ticketAttachmentDataService.getAll(params)
        : of(EMPTY_PAGE)
    })
  })),
  withComputed((store) => ({
    /** Anexos já carregados do ticket atual, do mais novo para o mais antigo (ordem aplicada pelo back-end). */
    attachments: computed(() => [...(valueOf(store._listResource)?.items ?? []), ...store.olderAttachments()]),
    /** Página de onde sai o cursor da próxima: a última carregada por "carregar mais" ou, antes disso, a primeira. */
    currentPage: computed(() => store.lastPage() ?? valueOf(store._listResource)),
    listState: computed(() => {
      const resourceError = store._listResource.error() as HttpErrorResponse | undefined;
      return {
        loading: store._listResource.isLoading(),
        error: store.mutationError() ?? (resourceError
          ? extractErrorMessage(resourceError, {
              403: 'Você não tem permissão para ver os anexos deste chamado.'
            }, 'Erro ao carregar anexos')
          : null)
      };
    })
  })),
  withComputed((store) => ({
    /** Indica se ainda há anexos mais antigos para carregar. */
    hasMore: computed(() => store.currentPage()?.hasNextPage ?? false)
  })),
  withMethods((store) => {
    /** Volta para a primeira página: descarta as páginas acumuladas e recarrega o resource. */
    const reloadFirstPage = () => {
      patchState(store, { olderAttachments: [], lastPage: null });
      store._listResource.reload();
    };

    return { _reloadFirstPage: reloadFirstPage };
  }),
  withMethods((store) => ({
    /** Define o ticket cujos anexos devem ser carregados, disparando o resource da primeira página. */
    loadForTicket(ticketId: string): void {
      patchState(store, { ticketId, mutationError: null, olderAttachments: [], lastPage: null });
    },

    /** Carrega a próxima página de anexos (mais antigos) e acrescenta à lista já exibida. */
    loadMore(): void {
      const ticketId = store.ticketId();
      const page = store.currentPage();
      if (!ticketId || !page?.hasNextPage || !page.nextCursorDate || !page.nextCursorId || store.loadingMore()) return;

      patchState(store, { loadingMore: true, mutationError: null });

      store._ticketAttachmentDataService.getAll(ticketId, { cursorDate: page.nextCursorDate, cursorId: page.nextCursorId }).pipe(
        finalize(() => patchState(store, { loadingMore: false }))
      ).subscribe({
        next: (nextPage) => {
          patchState(store, {
            olderAttachments: [...store.olderAttachments(), ...nextPage.items],
            lastPage: nextPage
          });
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, { mutationError: extractErrorMessage(err, {}, 'Erro ao carregar mais anexos') });
        }
      });
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
          store._reloadFirstPage();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, {
            uploadError: extractErrorMessage(err, {
              403: 'Você não tem permissão para anexar arquivos a este chamado.'
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
          store._reloadFirstPage();
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
