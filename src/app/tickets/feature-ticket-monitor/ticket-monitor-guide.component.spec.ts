import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TicketMonitorGuideComponent } from './ticket-monitor-guide.component';

const STORAGE_KEY = 'tickest.ticketMonitorGuide.open';

describe('TicketMonitorGuideComponent', () => {
  beforeEach(async () => {
    localStorage.removeItem(STORAGE_KEY);

    await TestBed.configureTestingModule({
      imports: [TicketMonitorGuideComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  it('explica como ler a fila e mostra a legenda de SLA a partir das constantes compartilhadas', async () => {
    const fixture = TestBed.createComponent(TicketMonitorGuideComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('a tela abre nos chamados ativos');
    expect(text).toContain('vence em 2h');
    expect(text).toContain('No prazo');
    expect(text).toContain('Sem SLA');
    expect(text).toContain('Dentro do prazo de atendimento definido pelo SLA.');
  });

  it('lembra a preferência aberto/fechado na chave própria da tela', async () => {
    const fixture = TestBed.createComponent(TicketMonitorGuideComponent);
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('.guide-toggle') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
  });
});
