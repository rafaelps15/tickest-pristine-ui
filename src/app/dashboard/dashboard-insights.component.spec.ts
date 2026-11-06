import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { DashboardInsightsComponent } from './dashboard-insights.component';
import { formatSlaDuration } from '../shared';
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
    // O relógio do card só anda com a aba visível; a janela do Karma pode estar oculta/em segundo
    // plano, então a visibilidade é fixada aqui em vez de depender de onde o navegador de teste está.
    spyOnProperty(document, 'hidden', 'get').and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [DashboardInsightsComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])]
    }).compileComponents();
  });

  it('shows only the SLA Alerts, with no provisional "Em breve" card without data', async () => {
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Alertas de SLA');
    expect(text).not.toContain('Atividade Recente');
    expect(text).not.toContain('Em breve');
  });

  it('shows the spinner while the SLA alerts load', async () => {
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    fixture.componentRef.setInput('loading', true);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.spinner-border')).toBeTruthy();
  });

  it('shows the error message, instead of the list, when the fetch fails', async () => {
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    fixture.componentRef.setInput('error', 'Erro ao carregar os alertas de SLA');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Erro ao carregar os alertas de SLA');
    expect(fixture.nativeElement.textContent).not.toContain('Nenhum chamado atrasado ou em risco agora.');
  });

  it('shows the empty message when there are no tickets at SLA risk', async () => {
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Nenhum chamado atrasado ou em risco agora.');
    expect(fixture.nativeElement.textContent).toContain('Fila em dia');
  });

  it('lists the received tickets at SLA risk, with a link to the detail', async () => {
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    fixture.componentRef.setInput('criticalTickets', [ticket]);
    await fixture.whenStable();

    const link = fixture.nativeElement.querySelector('.critical-ticket-link') as HTMLAnchorElement;
    expect(link.textContent).toContain('Chamado urgente');
    // A linha inteira (setor + prazo) fica dentro do link — alvo de toque maior que só o título.
    expect(link.textContent).toContain('TI ·');
    expect(link.getAttribute('href')).toBe('/tickets/t1');
  });

  it('says who handles each alert, and highlights when there is no assignee', async () => {
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    fixture.componentRef.setInput('criticalTickets', [ticket, { ...ticket, id: 't2', assignedToUserId: null, assignedToName: null }]);
    await fixture.whenStable();

    const [assigned, unassigned] = Array.from(fixture.nativeElement.querySelectorAll('.critical-ticket-link') as NodeListOf<HTMLElement>);
    expect(assigned.textContent).toContain('Com Atendente');
    expect(unassigned.querySelector('.critical-ticket-unassigned')?.textContent?.trim()).toBe('Sem responsável');
  });

  it('does not offer "Atribuir" without the permission to assign to another person', async () => {
    const orphan = { ...ticket, id: 't2', title: 'Sem dono', assignedToUserId: null, assignedToName: null };
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    fixture.componentRef.setInput('criticalTickets', [orphan]);
    fixture.componentRef.setInput('canAssign', false);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('.critical-ticket-assign').length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('Sem responsável');
  });

  it('offers "Atribuir" only on alerts without an assignee, outside the link, and emits the ticket', async () => {
    const orphan = { ...ticket, id: 't2', title: 'Sem dono', assignedToUserId: null, assignedToName: null };
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    fixture.componentRef.setInput('criticalTickets', [ticket, orphan]);
    const assign = jasmine.createSpy('assign');
    fixture.componentInstance.assign.subscribe(assign);
    await fixture.whenStable();

    const buttons = fixture.nativeElement.querySelectorAll('.critical-ticket-assign') as NodeListOf<HTMLButtonElement>;
    expect(buttons.length).toBe(1);
    expect(buttons[0].closest('a')).toBeNull(); // nada interativo dentro do link da linha
    expect(buttons[0].getAttribute('aria-label')).toBe('Atribuir responsável ao chamado Sem dono');

    buttons[0].click();
    expect(assign).toHaveBeenCalledWith(orphan);
  });

  it('to whoever works the queue without tickets:assign, offers "Atribuir a mim" on alerts without an assignee and emits the ticket', async () => {
    const orphan = { ...ticket, id: 't2', title: 'Sem dono', assignedToUserId: null, assignedToName: null };
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    fixture.componentRef.setInput('criticalTickets', [ticket, orphan]);
    fixture.componentRef.setInput('canAssign', false);
    fixture.componentRef.setInput('canAssignToMe', true);
    const assignToMe = jasmine.createSpy('assignToMe');
    fixture.componentInstance.assignToMe.subscribe(assignToMe);
    await fixture.whenStable();

    const buttons = fixture.nativeElement.querySelectorAll('.critical-ticket-assign') as NodeListOf<HTMLButtonElement>;
    expect(buttons.length).toBe(1);
    expect(buttons[0].textContent?.trim()).toBe('Atribuir a mim');
    expect(buttons[0].getAttribute('aria-label')).toBe('Atribuir a mim o chamado Sem dono');
    expect(fixture.nativeElement.querySelector('button[aria-label^="Atribuir responsável"]')).toBeNull();

    buttons[0].click();
    expect(assignToMe).toHaveBeenCalledWith(orphan);

    fixture.componentRef.setInput('assigningToMe', true);
    await fixture.whenStable();
    expect(buttons[0].disabled).toBeTrue();
  });

  it('says the failure of "Atribuir a mim" in a live region that already exists, changing only its text', async () => {
    const orphan = { ...ticket, id: 't2', title: 'Sem dono', assignedToUserId: null, assignedToName: null };
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    fixture.componentRef.setInput('criticalTickets', [orphan]);
    fixture.componentRef.setInput('canAssign', false);
    fixture.componentRef.setInput('canAssignToMe', true);
    await fixture.whenStable();

    const region = fixture.nativeElement.querySelector('.sla-band-list [role="alert"]') as HTMLElement;
    expect(region.textContent?.trim()).toBe('');

    fixture.componentRef.setInput('assignToMeError', 'Você não tem permissão para atribuir o responsável deste chamado.');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.sla-band-list [role="alert"]')).toBe(region);
    expect(region.textContent).toContain('Você não tem permissão para atribuir o responsável deste chamado.');
  });

  it('marks each ticket as "Atrasado" or "Em risco" with text, not only with color', async () => {
    const inTwoHours = new Date(Date.now() + 2 * 3_600_000).toISOString();
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    fixture.componentRef.setInput('criticalTickets', [
      { ...ticket, id: 't0', slaStatus: TicketSlaStatus.Breached },
      { ...ticket, dueAtUtc: inTwoHours }
    ]);
    await fixture.whenStable();

    const badges = Array.from(fixture.nativeElement.querySelectorAll('.critical-ticket-link .badge') as NodeListOf<HTMLElement>)
      .map(b => b.textContent?.trim());
    expect(badges).toEqual(['Atrasado', 'Em risco']);
  });

  it('shows the company totals of overdue and at-risk tickets, each leading to the queue filtered by that SLA', async () => {
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    fixture.componentRef.setInput('criticalTickets', [{ ...ticket, dueAtUtc: new Date(Date.now() + 3_600_000).toISOString() }]);
    fixture.componentRef.setInput('breachedCount', 7);
    fixture.componentRef.setInput('atRiskCount', 1);
    await fixture.whenStable();

    const [breached, atRisk] = Array.from(fixture.nativeElement.querySelectorAll('.sla-total') as NodeListOf<HTMLAnchorElement>);
    expect(breached.textContent).toContain('7');
    expect(breached.textContent).toContain('atrasados');
    expect(breached.getAttribute('href')).toBe(`/tickets/monitorar?slaStatus=${TicketSlaStatus.Breached}`);
    expect(atRisk.textContent).toContain('1');
    expect(atRisk.getAttribute('href')).toBe(`/tickets/monitorar?slaStatus=${TicketSlaStatus.AtRisk}`);
  });

  it('alert color only when there is something to alert: zero at risk stays neutral', async () => {
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    fixture.componentRef.setInput('criticalTickets', [{ ...ticket, slaStatus: TicketSlaStatus.Breached, dueAtUtc: new Date(Date.now() - 3_600_000).toISOString() }]);
    fixture.componentRef.setInput('breachedCount', 4);
    fixture.componentRef.setInput('atRiskCount', 0);
    await fixture.whenStable();

    const [breached, atRisk] = Array.from(fixture.nativeElement.querySelectorAll('.sla-total .stat-value') as NodeListOf<HTMLElement>);
    expect(breached.classList).toContain('text-danger');
    expect(atRisk.classList).not.toContain('text-warning');
  });

  describe('strip', () => {
    it('with the queue up to date, it becomes the compact form, with no list column', async () => {
      const fixture = TestBed.createComponent(DashboardInsightsComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('.sla-band').classList).toContain('sla-band-quiet');
      expect(fixture.nativeElement.querySelector('.sla-band-list')).toBeNull();
    });

    it('with alerts, it shows the list column and defines "em risco" next to the totals', async () => {
      const fixture = TestBed.createComponent(DashboardInsightsComponent);
      fixture.componentRef.setInput('criticalTickets', [{ ...ticket, dueAtUtc: new Date(Date.now() + 3_600_000).toISOString() }]);
      await fixture.whenStable();

      const band = fixture.nativeElement.querySelector('.sla-band') as HTMLElement;
      expect(band.classList).not.toContain('sla-band-quiet');
      expect(band.querySelector('.sla-band-list .critical-ticket-link')).not.toBeNull();
      expect(band.querySelector('.sla-band-summary')!.textContent).toContain('Em risco: a partir de 75% do prazo');
    });
  });

  describe('list freshness', () => {
    it('shows the time of the last load and asks for a refresh through the button', async () => {
      const fixture = TestBed.createComponent(DashboardInsightsComponent);
      fixture.componentRef.setInput('loadedAtMs', new Date(2026, 9, 27, 14, 32).getTime());
      const refresh = jasmine.createSpy('refresh');
      fixture.componentInstance.refresh.subscribe(refresh);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('Toda a empresa · atualizado às 14:32');
      (fixture.nativeElement.querySelector('button[aria-label="Atualizar alertas de SLA"]') as HTMLButtonElement).click();
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    it('in the "Com filtros" scope, says it follows the filters and takes the queue with them', async () => {
      const fixture = TestBed.createComponent(DashboardInsightsComponent);
      fixture.componentRef.setInput('criticalTickets', [ticket]);
      fixture.componentRef.setInput('showTotals', false);
      fixture.componentRef.setInput('filtered', true);
      fixture.componentRef.setInput('queueParams', { sectorId: ['s1'], status: 'active' });
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('Com os filtros');
      expect(fixture.nativeElement.textContent).not.toContain('Toda a empresa');
      const queue = Array.from(fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>).find(a => a.textContent?.includes('Ver a fila pelo prazo'))!;
      expect(queue.getAttribute('href')).toContain('sectorId=s1');
    });

    it('"Ver a fila pelo prazo" keeps the gap before the chevron with a margin on the icon, since the flex .tap-target drops the trailing space of the text', async () => {
      const fixture = TestBed.createComponent(DashboardInsightsComponent);
      fixture.componentRef.setInput('criticalTickets', [ticket]);
      fixture.componentRef.setInput('showTotals', false);
      await fixture.whenStable();

      const queue = Array.from(fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>).find(a => a.textContent?.includes('Ver a fila pelo prazo'))!;
      // A regra global do alvo de 24px (styles.css) faz do link um contêiner flex com qualquer ponteiro.
      expect(getComputedStyle(queue).display).toBe('inline-flex');
      const chevron = queue.querySelector('.bx-chevron-right') as HTMLElement;
      expect(chevron.classList).toContain('ms-1');
      expect(chevron.previousSibling?.textContent).toBe('Ver a fila pelo prazo');
    });

    it('spins the button and marks it unavailable while refreshing (aria-disabled, without dropping focus), without hiding the list', async () => {
      const fixture = TestBed.createComponent(DashboardInsightsComponent);
      fixture.componentRef.setInput('criticalTickets', [ticket]);
      fixture.componentRef.setInput('refreshing', true);
      const refresh = jasmine.createSpy('refresh');
      fixture.componentInstance.refresh.subscribe(refresh);
      await fixture.whenStable();

      const button = fixture.nativeElement.querySelector('button[aria-label="Atualizar alertas de SLA"]') as HTMLButtonElement;
      expect(button.disabled).toBeFalse();
      expect(button.getAttribute('aria-disabled')).toBe('true');
      button.click();
      expect(refresh).not.toHaveBeenCalled();
      expect(button.querySelector('.spinner-border')).not.toBeNull();
      expect(fixture.nativeElement.querySelectorAll('.critical-ticket-link').length).toBe(1);
    });

    it('with an error and a new attempt loading at the same time, the notice stays (without the block loading state) and is neither recreated nor announced again; only its button spins', async () => {
      const fixture = TestBed.createComponent(DashboardInsightsComponent);
      fixture.componentRef.setInput('error', 'Erro ao carregar os alertas de SLA');
      await fixture.whenStable();
      const alertBefore = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
      expect(alertBefore).not.toBeNull();

      // "Tentar novamente" ou a atualização automática: a nova tentativa carrega com o erro ainda valendo.
      fixture.componentRef.setInput('loading', true);
      await fixture.whenStable();

      const alertDuring = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
      expect(alertDuring).toBe(alertBefore);
      expect(fixture.nativeElement.textContent).not.toContain('Carregando alertas de SLA');
      expect(fixture.nativeElement.querySelectorAll('[role="alert"]').length).toBe(1);
      const retryButton = alertDuring.querySelector('button') as HTMLButtonElement;
      expect(retryButton.textContent).toContain('Tentando…');
      expect(retryButton.getAttribute('aria-disabled')).toBe('true');

      fixture.componentRef.setInput('loading', false);
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('[role="alert"]')).toBe(alertBefore);
      expect(retryButton.textContent).toContain('Tentar novamente');
    });

    it('when "Tentar novamente" succeeds, the focus (which would fall to the top of the page) goes to the card title', async () => {
      const fixture = TestBed.createComponent(DashboardInsightsComponent);
      fixture.componentRef.setInput('error', 'Erro ao carregar os alertas de SLA');
      document.body.appendChild(fixture.nativeElement);
      await fixture.whenStable();

      const retry = fixture.nativeElement.querySelector('[role="alert"] button') as HTMLButtonElement;
      retry.focus();
      retry.click();
      fixture.componentRef.setInput('loading', true);
      await fixture.whenStable();
      // A lista volta: o aviso (e o botão focado) sai da tela.
      fixture.componentRef.setInput('error', null);
      fixture.componentRef.setInput('loading', false);
      await fixture.whenStable();

      expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#slaAlertsTitle'));
      fixture.nativeElement.remove();
    });

    it('if "Tentar novamente" fails again, the focus stays on the button; a later automatic refresh that succeeds does not touch the focus', async () => {
      const fixture = TestBed.createComponent(DashboardInsightsComponent);
      fixture.componentRef.setInput('error', 'Erro ao carregar os alertas de SLA');
      document.body.appendChild(fixture.nativeElement);
      await fixture.whenStable();

      const retry = fixture.nativeElement.querySelector('[role="alert"] button') as HTMLButtonElement;
      retry.focus();
      retry.click();
      fixture.componentRef.setInput('loading', true);
      await fixture.whenStable();
      fixture.componentRef.setInput('loading', false);
      await fixture.whenStable();
      expect(document.activeElement).toBe(retry);

      // Depois a pessoa foi pra outro lugar; a atualização automática traz a lista.
      const elsewhere = document.createElement('button');
      document.body.appendChild(elsewhere);
      elsewhere.focus();
      fixture.componentRef.setInput('loading', true);
      await fixture.whenStable();
      fixture.componentRef.setInput('error', null);
      fixture.componentRef.setInput('loading', false);
      await fixture.whenStable();

      expect(document.activeElement).toBe(elsewhere);
      elsewhere.remove();
      fixture.nativeElement.remove();
    });

    it('offers "Tentar novamente" on error, which requests a new load', async () => {
      const fixture = TestBed.createComponent(DashboardInsightsComponent);
      fixture.componentRef.setInput('error', 'Erro ao carregar os alertas de SLA');
      const refresh = jasmine.createSpy('refresh');
      fixture.componentInstance.refresh.subscribe(refresh);
      await fixture.whenStable();

      const retry = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .find(b => b.textContent?.includes('Tentar novamente'))!;
      retry.click();
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    it('when returning to the tab it does not request data by itself: the automatic refresh of Início does the reloading', async () => {
      const fixture = TestBed.createComponent(DashboardInsightsComponent);
      const refresh = jasmine.createSpy('refresh');
      fixture.componentInstance.refresh.subscribe(refresh);

      fixture.componentRef.setInput('loadedAtMs', Date.now() - 6 * 60_000);
      await fixture.whenStable();
      document.dispatchEvent(new Event('visibilitychange'));
      expect(refresh).not.toHaveBeenCalled();
    });
  });

  describe('live deadline', () => {
    const base = new Date('2026-10-27T12:00:00Z');

    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(base);
    });

    afterEach(() => jasmine.clock().uninstall());

    /** Item em risco que vence `ms` depois de `base`. */
    const dueIn = (ms: number): TicketMonitorItem => ({ ...ticket, dueAtUtc: new Date(base.getTime() + ms).toISOString() });

    it('shows the relative deadline ("vence em" / "venceu há"), based on server time', async () => {
      const fixture = TestBed.createComponent(DashboardInsightsComponent);
      fixture.componentRef.setInput('criticalTickets', [dueIn(2 * 3_600_000 + 14 * 60_000), { ...dueIn(-35 * 60_000), id: 't2' }]);
      fixture.detectChanges();

      const times = Array.from(fixture.nativeElement.querySelectorAll('time') as NodeListOf<HTMLElement>).map(t => t.textContent?.trim());
      expect(times).toEqual(['vence em 2h 14min', 'venceu há 35 min']);

      // Servidor 1h à frente do navegador: o mesmo prazo fica 1h mais perto.
      fixture.componentRef.setInput('clockOffsetMs', 3_600_000);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('time').textContent.trim()).toBe('vence em 1h 14min');
    });

    it('becomes "Atrasado" by itself when crossing the deadline, and announces the change to the screen reader', async () => {
      const fixture = TestBed.createComponent(DashboardInsightsComponent);
      fixture.componentRef.setInput('criticalTickets', [dueIn(20_000)]);
      fixture.componentRef.setInput('breachedCount', 7);
      fixture.componentRef.setInput('atRiskCount', 2);
      fixture.detectChanges();

      const totals = () => Array.from(fixture.nativeElement.querySelectorAll('.sla-total .stat-value') as NodeListOf<HTMLElement>)
        .map(t => t.textContent?.trim());
      expect(totals()).toEqual(['7', '2']);

      const badge = () => (fixture.nativeElement.querySelector('.critical-ticket-link .badge') as HTMLElement).textContent?.trim();
      const live = () => (fixture.nativeElement.querySelector('[aria-live]') as HTMLElement).textContent?.trim();
      expect(badge()).toBe('Em risco');
      expect(live()).toBe('');

      jasmine.clock().tick(30_000);
      fixture.detectChanges();

      expect(badge()).toBe('Atrasado');
      expect(live()).toBe('O chamado "Chamado urgente" está atrasado.');
      // Realce breve na linha que acabou de vencer, que some depois de 1,6s.
      const link = () => fixture.nativeElement.querySelector('.critical-ticket-link') as HTMLElement;
      expect(link().classList).toContain('just-crossed');
      jasmine.clock().tick(1_600);
      fixture.detectChanges();
      expect(link().classList).not.toContain('just-crossed');
      // Os totais acompanham a virada, pra não dizer "2 em risco" com a lista já mostrando um vencido a mais.
      expect(totals()).toEqual(['8', '1']);
    });

    it('announces nothing on the initial load, even with tickets already overdue', async () => {
      const fixture = TestBed.createComponent(DashboardInsightsComponent);
      fixture.componentRef.setInput('criticalTickets', [dueIn(-60_000)]);
      fixture.detectChanges();

      expect((fixture.nativeElement.querySelector('[aria-live]') as HTMLElement).textContent?.trim()).toBe('');
    });
  });

  describe('formatSlaDuration', () => {
    it('formats in short pt-BR, from minutes to days', () => {
      expect(formatSlaDuration(20_000)).toBe('menos de 1 min');
      expect(formatSlaDuration(35 * 60_000)).toBe('35 min');
      expect(formatSlaDuration(2 * 3_600_000)).toBe('2h');
      expect(formatSlaDuration(2 * 3_600_000 + 14 * 60_000)).toBe('2h 14min');
      expect(formatSlaDuration(26 * 3_600_000)).toBe('1 dia');
      expect(formatSlaDuration(72 * 3_600_000)).toBe('3 dias');
    });
  });
});
