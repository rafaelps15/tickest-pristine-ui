/**
 * Preferências booleanas em localStorage (ex.: painéis "Guia da Tela" que lembram se ficaram
 * abertos/fechados) — leitura e escrita nunca quebram a tela se o storage falhar (ex.: modo privado).
 */

/** Lê o valor booleano salvo; devolve `defaultValue` se não houver nada salvo ou a leitura falhar. */
export function readPersistedToggle(storageKey: string, defaultValue: boolean): boolean {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved === null ? defaultValue : saved === 'true';
  } catch {
    return defaultValue;
  }
}

/** Se já existe uma preferência salva nessa chave (`false` também quando a leitura falha). */
export function hasPersistedToggle(storageKey: string): boolean {
  try {
    return localStorage.getItem(storageKey) !== null;
  } catch {
    return false;
  }
}

/** Salva o valor booleano; não quebra a tela se a escrita falhar (ex.: modo privado). */
export function writePersistedToggle(storageKey: string, value: boolean): void {
  try {
    localStorage.setItem(storageKey, String(value));
  } catch {
    // Preferência não persiste nesta sessão; a tela continua funcionando.
  }
}
