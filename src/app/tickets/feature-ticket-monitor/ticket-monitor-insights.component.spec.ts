import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TicketMonitorInsightsComponent } from './ticket-monitor-insights.component';

describe('TicketMonitorInsightsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketMonitorInsightsComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  it('mostra as três prévias de "Visão da Equipe", claramente marcadas como "Em breve"', async () => {
    const fixture = TestBed.createComponent(TicketMonitorInsightsComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Visão da Equipe');
    expect(text).toContain('Em breve');
    expect(text).toContain('Carga por atendente');
    expect(text).toContain('Setores mais críticos');
    expect(text).toContain('Atividade recente');
  });
});
