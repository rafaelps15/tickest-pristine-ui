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

  it('explains how to read the queue and shows the SLA legend from the shared constants', async () => {
    const fixture = TestBed.createComponent(TicketMonitorGuideComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('a tela abre nos chamados ativos');
    expect(text).toContain('vence em 2h');
    expect(text).toContain('No prazo');
    expect(text).toContain('Sem SLA');
    expect(text).toContain('Dentro do prazo de atendimento definido pelo SLA.');
  });

  it('remembers the open/closed preference under the screen own key', async () => {
    const fixture = TestBed.createComponent(TicketMonitorGuideComponent);
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('.guide-toggle') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
  });
});
