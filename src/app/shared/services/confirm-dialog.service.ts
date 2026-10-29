import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

/** Cor do botão de confirmação, de acordo com a gravidade da ação. */
export type ConfirmDialogVariant = 'primary' | 'danger' | 'success';

/** Conteúdo e opções de um pedido de confirmação. */
export interface ConfirmDialogOptions {
  /** Título do modal — geralmente a pergunta (ex.: 'Excluir o departamento "TI"?'). */
  title: string;
  /** Texto de apoio abaixo do título, com o detalhe/consequência da ação. */
  message: string;
  /** Texto do botão de confirmação (padrão: "Confirmar"). */
  confirmLabel?: string;
  /** Texto do botão de cancelamento (padrão: "Cancelar"). */
  cancelLabel?: string;
  /** Cor do botão de confirmação (padrão: "primary"). */
  variant?: ConfirmDialogVariant;
}

/**
 * Pedido de confirmação em modal, substituindo o `confirm()` nativo do navegador (que não segue
 * o visual do projeto) em toda a aplicação. Usado junto com {@link ConfirmDialogComponent},
 * montado uma única vez no `AppComponent`.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly _options = signal<ConfirmDialogOptions | null>(null);
  private resultSubject: Subject<boolean> | null = null;

  /** Opções do pedido de confirmação atual, ou `null` quando não há nenhum aberto. */
  readonly options = this._options.asReadonly();

  /** Abre o modal de confirmação e devolve `true`/`false` conforme a escolha do usuário. */
  confirm(options: ConfirmDialogOptions): Observable<boolean> {
    // Um pedido novo substitui o modal aberto; o anterior conta como cancelado em vez de ficar sem resposta.
    this.resultSubject?.next(false);
    this.resultSubject?.complete();
    this.resultSubject = new Subject<boolean>();
    this._options.set(options);
    return this.resultSubject.asObservable();
  }

  /** Resolve o pedido de confirmação atual — chamado pelo {@link ConfirmDialogComponent} ao fechar o modal. */
  resolve(result: boolean): void {
    this._options.set(null);
    this.resultSubject?.next(result);
    this.resultSubject?.complete();
    this.resultSubject = null;
  }
}
