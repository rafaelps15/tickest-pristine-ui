import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { injectSidePanelOverlay, isEscapeFromNestedLayer } from './side-panel.util';

describe('side-panel.util', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('reads the initial state of the overlay media query (below "lg")', () => {
    const isOverlay = TestBed.runInInjectionContext(() => injectSidePanelOverlay());

    expect(isOverlay()).toBe(window.matchMedia('(max-width: 991.98px)').matches);
  });

  it('identifies an Esc originating inside a modal or a "⋮" menu', () => {
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

  it('does not confuse an Esc originating in the rest of the screen with a layer of its own', () => {
    expect(isEscapeFromNestedLayer({ target: document.body } as unknown as Event)).toBeFalse();
    expect(isEscapeFromNestedLayer({ target: null } as unknown as Event)).toBeFalse();
  });
});
