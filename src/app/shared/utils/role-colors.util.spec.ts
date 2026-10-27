import { getRoleColor, setRoleColor, clearRoleColor, hasAccessibleRoleColorContrast } from './role-colors.util';

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
    setRoleColor('Admin', '#2e7d14');

    expect(getRoleColor('Agent')).toBe('#ff3e1d');
    expect(getRoleColor('Admin')).toBe('#2e7d14');
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

  it('ignora (devolve null) uma cor salva sem contraste suficiente, caindo no acento padrão', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ Agent: '#ffff99' }));

    expect(getRoleColor('Agent')).toBeNull();
  });

  it('ignora (devolve null) um valor salvo que não é uma cor hex válida', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ Agent: 'red; background: url(x)' }));

    expect(getRoleColor('Agent')).toBeNull();
  });

  it('rejeita branco por não ter contraste suficiente pro badge', () => {
    expect(hasAccessibleRoleColorContrast('#ffffff')).toBeFalse();
  });

  it('rejeita um amarelo claro por não ter contraste suficiente pro badge', () => {
    expect(hasAccessibleRoleColorContrast('#ffff99')).toBeFalse();
  });

  it('aceita um vermelho saturado, com contraste suficiente pro badge', () => {
    expect(hasAccessibleRoleColorContrast('#ff3e1d')).toBeTrue();
  });

  it('aceita preto, com contraste suficiente pro badge', () => {
    expect(hasAccessibleRoleColorContrast('#000000')).toBeTrue();
  });
});
