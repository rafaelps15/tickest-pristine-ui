/** Quantidade de badges de função exibidos antes de agrupar o restante num badge "+N". */
const MAX_VISIBLE_ROLE_BADGES = 2;

/** Primeiras {@link MAX_VISIBLE_ROLE_BADGES} funções pra exibir como badge — o restante vira um badge "+N". */
export function visibleRoles<T extends { name: string }>(roles: T[]): T[] {
  return roles.slice(0, MAX_VISIBLE_ROLE_BADGES);
}

/** Quantidade de funções além das já exibidas como badge. */
export function hiddenRolesCount<T extends { name: string }>(roles: T[]): number {
  return Math.max(0, roles.length - MAX_VISIBLE_ROLE_BADGES);
}

/** Nomes das funções ocultas, unidos por vírgula — para o tooltip nativo do badge "+N". */
export function hiddenRolesNames<T extends { name: string }>(roles: T[]): string {
  return roles.slice(MAX_VISIBLE_ROLE_BADGES).map(role => role.name).join(', ');
}
