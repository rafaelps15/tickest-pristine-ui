import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MainLayoutComponent, activeTicketsMenu } from './main-layout.component';

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

  it('abre e fecha o menu off-canvas por botões com nome acessível e aria-expanded', async () => {
    const fixture = TestBed.createComponent(MainLayoutComponent);
    await fixture.whenStable();

    const openButton = fixture.nativeElement.querySelector('button[aria-label="Abrir menu"]') as HTMLButtonElement;
    const closeButton = fixture.nativeElement.querySelector('button[aria-label="Fechar menu"]') as HTMLButtonElement;
    expect(openButton).withContext('o ☰ deve ser um <button> rotulado, não um link javascript:void(0)').toBeTruthy();
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

  describe('gaveta abaixo do xl (teclado e foco)', () => {
    /** Se a janela está abaixo do xl (gaveta) na simulação do matchMedia. */
    let offCanvas = true;

    beforeEach(() => {
      offCanvas = true;
      spyOn(window, 'matchMedia').and.callFake((query: string) => ({
        matches: query.includes('max-width') ? offCanvas : false,
        addEventListener: () => {},
        removeEventListener: () => {}
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

    it('com a gaveta fechada, os controles dela ficam fora do Tab (inert)', async () => {
      const { menu, page } = await render();

      expect(menu.hasAttribute('inert')).toBeTrue();
      expect(page.hasAttribute('inert')).toBeFalse();
    });

    it('ao abrir, o foco entra na gaveta e o resto da página fica inerte', async () => {
      const { fixture, menu, page, openButton, closeButton } = await render();

      openButton.click();
      await fixture.whenStable();

      expect(menu.hasAttribute('inert')).toBeFalse();
      expect(page.hasAttribute('inert')).toBeTrue();
      expect(document.activeElement).toBe(closeButton);
    });

    it('Esc fecha a gaveta e devolve o foco ao botão que a abriu', async () => {
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

    it('o botão "Fechar menu" e a sombra também devolvem o foco ao botão que abriu', async () => {
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

    it('ao escolher um item da gaveta, o foco vai para o título da nova tela', async () => {
      useStubRoutes();
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

    it('escolher o item da tela atual também leva o foco ao título, sem voltar ao topo do documento', async () => {
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

    it('o logo da gaveta também fecha a gaveta e leva o foco ao título do Início', async () => {
      useStubRoutes();
      const { fixture, openButton } = await render();
      openButton.click();
      await fixture.whenStable();

      (fixture.nativeElement.querySelector('#layout-menu .app-brand-link') as HTMLAnchorElement).click();
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('.layout-wrapper').classList).not.toContain('menu-open');
      expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.layout-page h1'));
    });

    it('clicar fora de um item (num cabeçalho da lista) só fecha a gaveta, sem mover o foco pro conteúdo', async () => {
      useStubRoutes();
      const { fixture, openButton } = await render();
      openButton.click();
      await fixture.whenStable();

      (fixture.nativeElement.querySelector('#layout-menu .menu-header') as HTMLElement).click();
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('.layout-wrapper').classList).not.toContain('menu-open');
      expect(document.activeElement?.tagName).not.toBe('H1');
    });

    it('com a gaveta aberta, o Tab dá a volta dentro dela e não sai para toasts ou o diálogo global', async () => {
      const { fixture, menu, openButton } = await render();
      openButton.click();
      await fixture.whenStable();
      const focusables = Array.from(menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));
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

    it('no meio da gaveta o Tab segue o caminho normal (não é interceptado)', async () => {
      const { fixture, menu, openButton } = await render();
      openButton.click();
      await fixture.whenStable();
      const focusables = Array.from(menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));

      focusables[1].focus();
      const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      focusables[1].dispatchEvent(tab);

      expect(tab.defaultPrevented).toBeFalse();
    });

    it('no desktop (xl ou maior) o menu fica sempre acessível, sem inert', async () => {
      offCanvas = false;
      const { menu, page } = await render();

      expect(menu.hasAttribute('inert')).toBeFalse();
      expect(page.hasAttribute('inert')).toBeFalse();
    });
  });
});

describe('activeTicketsMenu', () => {
  it('ativa "Meus Chamados" na lista, no Novo Chamado e no detalhe', () => {
    expect(activeTicketsMenu('/tickets')).toBe('mine');
    expect(activeTicketsMenu('/tickets?page=2')).toBe('mine');
    expect(activeTicketsMenu('/tickets/novo')).toBe('mine');
    expect(activeTicketsMenu('/tickets/8cc6644c-af6d-4c71-bb70-74d713b42cf0')).toBe('mine');
  });

  it('ativa "Monitorar Chamados" no Monitor e no detalhe aberto a partir dele', () => {
    expect(activeTicketsMenu('/tickets/monitorar')).toBe('monitor');
    expect(activeTicketsMenu('/tickets/monitorar?status=1')).toBe('monitor');
    expect(activeTicketsMenu('/tickets/t1?from=monitor')).toBe('monitor');
  });

  it('não ativa nenhum item de chamados fora de /chamados', () => {
    expect(activeTicketsMenu('/dashboard')).toBeNull();
    expect(activeTicketsMenu('/usuarios')).toBeNull();
  });
});
