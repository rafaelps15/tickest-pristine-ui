import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MainLayoutComponent, activeTicketsMenu } from './main-layout.component';
import { SessionService } from '../../../services/session.service';
import { FOCUSABLE_SELECTOR } from '../../../utils/focus-trap.util';

/** Tela de teste com o título (h1) que recebe o foco depois de navegar pela gaveta. */
@Component({ template: '<h1>Tela de teste</h1><button type="button">Ação</button>' })
class StubPageComponent {}

describe('MainLayoutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
  });

  it('opens and closes the off-canvas menu through buttons with an accessible name and aria-expanded', async () => {
    const fixture = TestBed.createComponent(MainLayoutComponent);
    await fixture.whenStable();

    const openButton = fixture.nativeElement.querySelector('button[aria-label="Abrir menu"]') as HTMLButtonElement;
    const closeButton = fixture.nativeElement.querySelector('button[aria-label="Fechar menu"]') as HTMLButtonElement;
    expect(openButton).withContext('the ☰ must be a labeled <button>, not a javascript:void(0) link').toBeTruthy();
    expect(closeButton).toBeTruthy();
    expect(openButton.getAttribute('aria-expanded')).toBe('false');

    openButton.click();
    await fixture.whenStable();
    expect(openButton.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('.layout-wrapper').classList).toContain('menu-open');

    closeButton.click();
    await fixture.whenStable();
    expect(openButton.getAttribute('aria-expanded')).toBe('false');
  });

  describe('drawer below xl (keyboard and focus)', () => {
    /** Se a janela está abaixo do xl (gaveta) na simulação do matchMedia. */
    let offCanvas = true;

    beforeEach(() => {
      offCanvas = true;
      spyOn(window, 'matchMedia').and.callFake((query: string) => ({
        matches: query.includes('max-width') ? offCanvas : false,
        addEventListener: jasmine.createSpy('addEventListener'),
        removeEventListener: jasmine.createSpy('removeEventListener')
      }) as unknown as MediaQueryList);
    });

    /** Cria o layout e devolve os elementos usados nos testes. */
    async function render() {
      const fixture = TestBed.createComponent(MainLayoutComponent);
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;
      return {
        fixture,
        menu: root.querySelector('#layout-menu') as HTMLElement,
        page: root.querySelector('.layout-page') as HTMLElement,
        openButton: root.querySelector('button[aria-label="Abrir menu"]') as HTMLButtonElement,
        closeButton: root.querySelector('button[aria-label="Fechar menu"]') as HTMLButtonElement,
        overlay: root.querySelector('.layout-overlay') as HTMLElement
      };
    }

    it('with the drawer closed, its controls stay out of the Tab order (inert)', async () => {
      const { menu, page } = await render();

      expect(menu.hasAttribute('inert')).toBeTrue();
      expect(page.hasAttribute('inert')).toBeFalse();
    });

    it('when opened, focus enters the drawer and the rest of the page becomes inert', async () => {
      const { fixture, menu, page, openButton, closeButton } = await render();

      openButton.click();
      await fixture.whenStable();

      expect(menu.hasAttribute('inert')).toBeFalse();
      expect(page.hasAttribute('inert')).toBeTrue();
      expect(document.activeElement).toBe(closeButton);
    });

    it('Esc closes the drawer and returns focus to the button that opened it', async () => {
      const { fixture, menu, page, openButton } = await render();
      openButton.click();
      await fixture.whenStable();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('.layout-wrapper').classList).not.toContain('menu-open');
      expect(menu.hasAttribute('inert')).toBeTrue();
      expect(page.hasAttribute('inert')).toBeFalse();
      expect(document.activeElement).toBe(openButton);
    });

    it('the "Fechar menu" button and the backdrop also return focus to the button that opened it', async () => {
      const { fixture, openButton, closeButton, overlay } = await render();

      openButton.click();
      await fixture.whenStable();
      closeButton.click();
      await fixture.whenStable();
      expect(document.activeElement).toBe(openButton);

      openButton.click();
      await fixture.whenStable();
      overlay.click();
      await fixture.whenStable();
      expect(document.activeElement).toBe(openButton);
    });

    /** Rotas de teste para os itens da gaveta que o usuário sem permissões vê (Início e Meus Chamados). */
    function useStubRoutes(): void {
      TestBed.inject(Router).resetConfig([
        { path: 'dashboard', component: StubPageComponent },
        { path: 'tickets', component: StubPageComponent }
      ]);
    }

    it('when choosing a drawer item, focus goes to the title of the new screen', async () => {
      useStubRoutes();
      // "Meus Chamados" só aparece para quem tem tickets:view-own.
      TestBed.inject(SessionService).setCurrentUser({
        id: 'u1', email: 'maria@empresa.com', firstName: 'Maria', lastName: 'Silva', roles: [], permissions: ['tickets:view-own']
      });
      const { fixture, openButton } = await render();
      openButton.click();
      await fixture.whenStable();

      (fixture.nativeElement.querySelector('#layout-menu .menu-inner a[href="/tickets"]') as HTMLAnchorElement).click();
      await fixture.whenStable();

      const heading = fixture.nativeElement.querySelector('.layout-page h1') as HTMLElement;
      expect(heading).toBeTruthy();
      expect(document.activeElement).toBe(heading);
      expect(heading.getAttribute('tabindex')).toBe('-1');
    });

    it('choosing the item of the current screen also moves focus to the title, without jumping back to the top of the document', async () => {
      useStubRoutes();
      const { fixture, openButton } = await render();
      await TestBed.inject(Router).navigateByUrl('/dashboard');
      await fixture.whenStable();
      openButton.click();
      await fixture.whenStable();

      (fixture.nativeElement.querySelector('#layout-menu .menu-inner a[href="/dashboard"]') as HTMLAnchorElement).click();
      await fixture.whenStable();

      expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.layout-page h1'));
    });

    it('the drawer logo also closes the drawer and moves focus to the title of Início', async () => {
      useStubRoutes();
      const { fixture, openButton } = await render();
      openButton.click();
      await fixture.whenStable();

      (fixture.nativeElement.querySelector('#layout-menu .app-brand-link') as HTMLAnchorElement).click();
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('.layout-wrapper').classList).not.toContain('menu-open');
      expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.layout-page h1'));
    });

    it('clicking outside an item (on a list heading) only closes the drawer, without moving focus to the content', async () => {
      useStubRoutes();
      const { fixture, openButton } = await render();
      openButton.click();
      await fixture.whenStable();

      (fixture.nativeElement.querySelector('#layout-menu .menu-header') as HTMLElement).click();
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('.layout-wrapper').classList).not.toContain('menu-open');
      expect(document.activeElement?.tagName).not.toBe('H1');
    });

    it('with the drawer open, Tab wraps around inside it and does not leave for toasts or the global dialog', async () => {
      const { fixture, menu, openButton } = await render();
      openButton.click();
      await fixture.whenStable();
      const focusables = Array.from(menu.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      last.focus();
      const forward = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      last.dispatchEvent(forward);
      expect(forward.defaultPrevented).toBeTrue();
      expect(document.activeElement).toBe(first);

      const backward = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
      first.dispatchEvent(backward);
      expect(backward.defaultPrevented).toBeTrue();
      expect(document.activeElement).toBe(last);
    });

    it('in the middle of the drawer, Tab follows the normal path (it is not intercepted)', async () => {
      const { fixture, menu, openButton } = await render();
      openButton.click();
      await fixture.whenStable();
      const focusables = Array.from(menu.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

      focusables[1].focus();
      const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      focusables[1].dispatchEvent(tab);

      expect(tab.defaultPrevented).toBeFalse();
    });

    it('on desktop (xl or larger) the menu is always accessible, without inert', async () => {
      offCanvas = false;
      const { menu, page } = await render();

      expect(menu.hasAttribute('inert')).toBeFalse();
      expect(page.hasAttribute('inert')).toBeFalse();
    });
  });
});

describe('activeTicketsMenu', () => {
  it('activates "Meus Chamados" on the list, on Novo Chamado and on the detail', () => {
    expect(activeTicketsMenu('/tickets')).toBe('mine');
    expect(activeTicketsMenu('/tickets?page=2')).toBe('mine');
    expect(activeTicketsMenu('/tickets/novo')).toBe('mine');
    expect(activeTicketsMenu('/tickets/8cc6644c-af6d-4c71-bb70-74d713b42cf0')).toBe('mine');
  });

  it('activates "Monitorar Chamados" on the Monitor and on the detail opened from it', () => {
    expect(activeTicketsMenu('/tickets/monitorar')).toBe('monitor');
    expect(activeTicketsMenu('/tickets/monitorar?status=1')).toBe('monitor');
    expect(activeTicketsMenu('/tickets/t1?from=monitor')).toBe('monitor');
  });

  it('does not activate any ticket item outside /chamados', () => {
    expect(activeTicketsMenu('/dashboard')).toBeNull();
    expect(activeTicketsMenu('/usuarios')).toBeNull();
  });
});
