import { Component, ChangeDetectionStrategy, inject, input, output, effect, viewChild, ElementRef, AfterViewInit, OnDestroy, HostListener, DOCUMENT } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ConfirmDialogService } from '../../../shared';

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
    imports: [ReactiveFormsModule],
    templateUrl: './ticket-edit-dialog.component.html',
    styleUrl: './ticket-edit-dialog.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketEditDialogComponent implements AfterViewInit, OnDestroy {
    private readonly fb = inject(FormBuilder);
    private readonly confirmDialogService = inject(ConfirmDialogService);
    private readonly document = inject(DOCUMENT);

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

    /** Campo de descrição, focado ao abrir o modal. */
    private readonly descriptionField = viewChild<ElementRef<HTMLTextAreaElement>>('descriptionField');
    /** Caixa do diálogo (`.modal-content`), onde o Tab fica preso enquanto o modal está aberto. */
    private readonly dialogBox = viewChild<ElementRef<HTMLElement>>('dialogBox');

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

    /** Foca o campo de descrição ao abrir e trava a rolagem da página por trás, como os modais do Bootstrap. */
    ngAfterViewInit(): void {
        this.document.body.classList.add('modal-open');
        this.descriptionField()?.nativeElement.focus();
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

    /** Verifica se o campo de descrição está inválido e já foi tocado, pra só mostrar o erro depois da primeira interação. */
    isDescriptionInvalid(): boolean {
        const control = this.form.controls.description;
        return control.invalid && (control.dirty || control.touched);
    }

    /**
     * Esc fecha o modal (com confirmação se houver alteração não salva), igual ao painel de informações do Monitor.
     * Ignorado enquanto a confirmação de descarte está aberta — ali o Esc só fecha a própria confirmação.
     */
    @HostListener('document:keydown.escape')
    onEscapeKey(): void {
        if (this.confirmDialogService.options()) return;
        this.requestClose();
    }

    /** Fecha ao clicar na área escura fora do modal — ignora cliques que começam dentro da caixa do diálogo. */
    onBackdropClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) this.requestClose();
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
