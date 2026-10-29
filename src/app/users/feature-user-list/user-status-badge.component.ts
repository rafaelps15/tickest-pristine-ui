import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';

/** Situação de um usuário como a tela mostra: pode entrar, ainda não ativou a conta, ou bloqueado. */
export type UserStatusKind = 'active' | 'pending' | 'inactive';

/** Rótulo e tom (classe `.bg-label-*`) de cada situação — âmbar é "esperando alguém", como "Aberto" nos chamados. */
const STATUS_BADGES: Record<UserStatusKind, { label: string; tone: string }> = {
  active: { label: 'Ativo', tone: 'bg-label-success' },
  pending: { label: 'Convite pendente', tone: 'bg-label-warning' },
  inactive: { label: 'Inativo', tone: 'bg-label-secondary' }
};

/** Situação de um usuário a partir dos dois campos da API: inativo vence; ativo sem senha é convite pendente. */
export function userStatusKind(user: { isActive: boolean; pendingActivation: boolean }): UserStatusKind {
  if (!user.isActive) return 'inactive';
  return user.pendingActivation ? 'pending' : 'active';
}

/**
 * Badge de status do usuário (Ativo, Convite pendente, Inativo) com o ponto da cor — o mesmo na
 * tabela, no painel "Informações do Usuário" e na legenda do Guia (antes era o markup copiado nos três).
 */
@Component({
  selector: 'app-user-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-inline-block' },
  template: `<span class="badge {{ badge().tone }}"><span class="badge-dot" aria-hidden="true"></span>{{ badge().label }}</span>`
})
export class UserStatusBadgeComponent {
  /** Situação a mostrar. */
  readonly status = input.required<UserStatusKind>();

  /** Rótulo e tom da situação atual. */
  protected readonly badge = computed(() => STATUS_BADGES[this.status()]);
}
