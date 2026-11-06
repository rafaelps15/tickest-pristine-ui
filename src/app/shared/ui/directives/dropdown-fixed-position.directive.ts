import { Directive, ElementRef, AfterViewInit, OnDestroy, inject } from '@angular/core';

/** Bootstrap é carregado via CDN (script global em index.html). */
declare const bootstrap: {
  Dropdown: new (element: Element, options?: Record<string, unknown>) => { dispose(): void };
};

/**
 * Força o dropdown do Bootstrap a se posicionar com estratégia `fixed` (relativa à viewport).
 * Sem isso, um dropdown dentro de um container com `overflow` (ex.: `.table-responsive`) fica
 * cortado pelo scroll do container. Usada pelo menu do usuário e pelas ações da linha das tabelas.
 */
@Directive({
  selector: '[appDropdownFixedPosition]'
})
export class DropdownFixedPositionDirective implements AfterViewInit, OnDestroy {
  /** Gatilho do dropdown, onde o Dropdown do Bootstrap é criado. */
  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);
  /** Dropdown do Bootstrap criado para o elemento, ou `null` sem o Bootstrap carregado. */
  private dropdown: { dispose(): void } | null = null;

  /** Cria o Dropdown do Bootstrap com a estratégia `fixed`, se o Bootstrap estiver carregado. */
  ngAfterViewInit(): void {
    if (typeof bootstrap !== 'undefined') {
      this.dropdown = new bootstrap.Dropdown(this.elementRef.nativeElement, {
        popperConfig: (defaultConfig: Record<string, unknown>) => ({ ...defaultConfig, strategy: 'fixed' })
      });
    }
  }

  /** Descarta o Dropdown (ouvintes e Popper), que senão ficaria preso ao elemento removido da tela. */
  ngOnDestroy(): void {
    this.dropdown?.dispose();
    this.dropdown = null;
  }
}
