import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { DialogComponent } from './dialog.component';

/** Tela de teste: um botão que abre o diálogo, e o diálogo com um campo e o rodapé. */
@Component({
  imports: [DialogComponent],
  template: `
    <button id="opener" type="button" (click)="open.set(true)">Abrir</button>
    @if (open()) {
      <app-dialog title="Nova função" subtitle="Administração" [busy]="busy()" (closed)="closedCount = closedCount + 1; open.set(false)">
        <div dialogContent class="dialog-content">
          <div class="modal-body"><input id="name" data-dialog-focus /></div>
          <div class="modal-footer"><button id="cancel" type="button">Cancelar</button></div>
        </div>
      </app-dialog>
    }
  `
})
class HostComponent {
  /** Se o diálogo está aberto. */
  readonly open = signal(false);
  /** Uma ação está em andamento. */
  readonly busy = signal(false);
  /** Quantas vezes o diálogo pediu pra fechar. */
  closedCount = 0;
}

describe('DialogComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  /** Abre o diálogo a partir do botão, com a tela anexada ao documento (pra foco funcionar). */
  async function openDialog() {
    const fixture = TestBed.createComponent(HostComponent);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const opener = fixture.nativeElement.querySelector('#opener') as HTMLButtonElement;
    opener.focus();
    opener.click();
    await fixture.whenStable();
    return fixture;
  }

  afterEach(() => document.body.classList.remove('modal-open'));

  it('é um diálogo modal rotulado pelo título, com o subtítulo de contexto', async () => {
    const fixture = await openDialog();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const title = fixture.nativeElement.querySelector(`#${dialog.getAttribute('aria-labelledby')}`) as HTMLElement;
    expect(title.textContent).toContain('Nova função');
    expect(fixture.nativeElement.textContent).toContain('Administração');
    fixture.nativeElement.remove();
  });

  it('foca o elemento marcado com data-dialog-focus e trava a rolagem da página', async () => {
    const fixture = await openDialog();

    expect(document.activeElement?.id).toBe('name');
    expect(document.body.classList).toContain('modal-open');
    fixture.nativeElement.remove();
  });

  it('fecha pelo Esc e pelo clique fora, e devolve o foco a quem abriu', async () => {
    const fixture = await openDialog();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(fixture.componentInstance.closedCount).toBe(1);
    expect(document.body.classList).not.toContain('modal-open');
    expect(document.activeElement?.id).toBe('opener');

    (fixture.nativeElement.querySelector('#opener') as HTMLButtonElement).click();
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('.modal') as HTMLElement).click();
    expect(fixture.componentInstance.closedCount).toBe(2);
    fixture.nativeElement.remove();
  });

  it('não fecha enquanto uma ação está em andamento', async () => {
    const fixture = await openDialog();
    fixture.componentInstance.busy.set(true);
    await fixture.whenStable();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    (fixture.nativeElement.querySelector('.modal') as HTMLElement).click();

    expect(fixture.componentInstance.closedCount).toBe(0);
    expect((fixture.nativeElement.querySelector('.btn-close') as HTMLButtonElement).disabled).toBeTrue();
    fixture.nativeElement.remove();
  });

  it('prende o Tab dentro da caixa: do último controle volta ao primeiro', async () => {
    const fixture = await openDialog();

    const cancel = fixture.nativeElement.querySelector('#cancel') as HTMLButtonElement;
    cancel.focus();
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    cancel.dispatchEvent(tab);

    expect(tab.defaultPrevented).toBeTrue();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.btn-close'));
    fixture.nativeElement.remove();
  });
});
