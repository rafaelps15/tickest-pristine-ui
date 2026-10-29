import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

/**
 * Pilha de toasts única e global (montada uma vez no `AppComponent`), controlada por
 * {@link ToastService}. Confirma visualmente ações fora de modal (desativar/reativar usuário,
 * atribuir funções etc.) sem bloquear a tela.
 */
@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 1080;">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast show align-items-center border-0 mb-2" [class]="'text-bg-' + toast.variant" role="status" aria-live="polite">
          <div class="d-flex">
            <div class="toast-body">{{ toast.message }}</div>
            @if (toast.action; as action) {
              <button type="button" class="btn btn-sm btn-light toast-action my-auto me-1 flex-shrink-0" (click)="toastService.runAction(toast.id)">{{ action.label }}</button>
            }
            <button type="button" class="btn-close btn-close-white me-2 m-auto" aria-label="Fechar" (click)="toastService.dismiss(toast.id)"></button>
          </div>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
}
