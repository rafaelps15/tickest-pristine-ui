import { getRoleColor, setRoleColor, clearRoleColor } from './role-colors.util';

const STORAGE_KEY = 'tickest.roleColors';

describe('role-colors.util', () => {
  beforeEach(() => localStorage.removeItem(STORAGE_KEY));
  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  it('devolve null pra uma função sem cor escolhida', () => {
    expect(getRoleColor('Agent')).toBeNull();
  });

  it('salva e lê a cor escolhida pra uma função', () => {
    setRoleColor('Agent', '#ff3e1d');

    expect(getRoleColor('Agent')).toBe('#ff3e1d');
  });

  it('guarda a cor de cada função separadamente', () => {
    setRoleColor('Agent', '#ff3e1d');
    setRoleColor('Admin', '#71dd37');

    expect(getRoleColor('Agent')).toBe('#ff3e1d');
    expect(getRoleColor('Admin')).toBe('#71dd37');
  });

  it('remove a cor customizada de uma função, voltando a devolver null', () => {
    setRoleColor('Agent', '#ff3e1d');

    clearRoleColor('Agent');

    expect(getRoleColor('Agent')).toBeNull();
  });

  it('não quebra ao ler quando o localStorage lança erro', () => {
    spyOn(Storage.prototype, 'getItem').and.throwError('bloqueado (ex.: modo privado)');

    expect(getRoleColor('Agent')).toBeNull();
  });

  it('não quebra ao salvar quando o localStorage lança erro', () => {
    spyOn(Storage.prototype, 'setItem').and.throwError('bloqueado (ex.: modo privado)');

    expect(() => setRoleColor('Agent', '#ff3e1d')).not.toThrow();
  });
});
