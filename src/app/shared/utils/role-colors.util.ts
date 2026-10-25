/** Chave do mapa (nome da função → cor em hex) guardado no navegador. */
const STORAGE_KEY = 'tickest.roleColors';

type RoleColorMap = Record<string, string>;

/** Lê o mapa salvo; mapa vazio se não houver nada ou a leitura falhar. */
function readMap(): RoleColorMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Salva o mapa; não quebra a tela se a escrita falhar (ex.: modo privado). */
function writeMap(map: RoleColorMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Prévia não persiste nesta sessão; a tela continua funcionando.
  }
}

/**
 * Cor escolhida pra uma função, ou `null` se nenhuma foi escolhida (cai no acento padrão,
 * índigo). **Prévia só neste navegador** — o back-end não tem campo de cor na função ainda,
 * então isso não é dado real, não sincroniza entre usuários/dispositivos.
 */
export function getRoleColor(roleName: string): string | null {
  return readMap()[roleName] ?? null;
}

/** Salva a cor escolhida pra uma função. */
export function setRoleColor(roleName: string, hex: string): void {
  const map = readMap();
  map[roleName] = hex;
  writeMap(map);
}

/** Remove a cor customizada de uma função, voltando ao acento padrão (índigo). */
export function clearRoleColor(roleName: string): void {
  const map = readMap();
  delete map[roleName];
  writeMap(map);
}
