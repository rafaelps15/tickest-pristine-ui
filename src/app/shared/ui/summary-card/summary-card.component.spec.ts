import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { SummaryCardComponent } from './summary-card.component';

/** Tela de teste com um Resumo cujo conteúdo é um número. */
@Component({
  imports: [SummaryCardComponent],
  template: `
    <app-summary-card [loading]="loading()" [failed]="failed()">
      <div class="insights-section"><div class="insights-stat">7</div><p>funções</p></div>
    </app-summary-card>
  `
})
class HostComponent {
  /** A lista de origem está carregando. */
  readonly loading = signal(false);
  /** A lista de origem falhou. */
  readonly failed = signal(false);
}

describe('SummaryCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  it('mostra os números projetados sob o título "Resumo" (h2)', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h2').textContent).toContain('Resumo');
    expect(fixture.nativeElement.querySelector('.insights-stat').textContent).toBe('7');
  });

  it('mostra "—" e "Carregando" no lugar dos números enquanto a lista carrega', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.loading.set(true);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.insights-stat').textContent).toBe('—');
    expect(fixture.nativeElement.textContent).toContain('Carregando o resumo');
    expect(fixture.nativeElement.textContent).not.toContain('funções');
  });

  it('mostra "—" e "indisponível" quando a lista falhou, nunca um 0', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.failed.set(true);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.insights-stat').textContent).toBe('—');
    expect(fixture.nativeElement.textContent).toContain('Resumo indisponível');
  });
});
