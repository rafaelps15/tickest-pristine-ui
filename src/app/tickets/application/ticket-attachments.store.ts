import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { finalize, of } from 'rxjs';
import { TicketAttachment, TicketAttachmentPolicy } from '../entities/ticket-attachment';
import { TicketAttachmentDataService } from '../infrastructure/ticket-attachment.data.service';
import { CursorPage, extractErrorMessage, formatFileSize, valueOf } from '../../shared';

/** Página vazia, usada antes de um ticket ser definido. */
const EMPTY_PAGE: CursorPage<TicketAttachment> = { items: [], nextCursorDate: null, nextCursorId: null, hasNextPage: false };

/** Tipo sem os parâmetros e em minúsculas, como o back-end compara: "Text/Plain; charset=utf-8" é "text/plain". */
function mediaTypeOf(contentType: string): string {
  return contentType.split(';', 1)[0].trim().toLowerCase();
}

/** Extensão do nome do arquivo com o ponto, em minúsculas, como o `Path.GetExtension` do back-end; vazia sem ponto ou com o ponto no fim. */
function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot >= 0 && dot < fileName.length - 1 ? fileName.slice(dot).toLowerCase() : '';
}

/**
 * Motivo pelo qual a política do back-end recusaria o arquivo, ou `null` se ele passa. Confere na ordem do
 * `TicketAttachment.Create` do back-end: o tipo (sem parâmetros e sem diferenciar maiúsculas), a extensão do nome
 * entre as do tipo, o tamanho e, por fim, a quantidade e a soma por chamado. Essas duas só são conferidas com todos
 * os anexos carregados (`complete`); com páginas por carregar, o back-end confere e devolve o motivo.
 */
export function attachmentPolicyViolation(file: File, policy: TicketAttachmentPolicy, current: TicketAttachment[], complete: boolean): string | null {
  const mediaType = mediaTypeOf(file.type);
  const allowedType = policy.allowedTypes.find(type => type.contentType.toLowerCase() === mediaType);
  if (!allowedType) {
    return `O tipo de arquivo "${file.type || 'desconhecido'}" não é suportado.`;
  }
  if (!allowedType.extensions.some(extension => extension.toLowerCase() === extensionOf(file.name))) {
    return `A extensão do arquivo não corresponde ao tipo "${file.type}". Para esse tipo, use ${allowedType.extensions.join(' ou ')}.`;
  }
  if (file.size > policy.maxFileSizeBytes) {
    return `O arquivo excede o tamanho máximo permitido de ${formatFileSize(policy.maxFileSizeBytes)}.`;
  }
  if (!complete) return null;
  if (current.length >= policy.maxAttachmentsPerTicket) {
    return `O chamado já tem o máximo de ${policy.maxAttachmentsPerTicket} anexos. Exclua um para enviar outro.`;
  }
  const totalBytes = current.reduce((sum, attachment) => sum + attachment.fileSizeBytes, 0);
  if (totalBytes + file.size > policy.maxTotalBytesPerTicket) {
    return `Com este arquivo, os anexos do chamado passariam do limite de ${formatFileSize(policy.maxTotalBytesPerTicket)}.`;
  }
  return null;
}

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
    /** Motivo pelo qual o arquivo escolhido foi recusado pela política antes de enviar (`null` quando passou). */
    validationError: null as string | null,
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
    }),
    _policyResource: rxResource({ stream: () => store._ticketAttachmentDataService.getPolicy() })
  })),
  withComputed((store) => ({
    /** Limites e tipos aceitos nos anexos, vindos do back-end; `null` enquanto carrega ou se a leitura falhar. */
    policy: computed(() => valueOf(store._policyResource) ?? null),
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
    /** Define o ticket cujos anexos devem ser carregados (dispara o resource) e limpa os erros do chamado anterior. */
    loadForTicket(ticketId: string): void {
      patchState(store, {
        ticketId, mutationError: null, validationError: null, uploadError: null, downloadError: null,
        olderAttachments: [], lastPage: null
      });
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

    /** Baixa um anexo e entrega o arquivo a `onDownloaded` — quem chama dispara o download no navegador. */
    download(attachmentId: string, onDownloaded: (file: Blob) => void): void {
      patchState(store, { downloading: true, downloadError: null });

      store._ticketAttachmentDataService.download(attachmentId).pipe(
        finalize(() => patchState(store, { downloading: false }))
      ).subscribe({
        next: (file) => onDownloaded(file),
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

    /**
     * Exclui um anexo e recarrega a listagem em caso de sucesso. A exclusão pode desfazer o motivo da
     * última recusa de envio (quantidade ou soma por chamado), então essas mensagens saem.
     */
    delete(attachmentId: string, onSuccess?: () => void): void {
      patchState(store, { mutationError: null, deleting: true });

      store._ticketAttachmentDataService.delete(attachmentId).pipe(
        finalize(() => patchState(store, { deleting: false }))
      ).subscribe({
        next: () => {
          patchState(store, { mutationError: null, validationError: null, uploadError: null });
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
  })),
  withMethods((store) => ({
    /**
     * Confere o arquivo escolhido pela política do back-end e, se passar, envia. Sem a política (carregando
     * ou com falha), envia direto: o back-end valida e devolve o motivo.
     */
    uploadIfValid(file: File, onSuccess?: () => void): void {
      const policy = store.policy();
      const violation = policy ? attachmentPolicyViolation(file, policy, store.attachments(), !store.hasMore()) : null;
      patchState(store, { validationError: violation });
      if (!violation) store.upload(file, onSuccess);
    }
  }))
);
