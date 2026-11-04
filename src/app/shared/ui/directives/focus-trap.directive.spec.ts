import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { FocusTrapDirective } from './focus-trap.directive';

/** Área mínima com foco preso: título só programático, dois botões, um oculto e um link. */
@Component({
  imports: [FocusTrapDirective],
  template: `
    <button type="button" id="before">Antes</button>
    <div [appFocusTrap]="active()">
      <h2 id="title" tabindex="-1">Título</h2>
      <button type="button" id="first">Primeiro</button>
      <button type="button" id="middle">Meio</button>
      <button type="button" id="hidden" style="display: none">Oculto</button>
      <a href="/fim" id="last">Último</a>
    </div>
  `
})
class HostComponent {
  readonly active = signal(true);
}

describe('FocusTrapDirective', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  async function render() {
    const fixture = TestBed.createComponent(HostComponent);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const get = (id: string) => fixture.nativeElement.querySelector('#' + id) as HTMLElement;
    return { fixture, get };
  }

  /** Dispara um Tab (ou Shift+Tab) no elemento e diz se a diretiva o interceptou. */
  function pressTab(target: HTMLElement, shiftKey = false): boolean {
    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    return event.defaultPrevented;
  }

  it('from the last visible control, Tab goes back to the first', async () => {
    const { fixture, get } = await render();
    get('last').focus();

    expect(pressTab(get('last'))).toBeTrue();
    expect(document.activeElement).toBe(get('first'));
    fixture.nativeElement.remove();
  });

  it('from the first control, Shift+Tab goes to the last, skipping the hidden one', async () => {
    const { fixture, get } = await render();
    get('first').focus();

    expect(pressTab(get('first'), true)).toBeTrue();
    expect(document.activeElement).toBe(get('last'));
    fixture.nativeElement.remove();
  });

  it('with focus on the title (outside the controls), Shift+Tab goes to the last', async () => {
    const { fixture, get } = await render();
    get('title').focus();

    expect(pressTab(get('title'), true)).toBeTrue();
    expect(document.activeElement).toBe(get('last'));
    fixture.nativeElement.remove();
  });

  it('in the middle, Tab follows the normal path', async () => {
    const { fixture, get } = await render();
    get('middle').focus();

    expect(pressTab(get('middle'))).toBeFalse();
    fixture.nativeElement.remove();
  });

  it('when turned off, does not intercept Tab', async () => {
    const { fixture, get } = await render();
    fixture.componentInstance.active.set(false);
    await fixture.whenStable();
    get('last').focus();

    expect(pressTab(get('last'))).toBeFalse();
    fixture.nativeElement.remove();
  });
});
