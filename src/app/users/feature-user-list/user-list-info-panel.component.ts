import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { UserSummary } from '../entities/user-summary';
import { SidePanelDirective } from '../../shared/ui/directives/side-panel.directive';
import { UserStatusBadgeComponent, userStatusKind } from './user-status-badge.component';

/**
 * Painel "Informações do Usuário" de Usuários: mostra os mesmos dados já carregados na linha
 * selecionada da tabela (via `user`) — sem busca nova, a tabela já exibe todos os campos do
 * `UserSummary`. Os atalhos (Atribuir funções, Editar cadastro, Reenviar convite, Ativar/Desativar)
 * não duplicam nenhuma lógica: emitem eventos que o componente pai trata chamando os mesmos métodos
 * que o menu de ações da linha já usa.
 */
@Component({
  selector: 'app-user-list-info-panel',
  imports: [DatePipe, SidePanelDirective, UserStatusBadgeComponent],
  templateUrl: './user-list-info-panel.component.html',
  styleUrl: './user-list-info-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListInfoPanelComponent {
  /** Usuário selecionado na tabela. */
  readonly user = input.required<UserSummary>();
  /**
   * Se o painel está no modo overlay de tela cheia (abaixo de "lg"): vira um diálogo modal de
   * verdade (`aria-modal`) e prende o Tab dentro dele, já que a tabela por trás fica coberta.
   */
  readonly modal = input(false);
  /** Se este usuário é a própria conta logada: sem Ativar/Desativar (não dá pra se auto-desativar) e com a marca "Você". */
  readonly isCurrentUser = input(false);
  /** Desativação em andamento (ou a contagem de chamados que vem antes dela). */
  readonly deactivating = input(false);
  /** Reativação em andamento. */
  readonly activating = input(false);
  /** Reenvio de convite em andamento para este usuário. */
  readonly resendingInvitation = input(false);

  /** Pedido de fechar o painel (X). */
  readonly close = output<void>();
  /** Pedido de abrir "Editar cadastro". */
  readonly editClick = output<void>();
  /** Pedido de abrir "Atribuir funções". */
  readonly assignRolesClick = output<void>();
  /** Pedido de desativar ou reativar, conforme o estado atual. */
  readonly toggleActiveClick = output<void>();
  /** Pedido de reenvio do convite de ativação (conta ainda não ativada). */
  readonly resendInvitationClick = output<void>();

  /** Situação do usuário pro badge (Ativo, Convite pendente, Inativo). */
  protected readonly status = computed(() => userStatusKind(this.user()));
}
