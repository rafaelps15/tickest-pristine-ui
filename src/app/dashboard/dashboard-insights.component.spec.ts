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

  it('mostra só os Alertas de SLA, sem card provisório "Em breve" sem dados', async () => {
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Alertas de SLA');
    expect(text).not.toContain('Atividade Recente');
    expect(text).not.toContain('Em breve');
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
    expect(fixture.nativeElement.textContent).not.toContain('Nenhum ticket com SLA vencido ou em risco agora.');
  });

  it('mostra a mensagem de vazio quando não há chamados em risco de SLA', async () => {
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Nenhum ticket com SLA vencido ou em risco agora.');
  });

  it('lista os chamados em risco de SLA recebidos, com link pro detalhe', async () => {
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    fixture.componentRef.setInput('criticalTickets', [ticket]);
    await fixture.whenStable();

    const link = fixture.nativeElement.querySelector('.critical-ticket-link') as HTMLAnchorElement;
    expect(link.textContent).toContain('Chamado urgente');
    // A linha inteira (setor + prazo) fica dentro do link — alvo de toque maior que só o título.
    expect(link.textContent).toContain('TI · prazo');
    expect(link.getAttribute('href')).toBe('/tickets/t1');
  });

  it('marca cada chamado como "Vencido" ou "Em risco" com texto, não só com cor', async () => {
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    fixture.componentRef.setInput('criticalTickets', [{ ...ticket, id: 't0', slaStatus: TicketSlaStatus.Breached }, ticket]);
    await fixture.whenStable();

    const badges = Array.from(fixture.nativeElement.querySelectorAll('.critical-ticket-link .badge') as NodeListOf<HTMLElement>)
      .map(b => b.textContent?.trim());
    expect(badges).toEqual(['Vencido', 'Em risco']);
  });

  it('mostra os totais de vencidos e em risco da empresa, cada um levando à fila filtrada por esse SLA', async () => {
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    fixture.componentRef.setInput('criticalTickets', [ticket]);
    fixture.componentRef.setInput('breachedCount', 7);
    fixture.componentRef.setInput('atRiskCount', 1);
    await fixture.whenStable();

    const [breached, atRisk] = Array.from(fixture.nativeElement.querySelectorAll('.sla-total') as NodeListOf<HTMLAnchorElement>);
    expect(breached.textContent).toContain('7');
    expect(breached.textContent).toContain('vencidos');
    expect(breached.getAttribute('href')).toBe(`/tickets/monitorar?slaStatus=${TicketSlaStatus.Breached}`);
    expect(atRisk.textContent).toContain('1');
    expect(atRisk.getAttribute('href')).toBe(`/tickets/monitorar?slaStatus=${TicketSlaStatus.AtRisk}`);
  });
});
