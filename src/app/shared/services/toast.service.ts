import { Injectable, signal } from '@angular/core';

/** Cor/semântica do toast. */
export type ToastVariant = 'success' | 'danger' | 'info';

/** Uma notificação toast ativa. */
export interface ToastMessage {
  id: number;
  message: string;
  variant: ToastVariant;
}

/** Tempo (ms) até um toast se fechar sozinho. */
const AUTO_DISMISS_MS = 4000;

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

  /** Mostra um toast; some sozinho depois de alguns segundos ou ao ser fechado manualmente. */
  show(message: string, variant: ToastVariant = 'success'): void {
    const id = ++this.nextId;
    this._toasts.update(list => [...list, { id, message, variant }]);
    setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);
  }

  /** Fecha um toast antes do tempo, ao clicar no X. */
  dismiss(id: number): void {
    this._toasts.update(list => list.filter(toast => toast.id !== id));
  }
}
