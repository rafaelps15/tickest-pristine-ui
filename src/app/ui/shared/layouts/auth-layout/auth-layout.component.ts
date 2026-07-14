import { Component, ChangeDetectionStrategy } from '@angular/core';

import { RouterModule } from '@angular/router';

/** Layout para as páginas de autenticação (Login, Registro, etc). */
@Component({
    selector: 'app-auth-layout',
    imports: [RouterModule],
    template: `
    <div class="auth-layout-container">
      <div class="auth-layout-card shadow-lg border-0">
        <div class="auth-layout-header">
          <div class="brand-wrapper d-flex justify-content-center align-items-center mb-5">
            <img src="/img/logo/logo_letra.png" alt="Logo" style="width: 48px; height: auto;">
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
      background: #f4f7f9; /* Fundo sóbrio e limpo */
      background-image: radial-gradient(#d1d9e6 1px, transparent 1px);
      background-size: 40px 40px;
      padding: 1.5rem;
    }
    .auth-layout-card {
      width: 100%;
      max-width: 520px;
      background: #ffffff;
      border-radius: 1.25rem;
      padding: 3.5rem 3rem;
    }
    .brand-text {
      font-size: 3rem;
      letter-spacing: -2px;
      font-family: 'Montserrat', sans-serif;
      text-transform: lowercase;
      line-height: 1;
      font-weight: 700;
    }
  `]
})
export class AuthLayoutComponent {}
