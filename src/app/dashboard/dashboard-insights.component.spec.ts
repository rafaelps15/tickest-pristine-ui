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
    expect(fixture.nativeElement.textContent).not.toContain('Nenhum chamado atrasado ou em risco agora.');
  });

  it('mostra a mensagem de vazio quando não há chamados em risco de SLA', async () => {
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Nenhum chamado atrasado ou em risco agora.');
    expect(fixture.nativeElement.textContent).toContain('Fila em dia');
  });

  it('lista os chamados em risco de SLA recebidos, com link pro detalhe', async () => {
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    fixture.componentRef.setInput('criticalTickets', [ticket]);
    await fixture.whenStable();

    const link = fixture.nativeElement.querySelector('.critical-ticket-link') as HTMLAnchorElement;
    expect(link.textContent).toContain('Chamado urgente');
    // A linha inteira (setor + prazo) fica dentro do link — alvo de toque maior que só o título.
    expect(link.textContent).toContain('TI ·');
    expect(link.getAttribute('href')).toBe('/tickets/t1');
  });

  it('diz quem atende cada alerta, e destaca quando não tem responsável', async () => {
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    fixture.componentRef.setInput('criticalTickets', [ticket, { ...ticket, id: 't2', assignedToUserId: null, assignedToName: null }]);
    await fixture.whenStable();

    const [assigned, unassigned] = Array.from(fixture.nativeElement.querySelectorAll('.critical-ticket-link') as NodeListOf<HTMLElement>);
    expect(assigned.textContent).toContain('Com Atendente');
    expect(unassigned.querySelector('.critical-ticket-unassigned')?.textContent?.trim()).toBe('Sem responsável');
  });

  it('oferece "Atribuir" só nos alertas sem responsável, fora do link, e emite o chamado', async () => {
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

  it('marca cada chamado como "Atrasado" ou "Em risco" com texto, não só com cor', async () => {
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

  it('mostra os totais de atrasados e em risco da empresa, cada um levando à fila filtrada por esse SLA', async () => {
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

  it('cor de alerta só quando há o que alertar: zero em risco fica neutro', async () => {
    const fixture = TestBed.createComponent(DashboardInsightsComponent);
    fixture.componentRef.setInput('criticalTickets', [{ ...ticket, slaStatus: TicketSlaStatus.Breached, dueAtUtc: new Date(Date.now() - 3_600_000).toISOString() }]);
    fixture.componentRef.setInput('breachedCount', 4);
    fixture.componentRef.setInput('atRiskCount', 0);
    await fixture.whenStable();

    const [breached, atRisk] = Array.from(fixture.nativeElement.querySelectorAll('.sla-total .stat-value') as NodeListOf<HTMLElement>);
    expect(breached.classList).toContain('text-danger');
    expect(atRisk.classList).not.toContain('text-warning');
  });

  describe('faixa', () => {
    it('com a fila em dia, vira a forma compacta, sem coluna de lista', async () => {
      const fixture = TestBed.createComponent(DashboardInsightsComponent);
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('.sla-band').classList).toContain('sla-band-quiet');
      expect(fixture.nativeElement.querySelector('.sla-band-list')).toBeNull();
    });

    it('com alertas, mostra a coluna da lista e define "em risco" junto dos totais', async () => {
      const fixture = TestBed.createComponent(DashboardInsightsComponent);
      fixture.componentRef.setInput('criticalTickets', [{ ...ticket, dueAtUtc: new Date(Date.now() + 3_600_000).toISOString() }]);
      await fixture.whenStable();

      const band = fixture.nativeElement.querySelector('.sla-band') as HTMLElement;
      expect(band.classList).not.toContain('sla-band-quiet');
      expect(band.querySelector('.sla-band-list .critical-ticket-link')).not.toBeNull();
      expect(band.querySelector('.sla-band-summary')!.textContent).toContain('Em risco: a partir de 75% do prazo');
    });
  });

  describe('atualidade da lista', () => {
    it('mostra a hora da última carga e pede atualização pelo botão', async () => {
      const fixture = TestBed.createComponent(DashboardInsightsComponent);
      fixture.componentRef.setInput('loadedAtMs', new Date(2026, 9, 27, 14, 32).getTime());
      const refresh = jasmine.createSpy('refresh');
      fixture.componentInstance.refresh.subscribe(refresh);
      await fixture.whenStable();

      expect(fixture.nativeElement.textContent).toContain('Toda a empresa · atualizado às 14:32');
      (fixture.nativeElement.querySelector('button[aria-label="Atualizar alertas de SLA"]') as HTMLButtonElement).click();
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    it('no escopo "Com filtros", diz que segue os filtros e leva a fila com eles', async () => {
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

    it('gira o botão e o marca indisponível enquanto atualiza (aria-disabled, sem tirar o foco), sem esconder a lista', async () => {
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

    it('com erro e uma nova tentativa carregando ao mesmo tempo, o aviso fica (sem o carregando do bloco) e não é recriado nem lido de novo; só o botão dele gira', async () => {
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

    it('quando o "Tentar novamente" dá certo, o foco (que cairia no início da página) vai pro título do card', async () => {
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

    it('se o "Tentar novamente" falha de novo, o foco fica no botão; uma atualização automática que dá certo depois não mexe no foco', async () => {
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

    it('oferece "Tentar novamente" no erro, que pede uma nova carga', async () => {
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

    it('ao voltar pra aba não pede dados sozinho: quem recarrega é a atualização automática do Início', async () => {
      const fixture = TestBed.createComponent(DashboardInsightsComponent);
      const refresh = jasmine.createSpy('refresh');
      fixture.componentInstance.refresh.subscribe(refresh);

      fixture.componentRef.setInput('loadedAtMs', Date.now() - 6 * 60_000);
      await fixture.whenStable();
      document.dispatchEvent(new Event('visibilitychange'));
      expect(refresh).not.toHaveBeenCalled();
    });
  });

  describe('prazo vivo', () => {
    const base = new Date('2026-10-27T12:00:00Z');

    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(base);
    });

    afterEach(() => jasmine.clock().uninstall());

    /** Item em risco que vence `ms` depois de `base`. */
    const dueIn = (ms: number): TicketMonitorItem => ({ ...ticket, dueAtUtc: new Date(base.getTime() + ms).toISOString() });

    it('mostra o prazo relativo ("vence em" / "venceu há"), pela hora do servidor', async () => {
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

    it('vira "Atrasado" sozinho ao cruzar o prazo, e anuncia a virada ao leitor de tela', async () => {
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

    it('não anuncia nada na carga inicial, mesmo com chamados já vencidos', async () => {
      const fixture = TestBed.createComponent(DashboardInsightsComponent);
      fixture.componentRef.setInput('criticalTickets', [dueIn(-60_000)]);
      fixture.detectChanges();

      expect((fixture.nativeElement.querySelector('[aria-live]') as HTMLElement).textContent?.trim()).toBe('');
    });
  });

  describe('formatSlaDuration', () => {
    it('formata em pt-BR curto, de minutos a dias', () => {
      expect(formatSlaDuration(20_000)).toBe('menos de 1 min');
      expect(formatSlaDuration(35 * 60_000)).toBe('35 min');
      expect(formatSlaDuration(2 * 3_600_000)).toBe('2h');
      expect(formatSlaDuration(2 * 3_600_000 + 14 * 60_000)).toBe('2h 14min');
      expect(formatSlaDuration(26 * 3_600_000)).toBe('1 dia');
      expect(formatSlaDuration(72 * 3_600_000)).toBe('3 dias');
    });
  });
});
