import { Component, inject, signal, computed, OnInit, OnDestroy, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, map } from 'rxjs';
import { SessionService } from '../../../services/session.service';
import { UserMenuComponent } from '../../user-menu/user-menu.component';

/**
 * Qual item de tickets do menu lateral fica ativo para a URL: "Meus Tickets" na lista, no Novo
 * Ticket e no detalhe; "Monitorar Tickets" no Monitor e no detalhe aberto a partir dele
 * (`?from=monitor`, o mesmo sinal que o detalhe usa pro breadcrumb). O `routerLinkActive` não dá
 * conta disso: com `exact` apagava no detalhe, sem `exact` acendia junto com o Monitor.
 */
export function activeTicketsMenu(url: string): 'mine' | 'monitor' | null {
  const [path, query = ''] = url.split('?');
  const segments = path.split('/').filter(Boolean);
  if (segments[0] !== 'tickets') return null;
  if (segments[1] === 'monitorar') return 'monitor';
  if (segments.length === 2 && new URLSearchParams(query).get('from') === 'monitor') return 'monitor';
  return 'mine';
}

/** Layout da área autenticada (com navegação), usado pelas rotas protegidas. */
@Component({
    selector: 'app-main-layout',
    imports: [RouterModule, UserMenuComponent],
    templateUrl: './main-layout.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  /** URL atual, atualizada a cada navegação concluída. */
  private readonly currentUrl = toSignal(
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), map(e => (e as NavigationEnd).urlAfterRedirects)),
    { initialValue: this.router.url }
  );

  /** Item de tickets do menu lateral ativo para a URL atual — ver {@link activeTicketsMenu}. */
  protected readonly activeTicketsItem = computed(() => activeTicketsMenu(this.currentUrl()));

  /** Controla o menu retrátil (off-canvas) usado abaixo do breakpoint xl — ver main-layout.component.css. */
  readonly menuOpen = signal(false);

  private darkModeQuery: MediaQueryList | null = null;
  private readonly applyDarkModePreference = (query: MediaQueryList | MediaQueryListEvent): void => {
    document.documentElement.setAttribute('data-bs-theme', query.matches ? 'dark' : 'light');
  };

  /**
   * Área autenticada segue a preferência de tema do SO (claro/escuro) — login/registro ficam
   * sempre no visual de marca claro (ver AuthLayoutComponent), só a área de trabalho se adapta.
   * Sem toggle manual por enquanto: se o usuário pedir, dá pra persistir uma escolha explícita
   * depois sem precisar tocar nos tokens, já que tudo já está em `[data-bs-theme="dark"]`.
   */
  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.applyDarkModePreference(this.darkModeQuery);
    this.darkModeQuery.addEventListener('change', this.applyDarkModePreference);
  }

  /** Remove o listener de preferência de tema para não vazar entre navegações. */
  ngOnDestroy(): void {
    this.darkModeQuery?.removeEventListener('change', this.applyDarkModePreference);
  }

  /** Abre/fecha o menu lateral off-canvas. */
  toggleMenu(): void {
    this.menuOpen.update(open => !open);
  }

  /** Fecha o menu lateral off-canvas (ex.: ao navegar ou clicar no overlay). */
  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
