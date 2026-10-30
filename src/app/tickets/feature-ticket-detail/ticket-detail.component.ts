import { Component, inject, OnInit, ChangeDetectionStrategy, signal, viewChild, ElementRef, DestroyRef, afterNextRender } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TicketDetailStore } from '../application/ticket-detail.store';
import { TicketAttachmentsStore } from '../application/ticket-attachments.store';
import { TicketHistoryStore } from '../application/ticket-history.store';
import { TicketMessagesStore } from '../application/ticket-messages.store';
import {
    TicketStatus, TICKET_STATUS_LABELS, TICKET_STATUS_BADGE_CLASS, TICKET_ACTIVE_STATUSES,
    TICKET_STATUS_TRANSITIONS, TICKET_STATUS_ACTION_LABELS
} from '../entities/ticket-status';
import { TICKET_PRIORITY_LABELS, TICKET_PRIORITY_BADGE_CLASS } from '../entities/ticket-priority';
import { TicketSlaStatus, TICKET_SLA_STATUS_LABELS, TICKET_SLA_STATUS_BADGE_CLASS } from '../entities/ticket-sla-status';
import { TicketDetail } from '../entities/ticket';
import {
    TicketSla, TicketSlaObjective, TICKET_SLA_METRIC_LABELS,
    TicketSlaObjectiveState, TICKET_SLA_OBJECTIVE_STATE_LABELS, TICKET_SLA_OBJECTIVE_STATE_BADGE_CLASS
} from '../entities/ticket-sla';
import { TicketMessage, TICKET_MESSAGE_MAX_LENGTH } from '../entities/ticket-message';
import { ConfirmDialogService, SessionService, ToastService } from '../../shared';
import { TicketEditDialogComponent } from '../ui/ticket-edit-dialog/ticket-edit-dialog.component';
import { TicketReopenDialogComponent } from '../ui/ticket-reopen-dialog/ticket-reopen-dialog.component';
import { PageCrumb, PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { LoadingStateComponent } from '../../shared/ui/data-state/data-state.components';
import { TicketAssignDialogComponent } from '../../shared/ui/ticket-assign-dialog/ticket-assign-dialog.component';
import { TicketAttachment } from '../entities/ticket-attachment';
import { TICKETS_CANCEL_PERMISSION, isCancelAvailable, ownerCancelHint } from '../ui/ticket-cancel-window';
import { canAssignTicketToOthers, canEditTicketDescription, canReopenTicket } from '../ui/ticket-action-permissions';


/** Tela de detalhe de um ticket: dados do ticket (GET /tickets/{id}), histórico e anexos. */
@Component({
    selector: 'app-ticket-detail',
    imports: [DatePipe, NgClass, RouterLink, PageHeaderComponent, TicketEditDialogComponent, TicketReopenDialogComponent, LoadingStateComponent, TicketAssignDialogComponent],
    templateUrl: './ticket-detail.component.html',
    styleUrl: './ticket-detail.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketDetailComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    protected readonly detailStore = inject(TicketDetailStore);
    protected readonly store = inject(TicketAttachmentsStore);
    protected readonly historyStore = inject(TicketHistoryStore);
    protected readonly messagesStore = inject(TicketMessagesStore);
    protected readonly sessionService = inject(SessionService);
    private readonly destroyRef = inject(DestroyRef);

    /** Hora atual do navegador, atualizada a cada 30 s, pra janela de cancelamento do dono vencer com a tela aberta. */
    protected readonly now = signal(Date.now());
    private readonly confirmDialogService = inject(ConfirmDialogService);
    private readonly toastService = inject(ToastService);

    protected readonly TicketStatus = TicketStatus;
    protected readonly statusLabels = TICKET_STATUS_LABELS;
    protected readonly statusBadgeClass = TICKET_STATUS_BADGE_CLASS;
    protected readonly statusActionLabels = TICKET_STATUS_ACTION_LABELS;
    protected readonly TICKET_MESSAGE_MAX_LENGTH = TICKET_MESSAGE_MAX_LENGTH;
    protected readonly priorityLabels = TICKET_PRIORITY_LABELS;
    protected readonly priorityBadgeClass = TICKET_PRIORITY_BADGE_CLASS;
    protected readonly slaStatusLabels = TICKET_SLA_STATUS_LABELS;
    protected readonly slaStatusBadgeClass = TICKET_SLA_STATUS_BADGE_CLASS;
    protected readonly TicketSlaObjectiveState = TicketSlaObjectiveState;
    protected readonly slaMetricLabels = TICKET_SLA_METRIC_LABELS;
    protected readonly slaObjectiveStateLabels = TICKET_SLA_OBJECTIVE_STATE_LABELS;
    protected readonly slaObjectiveStateBadgeClass = TICKET_SLA_OBJECTIVE_STATE_BADGE_CLASS;

    /** Painel "Ciclos anteriores" do SLA: fechado por padrão, só relevante em chamados já reabertos. */
    protected readonly olderCyclesOpen = signal(false);

    /** Alterna o painel "Ciclos anteriores" do SLA. */
    protected toggleOlderCycles(): void {
        this.olderCyclesOpen.update(open => !open);
    }

    /** Objetivos do ciclo vigente de cada métrica — os cartões principais do painel de SLA. */
    protected currentCycleObjectives(sla: TicketSla): TicketSlaObjective[] {
        return sla.objectives.filter(o => o.isCurrentCycle);
    }

    /** Objetivos de ciclos anteriores (ex.: resoluções de antes de uma reabertura) — a área recolhível. */
    protected previousCycleObjectives(sla: TicketSla): TicketSlaObjective[] {
        return sla.objectives.filter(o => !o.isCurrentCycle);
    }

    /**
     * Cor da linha de prazo de um objetivo do ciclo vigente: vermelho se estourou, âmbar se está em
     * risco, cinza no resto — o mesmo destaque que a linha "Prazo" do resumo dava antes de ficar só
     * como fallback (o painel de SLA é a fonte do prazo vigente).
     */
    protected objectiveUrgencyClass(objective: TicketSlaObjective): string {
        if (objective.completedAtUtc || objective.stoppedAtUtc) {
            return 'text-muted';
        }
        if (objective.state === TicketSlaObjectiveState.Breached) {
            return 'text-danger';
        }
        if (objective.state === TicketSlaObjectiveState.AtRisk) {
            return 'text-warning';
        }
        return 'text-muted';
    }

    /**
     * Urgência relativa pt-BR do prazo de um objetivo de SLA ("Vence em 40 minutos"/"Atrasado há 3
     * horas"), a partir da hora do servidor (nunca do relógio do navegador — os minutos são úteis e
     * só o back-end sabe quando o expediente/calendário conta ou não). Null sem prazo (ex.: sem
     * meta) ou quando o objetivo já terminou (concluído ou parado) — a data absoluta já basta.
     */
    protected objectiveRelativeLabel(objective: TicketSlaObjective, serverNowUtc: string): string | null {
        if (!objective.dueAtUtc || objective.completedAtUtc || objective.stoppedAtUtc) {
            return null;
        }

        const diffMs = new Date(objective.dueAtUtc).getTime() - new Date(serverNowUtc).getTime();
        const duration = this.formatDuration(Math.abs(diffMs));
        return diffMs < 0 ? `Atrasado há ${duration}` : `Vence em ${duration}`;
    }

    readonly ticketId = this.route.snapshot.paramMap.get('id')!;

    /**
     * De onde o usuário chegou nesta tela — hoje só distingue Monitorar Tickets (fila de todos os
     * chamados, usada por quem tem `tickets:manage`) do padrão "Meus Tickets" (lista pessoal do
     * próprio Solicitante/Atendente). Vem de `?from=monitor` na URL, passado pelos dois pontos de
     * entrada (`ticket-list`/`ticket-monitor`), não de permissão — reflete de onde a pessoa
     * efetivamente navegou, não quem ela é, já que o mesmo usuário pode chegar aqui pelos dois
     * caminhos em momentos diferentes.
     */
    protected readonly cameFromMonitor = this.route.snapshot.queryParamMap.get('from') === 'monitor';

    /**
     * Texto do trilho de navegação, coerente com a tela de onde o usuário realmente veio — inclui
     * "Administração /" quando vem do Monitor, igual o próprio Monitor mostra no cabeçalho dele
     * (achado do critique de 2026-10-25: aqui descartava esse nível, perdendo o pai que o usuário
     * acabou de ver um clique antes).
     */
    /** Trilha do cabeçalho — a tela de onde o usuário veio (Monitorar ou Meus Chamados). */
    protected readonly crumbs: PageCrumb[] = this.cameFromMonitor
        ? [{ label: 'Administração' }, { label: 'Monitorar Chamados', link: '/tickets/monitorar' }]
        : [{ label: 'Início', link: '/dashboard' }, { label: 'Meus Chamados', link: '/tickets' }];

    /** Destino do botão "Voltar" — a mesma tela de onde o usuário veio, não sempre "Meus Tickets". */
    protected readonly backLink = this.cameFromMonitor ? '/tickets/monitorar' : '/tickets';

    /** Mensagem de erro de validação (tamanho/tipo) do arquivo escolhido, antes de enviar. */
    fileValidationError = signal<string | null>(null);

    /**
     * Referência ao `<input type="file">` oculto, pra abrir o seletor de arquivo a partir de um
     * `<button>` real em vez de um `<label>` envolvendo o input — um `<label>` sem `tabindex` não
     * entra na ordem de tabulação, então o upload era inalcançável por teclado (achado no critique
     * de 2026-10-24).
     */
    private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

    /** Abre o seletor de arquivo do sistema, disparado pelo botão "Anexar arquivo". */
    protected openFilePicker(): void {
        this.fileInput().nativeElement.click();
    }

    /** Se o diálogo "Atribuir/Alterar responsável" está aberto. */

    readonly assignDialogOpen = signal(false);

    /** Detalhe do ticket carregado pelo id da rota. */
    protected readonly ticket = this.detailStore.ticket;

    /** Carrega o detalhe do ticket, o histórico, os anexos e as mensagens ao inicializar a tela. */
    constructor() {
        // O relógio da janela de cancelamento só roda no navegador (o prerender não pode ficar preso num intervalo).
        afterNextRender(() => {
            const timer = setInterval(() => this.now.set(Date.now()), 30_000);
            this.destroyRef.onDestroy(() => clearInterval(timer));
        });
    }

    ngOnInit(): void {
        this.detailStore.loadTicket(this.ticketId);
        this.historyStore.loadForTicket(this.ticketId);
        this.store.loadForTicket(this.ticketId);
        this.messagesStore.loadForTicket(this.ticketId);
    }

    /** Texto digitado na caixa de nova mensagem. */
    newMessageContent = signal('');

    /** Id da mensagem em edição inline (null quando nenhuma está sendo editada). */
    editingMessageId = signal<string | null>(null);

    /** Texto digitado na edição inline da mensagem em {@link editingMessageId}. */
    editMessageContent = signal('');

    /**
     * Nome de quem escreveu a mensagem, pra exibição — o back-end só manda o id do autor
     * (`TicketMessageResponse` não tem nome). Resolve pelos papéis já conhecidos do próprio
     * chamado (quem abriu, o responsável atual) ou por ser o próprio usuário logado; sem essas
     * três correspondências, "Equipe" é um rótulo genérico de propósito — não inventa qual função
     * específica a pessoa tem, já que tanto Administrador quanto Atendente podem postar.
     */
    protected messageAuthorName(message: TicketMessage, t: TicketDetail): string {
        if (message.authorUserId === this.sessionService.userId()) return 'Você';
        if (message.authorUserId === t.openedByUserId) return t.openedByName;
        if (message.authorUserId === t.assignedToUserId) return t.assignedToName ?? 'Equipe';
        return 'Equipe';
    }

    /** Só quem escreveu a mensagem pode editá-la. */
    protected canEditMessage(message: TicketMessage): boolean {
        return message.authorUserId === this.sessionService.userId();
    }

    /** Quem enviou o anexo, ou quem administra chamados, pode excluí-lo (mesma regra do back-end). */
    protected canDeleteAttachment(attachment: TicketAttachment): boolean {
        return attachment.uploadedByUserId === this.sessionService.userId() || this.sessionService.hasPermission('tickets:manage');
    }

    /** Quem escreveu a mensagem, ou quem administra chamados, pode excluí-la. */
    protected canDeleteMessage(message: TicketMessage): boolean {
        return message.authorUserId === this.sessionService.userId() || this.sessionService.hasPermission('tickets:manage');
    }

    /**
     * Publica a nova mensagem e limpa a caixa de composição em caso de sucesso. Também pede pro
     * SLA ser atualizado — publicar pode concluir a primeira resposta — já que `TicketMessagesStore`
     * não injeta `TicketDetailStore` (Stores desta arquitetura não injetam outras do mesmo domínio).
     */
    onSendMessage(): void {
        const content = this.newMessageContent().trim();
        if (!content) return;

        this.messagesStore.post(this.ticketId, content, () => {
            this.newMessageContent.set('');
            this.toastService.show('Mensagem enviada.');
            this.historyStore.reload();
            this.detailStore.refreshSla();
        });
    }

    /** Abre a edição inline da mensagem, pré-carregando o texto atual. */
    onStartEdit(message: TicketMessage): void {
        this.messagesStore.clearMutationError();
        this.editingMessageId.set(message.id);
        this.editMessageContent.set(message.content);
    }

    /** Cancela a edição inline sem salvar. */
    onCancelEdit(): void {
        this.editingMessageId.set(null);
    }

    /** Salva a edição inline e fecha o modo de edição em caso de sucesso. */
    onSaveEdit(messageId: string): void {
        const content = this.editMessageContent().trim();
        if (!content) return;

        this.messagesStore.editMessage(messageId, content, () => {
            this.toastService.show('Mensagem editada.');
            this.editingMessageId.set(null);
            this.historyStore.reload();
        });
    }

    /** Confirma e exclui a mensagem selecionada. */
    onDeleteMessage(messageId: string): void {
        this.confirmDialogService.confirm({
            title: 'Excluir esta mensagem?',
            message: 'Essa ação não pode ser desfeita.',
            confirmLabel: 'Excluir',
            variant: 'danger'
        }).subscribe(confirmed => {
            if (confirmed) {
                this.messagesStore.deleteMessage(messageId, () => {
                    this.toastService.show('Mensagem excluída.');
                    this.historyStore.reload();
                });
            }
        });
    }

    /**
     * Classe de cor da linha de Prazo — mesmo tratamento que a tabela de Monitorar Tickets já
     * aplica na data (`[class.text-danger]="isOverdue(ticket)"`), agora também no detalhe, e um
     * pouco mais fino: distingue "em risco" (amarelo) de "atrasado"/"violado" (vermelho) em vez de
     * só um booleano, já que o `slaStatus` do back-end já traz essa granularidade.
     */
    protected slaUrgencyClass(slaStatus: TicketSlaStatus): string {
        if (slaStatus === TicketSlaStatus.Breached || slaStatus === TicketSlaStatus.Missed) {
            return 'text-danger';
        }
        if (slaStatus === TicketSlaStatus.AtRisk) {
            return 'text-warning';
        }
        return '';
    }

    /**
     * Urgência do prazo em texto relativo pt-BR ("Vence em 40 minutos"/"Atrasado há 3 horas"), pra
     * não obrigar quem está lendo a calcular a diferença a partir de uma data/hora absoluta. Null
     * quando o chamado já foi resolvido — o prazo deixou de importar, a data absoluta já basta
     * como registro.
     */
    protected dueRelativeLabel(t: TicketDetail): string | null {
        if (t.resolvedAtUtc) {
            return null;
        }

        const diffMs = new Date(t.dueAtUtc).getTime() - Date.now();
        const duration = this.formatDuration(Math.abs(diffMs));
        return diffMs < 0 ? `Atrasado há ${duration}` : `Vence em ${duration}`;
    }

    /**
     * Formata minutos úteis de SLA como "45 min", "10h" ou "1h 30min" — só horas e minutos, sem
     * converter pra dias (um dia útil não tem 24h, e o expediente depende do calendário do plano).
     */
    protected formatBusinessMinutes(totalMinutes: number): string {
        if (totalMinutes < 60) {
            return `${totalMinutes} min`;
        }

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}min`;
    }

    /** Formata uma duração em milissegundos como "N minuto(s)"/"N hora(s)"/"N dia(s)", em pt-BR. */
    private formatDuration(ms: number): string {
        const minutes = Math.round(ms / 60_000);
        if (minutes < 60) {
            return minutes === 1 ? '1 minuto' : `${minutes} minutos`;
        }

        const hours = Math.round(minutes / 60);
        if (hours < 24) {
            return hours === 1 ? '1 hora' : `${hours} horas`;
        }

        const days = Math.round(hours / 24);
        return days === 1 ? '1 dia' : `${days} dias`;
    }

    /** Ticket em edição no modal de descrição (null quando o modal está fechado). */
    editingTicket = signal<TicketDetail | null>(null);

    /** Indica se o usuário logado foi quem abriu o chamado. */
    protected isOwner(t: TicketDetail): boolean {
        return t.openedByUserId === this.sessionService.userId();
    }

    /**
     * Indica se o botão "Editar" (descrição) deve aparecer: dono com `tickets:update-own` ou quem
     * administra chamados, com o chamado ativo — mesma regra do back-end.
     */
    protected canEditTicket(t: TicketDetail): boolean {
        return canEditTicketDescription(t.status, this.isOwner(t), code => this.sessionService.hasPermission(code));
    }

    /** Se quem está logado cancela qualquer chamado, sem prazo (`tickets:cancel`). */
    private canCancelAny(): boolean {
        return this.sessionService.hasPermission(TICKETS_CANCEL_PERMISSION);
    }

    /**
     * Se dá pra cancelar agora: o back-end permite (`canCancel` — dono nos 15 min após abrir, ou
     * `tickets:cancel`) e, pro dono sem a permissão, a janela ainda não venceu no relógio do navegador.
     */
    protected canCancelNow(t: TicketDetail): boolean {
        return TICKET_ACTIVE_STATUSES.has(t.status) && isCancelAvailable(t, this.now(), this.canCancelAny());
    }

    /** Tempo restante pro dono cancelar ("por mais 8 min"), ou null pra quem cancela sem prazo. */
    protected cancelHint(t: TicketDetail): string | null {
        return ownerCancelHint(t, this.now(), this.canCancelAny());
    }

    /**
     * Indica se o botão dedicado "Cancelar chamado" deve aparecer — quando dá pra cancelar e a pessoa
     * NÃO já vê essa opção nas transições de status de quem atende (`nextStatusOptions`), pra não
     * duplicar o botão.
     */
    protected canCancelSeparately(t: TicketDetail): boolean {
        return this.canCancelNow(t) && !this.nextStatusOptions(t).includes(TicketStatus.Canceled);
    }

    /** Abre o modal de edição da descrição, limpando o erro de uma mutação anterior. */
    onStartEditDescription(t: TicketDetail): void {
        this.detailStore.clearMutationError();
        this.editingTicket.set(t);
    }

    /** Fecha o modal de edição sem salvar. */
    onEditClosed(): void {
        this.editingTicket.set(null);
    }

    /** Salva a descrição editada no modal, mantendo o status atual do ticket. */
    onEditSave(description: string): void {
        const t = this.editingTicket();
        if (!t) return;

        this.detailStore.updateDescription(this.ticketId, description, t.status, () => {
            this.toastService.show('Descrição atualizada.');
            this.editingTicket.set(null);
            this.historyStore.reload();
        });
    }

    /**
     * Indica se o botão "Atribuir/Alterar responsável" deve aparecer: o diálogo escolhe qualquer pessoa,
     * então exige `tickets:manage` e `tickets:assign`, com o chamado ativo.
     */
    canAssignTicket(status: TicketStatus): boolean {
        return canAssignTicketToOthers(status, code => this.sessionService.hasPermission(code));
    }

    /** Indica se o botão "Remover responsável" deve aparecer: só pra quem administra, com o chamado ativo e com responsável atual. */
    canRemoveAssignee(status: TicketStatus, assignedToName: string | null): boolean {
        return this.sessionService.hasPermission('tickets:manage') && TICKET_ACTIVE_STATUSES.has(status) && assignedToName !== null;
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
                this.detailStore.removeAssignee(this.ticketId, () => {
                    this.toastService.show('Responsável removido.');
                    this.historyStore.reload();
                });
            }
        });
    }

    /** Indica se os botões de transição de status devem aparecer: só pra quem administra chamados. */
    protected canChangeStatus(): boolean {
        return this.sessionService.hasPermission('tickets:manage');
    }

    /**
     * Próximos status válidos a partir do status atual, pra quem administra chamados. Cancelar só
     * entra se dá pra cancelar agora: com a spec 016 do back-end, `tickets:manage` sozinho não cancela.
     */
    protected nextStatusOptions(t: TicketDetail): TicketStatus[] {
        if (!this.canChangeStatus()) return [];
        return TICKET_STATUS_TRANSITIONS[t.status].filter(status => status !== TicketStatus.Canceled || this.canCancelNow(t));
    }

    /** Indica se o botão "Reabrir chamado" deve aparecer: chamado inativo e dono com `tickets:reopen-own` ou `tickets:manage`. */
    protected canReopenTicket(t: TicketDetail): boolean {
        return canReopenTicket(t.status, this.isOwner(t), code => this.sessionService.hasPermission(code));
    }

    /**
     * Muda o status do ticket pra um dos próximos válidos. Cancelar passa pelo modal de
     * confirmação do sistema (ação sensível pro Solicitante, que perde o chamado); as demais
     * transições são progressões de rotina do fluxo de atendimento e não pedem confirmação —
     * mesmo critério já usado em Atribuir (sem confirmação) vs. Excluir (com confirmação).
     */
    protected onChangeStatus(newStatus: TicketStatus, currentDescription: string): void {
        if (newStatus === TicketStatus.Canceled) {
            this.confirmDialogService.confirm({
                title: 'Cancelar este chamado?',
                message: 'O Solicitante é avisado de que o chamado não vai ser atendido. Pode ser reaberto depois, se necessário.',
                confirmLabel: 'Cancelar chamado',
                // "Cancelar" ao lado de "Cancelar chamado" deixava ambíguo qual botão desiste da ação.
                cancelLabel: 'Voltar',
                variant: 'danger'
            }).subscribe(confirmed => {
                if (confirmed) this.submitStatusChange(newStatus, currentDescription);
            });
            return;
        }

        this.submitStatusChange(newStatus, currentDescription);
    }

    /**
     * Status pedido na última troca — só o botão desse status mostra o spinner enquanto
     * `updatingStatus` está ativo (os outros ficam só desabilitados), pra ficar claro qual ação está em andamento.
     */
    protected readonly pendingStatus = signal<TicketStatus | null>(null);

    /** Envia a troca de status e, em caso de sucesso, avisa por toast e recarrega o histórico. */
    private submitStatusChange(newStatus: TicketStatus, currentDescription: string): void {
        this.pendingStatus.set(newStatus);
        this.detailStore.updateStatus(this.ticketId, newStatus, currentDescription, () => {
            this.toastService.show(this.statusChangeToastMessage(newStatus));
            this.historyStore.reload();
        });
    }

    /** Mensagem de sucesso do toast, em tom de confirmação ("X feito"), separada do rótulo do botão (que nomeia a ação, "Fazer X"). */
    private statusChangeToastMessage(newStatus: TicketStatus): string {
        switch (newStatus) {
            case TicketStatus.InProgress: return 'Atendimento iniciado.';
            case TicketStatus.Resolved: return 'Chamado marcado como resolvido.';
            case TicketStatus.Closed: return 'Chamado fechado.';
            case TicketStatus.Canceled: return 'Chamado cancelado.';
            default: return 'Status atualizado.';
        }
    }

    /** Indica se o modal de reabertura (com motivo opcional) está aberto. */
    protected readonly reopenDialogOpen = signal(false);

    /** Botão "Reabrir chamado" — recebe o foco de volta quando o modal de reabertura fecha. */
    private readonly reopenButton = viewChild<ElementRef<HTMLButtonElement>>('reopenButton');

    /** Abre o modal de reabertura, sem herdar o erro de uma ação anterior. */
    protected onReopen(): void {
        this.detailStore.clearMutationError();
        this.reopenDialogOpen.set(true);
    }

    /**
     * Reabre o chamado com o motivo opcional, numa chamada só: o back-end grava a reabertura e a
     * mensagem juntas. Com motivo, a conversa é recarregada pra mensagem nova aparecer.
     */
    protected onReopenConfirm(reason: string | null): void {
        this.detailStore.reopen(this.ticketId, reason, () => {
            this.toastService.show('Chamado reaberto.');
            this.historyStore.reload();
            this.reopenDialogOpen.set(false);
            if (reason) this.messagesStore.loadForTicket(this.ticketId);
        });
    }

    /** Fecha o modal de reabertura sem reabrir, devolvendo o foco ao botão que o abriu. */
    protected onReopenClosed(): void {
        this.reopenDialogOpen.set(false);
        this.reopenButton()?.nativeElement.focus();
    }

    /** Abre o diálogo de atribuição, sem herdar a busca nem o erro de uma abertura anterior. */
    onOpenAssignModal(): void {
        this.detailStore.clearMutationError();
        this.detailStore.clearAssigneeSearch();
        this.assignDialogOpen.set(true);
    }

    /** Atribui o candidato confirmado no diálogo e fecha o diálogo em caso de sucesso. */
    onConfirmAssign(choice: { userId: string; name: string }): void {
        this.detailStore.assignTicket(this.ticketId, choice.userId, () => {
            this.toastService.show(`${choice.name} agora é o responsável.`);
            this.historyStore.reload();
            this.assignDialogOpen.set(false);
        });
    }

    /** Formata o tamanho do arquivo em KB/MB para exibição. */
    formatSize(bytes: number): string {
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(0)} KB`;
        }
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    /**
     * Valida o arquivo escolhido (tamanho/tipo) pela política do back-end e, se válido, envia o upload.
     * Sem a política (carregando ou com falha), envia direto: o back-end valida e devolve o motivo.
     */
    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        input.value = '';
        if (!file) return;

        const policy = this.store.policy();
        if (policy && file.size > policy.maxFileSizeBytes) {
            this.fileValidationError.set(`O arquivo excede o tamanho máximo permitido de ${this.formatSize(policy.maxFileSizeBytes)}.`);
            return;
        }

        if (policy && !policy.allowedTypes.some(type => type.contentType === file.type)) {
            this.fileValidationError.set(`O tipo de arquivo "${file.type || 'desconhecido'}" não é suportado.`);
            return;
        }

        this.fileValidationError.set(null);
        this.store.upload(file, () => this.toastService.show('Anexo enviado.'));
    }

    /** Confirma e exclui o anexo selecionado. */
    onDeleteAttachment(attachmentId: string, fileName: string): void {
        this.confirmDialogService.confirm({
            title: `Excluir o anexo "${fileName}"?`,
            message: 'Essa ação não pode ser desfeita.',
            confirmLabel: 'Excluir',
            variant: 'danger'
        }).subscribe(confirmed => {
            if (confirmed) this.store.delete(attachmentId, () => this.toastService.show('Anexo excluído.'));
        });
    }
}
