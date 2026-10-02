import { Component, inject, signal, ElementRef, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { SessionService } from '../../../services/session.service';
import { AuthDataService } from '../../../infrastructure/auth.data.service';

/** Bootstrap é carregado via CDN (script global em index.html), não como pacote npm — ver o mesmo padrão em outras partes do app que usam `data-bs-*`. */
declare const bootstrap: {
  Dropdown: new (element: Element, options?: Record<string, unknown>) => unknown;
};

/** Layout da área autenticada (com navegação e logout), usado pelas rotas protegidas. */
@Component({
    selector: 'app-main-layout',
    imports: [RouterModule],
    templateUrl: './main-layout.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements AfterViewInit {
  private readonly router = inject(Router);
  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly authDataService = inject(AuthDataService);
  protected readonly sessionService = inject(SessionService);

  /** Controla o menu retrátil (off-canvas) usado abaixo do breakpoint xl — ver main-layout.component.css. */
  readonly menuOpen = signal(false);

  /**
   * Força o dropdown do perfil a se posicionar com estratégia `fixed` (relativa à viewport),
   * em vez de `absolute` (o padrão do Bootstrap). Isso evita que ele saia do lugar quando algum
   * ancestral no layout tem `backdrop-filter`/`filter`/`transform` — propriedades que criam um
   * novo "containing block" que o Popper.js nem sempre detecta corretamente.
   */
  ngAfterViewInit(): void {
    const toggle = this.elementRef.nativeElement.querySelector<HTMLElement>('.dropdown-toggle');
    if (toggle && typeof bootstrap !== 'undefined') {
      new bootstrap.Dropdown(toggle, {
        popperConfig: (defaultConfig: Record<string, unknown>) => ({ ...defaultConfig, strategy: 'fixed' })
      });
    }
  }

  toggleMenu(): void {
    this.menuOpen.update(open => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  /** Revoga o refresh token no servidor (se houver) e, com sucesso ou erro, encerra a sessão e volta para a tela de login. */
  logout(): void {
    const refreshToken = this.sessionService.refreshToken();
    const finishLogout = () => {
      this.sessionService.clearSession();
      this.router.navigate(['/login']);
    };

    if (!refreshToken) {
      finishLogout();
      return;
    }

    this.authDataService.logout(refreshToken).pipe(
      finalize(finishLogout)
    ).subscribe({ error: () => {} });
  }
}
