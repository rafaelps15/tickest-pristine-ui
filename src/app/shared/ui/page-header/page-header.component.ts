import { Component, ChangeDetectionStrategy, ElementRef, input, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Um nível da trilha acima do título da tela (ex.: "Administração"); com `link`, vira um link de volta. */
export interface PageCrumb {
  /** Texto exibido na trilha. */
  label: string;
  /** Rota de destino; sem ela o nível é só texto (não existe tela própria pra ele). */
  link?: string;
}

/**
 * Cabeçalho único de toda tela autenticada: trilha (num `<nav>` fora do título, pra o leitor de
 * tela não anunciar "Administração barra Funções" como nome da página), `<h1 class="h4">`,
 * subtítulo e as ações da tela à direita (`[pageActions]`). Antes cada tela tinha a sua variante
 * (`h4` cru, `pt-3`/`py-3`, sem `flex-wrap`) — achado da auditoria global de 2026-10-27.
 *
 * O título vem de `title`, e conteúdo marcado com `[pageTitle]` é acrescentado dentro do mesmo
 * `h1` (ex.: o nome do usuário destacado na saudação do Dashboard).
 */
@Component({
  selector: 'app-page-header',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'page-header' },
  template: `
    <div class="page-header-text">
      @if (crumbs().length > 0) {
        <nav aria-label="Trilha">
          <ol class="page-crumbs">
            @for (crumb of crumbs(); track crumb.label) {
              <li>
                @if (crumb.link) {
                  <a [routerLink]="crumb.link">{{ crumb.label }}</a>
                } @else {
                  {{ crumb.label }}
                }
              </li>
            }
          </ol>
        </nav>
      }
      <h1 #heading class="h4 fw-bold mb-1 page-title" tabindex="-1">{{ title() }}<ng-content select="[pageTitle]" /></h1>
      @if (subtitle()) {
        <p class="page-subtitle small mb-0">{{ subtitle() }}</p>
      }
    </div>
    <div class="page-actions">
      <ng-content select="[pageActions]" />
    </div>
  `
})
export class PageHeaderComponent {
  /** Nome da tela, exibido no `h1`. */
  readonly title = input('');
  /** Uma frase dizendo o que a tela mostra ou permite fazer. */
  readonly subtitle = input<string | null>(null);
  /** Níveis acima da tela atual, do mais geral pro mais próximo — a tela atual não entra (é o `h1`). */
  readonly crumbs = input<PageCrumb[]>([]);

  /** O `h1` da tela, que aceita foco programático. */
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  /** Move o foco pro título da tela (ex.: depois de fechar algo cujo gatilho sumiu). */
  focus(): void {
    this.heading().nativeElement.focus();
  }
}
