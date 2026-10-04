import { Component, ElementRef, inject, viewChild, effect, ChangeDetectionStrategy } from '@angular/core';
import { ConfirmDialogService, ConfirmDialogVariant } from '../../services/confirm-dialog.service';

/** Bootstrap é carregado via CDN (script global em index.html) — ver o mesmo padrão em main-layout.component.ts. */
declare const bootstrap: {
  Modal: new (element: Element) => { show(): void; hide(): void };
};

/**
 * Modal de confirmação único e global (montado uma vez no `AppComponent`), controlado por
 * {@link ConfirmDialogService}. Qualquer tela que precisar confirmar uma ação destrutiva/sensível
 * injeta o serviço em vez de usar o `confirm()` nativo do navegador.
 */
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal fade" tabindex="-1" aria-hidden="true" role="dialog" aria-labelledby="confirmDialogTitle" #modalEl>
      @if (options(); as opts) {
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="confirmDialogTitle">{{ opts.title }}</h5>
              <button type="button" class="btn-close" aria-label="Fechar" (click)="cancel()"></button>
            </div>
            <div class="modal-body">
              <p class="mb-0">{{ opts.message }}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" (click)="cancel()">
                {{ opts.cancelLabel ?? 'Cancelar' }}
              </button>
              <button type="button" class="btn" [class]="confirmButtonClass(opts.variant)" (click)="confirmAction()">
                {{ opts.confirmLabel ?? 'Confirmar' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ConfirmDialogComponent {
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly modalElementRef = viewChild.required<ElementRef<HTMLElement>>('modalEl');

  private modal: { show(): void; hide(): void } | null = null;
  private confirmed = false;

  protected readonly options = this.confirmDialogService.options;

  constructor() {
    // Mostra/esconde o modal do Bootstrap sempre que o serviço abrir ou limpar um pedido de confirmação.
    effect(() => {
      const opts = this.options();
      this.ensureModal();
      if (opts) {
        this.confirmed = false;
        this.modal?.show();
      }
    });
  }

  /** Classe do botão de confirmação, de acordo com a gravidade da ação. */
  protected confirmButtonClass(variant: ConfirmDialogVariant | undefined): string {
    return `btn-${variant ?? 'primary'}`;
  }

  protected confirmAction(): void {
    this.confirmed = true;
    this.modal?.hide();
  }

  protected cancel(): void {
    this.modal?.hide();
  }

  /**
   * Cria a instância do modal do Bootstrap na primeira vez e escuta `hidden.bs.modal` — assim o
   * pedido é resolvido independente de como o modal foi fechado (botão, X, backdrop ou Esc).
   */
  private ensureModal(): void {
    if (this.modal || typeof bootstrap === 'undefined') return;

    const element = this.modalElementRef().nativeElement;
    this.modal = new bootstrap.Modal(element);
    element.addEventListener('hidden.bs.modal', () => {
      this.confirmDialogService.resolve(this.confirmed);
    });
  }
}
