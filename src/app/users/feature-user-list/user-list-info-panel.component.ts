import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { UserSummary } from '../entities/user-summary';
import { getRoleColor } from '../../shared';
import { SidePanelDirective } from '../../shared/ui/directives/side-panel.directive';

/**
 * Painel "Informações do Usuário" de Usuários: mostra os mesmos dados já carregados na linha
 * selecionada da tabela (via `user`) — sem busca nova, a tabela já exibe todos os campos do
 * `UserSummary`. Os 3 atalhos (Editar cadastro, Atribuir funções, Ativar/Desativar) não duplicam
 * nenhuma lógica: emitem eventos que o componente pai trata chamando os mesmos métodos que o menu
 * de ações da linha já usa.
 */
@Component({
  selector: 'app-user-list-info-panel',
  imports: [DatePipe, SidePanelDirective],
  templateUrl: './user-list-info-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListInfoPanelComponent {
  readonly user = input.required<UserSummary>();
  /**
   * Se o painel está no modo overlay de tela cheia (abaixo de "lg"): vira um diálogo modal de
   * verdade (`aria-modal`) e prende o Tab dentro dele, já que a tabela por trás fica coberta.
   */
  readonly modal = input(false);
  /** Esconde o botão Ativar/Desativar — usado pra própria conta logada, que não pode se auto-(des)ativar. */
  readonly canToggleActive = input(true);
  readonly deactivating = input(false);
  readonly activating = input(false);
  /** Reenvio de convite em andamento para este usuário. */
  readonly resendingInvitation = input(false);

  readonly close = output<void>();
  readonly editClick = output<void>();
  readonly assignRolesClick = output<void>();
  readonly toggleActiveClick = output<void>();
  /** Pedido de reenvio do convite de ativação (conta ainda não ativada). */
  readonly resendInvitationClick = output<void>();

  /** Cor escolhida pra uma função — prévia só neste navegador (ver `shared/utils/role-colors.util.ts`); `null` cai no acento padrão. */
  roleColor(roleName: string): string | null {
    return getRoleColor(roleName);
  }
}
