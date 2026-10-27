import { Component, ChangeDetectionStrategy, AfterViewInit, OnDestroy, ElementRef, HostListener, DOCUMENT, inject, input, output, viewChild } from '@angular/core';

/** Controles que entram no ciclo de Tab do diálogo. */
const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Contador pra gerar ids únicos do título (o `aria-labelledby` do diálogo aponta pra ele). */
let nextDialogId = 0;

/** Diálogos abertos, do mais antigo pro do topo — só o do topo responde ao Esc (ex.: a confirmação de descarte sobre a edição). */
const openDialogs: DialogComponent[] = [];

/**
 * Diálogo modal único do sistema, renderizado pelo Angular (a tela o mostra com `@if`) — aposenta o
 * `data-bs-toggle="modal"` + "clicar no X escondido" pra fechar. Cuida do que cada modal repetia:
 * fundo escurecido, `role="dialog"`/`aria-modal`, foco inicial, Tab preso dentro da caixa, Esc e
 * clique fora pra fechar (travados enquanto `busy`), e a rolagem da página travada por trás.
 *
 * Conteúdo: o corpo é projetado direto; o rodapé vem marcado com `dialogFooter`. Quando o diálogo
 * é um formulário, a tela envolve corpo e rodapé num `<form>` próprio e marca o form inteiro com
 * `dialogContent` (assim o botão submit do rodapé fica dentro do form). O foco inicial vai pro
 * elemento marcado com `data-dialog-focus`, ou pro primeiro controle do corpo.
 */
@Component({
  selector: 'app-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-backdrop fade show"></div>

    <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" [attr.aria-labelledby]="titleId"
         (click)="onBackdropClick($event)">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" [class.modal-lg]="size() === 'lg'">
        <div #box class="modal-content" (keydown)="onKeydown($event)">
          <div class="modal-header">
            <div class="min-w-0">
              <h2 class="modal-title h5" [id]="titleId">{{ title() }}</h2>
              @if (subtitle()) {
                <p class="text-muted small mb-0 text-truncate">{{ subtitle() }}</p>
              }
            </div>
            <button type="button" class="btn-close" [attr.aria-label]="closeLabel()" [disabled]="busy()" (click)="requestClose()"></button>
          </div>

          <ng-content select="[dialogContent]" />

          <div class="modal-body dialog-body">
            <ng-content />
          </div>

          <ng-content select="[dialogFooter]" />
        </div>
      </div>
    </div>
  `,
  styles: `
    :host { display: contents; }
    .min-w-0 { min-width: 0; }
    .dialog-body:empty { display: none; }
  `
})
export class DialogComponent implements AfterViewInit, OnDestroy {
  private readonly document = inject(DOCUMENT);

  /** Título do diálogo (vira o nome acessível dele). */
  readonly title = input.required<string>();
  /** Linha de contexto abaixo do título (ex.: o nome do item afetado). */
  readonly subtitle = input<string | null>(null);
  /** Rótulo do X de fechar pra leitor de tela. */
  readonly closeLabel = input('Fechar');
  /** Largura: padrão ou `lg` (listas longas, permissões). */
  readonly size = input<'md' | 'lg'>('md');
  /** Uma ação está em andamento — trava X, Esc e clique fora, pra não perder o resultado. */
  readonly busy = input(false);

  /** Pedido de fechar (X, Esc, clique fora); a tela decide e tira o diálogo do `@if`. */
  readonly closed = output<void>();

  /** Id do título. */
  protected readonly titleId = `app-dialog-title-${nextDialogId++}`;
  /** Caixa do diálogo, onde o Tab fica preso. */
  private readonly box = viewChild.required<ElementRef<HTMLElement>>('box');
  /** Elemento focado antes de abrir, pra devolver o foco ao fechar. */
  private readonly previousFocus = this.document.activeElement as HTMLElement | null;

  /** Trava a rolagem da página por trás e põe o foco no primeiro controle (ou no marcado com `data-dialog-focus`). */
  ngAfterViewInit(): void {
    openDialogs.push(this);
    this.document.body.classList.add('modal-open');
    const box = this.box().nativeElement;
    const preferred = box.querySelector<HTMLElement>('[data-dialog-focus]');
    const firstInBody = Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      .find(element => !element.classList.contains('btn-close'));
    (preferred ?? firstInBody ?? box.querySelector<HTMLElement>('.btn-close'))?.focus();
  }

  /** Devolve a rolagem da página e o foco a quem abriu o diálogo, se ele ainda existir. */
  ngOnDestroy(): void {
    openDialogs.splice(openDialogs.indexOf(this), 1);
    if (openDialogs.length === 0) this.document.body.classList.remove('modal-open');
    if (this.previousFocus?.isConnected) this.previousFocus.focus();
  }

  /** Pede pra fechar, a não ser que uma ação esteja em andamento. */
  requestClose(): void {
    if (!this.busy()) this.closed.emit();
  }

  /** Esc fecha só o diálogo do topo — e não quando nasceu dentro de um menu "⋮" aberto nele. */
  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    if (openDialogs[openDialogs.length - 1] !== this) return;
    if ((event.target as Element | null)?.closest?.('.dropdown-menu.show')) return;
    this.requestClose();
  }

  /** Clique na área escura fora da caixa fecha; cliques que começam dentro dela, não. */
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.requestClose();
  }

  /** Prende o Tab/Shift+Tab dentro da caixa: do último controle volta ao primeiro, e vice-versa. */
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;

    const focusable = Array.from(this.box().nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.document.activeElement as HTMLElement | null;
    const outside = !active || !focusable.includes(active);

    if (event.shiftKey && (active === first || outside)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || outside)) {
      event.preventDefault();
      first.focus();
    }
  }
}
