import { Component, ChangeDetectionStrategy, OnInit, input, signal } from '@angular/core';
import { hasPersistedToggle, readPersistedToggle, writePersistedToggle } from '../../utils/persisted-toggle.util';

/** Contador pra gerar ids únicos do corpo de cada Guia montado (o `aria-controls` do botão aponta pra ele). */
let nextGuideId = 0;

/**
 * "Guia da Tela": card recolhível logo abaixo do cabeçalho de uma tela, com a preferência
 * aberto/fechado lembrada no navegador por `storageKey`. Abre sozinho só na primeira visita à
 * tela; dali em diante começa fechado, a não ser que o usuário o deixe aberto (crítica de
 * 2026-10-27: aberto sempre empurrava o conteúdo pra baixo em toda visita repetida). O conteúdo (seções
 * `<app-guide-section>`, parágrafos soltos) é projetado — cada domínio só escreve o texto.
 *
 * O corpo fica sempre no DOM, só escondido, pro `aria-controls` do botão apontar pra um elemento
 * que existe. Antes eram 5 cópias desse card, 4 com o corpo em `@if` e uma com `[hidden]`.
 */
@Component({
  selector: 'app-screen-guide',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block mb-3' },
  template: `
    <div class="card guide-card">
      <button type="button" class="btn w-100 text-start d-flex align-items-center justify-content-between p-3 guide-toggle"
              [attr.aria-expanded]="open()" [attr.aria-controls]="bodyId" (click)="toggle()">
        <span class="fw-bold">
          <i class="bx bx-info-circle me-2" aria-hidden="true"></i>Guia da Tela
        </span>
        <i class="bx fs-4" [class.bx-chevron-up]="open()" [class.bx-chevron-down]="!open()" aria-hidden="true"></i>
      </button>

      <div [id]="bodyId" class="card-body pt-0 guide-body" [hidden]="!open()">
        <ng-content />
      </div>
    </div>
  `
})
export class ScreenGuideComponent implements OnInit {
  /** Chave do localStorage onde a preferência aberto/fechado desta tela fica salva. */
  readonly storageKey = input.required<string>();
  /** Estado na primeira visita (sem preferência salva) — aberto, pra quem chega ver a explicação. */
  readonly defaultOpen = input(true);

  /** Id do corpo do Guia, referenciado pelo `aria-controls` do botão. */
  protected readonly bodyId = `screen-guide-body-${nextGuideId++}`;

  /** Se o Guia está aberto; restaurado do localStorage assim que os inputs chegam. */
  protected readonly open = signal(true);

  /**
   * Restaura a preferência salva — só aqui os inputs `storageKey`/`defaultOpen` já têm valor. Na
   * primeira visita usa `defaultOpen` e já grava "fechado" pra próxima, que começa recolhida.
   */
  ngOnInit(): void {
    const key = this.storageKey();
    if (hasPersistedToggle(key)) {
      this.open.set(readPersistedToggle(key, this.defaultOpen()));
      return;
    }
    this.open.set(this.defaultOpen());
    writePersistedToggle(key, false);
  }

  /** Alterna o Guia e salva a preferência, sem quebrar a tela se a escrita falhar. */
  protected toggle(): void {
    const next = !this.open();
    this.open.set(next);
    writePersistedToggle(this.storageKey(), next);
  }
}

/**
 * Uma seção do Guia da Tela: título em versalete discreto (`h2`, logo abaixo do `h1` da tela)
 * e o conteúdo projetado. Seções vizinhas são separadas por um fio (`.guide-section + .guide-section`).
 */
@Component({
  selector: 'app-guide-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'guide-section' },
  template: `
    <h2 class="h6 guide-section-title">{{ title() }}</h2>
    <ng-content />
  `
})
export class GuideSectionComponent {
  /** Título da seção (ex.: "Status", "Prioridade"). */
  readonly title = input.required<string>();
}
