import { Component, inject, signal, OnInit, OnDestroy, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SessionService } from '../../../services/session.service';
import { UserMenuComponent } from '../../user-menu/user-menu.component';

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

  toggleMenu(): void {
    this.menuOpen.update(open => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
