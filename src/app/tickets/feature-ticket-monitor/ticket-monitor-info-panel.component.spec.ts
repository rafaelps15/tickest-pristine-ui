import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TicketMonitorInfoPanelComponent } from './ticket-monitor-info-panel.component';
import { TicketAwaiting } from '../entities/ticket-awaiting';
import { TicketQuickInfoStore } from '../application/ticket-quick-info.store';
import { TicketMonitorItem } from '../entities/ticket-monitor-item';
import { TicketDetail } from '../entities/ticket';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { TicketSlaStatus } from '../entities/ticket-sla-status';
import { TicketSla } from '../entities/ticket-sla';

/** Prazo do dono ainda aberto (o relógio dos testes nunca chega lá). */
const FAR_FUTURE = '2999-01-01T00:00:00Z';

describe('TicketMonitorInfoPanelComponent', () => {
  const sla: TicketSla = { serverNowUtc: '2026-01-01T12:00:00Z', plan: { policyId: null, policyName: '', policyVersion: 1, calendarId: '', calendarName: '', isLegacy: false }, objectives: [] };
  const ticket: TicketMonitorItem = {
    id: 't1', title: 'Impressora não funciona', priority: TicketPriority.High, status: TicketStatus.Open,
    requesterId: 'u1', requesterName: 'Maria Silva', requesterEmail: 'maria@empresa.com',
    assignedToUserId: null, assignedToName: null, sectorId: 's1', sectorName: 'Suporte',
    createdAtUtc: '2026-01-01T12:00:00Z', dueAtUtc: '2026-01-02T12:00:00Z', slaWarningAtUtc: '2026-01-02T06:00:00Z',
    resolvedAtUtc: null, slaStatus: TicketSlaStatus.OnTime
  };

  let quickInfoStoreFake: { ticket: ReturnType<typeof signal<TicketDetail | undefined>>; state: ReturnType<typeof signal<{ loading: boolean; error: string | null }>>; reload: jasmine.Spy };

  beforeEach(async () => {
    quickInfoStoreFake = {
      ticket: signal<TicketDetail | undefined>(undefined),
      state: signal({ loading: false, error: null as string | null }),
      reload: jasmine.createSpy('reload')
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

  it('is a region labeled by the ticket title outside modal mode, and becomes a modal dialog in the overlay', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    const panel = fixture.nativeElement.querySelector('.info-panel') as HTMLElement;
    expect(panel.getAttribute('role')).toBe('region');
    expect(panel.hasAttribute('aria-modal')).toBeFalse();

    fixture.componentRef.setInput('modal', true);
    await fixture.whenStable();
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.getAttribute('aria-modal')).toBe('true');
  });

  it('in overlay mode, moves focus to the title on open, but does not steal it when the list reloads the same ticket', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('modal', true);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();

    const title = fixture.nativeElement.querySelector('#ticketInfoPanelTitle') as HTMLElement;
    expect(document.activeElement).toBe(title);

    const searchInput = document.createElement('input');
    document.body.appendChild(searchInput);
    searchInput.focus();
    fixture.componentRef.setInput('ticket', { ...ticket });
    await fixture.whenStable();
    expect(document.activeElement).toBe(searchInput);

    searchInput.remove();
    fixture.nativeElement.remove();
  });

  it('in modal mode, Tab on the last control goes back to the first and Shift+Tab on the first goes to the last', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('modal', true);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();

    const first = fixture.nativeElement.querySelector('button') as HTMLElement;
    const last = fixture.nativeElement.querySelector('a[href]') as HTMLElement;

    last.focus();
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(first);

    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(last);

    fixture.nativeElement.remove();
  });

  it('renders the instant fields received via @Input, without waiting for any fetch', async () => {
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

  it('shows the agent name when the ticket already has an assignee', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('ticket', { ...ticket, assignedToUserId: 'u2', assignedToName: 'Carlos Souza' });
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Carlos Souza');
  });

  it('shows the relative due date received from the screen, in red and bold when overdue, and whose turn it is', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('ticket', { ...ticket, waitingOn: TicketAwaiting.Agent });
    fixture.componentRef.setInput('dueRelative', 'venceu há 35 min');
    fixture.componentRef.setInput('overdue', true);
    await fixture.whenStable();

    const relative = Array.from(fixture.nativeElement.querySelectorAll('dd span') as NodeListOf<HTMLElement>)
      .find(span => span.textContent?.includes('venceu há 35 min'))!;
    expect(relative.classList).toContain('text-danger');
    expect(relative.classList).toContain('fw-semibold');
    expect(fixture.nativeElement.textContent).toContain('Aguardando');
    expect(fixture.nativeElement.textContent).toContain('Aguardando a equipe');
  });

  it('shows the resolution date only when the ticket has already been resolved', async () => {
    const fixture = createFixture();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).not.toContain('Resolvido em');

    fixture.componentRef.setInput('ticket', { ...ticket, resolvedAtUtc: '2026-01-03T10:00:00Z' });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Resolvido em');
  });

  it('shows a loading indicator while fetching the full description', async () => {
    quickInfoStoreFake.state.set({ loading: true, error: null });
    const fixture = createFixture();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.spinner-border')).toBeTruthy();
  });

  it('shows the full description when the fetch finishes', async () => {
    quickInfoStoreFake.ticket.set({
      id: 't1', title: ticket.title, description: 'Fumaça saindo da impressora.',
      priority: ticket.priority, status: ticket.status,
      openedByUserId: 'u1', openedByName: 'Maria Silva', canCancel: true, ownerCancelDeadlineUtc: FAR_FUTURE, assignedToUserId: null, assignedToName: null,
      sectorId: 's1', sectorName: 'Suporte',
      createdAtUtc: ticket.createdAtUtc, dueAtUtc: ticket.dueAtUtc, slaWarningAtUtc: ticket.slaWarningAtUtc,
      resolvedAtUtc: null, slaStatus: ticket.slaStatus, sla
    });
    const fixture = createFixture();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Fumaça saindo da impressora.');
  });

  it('shows the error message when the description fetch fails', async () => {
    quickInfoStoreFake.state.set({ loading: false, error: 'Você não tem acesso a este chamado.' });
    const fixture = createFixture();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Você não tem acesso a este chamado.');
  });

  it('emits "close" when clicking the close button', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    const closeSpy = jasmine.createSpy('close');
    fixture.componentInstance.close.subscribe(closeSpy);

    const closeButton = fixture.nativeElement.querySelector('button[aria-label="Fechar painel de informações do chamado"]') as HTMLButtonElement;
    closeButton.click();

    expect(closeSpy).toHaveBeenCalled();
  });

  it('the "Ver detalhes" link leads to the ticket with ?from=monitor', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/tickets/t1?from=monitor');
  });

  it('shows the assignment shortcuts only when the screen allows it, and notifies the screen on click', async () => {
    const fixture = createFixture();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).not.toContain('Atribuir a mim');

    fixture.componentRef.setInput('canAssignToMe', true);
    fixture.componentRef.setInput('canAssignResponsible', true);
    await fixture.whenStable();

    const assignToMe = jasmine.createSpy('assignToMe');
    const assignResponsible = jasmine.createSpy('assignResponsible');
    fixture.componentInstance.assignToMeClick.subscribe(assignToMe);
    fixture.componentInstance.assignResponsibleClick.subscribe(assignResponsible);
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>);
    buttons.find(button => button.textContent?.includes('Atribuir a mim'))!.click();
    buttons.find(button => button.textContent?.includes('responsável'))!.click();

    expect(assignToMe).toHaveBeenCalled();
    expect(assignResponsible).toHaveBeenCalled();
  });

  it('shows the SLA status that the row shows, when the screen passes one (the badge follows the clock)', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('slaStatus', TicketSlaStatus.Breached);
    await fixture.whenStable();

    const badges = [...fixture.nativeElement.querySelectorAll('.badge')].map(b => (b as HTMLElement).textContent?.trim());
    expect(badges).toContain('Atrasado');
    expect(badges).not.toContain('No prazo');
  });

  it('does not show a due date for a ticket without SLA, like the table', async () => {
    const fixture = TestBed.createComponent(TicketMonitorInfoPanelComponent);
    fixture.componentRef.setInput('ticket', { ...ticket, slaStatus: TicketSlaStatus.NotApplicable });
    await fixture.whenStable();

    const text = fixture.nativeElement.querySelector('.info-list').textContent as string;
    expect(text).toContain('Sem prazo de SLA');
    expect(text).not.toContain('02/01/2026');
  });

  it('with the description that failed, shows the error in a neutral tone and retries through the store', async () => {
    quickInfoStoreFake.state.set({ loading: false, error: 'Erro ao carregar os detalhes do chamado' });
    const fixture = createFixture();
    await fixture.whenStable();

    const error = [...fixture.nativeElement.querySelectorAll('p')].find(p => (p as HTMLElement).textContent?.includes('Erro ao carregar os detalhes')) as HTMLElement;
    expect(error.classList).not.toContain('text-danger');
    (error.querySelector('button') as HTMLButtonElement).click();

    expect(quickInfoStoreFake.reload).toHaveBeenCalled();
  });
});
