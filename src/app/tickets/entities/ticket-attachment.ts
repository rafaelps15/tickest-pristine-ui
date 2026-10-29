/** Anexo de um ticket, conforme retornado (paginado por cursor) por GET /tickets/{ticketId}/attachments. */
export interface TicketAttachment {
  id: string;
  ticketId: string;
  uploadedByUserId: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  uploadedAtUtc: string;
}

/** Limites de upload espelhando TicketAttachmentLimits do back-end — valida cedo, antes de enviar o arquivo. */
export const TICKET_ATTACHMENT_LIMITS = {
  maxFileSizeBytes: 10 * 1024 * 1024,
  allowedContentTypes: new Set([
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip'
  ])
};
