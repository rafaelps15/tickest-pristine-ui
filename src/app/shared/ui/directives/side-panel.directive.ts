import { Directive, ElementRef, HostListener, afterRenderEffect, inject, input, untracked } from '@angular/core';

/** Controles que entram no ciclo de Tab do painel no modo modal. */
const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Painel lateral "Informações do X" (Usuários, Monitorar Tickets): região rotulada ao lado da
 * tabela em telas largas, diálogo modal de tela cheia abaixo de "lg". Cuida da parte de
 * acessibilidade que as duas telas tinham copiada, e que já precisou ser corrigida em sincronia:
 *
 * - `role="region"` ou `role="dialog"` + `aria-modal`, conforme `sidePanelModal`;
 * - no modo modal, foco no elemento marcado com `data-side-panel-title` ao abrir e a cada troca
 *   de item — o gatilho é a chave passada em `appSidePanel` (o id), nunca o objeto: a lista recria
 *   os objetos a cada recarga, e reagir a isso roubava o foco da busca no meio da digitação. Fora
 *   do modo modal o foco fica onde está (na linha que abriu): o painel vem depois da tabela no DOM,
 *   e puxar o foco pra ele fazia quem navega por teclado perder o lugar na tabela — quem abriu já
 *   ouve o `aria-expanded` do botão mudar;
 * - no modo modal, Tab/Shift+Tab circulam só entre os controles do painel.
 *
 * O título precisa de `tabindex="-1"` pra aceitar foco programático.
 */
@Directive({
  selector: '[appSidePanel]',
  host: {
    '[attr.role]': "sidePanelModal() ? 'dialog' : 'region'",
    '[attr.aria-modal]': 'sidePanelModal() || null'
  }
})
export class SidePanelDirective {
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  /** Chave do item exibido (ex.: id do usuário/ticket) — no modo modal, mudar a chave move o foco pro título. */
  readonly appSidePanel = input.required<string>();
  /** Se o painel está no modo overlay de tela cheia: vira diálogo modal e prende o Tab dentro dele. */
  readonly sidePanelModal = input(false);

  constructor() {
    afterRenderEffect(() => {
      this.appSidePanel();
      // Lido sem rastrear: redimensionar a janela pro modo overlay não deve, por si só, puxar o foco.
      if (untracked(() => this.sidePanelModal())) this.titleElement()?.focus();
    });
  }

  /** No modo modal, Tab/Shift+Tab circulam só entre os controles do painel, sem escapar pra tabela coberta por trás. */
  @HostListener('keydown.tab', ['$event'])
  @HostListener('keydown.shift.tab', ['$event'])
  onTab(event: Event): void {
    if (!this.sidePanelModal()) return;

    const panel = this.host.nativeElement;
    const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const backwards = (event as KeyboardEvent).shiftKey;
    const active = document.activeElement;

    if (backwards && (active === first || active === this.titleElement() || !panel.contains(active))) {
      last.focus();
      event.preventDefault();
    } else if (!backwards && active === last) {
      first.focus();
      event.preventDefault();
    }
  }

  /** Título do painel, que recebe o foco programático. */
  private titleElement(): HTMLElement | null {
    return this.host.nativeElement.querySelector<HTMLElement>('[data-side-panel-title]');
  }
}
