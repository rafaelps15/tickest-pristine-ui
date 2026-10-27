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

  it('projeta as seções, cada uma com o título num h2', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const titles = Array.from(fixture.nativeElement.querySelectorAll('h2.guide-section-title') as NodeListOf<HTMLElement>)
      .map(h => h.textContent?.trim());
    expect(titles).toEqual(['Status', 'Busca']);
    expect(body(fixture).textContent).toContain('Como a busca funciona');
  });

  it('começa aberto quando não há preferência salva', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    expect(body(fixture).hidden).toBeFalse();
    expect(toggle(fixture).getAttribute('aria-expanded')).toBe('true');
  });

  it('respeita defaultOpen=false quando não há preferência salva', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.defaultOpen.set(false);
    await fixture.whenStable();

    expect(body(fixture).hidden).toBeTrue();
  });

  it('mantém o corpo no DOM (só escondido), pro aria-controls do botão apontar pra algo que existe', async () => {
    localStorage.setItem(STORAGE_KEY, 'false');
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const controls = toggle(fixture).getAttribute('aria-controls');
    expect(fixture.nativeElement.querySelector(`#${controls}`)).toBe(body(fixture));
    expect(body(fixture).hidden).toBeTrue();
  });

  it('fecha e abre ao clicar no cabeçalho, e persiste a preferência', async () => {
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

  it('restaura o Guia fechado quando a preferência salva é "false"', async () => {
    localStorage.setItem(STORAGE_KEY, 'false');
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    expect(body(fixture).hidden).toBeTrue();
  });

  it('começa no padrão mesmo que a leitura do localStorage falhe', async () => {
    spyOn(Storage.prototype, 'getItem').and.throwError('bloqueado (ex.: modo privado)');
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    expect(body(fixture).hidden).toBeFalse();
  });

  it('não quebra ao alternar quando a escrita no localStorage falha', async () => {
    spyOn(Storage.prototype, 'setItem').and.throwError('bloqueado (ex.: modo privado)');
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    expect(() => toggle(fixture).click()).not.toThrow();
    await fixture.whenStable();
    expect(body(fixture).hidden).toBeTrue();
  });
});
