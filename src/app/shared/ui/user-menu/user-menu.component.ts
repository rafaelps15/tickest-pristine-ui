import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { LoginStore } from '../../application/login.store';
import { DropdownFixedPositionDirective } from '../directives/dropdown-fixed-position.directive';

/**
 * Menu do usuário logado (avatar com as iniciais + dropdown com acesso ao perfil e logout), fixado
 * no canto direito da navbar — o único lugar com "Sair". Extraído do `MainLayoutComponent` por ser uma peça autocontida — tem seu
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

  /**
   * Iniciais do usuário no avatar (ex.: "MS" pra Maria Silva) — antes era uma imagem genérica
   * "User" carregada de um serviço externo, igual pra todo mundo.
   */
  protected readonly initials = computed(() => {
    const user = this.sessionService.currentUser();
    if (!user) return '?';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  });

  /** Encerra a sessão do usuário logado. */
  logout(): void {
    this.loginStore.logout();
  }
}
