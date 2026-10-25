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

  it('mostra a legenda de prioridade, status e SLA a partir das constantes compartilhadas', async () => {
    const fixture = TestBed.createComponent(TicketMonitorGuideComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Baixa');
    expect(text).toContain('Urgente');
    expect(text).toContain('Aberto');
    expect(text).toContain('Cancelado');
    expect(text).toContain('No prazo');
    expect(text).toContain('Sem SLA');
    expect(text).toContain('Dentro do prazo de atendimento definido pelo SLA.');
  });

  it('começa aberto quando não há preferência salva', async () => {
    const fixture = TestBed.createComponent(TicketMonitorGuideComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#ticketMonitorGuideBody')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[aria-expanded="true"]')).toBeTruthy();
  });

  it('fecha e abre ao clicar no cabeçalho, e persiste a preferência', async () => {
    const fixture = TestBed.createComponent(TicketMonitorGuideComponent);
    await fixture.whenStable();

    const toggleButton = fixture.nativeElement.querySelector('.guide-toggle') as HTMLButtonElement;
    toggleButton.click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#ticketMonitorGuideBody')).toBeNull();
    expect(toggleButton.getAttribute('aria-expanded')).toBe('false');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');

    toggleButton.click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#ticketMonitorGuideBody')).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
  });

  it('restaura o painel fechado quando a preferência salva é "false"', async () => {
    localStorage.setItem(STORAGE_KEY, 'false');

    const fixture = TestBed.createComponent(TicketMonitorGuideComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#ticketMonitorGuideBody')).toBeNull();
  });

  it('começa aberto mesmo que a leitura do localStorage falhe', async () => {
    spyOn(Storage.prototype, 'getItem').and.throwError('bloqueado (ex.: modo privado)');

    const fixture = TestBed.createComponent(TicketMonitorGuideComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#ticketMonitorGuideBody')).toBeTruthy();
  });

  it('não quebra ao alternar quando a escrita no localStorage falha', async () => {
    spyOn(Storage.prototype, 'setItem').and.throwError('bloqueado (ex.: modo privado)');
    const fixture = TestBed.createComponent(TicketMonitorGuideComponent);
    await fixture.whenStable();

    const toggleButton = fixture.nativeElement.querySelector('.guide-toggle') as HTMLButtonElement;
    expect(() => toggleButton.click()).not.toThrow();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#ticketMonitorGuideBody')).toBeNull();
  });
});
