import { Component, ChangeDetectionStrategy, inject, input, output, viewChild, ElementRef, AfterViewInit, OnDestroy, HostListener, DOCUMENT } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

/** Tamanho máximo do motivo da reabertura — curto de propósito; o assunto continua na conversa do chamado. */
export const TICKET_REOPEN_REASON_MAX_LENGTH = 500;

/**
 * Modal de reabertura de um chamado inativo, com um motivo opcional que vira mensagem no ticket —
 * pra quem atende saber por que o chamado voltou (o ciclo de SLA recomeça na reabertura).
 * Reaproveitado por Meus Tickets e pelo detalhe do chamado. Componente burro: não injeta nenhuma
 * Store; quem o usa chama o Store certo a partir do evento `confirm`.
 */
@Component({
    selector: 'app-ticket-reopen-dialog',
    imports: [ReactiveFormsModule],
    templateUrl: './ticket-reopen-dialog.component.html',
    styleUrl: './ticket-reopen-dialog.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketReopenDialogComponent implements AfterViewInit, OnDestroy {
    private readonly fb = inject(FormBuilder);
    private readonly document = inject(DOCUMENT);

    /** Título do chamado, exibido no cabeçalho do modal para dar contexto. */
    readonly ticketTitle = input.required<string>();
    /** Indica se a reabertura está em andamento — trava o botão de confirmar e evita duplo-envio. */
    readonly saving = input(false);
    /** Mensagem de erro da última tentativa de reabrir, vinda da API. */
    readonly error = input<string | null>(null);

    /** Disparado ao confirmar, com o motivo sem espaços nas pontas (ou `null` quando ficou em branco). */
    readonly confirm = output<string | null>();
    /** Disparado ao desistir (Voltar, X, Esc ou clique fora). */
    readonly closed = output<void>();

    /** Limite exibido no contador do campo. */
    readonly maxLength = TICKET_REOPEN_REASON_MAX_LENGTH;

    /** Campo do motivo, focado ao abrir. */
    private readonly reasonField = viewChild<ElementRef<HTMLTextAreaElement>>('reasonField');
    /** Caixa do diálogo (`.modal-content`), onde o Tab fica preso enquanto o modal está aberto. */
    private readonly dialogBox = viewChild<ElementRef<HTMLElement>>('dialogBox');

    /** Formulário com o motivo opcional da reabertura. */
    readonly form = this.fb.group({
        reason: ['', [Validators.maxLength(TICKET_REOPEN_REASON_MAX_LENGTH)]]
    });

    /** Foca o campo do motivo ao abrir e trava a rolagem da página por trás, como os modais do Bootstrap. */
    ngAfterViewInit(): void {
        this.document.body.classList.add('modal-open');
        this.reasonField()?.nativeElement.focus();
    }

    /** Devolve a rolagem da página ao fechar o modal. */
    ngOnDestroy(): void {
        this.document.body.classList.remove('modal-open');
    }

    /** Prende o Tab/Shift+Tab dentro do diálogo: do último controle volta ao primeiro, e vice-versa. */
    onDialogKeydown(event: KeyboardEvent): void {
        if (event.key !== 'Tab') return;

        const focusable = Array.from(this.dialogBox()?.nativeElement.querySelectorAll<HTMLElement>(
            'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        ) ?? []);
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = this.document.activeElement;

        if (event.shiftKey && (active === first || !focusable.includes(active as HTMLElement))) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && (active === last || !focusable.includes(active as HTMLElement))) {
            event.preventDefault();
            first.focus();
        }
    }

    /** Esc desiste da reabertura. */
    @HostListener('document:keydown.escape')
    onEscapeKey(): void {
        if (!this.saving()) this.closed.emit();
    }

    /** Fecha ao clicar na área escura fora do modal — ignora cliques que começam dentro da caixa do diálogo. */
    onBackdropClick(event: MouseEvent): void {
        if (event.target === event.currentTarget && !this.saving()) this.closed.emit();
    }

    /** Valida o motivo e emite a confirmação — motivo em branco vira `null` (reabre sem mensagem). */
    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const reason = this.form.getRawValue().reason?.trim() ?? '';
        this.confirm.emit(reason.length > 0 ? reason : null);
    }
}
