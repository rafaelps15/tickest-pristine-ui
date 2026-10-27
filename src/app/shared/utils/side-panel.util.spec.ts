import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { injectSidePanelOverlay, isEscapeFromNestedLayer } from './side-panel.util';

describe('side-panel.util', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('lê o estado inicial da media query de overlay (abaixo de "lg")', () => {
    const isOverlay = TestBed.runInInjectionContext(() => injectSidePanelOverlay());

    expect(isOverlay()).toBe(window.matchMedia('(max-width: 991.98px)').matches);
  });

  it('identifica um Esc nascido dentro de um modal ou de um menu "⋮"', () => {
    const modal = document.createElement('div');
    modal.className = 'modal';
    const input = document.createElement('input');
    modal.appendChild(input);

    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown';
    const toggle = document.createElement('button');
    dropdown.appendChild(toggle);

    expect(isEscapeFromNestedLayer({ target: input } as unknown as Event)).toBeTrue();
    expect(isEscapeFromNestedLayer({ target: toggle } as unknown as Event)).toBeTrue();
  });

  it('não confunde um Esc nascido no resto da tela com uma camada própria', () => {
    expect(isEscapeFromNestedLayer({ target: document.body } as unknown as Event)).toBeFalse();
    expect(isEscapeFromNestedLayer({ target: null } as unknown as Event)).toBeFalse();
  });
});
