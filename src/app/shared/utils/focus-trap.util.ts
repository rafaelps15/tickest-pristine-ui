/** Controles que entram no ciclo de Tab de uma área com foco preso (diálogo, painel modal, gaveta do menu). */
export const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Prende o Tab dentro de `container`: do último controle visível volta ao primeiro e, com Shift, do primeiro
 * vai ao último. Com o foco fora dos controles (no título com `tabindex="-1"`, na própria caixa ou fora
 * dela), o Tab vai ao primeiro e o Shift+Tab ao último. No meio, o Tab segue o caminho normal.
 */
export function trapTabWithin(event: KeyboardEvent, container: HTMLElement): void {
  if (event.key !== 'Tab') return;
  const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter(element => element.getClientRects().length > 0);
  if (focusables.length === 0) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = container.ownerDocument.activeElement as HTMLElement | null;
  const outside = !active || !focusables.includes(active);

  if (event.shiftKey && (active === first || outside)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || outside)) {
    event.preventDefault();
    first.focus();
  }
}
