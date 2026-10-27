import { Component, ChangeDetectionStrategy, inject, input, output, effect } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ConfirmDialogService } from '../../../shared';
import { DialogComponent } from '../../../shared/ui/dialog/dialog.component';

/** Dados mínimos de um ticket para editar a descrição — o suficiente tanto em `Ticket` quanto em `TicketDetail`. */
export interface TicketEditDialogTicket {
    /** Id do ticket editado. */
    id: string;
    /** Título exibido no cabeçalho do modal, para dar contexto. */
    title: string;
    /** Descrição atual, que pré-carrega o campo de edição. */
    description: string;
}

/**
 * Modal de edição da descrição de um ticket — único lugar da aplicação que oferece essa edição,
 * reaproveitado por Meus Tickets e pelo detalhe do chamado. Componente burro: não injeta nenhuma
 * Store, só o `ConfirmDialogService` (serviço de UI compartilhado, não é regra de negócio) para o
 * aviso de alteração não salva. Quem o usa decide a permissão/estado que libera "Editar" e chama o
 * Store certo (`TicketsStore`/`TicketDetailStore`) a partir do evento `save`.
 */
@Component({
    selector: 'app-ticket-edit-dialog',
    imports: [ReactiveFormsModule, DialogComponent],
    templateUrl: './ticket-edit-dialog.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketEditDialogComponent {
    private readonly fb = inject(FormBuilder);
    private readonly confirmDialogService = inject(ConfirmDialogService);

    /** Ticket cuja descrição está sendo editada. */
    readonly ticket = input.required<TicketEditDialogTicket>();
    /** Indica se o salvamento está em andamento — trava o botão "Salvar" e evita duplo-envio. */
    readonly saving = input(false);
    /** Mensagem de erro da última tentativa de salvar, vinda da API. */
    readonly error = input<string | null>(null);

    /** Disparado ao confirmar o formulário válido, com a nova descrição já sem espaços nas pontas. */
    readonly save = output<string>();
    /** Disparado ao fechar o modal (sem alteração pendente, ou após confirmar descartá-la). */
    readonly closed = output<void>();

    /** Formulário com a descrição editada — mesmas regras de tamanho do back-end (10 a 500 caracteres). */
    readonly form = this.fb.group({
        description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });

    constructor() {
        // Recarrega o formulário com a descrição atual sempre que o ticket editado mudar — cobre
        // tanto a abertura inicial quanto um eventual reaproveitamento da mesma instância.
        effect(() => {
            this.form.reset({ description: this.ticket().description });
        });
    }

    /** Verifica se o campo de descrição está inválido e já foi tocado, pra só mostrar o erro depois da primeira interação. */
    isDescriptionInvalid(): boolean {
        const control = this.form.controls.description;
        return control.invalid && (control.dirty || control.touched);
    }

    /**
     * Pedido de fechar vindo de `<app-dialog>` (X, Esc, clique fora) — passa pela mesma confirmação
     * do "Cancelar". Ignorado enquanto a confirmação de descarte está aberta: ali o Esc só fecha a
     * própria confirmação.
     */
    onDialogClose(): void {
        if (this.confirmDialogService.options()) return;
        this.requestClose();
    }

    /** Valida o formulário e emite a nova descrição sem espaços nas pontas. */
    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.save.emit(this.form.getRawValue().description!.trim());
    }

    /** Fecha pelo botão "Cancelar", pelo X ou pelo clique no backdrop — sempre passando pela mesma confirmação. */
    requestClose(): void {
        if (!this.form.dirty) {
            this.closed.emit();
            return;
        }

        this.confirmDialogService.confirm({
            title: 'Descartar as alterações?',
            message: 'O texto editado ainda não foi salvo e vai se perder.',
            confirmLabel: 'Descartar',
            variant: 'danger'
        }).subscribe(confirmed => {
            if (confirmed) this.closed.emit();
        });
    }
}
