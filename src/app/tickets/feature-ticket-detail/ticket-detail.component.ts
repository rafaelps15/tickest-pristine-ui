import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TicketDetailStore } from '../application/ticket-detail.store';
import { TicketAttachmentsStore } from '../application/ticket-attachments.store';
import { TICKET_STATUS_LABELS, TICKET_STATUS_BADGE_CLASS } from '../entities/ticket-status';
import { TICKET_PRIORITY_LABELS, TICKET_PRIORITY_BADGE_CLASS } from '../entities/ticket-priority';
import { TICKET_SLA_STATUS_LABELS, TICKET_SLA_STATUS_BADGE_CLASS } from '../entities/ticket-sla-status';
import { TICKET_ATTACHMENT_LIMITS } from '../entities/ticket-attachment';
import { ConfirmDialogService } from '../../shared';

/** Tela de detalhe de um ticket: dados do ticket (GET /tickets/{id}) e os anexos. */
@Component({
    selector: 'app-ticket-detail',
    imports: [DatePipe, NgClass, RouterLink],
    templateUrl: './ticket-detail.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketDetailComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    protected readonly detailStore = inject(TicketDetailStore);
    protected readonly store = inject(TicketAttachmentsStore);
    private readonly confirmDialogService = inject(ConfirmDialogService);

    protected readonly statusLabels = TICKET_STATUS_LABELS;
    protected readonly statusBadgeClass = TICKET_STATUS_BADGE_CLASS;
    protected readonly priorityLabels = TICKET_PRIORITY_LABELS;
    protected readonly priorityBadgeClass = TICKET_PRIORITY_BADGE_CLASS;
    protected readonly slaStatusLabels = TICKET_SLA_STATUS_LABELS;
    protected readonly slaStatusBadgeClass = TICKET_SLA_STATUS_BADGE_CLASS;

    readonly ticketId = this.route.snapshot.paramMap.get('id')!;

    /** Mensagem de erro de validação (tamanho/tipo) do arquivo escolhido, antes de enviar. */
    fileValidationError = signal<string | null>(null);

    /** Detalhe do ticket carregado pelo id da rota. */
    protected readonly ticket = this.detailStore.ticket;

    /** Carrega o detalhe do ticket e a primeira página de anexos ao inicializar a tela. */
    ngOnInit(): void {
        this.detailStore.loadTicket(this.ticketId);
        this.store.loadForTicket(this.ticketId);
    }

    /** Formata o tamanho do arquivo em KB/MB para exibição. */
    formatSize(bytes: number): string {
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(0)} KB`;
        }
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    /** Valida o arquivo escolhido (tamanho/tipo) e, se válido, envia o upload. */
    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        input.value = '';
        if (!file) return;

        if (file.size > TICKET_ATTACHMENT_LIMITS.maxFileSizeBytes) {
            const maxMb = TICKET_ATTACHMENT_LIMITS.maxFileSizeBytes / (1024 * 1024);
            this.fileValidationError.set(`O arquivo excede o tamanho máximo permitido de ${maxMb} MB.`);
            return;
        }

        if (!TICKET_ATTACHMENT_LIMITS.allowedContentTypes.has(file.type)) {
            this.fileValidationError.set(`O tipo de arquivo "${file.type || 'desconhecido'}" não é suportado.`);
            return;
        }

        this.fileValidationError.set(null);
        this.store.upload(file);
    }

    /** Confirma e exclui o anexo selecionado. */
    onDeleteAttachment(attachmentId: string, fileName: string): void {
        this.confirmDialogService.confirm({
            title: `Excluir o anexo "${fileName}"?`,
            message: 'Essa ação não pode ser desfeita.',
            confirmLabel: 'Excluir',
            variant: 'danger'
        }).subscribe(confirmed => {
            if (confirmed) this.store.delete(attachmentId);
        });
    }
}
