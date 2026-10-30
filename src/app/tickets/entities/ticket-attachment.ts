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

/** Tipo de arquivo aceito nos anexos, com as extensões que o back-end aceita para ele. */
export interface AllowedAttachmentType {
  /** Tipo MIME (ex.: `application/pdf`). */
  contentType: string;
  /** Extensões aceitas para o tipo, com ponto (ex.: `.jpg`). */
  extensions: string[];
}

/** Limites e tipos aceitos nos anexos (GET /ticket-attachments/policy): os mesmos que o envio valida no back-end. */
export interface TicketAttachmentPolicy {
  /** Tamanho máximo de um arquivo, em bytes. */
  maxFileSizeBytes: number;
  /** Quantidade máxima de anexos por chamado. */
  maxAttachmentsPerTicket: number;
  /** Soma máxima dos anexos de um chamado, em bytes. */
  maxTotalBytesPerTicket: number;
  /** Tipos de arquivo aceitos. */
  allowedTypes: AllowedAttachmentType[];
}
