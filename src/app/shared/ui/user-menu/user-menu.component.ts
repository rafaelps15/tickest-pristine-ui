import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { SessionService } from '../../services/session.service';
import { AuthDataService } from '../../infrastructure/auth.data.service';
import { DropdownFixedPositionDirective } from '../directives/dropdown-fixed-position.directive';

/**
 * Menu do usuário logado (avatar + dropdown com acesso ao perfil e logout), fixado no canto
 * direito da navbar. Extraído do `MainLayoutComponent` por ser uma peça autocontida — tem seu
 * próprio estado de sessão e ação de logout, sem depender de mais nada do layout ao redor.
 */
@Component({
  selector: 'app-user-menu',
  imports: [RouterLink, DropdownFixedPositionDirective],
  templateUrl: './user-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './user-menu.component.css'
})
export class UserMenuComponent {
  protected readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);
  private readonly authDataService = inject(AuthDataService);

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
