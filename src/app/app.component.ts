import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationSkipped, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { ConfirmDialogComponent } from './shared/ui/confirm-dialog/confirm-dialog.component';
import { ToastContainerComponent } from './shared/ui/toast-container/toast-container.component';
import { SessionRetryNoticeComponent } from './shared/ui/session-retry-notice/session-retry-notice.component';
import { CurrentUserService } from './shared/services/current-user.service';

/**
 * Componente host das rotas — também monta o modal de confirmação, a pilha de toasts globais e o aviso
 * de nova tentativa da primeira carga do usuário logado.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConfirmDialogComponent, ToastContainerComponent, SessionRetryNoticeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <router-outlet />
    @if (navigating() && currentUserService.retryingFirstLoad()) {
      <app-session-retry-notice />
    }
    <app-confirm-dialog />
    <app-toast-container />
  `
})
export class AppComponent {
  /** Carregamento do usuário logado, que diz quando a primeira carga de GET /users/me está numa nova tentativa. */
  protected readonly currentUserService = inject(CurrentUserService);

  /**
   * Uma navegação está esperando (o guard aguarda GET /users/me): só aí a tela fica vazia. Junto com
   * `retryingFirstLoad`, o aviso não aparece nas recargas de fundo, com ou sem navegação pendente.
   */
  protected readonly navigating = toSignal(
    inject(Router).events.pipe(
      filter(e => e instanceof NavigationStart || e instanceof NavigationEnd || e instanceof NavigationCancel
        || e instanceof NavigationError || e instanceof NavigationSkipped),
      map(e => e instanceof NavigationStart)
    ),
    { initialValue: false }
  );
}
