import { Directive, ElementRef, inject, input } from '@angular/core';
import { trapTabWithin } from '../../utils/focus-trap.util';

/**
 * Prende o Tab dentro do elemento enquanto `appFocusTrap` for verdadeiro (ver {@link trapTabWithin}).
 * Usada pelo diálogo do sistema e pela gaveta do menu lateral; sem valor, fica sempre ativa.
 */
@Directive({
  selector: '[appFocusTrap]',
  host: { '(keydown)': 'onKeydown($event)' }
})
export class FocusTrapDirective {
  /** Elemento onde o Tab fica preso. */
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  /** Se o foco preso está ativo agora (ex.: só com a gaveta aberta); o atributo sem valor conta como ativo. */
  readonly appFocusTrap = input(true, { transform: (value: boolean | '') => value !== false });

  /** Repassa o Tab ao {@link trapTabWithin} quando ativa. */
  onKeydown(event: KeyboardEvent): void {
    if (this.appFocusTrap()) trapTabWithin(event, this.host.nativeElement);
  }
}
