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
    <!--
      A .modal-dialog fica SEMPRE no DOM: o bootstrap.Modal guarda a referência dela no construtor
      (criado antes do primeiro pedido) e quebra todo show() com "Illegal invocation" se ela não
      existir ainda. Só o conteúdo depende do pedido atual.
    -->
    <div class="modal fade" tabindex="-1" aria-hidden="true" role="dialog" aria-labelledby="confirmDialogTitle" #modalEl>
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          @if (options(); as opts) {
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
          }
        </div>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
  private readonly confirmDialogService = inject(ConfirmDialogService);
  /** Elemento raiz `.modal`, onde a instância do Bootstrap é criada. */
  private readonly modalElementRef = viewChild.required<ElementRef<HTMLElement>>('modalEl');

  /** Instância do `bootstrap.Modal` ligada a {@link modalElement}. */
  private modal: { show(): void; hide(): void } | null = null;
  /** Elemento ao qual {@link modal} está ligado — pra recriar a instância se o Angular trocar o elemento. */
  private modalElement: HTMLElement | null = null;
  /** Se o modal foi fechado pelo botão de confirmação (e não por cancelar/X/Esc/backdrop). */
  private confirmed = false;

  /** Pedido de confirmação atual, vindo do serviço. */
  protected readonly options = this.confirmDialogService.options;

  constructor() {
    // Mostra/esconde o modal do Bootstrap sempre que o serviço abrir ou limpar um pedido de confirmação.
    effect(() => {
      const opts = this.options();
      if (opts) {
        this.confirmed = false;
        this.ensureModal()?.show();
      }
    });
  }

  /** Classe do botão de confirmação, de acordo com a gravidade da ação. */
  protected confirmButtonClass(variant: ConfirmDialogVariant | undefined): string {
    return `btn-${variant ?? 'primary'}`;
  }

  /** Confirma a ação e fecha o modal — o pedido é resolvido com `true` no `hidden.bs.modal`. */
  protected confirmAction(): void {
    this.confirmed = true;
    this.modal?.hide();
  }

  /** Fecha o modal sem confirmar — o pedido é resolvido com `false` no `hidden.bs.modal`. */
  protected cancel(): void {
    this.modal?.hide();
  }

  /**
   * Devolve a instância do modal do Bootstrap ligada ao elemento que está no DOM agora, criando-a
   * (e escutando `hidden.bs.modal`) na primeira abertura — assim o pedido é resolvido independente
   * de como o modal foi fechado (botão, X, backdrop ou Esc). Criar só ao abrir, e recriar se o
   * elemento mudou, evita ficar preso a um elemento descartado pela hidratação do SSR (o Bootstrap
   * anexava essa cópia vazia ao `body` e a confirmação nunca aparecia).
   */
  private ensureModal(): { show(): void; hide(): void } | null {
    if (typeof bootstrap === 'undefined') return null;

    const element = this.modalElementRef().nativeElement;
    if (this.modalElement !== element) {
      this.modalElement = element;
      this.modal = new bootstrap.Modal(element);
      element.addEventListener('hidden.bs.modal', () => {
        this.confirmDialogService.resolve(this.confirmed);
      });
    }
    return this.modal;
  }
}
