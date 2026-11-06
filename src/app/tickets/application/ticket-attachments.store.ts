import { signalStore, withState, withProps, withComputed, withMethods, withFeature, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { TicketAttachment, TicketAttachmentPolicy } from '../entities/ticket-attachment';
import { TicketAttachmentDataService } from '../infrastructure/ticket-attachment.data.service';
import { withTicketCursorPages } from './ticket-cursor-pages';
import { extractErrorMessage, formatFileSize, valueOf } from '../../shared';

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
 * Store dos anexos de um ticket: listagem paginada por cursor ("carregar mais", {@link withTicketCursorPages}),
 * upload, download e exclusão.
 */
export const TicketAttachmentsStore = signalStore(
  { providedIn: 'root' },
  withState({
    /** Falha da última exclusão de anexo (a da leitura vem do resource, em {@link listState}). */
    mutationError: null as string | null,
    uploading: false,
    uploadError: null as string | null,
    /** Motivo pelo qual o arquivo escolhido foi recusado pela política antes de enviar (`null` quando passou). */
    validationError: null as string | null,
    downloading: false,
    downloadError: null as string | null,
    deleting: false
  }),
  withProps(() => ({
    _ticketAttachmentDataService: inject(TicketAttachmentDataService)
  })),
  withFeature((store) => withTicketCursorPages<TicketAttachment>(
    (...page) => store._ticketAttachmentDataService.getAll(...page),
    {
      readError: 'Erro ao carregar anexos',
      readStatusMessages: { 403: 'Você não tem permissão para ver os anexos deste chamado.' },
      loadMoreError: 'Erro ao carregar mais anexos'
    }
  )),
  withProps((store) => ({
    _policyResource: rxResource({ stream: () => store._ticketAttachmentDataService.getPolicy() })
  })),
  withComputed((store) => ({
    /** Limites e tipos aceitos nos anexos, vindos do back-end; `null` enquanto carrega ou se a leitura falhar. */
    policy: computed(() => valueOf(store._policyResource) ?? null),
    /** Anexos já carregados do ticket atual, do mais novo para o mais antigo (ordem aplicada pelo back-end). */
    attachments: computed(() => store._items()),
    /** Estado da leitura da primeira página: carregamento e erro de leitura, sem os erros das ações. */
    listState: computed(() => store._listState())
  })),
  withMethods((store) => ({
    /** Volta para a primeira página e tira a falha do "carregar mais" anterior (depois de enviar ou excluir). */
    _reloadListAfterChange(): void {
      patchState(store, { loadMoreError: null });
      store._reloadFirstPage();
    }
  })),
  withMethods((store) => ({
    /**
     * Define o ticket cujos anexos devem ser carregados (dispara o resource) e limpa os erros do chamado anterior.
     * Com o mesmo ticket ("Tentar novamente", reabrir a tela), recarrega a primeira página.
     */
    loadForTicket(ticketId: string): void {
      patchState(store, { mutationError: null, validationError: null, uploadError: null, downloadError: null, loadMoreError: null });
      store._loadTicket(ticketId);
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
          store._reloadListAfterChange();
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
          store._reloadListAfterChange();
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
