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

  it('is a region outside modal mode and a modal dialog in overlay mode', async () => {
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

  it('outside modal mode, does not pull focus to the panel (keyboard users stay in the table position)', async () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();

    const fixture = await createAttached();
    expect(document.activeElement).toBe(opener);

    opener.remove();
    fixture.nativeElement.remove();
  });

  it('in modal mode, moves focus to the title on open and when switching items, but not when the key stays the same', async () => {
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

  it('in modal mode, traps Tab between the first and the last control', async () => {
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

  it('outside modal mode, does not interfere with Tab', async () => {
    const fixture = await createAttached();
    const last = fixture.nativeElement.querySelector('#lastControl') as HTMLElement;
    last.focus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    last.dispatchEvent(event);

    expect(event.defaultPrevented).toBeFalse();
    fixture.nativeElement.remove();
  });
});
