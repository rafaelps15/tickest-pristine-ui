import { Component, ChangeDetectionStrategy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

/** Layout para as páginas de autenticação (Login, Registro, etc). */
@Component({
    selector: 'app-auth-layout',
    imports: [RouterModule],
    template: `
    <div class="auth-layout-container">
      <div class="auth-layout-card border-0">
        <div class="auth-layout-header">
          <div class="brand-wrapper d-flex justify-content-center align-items-center mb-5">
            <img src="/img/logo/logo_letra.png" alt="Tickest" style="width: 48px; height: auto;">
            <span class="ms-1 text-primary brand-text">ickest</span>
          </div>
        </div>
        <div class="auth-layout-body">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [`
    .auth-layout-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      /*
       * Único gradiente de fundo do sistema — reservado pro momento de entrada (ver DESIGN.md).
       * Dois brilhos suaves em índigo (o próprio acento da marca, não uma cor nova) dão ao vidro
       * da frente algo de verdade pra desfocar — sem eles, o blur não tem nada pra revelar.
       */
      background:
        radial-gradient(circle at 15% 20%, rgba(var(--tk-primary-rgb), 0.35) 0%, transparent 45%),
        radial-gradient(circle at 85% 80%, rgba(var(--tk-primary-rgb), 0.28) 0%, transparent 45%),
        linear-gradient(135deg, var(--tk-page-bg) 0%, var(--tk-border) 100%);
      padding: 1.5rem;
    }
    .auth-layout-card {
      width: 100%;
      max-width: 520px;
      /* Vidro de verdade: fundo translúcido + blur sobre o gradiente — único lugar do sistema com esse efeito. */
      background: rgba(255, 255, 255, 0.72);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: var(--tk-radius-lg);
      padding: 3.5rem 3rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      animation: auth-card-in 350ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    /* Em telas bem estreitas, o padding generoso do card deixa pouco espaço de verdade pro formulário. */
    @media (max-width: 480px) {
      .auth-layout-card {
        padding: 2rem 1.5rem;
      }
    }
    .brand-wrapper img {
      /* O logo some no fundo sem nenhuma profundidade própria — um brilho sutil na cor da marca resolve. */
      filter: drop-shadow(0 0 24px rgba(var(--tk-primary-rgb), 0.35));
    }
    .brand-text {
      font-size: 3rem;
      letter-spacing: -2px;
      font-family: 'Sora', sans-serif;
      text-transform: lowercase;
      line-height: 1;
      font-weight: 700;
      color: var(--tk-primary-darker);
    }
    @keyframes auth-card-in {
      from { opacity: 0; transform: translateY(12px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `]
})
export class AuthLayoutComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * Força sempre o tema claro — login/registro mantêm o visual de marca fixo independente da
   * preferência de SO; só a área autenticada (MainLayoutComponent) acompanha o dark mode.
   */
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.setAttribute('data-bs-theme', 'light');
    }
  }
}
