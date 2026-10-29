import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TicketMonitorInfoPanelComponent } from './ticket-monitor-info-panel.component';
import { TicketQuickInfoStore } from '../application/ticket-quick-info.store';
import { TicketMonitorItem } from '../entities/ticket-monitor-item';
import { TicketDetail } from '../entities/ticket';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { TicketSlaStatus } from '../entities/ticket-sla-status';
import { TicketSla } from '../entities/ticket-sla';

describe('TicketMonitorInfoPanelComponent', () => {
  const sla: TicketSla = { serverNowUtc: '2026-01-01T12:00:00Z', plan: { policyId: null, policyName: '', policyVersion: 1, calendarId: '', calendarName: '', isLegacy: false }, objectives: [] };
  const ticket: TicketMonitorItem = {
    id: 't1', title: 'Impressora não funciona', priority: TicketPriority.High, status: TicketStatus.Open,
    requesterId: 'u1', requesterName: 'Maria Silva', requesterEmail: 'maria@empresa.com',
    assignedToUserId: null, assignedToName: null, sectorId: 's1', sectorName: 'Suporte',
    createdAtUtc: '2026-01-01T12:00:00Z', dueAtUtc: '2026-01-02T12:00:00Z', slaWarningAtUtc: '2026-01-02T06:00:00Z',
    resolvedAtUtc: null, slaStatus: TicketSlaStatus.OnTime
  };

  let quickInfoStoreFake: { ticket: ReturnType<typeof signal<TicketDetail | undefined>>; state: ReturnType<typeof signal<{ loading: boolean; error: string | null }>> };

  beforeEach(async () => {
    quickInfoStoreFake = {
      ticket: signal<TicketDetail | undefined>(undefined),
      state: signal({ loading: false, error: null as string | null })
    };

    await TestBed.configureTestingModule({
      imports: [TicketMonitorInfoPanelComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TicketQuickInfoStore, useValue: quickInfoStoreFake }
      ]
    }).compileComponents();
  });

  function createFixture() {
    const fixture = TestBed.createComponent(TicketMonitorInfoPanelComponent);
    fixture.componentRef.setInput('ticket', ticket);
    return fixture;
  }

  it('renderiza os campos instantâneos recebidos por @Input, sem esperar nenhuma busca', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Impressora não funciona');
    expect(text).toContain('Maria Silva');
    expect(text).toContain('maria@empresa.com');
    expect(text).toContain('Não atribuído');
    expect(text).toContain('Suporte');
    expect(text).toContain('Alta');
    expect(text).toContain('Aberto');
    expect(text).toContain('No prazo');
  });

  it('mostra o nome do atendente quando o ticket já tem um responsável', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('ticket', { ...ticket, assignedToUserId: 'u2', assignedToName: 'Carlos Souza' });
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Carlos Souza');
  });

  it('mostra a data de resolução só quando o ticket já foi resolvido', async () => {
    const fixture = createFixture();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).not.toContain('Resolvido em');

    fixture.componentRef.setInput('ticket', { ...ticket, resolvedAtUtc: '2026-01-03T10:00:00Z' });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Resolvido em');
  });

  it('mostra um indicador de carregamento enquanto busca a descrição completa', async () => {
    quickInfoStoreFake.state.set({ loading: true, error: null });
    const fixture = createFixture();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.spinner-border')).toBeTruthy();
  });

  it('mostra a descrição completa quando a busca termina', async () => {
    quickInfoStoreFake.ticket.set({
      id: 't1', title: ticket.title, description: 'Fumaça saindo da impressora.',
      priority: ticket.priority, status: ticket.status,
      openedByUserId: 'u1', openedByName: 'Maria Silva', assignedToUserId: null, assignedToName: null,
      sectorId: 's1', sectorName: 'Suporte',
      createdAtUtc: ticket.createdAtUtc, dueAtUtc: ticket.dueAtUtc, slaWarningAtUtc: ticket.slaWarningAtUtc,
      resolvedAtUtc: null, slaStatus: ticket.slaStatus, sla
    });
    const fixture = createFixture();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Fumaça saindo da impressora.');
  });

  it('mostra a mensagem de erro quando a busca da descrição falha', async () => {
    quickInfoStoreFake.state.set({ loading: false, error: 'Você não tem acesso a este ticket.' });
    const fixture = createFixture();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Você não tem acesso a este ticket.');
  });

  it('emite "close" ao clicar no botão de fechar', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    const closeSpy = jasmine.createSpy('close');
    fixture.componentInstance.close.subscribe(closeSpy);

    const closeButton = fixture.nativeElement.querySelector('button[aria-label="Fechar painel de informações do ticket"]') as HTMLButtonElement;
    closeButton.click();

    expect(closeSpy).toHaveBeenCalled();
  });

  it('o link "Ver detalhes completos" leva pro ticket com ?from=monitor', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/tickets/t1?from=monitor');
  });
});
