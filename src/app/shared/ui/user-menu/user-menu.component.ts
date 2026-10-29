import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { LoginStore } from '../../application/login.store';
import { DropdownFixedPositionDirective } from '../directives/dropdown-fixed-position.directive';

/**
 * Menu do usuário logado (avatar + dropdown com acesso ao perfil e logout), fixado no canto
 * direito da navbar. Extraído do `MainLayoutComponent` por ser uma peça autocontida — tem seu
 * próprio estado de sessão, delegando o encerramento dela ao `LoginStore` (dono do ciclo de
 * vida da sessão), em vez de falar com `AuthDataService` diretamente.
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
  private readonly loginStore = inject(LoginStore);

  /** Nome exibido no menu — nome e sobrenome do usuário logado, com um rótulo genérico até o perfil carregar. */
  protected readonly displayName = computed(() => {
    const user = this.sessionService.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : 'Usuário';
  });

  /** Encerra a sessão do usuário logado. */
  logout(): void {
    this.loginStore.logout();
  }
}
