import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ConfirmDialogService, ConfirmDialogVariant } from '../../services/confirm-dialog.service';
import { DialogComponent } from '../dialog/dialog.component';

/**
 * Modal de confirmação único e global (montado uma vez no `AppComponent`), controlado por
 * {@link ConfirmDialogService}. Qualquer tela que precisar confirmar uma ação destrutiva/sensível
 * injeta o serviço em vez de usar o `confirm()` nativo do navegador.
 *
 * Usa o mesmo `<app-dialog>` de todos os outros modais (antes era um `bootstrap.Modal` à parte,
 * com `h5` e outro comportamento de foco): mostrado com `@if` enquanto há um pedido, e qualquer
 * saída — botão, X, Esc ou clique fora — resolve o pedido. Montado depois do `router-outlet`, fica
 * por cima de um diálogo da tela (ex.: "Descartar as alterações?" sobre "Editar descrição"), e
 * só ele responde ao Esc enquanto está aberto.
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [DialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (options(); as opts) {
      <app-dialog [title]="opts.title" closeLabel="Fechar sem confirmar" (closed)="cancel()">
        <div dialogContent class="dialog-content">
          <div class="modal-body">
            <p class="mb-0">{{ opts.message }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-dialog-focus (click)="cancel()">
              {{ opts.cancelLabel ?? 'Cancelar' }}
            </button>
            <button type="button" class="btn" [class]="confirmButtonClass(opts.variant)" (click)="confirmAction()">
              {{ opts.confirmLabel ?? 'Confirmar' }}
            </button>
          </div>
        </div>
      </app-dialog>
    }
  `
})
export class ConfirmDialogComponent {
  private readonly confirmDialogService = inject(ConfirmDialogService);

  /** Pedido de confirmação atual, vindo do serviço. */
  protected readonly options = this.confirmDialogService.options;

  /** Classe do botão de confirmação, de acordo com a gravidade da ação. */
  protected confirmButtonClass(variant: ConfirmDialogVariant | undefined): string {
    return `btn btn-${variant ?? 'primary'}`;
  }

  /** Confirma a ação: resolve o pedido com `true` e fecha o modal. */
  protected confirmAction(): void {
    this.confirmDialogService.resolve(true);
  }

  /** Desiste (Cancelar, X, Esc ou clique fora): resolve o pedido com `false` e fecha o modal. */
  protected cancel(): void {
    this.confirmDialogService.resolve(false);
  }
}
