import { Directive, ElementRef, AfterViewInit, inject } from '@angular/core';

/** Bootstrap é carregado via CDN (script global em index.html) — ver o mesmo padrão em main-layout.component.ts. */
declare const bootstrap: {
  Dropdown: new (element: Element, options?: Record<string, unknown>) => unknown;
};

/**
 * Força o dropdown do Bootstrap a se posicionar com estratégia `fixed` (relativa à viewport).
 * Sem isso, um dropdown dentro de um container com `overflow` (ex.: `.table-responsive`) fica
 * cortado pelo scroll do container — mesmo problema e correção já usados no dropdown do perfil
 * em `MainLayoutComponent`, extraído aqui como diretiva para reaproveitar em qualquer tabela.
 */
@Directive({
  selector: '[appDropdownFixedPosition]'
})
export class DropdownFixedPositionDirective implements AfterViewInit {
  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);

  ngAfterViewInit(): void {
    if (typeof bootstrap !== 'undefined') {
      new bootstrap.Dropdown(this.elementRef.nativeElement, {
        popperConfig: (defaultConfig: Record<string, unknown>) => ({ ...defaultConfig, strategy: 'fixed' })
      });
    }
  }
}
