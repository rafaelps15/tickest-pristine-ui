import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { UserSummary, UserRoleSummary } from '../entities/user-summary';
import { visibleRoles as sharedVisibleRoles, hiddenRolesCount as sharedHiddenRolesCount, hiddenRolesNames as sharedHiddenRolesNames } from '../../shared';

/**
 * Painel "Informações do Usuário" de Usuários: mostra os mesmos dados já carregados na linha
 * selecionada da tabela (via `user`) — sem busca nova, a tabela já exibe todos os campos do
 * `UserSummary`. Os 3 atalhos (Editar cadastro, Atribuir funções, Ativar/Desativar) não duplicam
 * nenhuma lógica: emitem eventos que o componente pai trata chamando os mesmos métodos que o menu
 * de ações da linha já usa.
 */
@Component({
  selector: 'app-user-list-info-panel',
  imports: [DatePipe],
  templateUrl: './user-list-info-panel.component.html',
  styleUrl: './user-list-info-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListInfoPanelComponent {
  readonly user = input.required<UserSummary>();
  /** Esconde o botão Ativar/Desativar — usado pra própria conta logada, que não pode se auto-(des)ativar. */
  readonly canToggleActive = input(true);
  readonly deactivating = input(false);
  readonly activating = input(false);

  readonly close = output<void>();
  readonly editClick = output<void>();
  readonly assignRolesClick = output<void>();
  readonly toggleActiveClick = output<void>();

  /** Até 2 funções exibidas como badge; o restante vira um badge "+N" (mesma regra da tabela). */
  visibleRoles(user: UserSummary): UserRoleSummary[] {
    return sharedVisibleRoles(user.roles);
  }

  hiddenRolesCount(user: UserSummary): number {
    return sharedHiddenRolesCount(user.roles);
  }

  hiddenRolesNames(user: UserSummary): string {
    return sharedHiddenRolesNames(user.roles);
  }
}
