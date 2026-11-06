import { Component, ChangeDetectionStrategy, input } from '@angular/core';

/**
 * Aviso da primeira carga do usuário logado em nova tentativa (A-42): enquanto GET /users/me falha por
 * rede, 429 ou 5xx e é repetido (cerca de 15s antes da tela de sessão indisponível), a tela ficava vazia
 * sem dizer nada. Fica sempre no shell, que o liga só durante uma navegação à espera do guard; a região
 * viva existe desde o início e só o conteúdo muda, para o leitor de tela anunciar o aviso.
 */
@Component({
  selector: 'app-session-retry-notice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.is-active]': 'active()' },
  template: `
    <!-- A região viva existe sempre e só o conteúdo muda: criada junto com o texto, o leitor de tela não anuncia. -->
    <div role="status">
      @if (active()) {
        <div class="session-retry-card">
          <span class="spinner-border text-primary" aria-hidden="true"></span>
          <p class="fw-semibold mb-1">Conectando ao servidor…</p>
          <p class="text-muted small mb-0">A primeira tentativa falhou. Tentando de novo, isso pode levar alguns segundos.</p>
        </div>
      }
    </div>
  `,
  styles: `
    :host(.is-active) {
      position: fixed;
      inset: 0;
      z-index: 1050;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: var(--tk-page-bg, #f5f5f9);
    }

    .session-retry-card {
      max-width: 24rem;
      padding: 2rem 1.5rem;
      border-radius: var(--tk-radius-lg);
      background: var(--tk-surface, #fff);
      box-shadow: var(--tk-shadow-sm);
      text-align: center;
    }

    .spinner-border {
      margin-bottom: 1rem;
    }
  `
})
export class SessionRetryNoticeComponent {
  /** Liga o aviso e cobre a tela: uma navegação espera a nova tentativa da primeira carga do usuário. */
  readonly active = input(false);
}
