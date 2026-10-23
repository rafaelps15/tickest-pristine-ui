import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { TicketDetailStore } from '../application/ticket-detail.store';
import { TicketAttachmentsStore } from '../application/ticket-attachments.store';
import { TicketHistoryStore } from '../application/ticket-history.store';
import { TicketStatus, TICKET_STATUS_LABELS, TICKET_STATUS_BADGE_CLASS } from '../entities/ticket-status';
import { TICKET_PRIORITY_LABELS, TICKET_PRIORITY_BADGE_CLASS } from '../entities/ticket-priority';
import { TICKET_SLA_STATUS_LABELS, TICKET_SLA_STATUS_BADGE_CLASS } from '../entities/ticket-sla-status';
import { TICKET_ATTACHMENT_LIMITS } from '../entities/ticket-attachment';
import { ConfirmDialogService, SessionService, visibleRoles, hiddenRolesCount, hiddenRolesNames } from '../../shared';
import { UserSummary } from '../../users';

/** Status em que o ticket ainda está ativo (aceita mudanças como atribuir/remover o responsável). */
const ACTIVE_STATUSES: ReadonlySet<TicketStatus> = new Set([TicketStatus.Open, TicketStatus.InProgress]);

/** Tela de detalhe de um ticket: dados do ticket (GET /tickets/{id}), histórico e anexos. */
@Component({
    selector: 'app-ticket-detail',
    imports: [DatePipe, NgClass, RouterLink],
    templateUrl: './ticket-detail.component.html',
    styleUrl: './ticket-detail.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketDetailComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    protected readonly detailStore = inject(TicketDetailStore);
    protected readonly store = inject(TicketAttachmentsStore);
    protected readonly historyStore = inject(TicketHistoryStore);
    protected readonly sessionService = inject(SessionService);
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

    /** Texto digitado na busca de candidatos a responsável, antes do debounce. */
    assigneeSearchInput = signal('');

    /** Id do candidato selecionado no modal de atribuição, antes de confirmar. */
    selectedAssigneeId = signal<string | null>(null);

    /** Índice do candidato com foco (tabindex circulante), pra navegação por seta no listbox de busca. */
    focusedAssigneeIndex = signal(0);

    /** Detalhe do ticket carregado pelo id da rota. */
    protected readonly ticket = this.detailStore.ticket;

    constructor() {
        // Espera ~300ms após a última tecla antes de buscar, pra não buscar a cada letra digitada.
        toObservable(this.assigneeSearchInput).pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntilDestroyed()
        ).subscribe(search => {
            this.focusedAssigneeIndex.set(0);
            this.detailStore.searchAssignees(search);
        });
    }

    /** Carrega o detalhe do ticket, o histórico e a primeira página de anexos ao inicializar a tela. */
    ngOnInit(): void {
        this.detailStore.loadTicket(this.ticketId);
        this.historyStore.loadForTicket(this.ticketId);
        this.store.loadForTicket(this.ticketId);
    }

    /** Indica se o botão "Atribuir/Alterar responsável" deve aparecer: só pra quem administra, com o chamado ativo. */
    canAssignTicket(status: TicketStatus): boolean {
        return this.sessionService.hasPermission('tickets:manage') && ACTIVE_STATUSES.has(status);
    }

    /** Indica se o botão "Remover responsável" deve aparecer: só pra quem administra, com o chamado ativo e com responsável atual. */
    canRemoveAssignee(status: TicketStatus, assignedToName: string | null): boolean {
        return this.sessionService.hasPermission('tickets:manage') && ACTIVE_STATUSES.has(status) && assignedToName !== null;
    }

    /** Confirma e remove o responsável atual do ticket, recarregando o detalhe e o histórico em caso de sucesso. */
    onRemoveAssignee(assignedToName: string): void {
        this.confirmDialogService.confirm({
            title: `Remover ${assignedToName} como responsável por este chamado?`,
            message: 'O chamado volta a ficar sem responsável atribuído.',
            confirmLabel: 'Remover',
            variant: 'danger'
        }).subscribe(confirmed => {
            if (confirmed) {
                this.detailStore.removeAssignee(this.ticketId, () => this.historyStore.reload());
            }
        });
    }

    /** Reseta a busca e a seleção do modal de atribuição ao abri-lo. */
    onOpenAssignModal(): void {
        this.assigneeSearchInput.set('');
        this.selectedAssigneeId.set(null);
        this.focusedAssigneeIndex.set(0);
        this.detailStore.clearMutationError();
        this.detailStore.clearAssigneeSearch();
    }

    /** Nome do candidato selecionado no modal de atribuição, pra mostrar no aviso de substituição do responsável atual. */
    selectedAssigneeName(): string | null {
        const candidate = this.detailStore.assigneeCandidates().find(c => c.id === this.selectedAssigneeId());
        return candidate ? `${candidate.firstName} ${candidate.lastName}` : null;
    }

    /** Até 2 funções do candidato exibidas como badge; o restante vira um badge "+N" (mesma regra da Gestão de Usuários). */
    visibleCandidateRoles(candidate: UserSummary) {
        return visibleRoles(candidate.roles);
    }

    hiddenCandidateRolesCount(candidate: UserSummary): number {
        return hiddenRolesCount(candidate.roles);
    }

    hiddenCandidateRolesNames(candidate: UserSummary): string {
        return hiddenRolesNames(candidate.roles);
    }

    /** Marca (ou desmarca, ao clicar de novo) um candidato como o escolhido para responsável; limpa o erro de uma tentativa anterior. */
    onSelectAssignee(userId: string, index: number): void {
        this.selectedAssigneeId.update(current => current === userId ? null : userId);
        this.focusedAssigneeIndex.set(index);
        this.detailStore.clearMutationError();
    }

    /**
     * Navega entre os candidatos encontrados com as setas (padrão ARIA Listbox de tabindex
     * circulante: só o item focado tem tabindex 0, os demais ficam fora do Tab).
     */
    onAssigneeListKeydown(event: KeyboardEvent, candidateCount: number): void {
        if (candidateCount === 0) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.focusedAssigneeIndex.update(i => (i + 1) % candidateCount);
            this.focusAssigneeRow();
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            this.focusedAssigneeIndex.update(i => (i - 1 + candidateCount) % candidateCount);
            this.focusAssigneeRow();
        }
    }

    /** Move o foco do navegador pro candidato atualmente marcado como circulante. */
    private focusAssigneeRow(): void {
        document.getElementById(`assignee-candidate-${this.focusedAssigneeIndex()}`)?.focus();
    }

    /** Atribui o candidato selecionado como responsável e fecha o modal em caso de sucesso. */
    onConfirmAssign(): void {
        const userId = this.selectedAssigneeId();
        if (!userId) return;

        this.detailStore.assignTicket(this.ticketId, userId, () => {
            this.historyStore.reload();
            document.getElementById('ticketAssignModalCloseButton')?.click();
        });
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
