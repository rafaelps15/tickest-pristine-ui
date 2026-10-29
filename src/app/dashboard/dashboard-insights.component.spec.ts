import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { DashboardInsightsComponent } from './dashboard-insights.component';
import { TicketMonitorItem, TicketSlaStatus, TicketPriority, TicketStatus } from '../tickets';

const ticket: TicketMonitorItem = {
  id: 't1', title: 'Chamado urgente', priority: TicketPriority.High, status: TicketStatus.InProgress,
  requesterId: 'r1', requesterName: 'Fulano', requesterEmail: 'fulano@empresa.com',
  assignedToUserId: 'u1', assignedToName: 'Atendente', sectorId: 's1', sectorName: 'TI',
  createdAtUtc: '2026-01-01T12:00:00Z', dueAtUtc: '2026-01-02T12:00:00Z', slaWarningAtUtc: '2026-01-02T06:00:00Z',
  resolvedAtUtc: null, slaStatus: TicketSlaStatus.AtRisk
};

describe('DashboardInsightsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardInsightsComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])]
    }).compileComponents();
  });

  it('mostra o card "Atividade Recente" claramente marcado como "Em breve"', async () => {
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Atividade Recente');
    expect(text).toContain('Em breve');
  });

  it('mostra o spinner enquanto carrega os alertas de SLA', async () => {
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    fixture.componentRef.setInput('loading', true);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.spinner-border')).toBeTruthy();
  });

  it('mostra a mensagem de erro, em vez da lista, quando a busca falhar', async () => {
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    fixture.componentRef.setInput('error', 'Erro ao carregar os alertas de SLA');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Erro ao carregar os alertas de SLA');
    expect(fixture.nativeElement.textContent).not.toContain('Nenhum chamado em risco de SLA agora.');
  });

  it('mostra a mensagem de vazio quando não há chamados em risco de SLA', async () => {
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Nenhum chamado em risco de SLA agora.');
  });

  it('lista os chamados em risco de SLA recebidos, com link pro detalhe', async () => {
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    fixture.componentRef.setInput('criticalTickets', [ticket]);
    await fixture.whenStable();

    const link = fixture.nativeElement.querySelector('.critical-ticket-link') as HTMLAnchorElement;
    expect(link.textContent).toContain('Chamado urgente');
    expect(fixture.nativeElement.textContent).toContain('TI');
    expect(link.getAttribute('href')).toBe('/tickets/t1');
  });
});
