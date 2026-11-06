import { FOCUSABLE_SELECTOR, trapTabWithin } from './focus-trap.util';

describe('focus-trap.util', () => {
  /** Área com foco preso: título só programático, controles visíveis, um oculto, um desabilitado e um fora do Tab. */
  let container: HTMLElement;
  /** Botão fora da área, como o que abriu o diálogo. */
  let outside: HTMLButtonElement;

  beforeEach(() => {
    outside = document.createElement('button');
    outside.type = 'button';
    container = document.createElement('div');
    container.innerHTML = `
      <h2 id="title" tabindex="-1">Título</h2>
      <button type="button" id="first">Primeiro</button>
      <input type="text" id="middle" aria-label="Meio">
      <a href="/fim" id="last">Último</a>
      <button type="button" id="hidden" style="display: none">Oculto</button>
      <button type="button" id="disabled" disabled>Desabilitado</button>
      <span id="programmatic" tabindex="-1">Só programático</span>
    `;
    document.body.append(outside, container);
  });

  afterEach(() => {
    container.remove();
    outside.remove();
  });

  /** Elemento da área pelo id. */
  function get(id: string): HTMLElement {
    return container.querySelector('#' + id) as HTMLElement;
  }

  /** Passa uma tecla (Tab por padrão) ao utilitário e diz se ele a interceptou. */
  function press(shiftKey = false, key = 'Tab'): boolean {
    const event = new KeyboardEvent('keydown', { key, shiftKey, cancelable: true });
    trapTabWithin(event, container);
    return event.defaultPrevented;
  }

  it('from the last visible control, Tab goes back to the first', () => {
    get('last').focus();

    expect(press()).toBeTrue();
    expect(document.activeElement).toBe(get('first'));
  });

  it('from the first control, Shift+Tab goes to the last visible one', () => {
    get('first').focus();

    expect(press(true)).toBeTrue();
    expect(document.activeElement).toBe(get('last'));
  });

  it('with focus on the title (outside the controls), Tab goes to the first and Shift+Tab to the last', () => {
    get('title').focus();
    expect(press()).toBeTrue();
    expect(document.activeElement).toBe(get('first'));

    get('title').focus();
    expect(press(true)).toBeTrue();
    expect(document.activeElement).toBe(get('last'));
  });

  it('with focus outside the area, Tab brings it to the first control', () => {
    outside.focus();

    expect(press()).toBeTrue();
    expect(document.activeElement).toBe(get('first'));
  });

  it('in the middle, Tab and Shift+Tab follow the normal path', () => {
    get('middle').focus();

    expect(press()).toBeFalse();
    expect(press(true)).toBeFalse();
    expect(document.activeElement).toBe(get('middle'));
  });

  it('ignores the other keys', () => {
    get('last').focus();

    expect(press(false, 'Enter')).toBeFalse();
    expect(document.activeElement).toBe(get('last'));
  });

  it('does not intercept Tab when the area has no visible control', () => {
    container.querySelectorAll('button, input, a').forEach(element => element.remove());
    get('title').focus();

    expect(press()).toBeFalse();
    expect(document.activeElement).toBe(get('title'));
  });

  it('counts as focusable only enabled controls, links and elements reachable by Tab', () => {
    const matches = (id: string) => get(id).matches(FOCUSABLE_SELECTOR);

    expect(matches('first')).toBeTrue();
    expect(matches('middle')).toBeTrue();
    expect(matches('last')).toBeTrue();
    expect(matches('disabled')).toBeFalse();
    expect(matches('title')).toBeFalse();
    expect(matches('programmatic')).toBeFalse();
  });
});
