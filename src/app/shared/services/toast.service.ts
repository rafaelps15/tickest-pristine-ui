import { Injectable, signal } from '@angular/core';

/** Cor/semântica do toast. */
export type ToastVariant = 'success' | 'danger' | 'info';

/** Ação opcional de um toast (ex.: "Desfazer") — roda e fecha o toast ao clicar. */
export interface ToastAction {
  label: string;
  run: () => void;
}

/** Uma notificação toast ativa. */
export interface ToastMessage {
  id: number;
  message: string;
  variant: ToastVariant;
  action?: ToastAction;
}

/** Tempo (ms) até um toast se fechar sozinho. */
const AUTO_DISMISS_MS = 4000;

/** Tempo (ms) de um toast com ação: o dobro, pra dar tempo de ler e alcançar o botão (WCAG 2.2.1). */
const AUTO_DISMISS_WITH_ACTION_MS = 8000;

/**
 * Notificações toast curtas e não bloqueantes, usadas pra confirmar que uma ação fora de um
 * modal (desativar/reativar usuário, atribuir funções etc.) realmente aconteceu — sem isso, a
 * única confirmação era notar sozinho que algo mudou na lista.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<ToastMessage[]>([]);
  private nextId = 0;

  /** Toasts ativos no momento, na ordem em que apareceram. */
  readonly toasts = this._toasts.asReadonly();

  /** Mostra um toast, opcionalmente com uma ação (ex.: "Desfazer"); some sozinho depois de alguns segundos ou ao ser fechado manualmente. */
  show(message: string, variant: ToastVariant = 'success', action?: ToastAction): void {
    const id = ++this.nextId;
    this._toasts.update(list => [...list, { id, message, variant, action }]);
    setTimeout(() => this.dismiss(id), action ? AUTO_DISMISS_WITH_ACTION_MS : AUTO_DISMISS_MS);
  }

  /** Roda a ação do toast e o fecha. */
  runAction(id: number): void {
    const toast = this._toasts().find(item => item.id === id);
    this.dismiss(id);
    toast?.action?.run();
  }

  /** Fecha um toast antes do tempo, ao clicar no X. */
  dismiss(id: number): void {
    this._toasts.update(list => list.filter(toast => toast.id !== id));
  }
}
