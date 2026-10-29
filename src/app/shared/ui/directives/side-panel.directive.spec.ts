import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { SidePanelDirective } from './side-panel.directive';

/** Painel mínimo pra exercitar a diretiva: título focável, um botão e um link. */
@Component({
  imports: [SidePanelDirective],
  template: `
    <div [appSidePanel]="itemId()" [sidePanelModal]="modal()" aria-labelledby="panelTitle">
      <h5 id="panelTitle" tabindex="-1" data-side-panel-title>Título</h5>
      <button type="button" id="firstControl">Fechar</button>
      <a href="/detalhe" id="lastControl">Detalhes</a>
    </div>
  `
})
class HostComponent {
  readonly itemId = signal('a');
  readonly modal = signal(false);
}

describe('SidePanelDirective', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  async function createAttached(modal = false) {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.modal.set(modal);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    return fixture;
  }

  it('é uma região fora do modo modal e um diálogo modal no modo overlay', async () => {
    const fixture = await createAttached();
    const panel = fixture.nativeElement.querySelector('[aria-labelledby]') as HTMLElement;
    expect(panel.getAttribute('role')).toBe('region');
    expect(panel.hasAttribute('aria-modal')).toBeFalse();

    fixture.componentInstance.modal.set(true);
    await fixture.whenStable();
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.getAttribute('aria-modal')).toBe('true');

    fixture.nativeElement.remove();
  });

  it('fora do modo modal, não puxa o foco pro painel (quem navega por teclado fica no lugar da tabela)', async () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();

    const fixture = await createAttached();
    expect(document.activeElement).toBe(opener);

    opener.remove();
    fixture.nativeElement.remove();
  });

  it('no modo modal, move o foco pro título ao abrir e ao trocar de item, mas não quando a chave continua a mesma', async () => {
    const fixture = await createAttached(true);
    const title = fixture.nativeElement.querySelector('#panelTitle') as HTMLElement;
    expect(document.activeElement).toBe(title);

    const outside = document.createElement('input');
    document.body.appendChild(outside);
    outside.focus();
    fixture.componentInstance.itemId.set('a');
    await fixture.whenStable();
    expect(document.activeElement).toBe(outside);

    fixture.componentInstance.itemId.set('b');
    await fixture.whenStable();
    expect(document.activeElement).toBe(title);

    outside.remove();
    fixture.nativeElement.remove();
  });

  it('no modo modal, prende o Tab entre o primeiro e o último controle', async () => {
    const fixture = await createAttached();
    fixture.componentInstance.modal.set(true);
    await fixture.whenStable();
    const first = fixture.nativeElement.querySelector('#firstControl') as HTMLElement;
    const last = fixture.nativeElement.querySelector('#lastControl') as HTMLElement;

    last.focus();
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(first);

    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(last);

    fixture.nativeElement.remove();
  });

  it('fora do modo modal, não interfere no Tab', async () => {
    const fixture = await createAttached();
    const last = fixture.nativeElement.querySelector('#lastControl') as HTMLElement;
    last.focus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    last.dispatchEvent(event);

    expect(event.defaultPrevented).toBeFalse();
    fixture.nativeElement.remove();
  });
});
