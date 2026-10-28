import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, fromEvent, map, merge, switchMap, startWith, timer } from 'rxjs';

/**
 * Intervalo da atualização automática do Início: 2 minutos. O prazo de SLA anda em minutos, então
 * mais espaçado deixaria "em risco" desatualizado; mais curto multiplicaria consultas agregadas sem
 * mudar o que se lê na tela (decisão do produto em 2026-10-28).
 */
export const DASHBOARD_REFRESH_MS = 2 * 60_000;

/**
 * Quanto falta pra próxima atualização: o que sobra do intervalo desde a última carga — zero se os
 * dados já estão velhos (ex.: voltou pra aba depois de 10 min) — ou o intervalo inteiro sem carga ainda.
 */
export function refreshDelay(updatedAtMs: number | null, nowMs: number, intervalMs = DASHBOARD_REFRESH_MS): number {
  if (updatedAtMs === null) return intervalMs;
  return Math.max(0, updatedAtMs + intervalMs - nowMs);
}

/** Controle da atualização automática ligada. */
export interface DashboardAutoRefresh {
  /** Recomeça a contagem do intervalo (depois de uma atualização manual, pra não repetir logo em seguida). */
  restart(): void;
}

/**
 * Liga a atualização automática: a cada {@link DASHBOARD_REFRESH_MS} com a aba visível, parada com
 * a aba oculta e, ao voltar, imediata se os dados passaram do intervalo. Termina sozinha quando a
 * tela é destruída.
 */
export function startDashboardAutoRefresh(document: Document, updatedAtMs: () => number | null, refresh: () => void, destroyRef: DestroyRef): DashboardAutoRefresh {
  const restarts = new Subject<void>();
  const visibility = fromEvent(document, 'visibilitychange').pipe(
    startWith(null),
    map(() => ({ visible: document.visibilityState === 'visible', delay: refreshDelay(updatedAtMs(), Date.now()) }))
  );
  const restarted = restarts.pipe(map(() => ({ visible: document.visibilityState === 'visible', delay: DASHBOARD_REFRESH_MS })));

  merge(visibility, restarted).pipe(
    switchMap(({ visible, delay }) => (visible ? timer(delay, DASHBOARD_REFRESH_MS) : EMPTY)),
    takeUntilDestroyed(destroyRef)
  ).subscribe(() => refresh());

  return { restart: () => restarts.next() };
}
