import { signal, WritableSignal } from '@angular/core';

/**
 * Cria um signal booleano com persistência em localStorage (ex.: painéis "Guia da Tela" que
 * lembram se ficaram abertos/fechados) — leitura e escrita nunca quebram a tela se o storage
 * falhar (ex.: modo privado). Extraído depois de o mesmo bloco aparecer copiado em 5 componentes
 * de rail (Monitor, Funções, Departamentos, Usuários, Dashboard) — achado no simplify de 2026-10-27.
 */
export function createPersistedToggle(storageKey: string, defaultValue: boolean): WritableSignal<boolean> {
  return signal(readPersistedToggle(storageKey, defaultValue));
}

/** Lê o valor booleano salvo; devolve `defaultValue` se não houver nada salvo ou a leitura falhar. */
export function readPersistedToggle(storageKey: string, defaultValue: boolean): boolean {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved === null ? defaultValue : saved === 'true';
  } catch {
    return defaultValue;
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
