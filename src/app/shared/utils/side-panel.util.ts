import { DestroyRef, WritableSignal, inject, signal } from '@angular/core';

/** Abaixo de "lg" o painel lateral "Informações do X" vira overlay de tela cheia (ver `.info-panel-col` em styles.css). */
const SIDE_PANEL_OVERLAY_QUERY = '(max-width: 991.98px)';

/**
 * Sinal que diz se a janela está abaixo de "lg", onde o painel lateral vira diálogo modal de tela
 * cheia — acompanha o redimensionamento e solta o listener quando o componente é destruído.
 * Precisa de contexto de injeção (inicializador de campo ou construtor).
 */
export function injectSidePanelOverlay(): WritableSignal<boolean> {
  const query = window.matchMedia(SIDE_PANEL_OVERLAY_QUERY);
  const isOverlay = signal(query.matches);
  const onChange = (event: MediaQueryListEvent) => isOverlay.set(event.matches);

  query.addEventListener('change', onChange);
  inject(DestroyRef).onDestroy(() => query.removeEventListener('change', onChange));

  return isOverlay;
}

/**
 * Se um Esc nasceu dentro de uma camada própria (modal do Bootstrap, menu "⋮") — ali ele só fecha
 * aquela camada, e o painel lateral por baixo não deve fechar junto.
 */
export function isEscapeFromNestedLayer(event: Event): boolean {
  const target = event.target as Element | null;
  return !!target?.closest?.('.modal, .dropdown');
}
