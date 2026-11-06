import { hiddenRolesCount, hiddenRolesNames, visibleRoles } from './role-badges.util';

/** Funções nomeadas, na ordem em que a pessoa as recebeu. */
function rolesNamed(...names: string[]): { name: string }[] {
  return names.map(name => ({ name }));
}

describe('role-badges.util', () => {
  it('shows every role as a badge while there are at most two, with nothing grouped', () => {
    const roles = rolesNamed('Atendente', 'Supervisor');

    expect(visibleRoles(roles)).toEqual(roles);
    expect(hiddenRolesCount(roles)).toBe(0);
    expect(hiddenRolesNames(roles)).toBe('');
    expect(visibleRoles([])).toEqual([]);
    expect(hiddenRolesCount([])).toBe(0);
  });

  it('beyond two, shows the first two and groups the rest in "+N", naming the hidden ones for the tooltip', () => {
    const roles = rolesNamed('Atendente', 'Supervisor', 'Financeiro', 'RH');

    expect(visibleRoles(roles).map(role => role.name)).toEqual(['Atendente', 'Supervisor']);
    expect(hiddenRolesCount(roles)).toBe(2);
    expect(hiddenRolesNames(roles)).toBe('Financeiro, RH');
  });
});
