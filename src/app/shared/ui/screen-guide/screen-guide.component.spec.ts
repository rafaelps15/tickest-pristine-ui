import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { GuideSectionComponent, ScreenGuideComponent } from './screen-guide.component';

const STORAGE_KEY = 'tickest.testGuide.open';

/** Tela de teste que usa o Guia com uma seção e um parágrafo solto, como as telas reais. */
@Component({
  imports: [ScreenGuideComponent, GuideSectionComponent],
  template: `
    <app-screen-guide [storageKey]="storageKey" [defaultOpen]="defaultOpen()">
      <app-guide-section title="Status"><p>Legenda de status</p></app-guide-section>
      <app-guide-section title="Busca"><p>Como a busca funciona</p></app-guide-section>
    </app-screen-guide>
  `
})
class HostComponent {
  /** Chave de preferência usada pelo Guia de teste. */
  readonly storageKey = STORAGE_KEY;
  /** Estado inicial do Guia quando não há preferência salva. */
  readonly defaultOpen = signal(true);
}

describe('ScreenGuideComponent', () => {
  beforeEach(async () => {
    localStorage.removeItem(STORAGE_KEY);

    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  /** Corpo do Guia renderizado. */
  function body(fixture: { nativeElement: HTMLElement }): HTMLElement {
    return fixture.nativeElement.querySelector('.guide-body') as HTMLElement;
  }

  /** Botão de abrir/fechar do Guia. */
  function toggle(fixture: { nativeElement: HTMLElement }): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.guide-toggle') as HTMLButtonElement;
  }

  it('projects the sections, each with the title in an h2', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const titles = Array.from(fixture.nativeElement.querySelectorAll('h2.guide-section-title') as NodeListOf<HTMLElement>)
      .map(h => h.textContent?.trim());
    expect(titles).toEqual(['Status', 'Busca']);
    expect(body(fixture).textContent).toContain('Como a busca funciona');
  });

  it('starts open when there is no saved preference', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    expect(body(fixture).hidden).toBeFalse();
    expect(toggle(fixture).getAttribute('aria-expanded')).toBe('true');
  });

  it('opens only on the first visit: the next one starts closed, without the user having to close it', async () => {
    const first = TestBed.createComponent(HostComponent);
    await first.whenStable();
    expect(body(first).hidden).toBeFalse();
    first.destroy();

    const second = TestBed.createComponent(HostComponent);
    await second.whenStable();
    expect(body(second).hidden).toBeTrue();
  });

  it('respects the choice to keep it open on later visits', async () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    expect(body(fixture).hidden).toBeFalse();
  });

  it('respects defaultOpen=false when there is no saved preference', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.defaultOpen.set(false);
    await fixture.whenStable();

    expect(body(fixture).hidden).toBeTrue();
  });

  it('keeps the body in the DOM (only hidden), so the button aria-controls points to something that exists', async () => {
    localStorage.setItem(STORAGE_KEY, 'false');
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const controls = toggle(fixture).getAttribute('aria-controls');
    expect(fixture.nativeElement.querySelector(`#${controls}`)).toBe(body(fixture));
    expect(body(fixture).hidden).toBeTrue();
  });

  it('closes and opens when clicking the header, and persists the preference', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    toggle(fixture).click();
    await fixture.whenStable();
    expect(body(fixture).hidden).toBeTrue();
    expect(toggle(fixture).getAttribute('aria-expanded')).toBe('false');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');

    toggle(fixture).click();
    await fixture.whenStable();
    expect(body(fixture).hidden).toBeFalse();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
  });

  it('restores the Guia closed when the saved preference is "false"', async () => {
    localStorage.setItem(STORAGE_KEY, 'false');
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    expect(body(fixture).hidden).toBeTrue();
  });

  it('starts at the default even if reading localStorage fails', async () => {
    spyOn(Storage.prototype, 'getItem').and.throwError('bloqueado (ex.: modo privado)');
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    expect(body(fixture).hidden).toBeFalse();
  });

  it('does not break when toggling if writing to localStorage fails', async () => {
    spyOn(Storage.prototype, 'setItem').and.throwError('bloqueado (ex.: modo privado)');
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    expect(() => toggle(fixture).click()).not.toThrow();
    await fixture.whenStable();
    expect(body(fixture).hidden).toBeTrue();
  });
});
