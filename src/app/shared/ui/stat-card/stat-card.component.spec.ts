import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { StatCardComponent } from './stat-card.component';

/** Tela de teste com um card de filtro (pressed) e um card só de leitura. */
@Component({
  imports: [StatCardComponent],
  template: `
    <app-stat-card id="filter" label="Em Risco" [value]="value()" hint="Perto de vencer" icon="bx-error-circle" tone="warning"
                   [loading]="loading()" [failed]="failed()" [pressed]="pressed()" (press)="presses = presses + 1" />
    <app-stat-card id="plain" label="Total" [value]="10" />
    <app-stat-card id="compact" label="Em aberto" [value]="2" [compact]="true" />
  `
})
class HostComponent {
  /** Número exibido no card de filtro. */
  readonly value = signal<number | null>(4);
  /** O resumo está carregando. */
  readonly loading = signal(false);
  /** O resumo falhou. */
  readonly failed = signal(false);
  /** Se o filtro do card está ativo. */
  readonly pressed = signal<boolean | null>(false);
  /** Quantas vezes o card foi acionado. */
  presses = 0;
}

describe('StatCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  /** Card de filtro renderizado. */
  function filterCard(fixture: { nativeElement: HTMLElement }): HTMLElement {
    return fixture.nativeElement.querySelector('#filter') as HTMLElement;
  }

  it('mostra rótulo, número no tom do card (num div, não heading), legenda e ícone decorativo', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const card = filterCard(fixture);
    const value = card.querySelector('.stat-value') as HTMLElement;
    expect(value.tagName).toBe('DIV');
    expect(value.textContent?.trim()).toBe('4');
    expect(value.classList).toContain('text-warning');
    expect(card.textContent).toContain('Perto de vencer');
    expect(card.querySelector('.kpi-icon')?.getAttribute('aria-hidden')).toBe('true');
    expect(card.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
  });

  it('tamanho padrão do número continua o mesmo; o compacto desce um passo (apoio abaixo de números maiores)', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const plain = fixture.nativeElement.querySelector('#plain .stat-value') as HTMLElement;
    const compact = fixture.nativeElement.querySelector('#compact .stat-value') as HTMLElement;
    expect(plain.classList).toContain('fs-3');
    expect(compact.classList).toContain('fs-4');
    expect(compact.classList).not.toContain('fs-3');
  });

  it('mostra spinner enquanto carrega e "—"/indisponível quando falhou, nunca um 0', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.loading.set(true);
    await fixture.whenStable();
    expect(filterCard(fixture).querySelector('.spinner-border[role="status"]')).not.toBeNull();

    fixture.componentInstance.loading.set(false);
    fixture.componentInstance.failed.set(true);
    await fixture.whenStable();
    expect(filterCard(fixture).querySelector('.stat-value')?.textContent).toContain('—');
    expect(filterCard(fixture).textContent).toContain('indisponível');
  });

  it('no modo filtro, vira um botão aria-pressed sobre o card inteiro que avisa ao ser clicado', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const press = filterCard(fixture).querySelector('button.stat-press') as HTMLButtonElement;
    expect(press.classList).toContain('stretched-link');
    expect(press.getAttribute('aria-pressed')).toBe('false');
    press.click();
    expect(fixture.componentInstance.presses).toBe(1);

    fixture.componentInstance.pressed.set(true);
    await fixture.whenStable();
    expect(press.getAttribute('aria-pressed')).toBe('true');
    expect(filterCard(fixture).classList).toContain('card-stats-pressed');
  });

  it('sem pressed, não tem botão nem realce de card clicável (sem afordância falsa)', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const plain = fixture.nativeElement.querySelector('#plain') as HTMLElement;
    expect(plain.querySelector('button')).toBeNull();
    expect(plain.classList).not.toContain('card-stats-clickable');
  });
  it('zero fica neutro (sem a cor do tom) e o número tem separador de milhar', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.value.set(0);
    await fixture.whenStable();
    expect((filterCard(fixture).querySelector('.stat-value') as HTMLElement).classList).not.toContain('text-warning');

    fixture.componentInstance.value.set(1240);
    await fixture.whenStable();
    const value = filterCard(fixture).querySelector('.stat-value') as HTMLElement;
    expect(value.textContent?.trim()).toBe('1.240');
    expect(value.classList).toContain('text-warning');
  });
});
