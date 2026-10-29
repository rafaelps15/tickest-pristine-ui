import { Component, ChangeDetectionStrategy, inject, input, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DialogComponent } from '../../../shared/ui/dialog/dialog.component';

/** Tamanho máximo do motivo da reabertura — curto de propósito; o assunto continua na conversa do chamado. */
export const TICKET_REOPEN_REASON_MAX_LENGTH = 500;

/**
 * Modal de reabertura de um chamado inativo, com um motivo opcional que vira mensagem no ticket —
 * pra quem atende saber por que o chamado voltou (o ciclo de SLA recomeça na reabertura).
 * Reaproveitado por Meus Tickets e pelo detalhe do chamado. Componente burro: não injeta nenhuma
 * Store; quem o usa chama o Store certo a partir do evento `confirm`. Backdrop, foco, Tab preso,
 * Esc e clique fora vêm de `<app-dialog>`, travados enquanto `saving`.
 */
@Component({
    selector: 'app-ticket-reopen-dialog',
    imports: [ReactiveFormsModule, DialogComponent],
    templateUrl: './ticket-reopen-dialog.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketReopenDialogComponent {
    private readonly fb = inject(FormBuilder);

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

    /** Formulário com o motivo opcional da reabertura. */
    readonly form = this.fb.group({
        reason: ['', [Validators.maxLength(TICKET_REOPEN_REASON_MAX_LENGTH)]]
    });

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
