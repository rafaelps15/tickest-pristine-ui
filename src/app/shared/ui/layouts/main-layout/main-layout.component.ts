import { Component, inject, signal, computed, OnInit, OnDestroy, PLATFORM_ID, ChangeDetectionStrategy, DestroyRef, ElementRef, Injector, afterNextRender, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationSkipped, Router, RouterModule } from '@angular/router';
import { filter, map, take } from 'rxjs';
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
    styleUrls: ['./main-layout.component.css'],
    host: { '(document:keydown.escape)': 'onEscape()' }
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  /** Plataforma: tema e breakpoint só são lidos no navegador (não no SSR). */
  private readonly platformId = inject(PLATFORM_ID);
  /** Sessão: usuário logado e permissões que decidem os itens do menu. */
  protected readonly sessionService = inject(SessionService);
  /** Router: URL atual e fim da navegação para o foco depois da gaveta. */
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

  /** Abaixo do breakpoint xl o menu vira gaveta (off-canvas); acima, fica sempre à vista. */
  readonly offCanvas = signal(false);

  /** Gaveta fechada abaixo do xl: fora da tela, não pode receber foco nem ser lida (vira `inert`). */
  protected readonly menuHidden = computed(() => this.offCanvas() && !this.menuOpen());

  /** Gaveta aberta abaixo do xl: o resto da página fica `inert`, pra o Tab não sair da gaveta. */
  protected readonly pageBehindMenu = computed(() => this.offCanvas() && this.menuOpen());

  /** Injetor usado pelo `afterNextRender` ao mover o foco depois de abrir ou fechar a gaveta. */
  private readonly injector = inject(Injector);

  /** Botão ☰ que abre a gaveta: recebe o foco de volta quando ela fecha. */
  private readonly menuOpener = viewChild.required<ElementRef<HTMLButtonElement>>('menuOpener');

  /** Botão "Fechar menu" da gaveta: recebe o foco quando ela abre. */
  private readonly menuCloser = viewChild.required<ElementRef<HTMLButtonElement>>('menuCloser');

  /** A gaveta (e a sidebar do desktop): onde o Tab fica preso enquanto ela está aberta. */
  private readonly menu = viewChild.required<ElementRef<HTMLElement>>('menu');

  /** Área do conteúdo da tela: recebe o foco depois de navegar por um item da gaveta. */
  private readonly mainContent = viewChild.required<ElementRef<HTMLElement>>('mainContent');

  /** Encerra a espera pela navegação de um item da gaveta quando o layout sai da tela. */
  private readonly destroyRef = inject(DestroyRef);

  /** Consulta do breakpoint da gaveta (abaixo do xl). */
  private offCanvasQuery: MediaQueryList | null = null;

  /** Atualiza o modo gaveta quando a janela cruza o breakpoint. */
  private readonly applyOffCanvas = (query: MediaQueryList | MediaQueryListEvent): void => {
    this.offCanvas.set(query.matches);
    // Passou pro layout de desktop com a gaveta aberta: fecha, senão a página ficaria inerte ao voltar.
    if (!query.matches) this.menuOpen.set(false);
  };

  /** Consulta da preferência de tema do sistema operacional; `null` fora do navegador. */
  private darkModeQuery: MediaQueryList | null = null;
  /** Aplica o tema claro ou escuro conforme a preferência do sistema operacional. */
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

    // Mesmo breakpoint do CSS da gaveta (main-layout.component.css).
    this.offCanvasQuery = window.matchMedia('(max-width: 1199.98px)');
    this.applyOffCanvas(this.offCanvasQuery);
    this.offCanvasQuery.addEventListener('change', this.applyOffCanvas);
  }

  /** Remove os listeners de tema e de breakpoint para não vazar entre navegações. */
  ngOnDestroy(): void {
    this.darkModeQuery?.removeEventListener('change', this.applyDarkModePreference);
    this.offCanvasQuery?.removeEventListener('change', this.applyOffCanvas);
  }

  /** Abre/fecha o menu lateral off-canvas; ao abrir, leva o foco pra dentro da gaveta. */
  toggleMenu(): void {
    if (this.menuOpen()) {
      this.closeMenuAndRestoreFocus();
      return;
    }
    this.menuOpen.set(true);
    // Depois da renderização: antes dela a gaveta ainda está `inert` e não aceita foco.
    afterNextRender(() => this.menuCloser().nativeElement.focus(), { injector: this.injector });
  }

  /** Fecha o menu lateral off-canvas (ex.: ao navegar por um item do menu). */
  closeMenu(): void {
    this.menuOpen.set(false);
  }

  /**
   * Clique na gaveta: um link (item ou logo) ou a lista de itens fecha a gaveta e, se ela estava aberta e foi
   * um link, leva o foco ao título da nova tela quando a navegação terminar. Sem isso, o foco ficava no
   * link, que some com a gaveta, e o Tab recomeçava do topo do documento.
   */
  onMenuClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    const link = target?.closest('a[href]');
    if (!link && !target?.closest('.menu-inner')) return;

    const fromDrawer = this.pageBehindMenu();
    this.closeMenu();
    if (!fromDrawer || !link) return;

    // Item da tela atual: o router ignora a navegação na hora, antes desta escuta começar; foca já.
    const sameUrl = this.router.serializeUrl(this.router.parseUrl(link.getAttribute('href') ?? '')) === this.router.url;
    if (sameUrl) {
      afterNextRender(() => this.focusMainContent(), { injector: this.injector });
    } else {
      this.focusContentAfterNavigation();
    }
  }

  /**
   * Com a gaveta aberta, o Tab dá a volta dentro dela (do último item ao primeiro e vice-versa): a página
   * atrás já está `inert`, mas os toasts e o diálogo global ficam fora do layout e o Tab chegaria neles.
   */
  onMenuKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !this.pageBehindMenu()) return;
    const focusables = Array.from(this.menu().nativeElement.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
      .filter(el => el.getClientRects().length > 0);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /** Espera a navegação do item terminar (ou ser ignorada ou falhar) e, depois que a tela é desenhada, foca o conteúdo. */
  private focusContentAfterNavigation(): void {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd || e instanceof NavigationSkipped || e instanceof NavigationCancel || e instanceof NavigationError),
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => afterNextRender(() => this.focusMainContent(), { injector: this.injector }));
  }

  /** Põe o foco no título da tela (o `h1` do `page-header`); sem título ainda, no começo do conteúdo. */
  private focusMainContent(): void {
    const content = this.mainContent().nativeElement;
    const target = content.querySelector<HTMLElement>('h1') ?? content;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus();
  }

  /** Fecha a gaveta e devolve o foco ao ☰ que a abriu (botão "Fechar menu", overlay e Esc). */
  closeMenuAndRestoreFocus(): void {
    if (!this.menuOpen()) return;
    this.menuOpen.set(false);
    afterNextRender(() => this.menuOpener().nativeElement.focus(), { injector: this.injector });
  }

  /** Esc fecha a gaveta aberta, esteja o foco onde estiver. */
  onEscape(): void {
    if (this.pageBehindMenu()) this.closeMenuAndRestoreFocus();
  }
}
