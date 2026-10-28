import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { TicketListComponent, formatLastActivity } from './ticket-list.component';
import { TicketsStore } from '../application/tickets.store';
import { Ticket } from '../entities/ticket';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { TicketSlaStatus } from '../entities/ticket-sla-status';
import { TicketStatusGroup } from '../entities/ticket-status-group';
import { ConfirmDialogService, SessionService, ToastService } from '../../shared';
import { DepartmentsStore } from '../../departments';

/** Data UTC a N minutos de agora, pra janela de cancelamento do dono nos testes. */
function minutesFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

describe('TicketListComponent', () => {
  const openTicket: Ticket = {
    id: 't1', title: 'Impressora não funciona', description: 'A impressora do 3º andar não imprime.',
    priority: TicketPriority.High, status: TicketStatus.Open, openedByUserId: 'u1', assignedToUserId: null,
    assignedToName: null, sectorId: 's1', sectorName: 'Helpdesk', createdAtUtc: '2026-01-01T12:00:00Z',
    dueAtUtc: '2026-01-02T12:00:00Z', slaStatus: TicketSlaStatus.OnTime, lastActivityAtUtc: '2026-01-01T12:00:00Z',
    canCancel: true, ownerCancelDeadlineUtc: minutesFromNow(8)
  };
  const resolvedTicket: Ticket = {
    id: 't2', title: 'Monitor com defeito', description: 'Tela piscando.',
    priority: TicketPriority.Low, status: TicketStatus.Resolved, openedByUserId: 'u1', assignedToUserId: 'u2',
    assignedToName: 'Ana Souza', sectorId: 's2', sectorName: 'Infraestrutura', createdAtUtc: '2026-01-02T12:00:00Z',
    dueAtUtc: '2026-01-03T12:00:00Z', slaStatus: TicketSlaStatus.Met, lastActivityAtUtc: '2026-01-02T15:00:00Z',
    canCancel: false, ownerCancelDeadlineUtc: '2026-01-02T12:15:00Z'
  };

  /** Cria um store falso com signals reais, para o template reagir como no store verdadeiro. */
  function createStoreFake() {
    const statusGroup = signal<TicketStatusGroup | null>(TicketStatusGroup.Active);
    const search = signal('');
    return {
      statusGroup,
      search,
      hasAnyTicket: signal<boolean | null>(true),
      setStatusGroup: jasmine.createSpy('setStatusGroup').and.callFake((value: TicketStatusGroup | null) => statusGroup.set(value)),
      setSearch: jasmine.createSpy('setSearch').and.callFake((value: string) => search.set(value.trim())),
      tickets: signal<Ticket[]>([openTicket]),
      state: signal({ data: [openTicket], loading: false, error: null as string | null }),
      currentPage: signal(1),
      currentPageSize: signal(20),
      total: signal(1),
      totalPages: signal(1),
      hasPreviousPage: signal(false),
      hasNextPage: signal(false),
      pendingTicketIds: signal<string[]>([]),
      loadError: signal<string | null>(null),
      mutationError: signal<string | null>(null),
      clearMutationError: jasmine.createSpy('clearMutationError'),
      loadForCurrentUser: jasmine.createSpy('loadForCurrentUser'),
      goToPage: jasmine.createSpy('goToPage'),
      setPageSize: jasmine.createSpy('setPageSize'),
      reopen: jasmine.createSpy('reopen'),
      update: jasmine.createSpy('update')
    };
  }

  let storeFake: ReturnType<typeof createStoreFake>;
  let confirmDialogServiceFake: { confirm: jasmine.Spy };
  let toastServiceFake: { show: jasmine.Spy };
  let sessionServiceFake: { hasPermission: jasmine.Spy };
  let departmentsStoreFake: { departments: ReturnType<typeof signal<{ name: string; sectors: unknown[] }[]>> };

  beforeEach(async () => {
    storeFake = createStoreFake();
    confirmDialogServiceFake = { confirm: jasmine.createSpy('confirm').and.returnValue(of(true)) };
    toastServiceFake = { show: jasmine.createSpy('show') };
    sessionServiceFake = { hasPermission: jasmine.createSpy('hasPermission').and.returnValue(false) };
    departmentsStoreFake = { departments: signal<{ name: string; sectors: unknown[] }[]>([]) };

    await TestBed.configureTestingModule({
      imports: [TicketListComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TicketsStore, useValue: storeFake },
        { provide: ConfirmDialogService, useValue: confirmDialogServiceFake },
        { provide: ToastService, useValue: toastServiceFake },
        { provide: SessionService, useValue: sessionServiceFake },
        { provide: DepartmentsStore, useValue: departmentsStoreFake }
      ]
    }).compileComponents();
  });

  it('carrega os chamados do usuário logado ao inicializar', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(storeFake.loadForCurrentUser).toHaveBeenCalled();
  });

  it('renderiza cada chamado com quem atende, setor, prazo com SLA, status e última atividade — sem a prioridade', async () => {
    storeFake.tickets.set([openTicket, resolvedTicket]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Impressora não funciona');
    expect(text).toContain('Aguardando atendimento');
    expect(text).toContain('Helpdesk');
    expect(text).toContain('Ana Souza');
    expect(text).toContain('No prazo');
    expect(text).toContain('Cumprido');
    expect(text).toContain('Aberto');
    expect(text).not.toContain('Alta');
    const time = fixture.nativeElement.querySelector('time') as HTMLTimeElement;
    expect(time.getAttribute('datetime')).toBe(openTicket.lastActivityAtUtc);
  });

  it('diz "Sem responsável" (e não "Aguardando atendimento") num chamado encerrado que ninguém assumiu', async () => {
    storeFake.tickets.set([{ ...resolvedTicket, assignedToName: null }]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Sem responsável');
    expect(fixture.nativeElement.textContent).not.toContain('Aguardando atendimento');
  });

  it('mostra o spinner enquanto carrega', async () => {
    storeFake.state.set({ data: [], loading: true, error: null });
    storeFake.tickets.set([]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.spinner-border')).not.toBeNull();
  });

  it('mostra o estado vazio de primeiro uso quando a pessoa não tem nenhum chamado', async () => {
    storeFake.tickets.set([]);
    storeFake.hasAnyTicket.set(false);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Nenhum chamado aberto ainda');
    const cta = fixture.nativeElement.querySelector('.first-use a.btn-primary') as HTMLAnchorElement;
    expect(cta.getAttribute('href')).toBe('/tickets/novo');
  });

  it('lista no estado vazio só os departamentos que têm setor para atender', async () => {
    storeFake.tickets.set([]);
    storeFake.hasAnyTicket.set(false);
    departmentsStoreFake.departments.set([
      { name: 'TI', sectors: [{}] },
      { name: 'RH', sectors: [{}] },
      { name: 'Jurídico', sectors: [] },
      { name: 'Financeiro', sectors: [{}] }
    ]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Atendem chamados: TI, RH e Financeiro.');
  });

  it('mostra a mensagem de erro de carregamento do store', async () => {
    storeFake.loadError.set('Erro ao carregar chamados');
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Erro ao carregar chamados');
  });

  it('recarrega os chamados ao clicar em "Tentar novamente" no alerta de erro', async () => {
    storeFake.loadError.set('Erro ao carregar chamados');
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    const retryButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(button => button.textContent?.includes('Tentar novamente'));
    retryButton?.click();

    expect(storeFake.loadForCurrentUser).toHaveBeenCalledTimes(2);
  });

  it('só mostra "Reabrir" para chamados inativos (Resolvido/Fechado/Cancelado)', async () => {
    storeFake.tickets.set([openTicket, resolvedTicket]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.canReopen(openTicket)).toBeFalse();
    expect(fixture.componentInstance.canReopen(resolvedTicket)).toBeTrue();
    expect(fixture.nativeElement.querySelectorAll('.dropdown-item.text-success').length).toBe(1);
  });

  it('leva ao detalhe pelo título do chamado, sem um botão "Ver detalhes" separado', async () => {
    storeFake.tickets.set([openTicket]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    const titleLink = fixture.nativeElement.querySelector('a.ticket-title') as HTMLAnchorElement;
    expect(titleLink.textContent?.trim()).toBe(openTicket.title);
    expect(titleLink.getAttribute('href')).toBe(`/tickets/${openTicket.id}`);
    expect(fixture.nativeElement.querySelector('.bx-show')).toBeNull();
  });

  it('reabre o chamado pelo modal, com o motivo informado, e fecha o modal em caso de sucesso', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onStartReopen(resolvedTicket);
    await fixture.whenStable();
    expect(storeFake.clearMutationError).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('app-ticket-reopen-dialog')).not.toBeNull();

    fixture.componentInstance.onReopenConfirm('O monitor voltou a piscar.');
    expect(storeFake.reopen).toHaveBeenCalledWith('t2', 'O monitor voltou a piscar.', jasmine.any(Function));

    storeFake.reopen.calls.mostRecent().args[2]();
    expect(toastServiceFake.show).toHaveBeenCalledWith('Chamado reaberto.');
    expect(fixture.componentInstance.reopeningTicket()).toBeNull();
  });

  it('não oferece "Excluir" ao solicitante', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.bx-trash')).toBeNull();
  });
  it('calcula o intervalo exibido no rodapé ("Exibindo X–Y de Z")', async () => {
    storeFake.currentPage.set(2);
    storeFake.currentPageSize.set(20);
    storeFake.total.set(45);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.card-footer').textContent).toContain('Exibindo 21–40 de');
  });

  it('usa reticências em vez de um botão por página quando há muitas páginas', async () => {
    storeFake.totalPages.set(50);
    storeFake.currentPage.set(25);
    storeFake.hasPreviousPage.set(true);
    storeFake.hasNextPage.set(true);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    const windowItems = Array.from(fixture.nativeElement.querySelectorAll('.btn-page-number, .page-ellipsis') as NodeListOf<HTMLElement>)
      .map(item => item.textContent?.trim());
    expect(windowItems).toEqual(['1', '…', '24', '25', '26', '…', '50']);
    expect(fixture.nativeElement.querySelectorAll('.card-footer button').length).toBeLessThan(10);
  });

  it('não mostra os controles de paginação quando há só uma página', async () => {
    storeFake.totalPages.set(1);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Anterior');
    expect(fixture.nativeElement.textContent).not.toContain('Próxima');
  });

  it('navega para a página clicada', async () => {
    storeFake.totalPages.set(3);
    storeFake.hasNextPage.set(true);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    const pageButtons = fixture.nativeElement.querySelectorAll('.card-footer button');
    const pageTwoButton = Array.from(pageButtons as NodeListOf<HTMLButtonElement>)
      .find(button => button.textContent?.trim() === '2');
    pageTwoButton?.click();

    expect(storeFake.goToPage).toHaveBeenCalledWith(2);
  });

  it('marca a página atual com aria-current', async () => {
    storeFake.totalPages.set(3);
    storeFake.currentPage.set(1);
    storeFake.hasNextPage.set(true);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    const pageButtons = Array.from(fixture.nativeElement.querySelectorAll('.card-footer button') as NodeListOf<HTMLButtonElement>);
    const pageOneButton = pageButtons.find(button => button.textContent?.trim() === '1');
    const pageTwoButton = pageButtons.find(button => button.textContent?.trim() === '2');

    expect(pageOneButton?.getAttribute('aria-current')).toBe('page');
    expect(pageTwoButton?.getAttribute('aria-current')).toBeNull();
  });

  it('desabilita as ações e troca o ícone do "⋮" por um spinner no chamado pendente', async () => {
    storeFake.tickets.set([openTicket, resolvedTicket]);
    storeFake.pendingTicketIds.set(['t2']);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.isPending(resolvedTicket)).toBeTrue();
    expect(fixture.componentInstance.isPending(openTicket)).toBeFalse();

    const reopenButton = fixture.nativeElement.querySelector('.dropdown-item.text-success') as HTMLButtonElement;
    expect(reopenButton.disabled).toBeTrue();
    const menuButtons = fixture.nativeElement.querySelectorAll('.btn-row-actions');
    expect(menuButtons[1].querySelector('.spinner-border')).not.toBeNull();
    expect(menuButtons[0].querySelector('.spinner-border')).toBeNull();
  });

  it('mostra Editar descrição/Cancelar chamado no "⋮" só para chamados ativos (Aberto/Em Andamento)', async () => {
    storeFake.tickets.set([openTicket, resolvedTicket]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.isActive(openTicket)).toBeTrue();
    expect(fixture.componentInstance.isActive(resolvedTicket)).toBeFalse();
    // Cada linha tem um único "⋮"; o do chamado ativo (t1) traz editar e cancelar, o do inativo (t2) só Reabrir.
    // O rótulo é lido sem a contagem da janela do dono ("por mais 8 min"), coberta em teste próprio.
    expect(fixture.nativeElement.querySelectorAll('.btn-row-actions').length).toBe(2);
    const itemLabels = Array.from(fixture.nativeElement.querySelectorAll('.dropdown-item') as NodeListOf<HTMLElement>)
      .map(item => {
        const clone = item.cloneNode(true) as HTMLElement;
        clone.querySelector('.cancel-hint')?.remove();
        return clone.textContent?.trim();
      });
    expect(itemLabels).toEqual(['Editar descrição', 'Cancelar chamado', 'Reabrir chamado']);
  });

  it('abre o modal de edição pré-carregando o chamado, e fecha sem salvar', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onStartEdit(openTicket);
    expect(fixture.componentInstance.editingTicket()).toBe(openTicket);

    fixture.componentInstance.onEditClosed();
    expect(fixture.componentInstance.editingTicket()).toBeNull();
  });

  it('salva a descrição editada no modal mantendo o status atual, e fecha a edição em caso de sucesso', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onStartEdit(openTicket);
    fixture.componentInstance.onEditSave('Descrição corrigida com mais detalhes.');

    expect(storeFake.update).toHaveBeenCalledWith('t1', { description: 'Descrição corrigida com mais detalhes.', status: TicketStatus.Open }, jasmine.any(Function));

    storeFake.update.calls.mostRecent().args[2]();
    expect(fixture.componentInstance.editingTicket()).toBeNull();
    expect(toastServiceFake.show).toHaveBeenCalledWith('Descrição atualizada.');
  });

  it('renderiza o modal de edição ao clicar em "Editar descrição"', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    const editButton = Array.from(fixture.nativeElement.querySelectorAll('.dropdown-item') as NodeListOf<HTMLButtonElement>)
      .find(item => item.textContent?.includes('Editar descrição'))!;
    editButton.click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-ticket-edit-dialog')).not.toBeNull();
  });

  it('cancela o chamado quando confirmado, preservando a descrição atual', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onCancelTicket(openTicket);

    // "Voltar" em vez de "Cancelar" ao lado de "Cancelar ticket", pra não ficar ambíguo.
    expect(confirmDialogServiceFake.confirm).toHaveBeenCalledWith(jasmine.objectContaining({ confirmLabel: 'Cancelar chamado', cancelLabel: 'Voltar' }));
    expect(storeFake.update).toHaveBeenCalledWith('t1', { description: openTicket.description, status: TicketStatus.Canceled }, jasmine.any(Function));

    storeFake.update.calls.mostRecent().args[2]();
    expect(toastServiceFake.show).toHaveBeenCalledWith('Chamado cancelado.');
  });

  it('não cancela o chamado quando a confirmação for cancelada', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(false));
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onCancelTicket(openTicket);

    expect(storeFake.update).not.toHaveBeenCalled();
  });

  it('muda o tamanho da página', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onPageSizeChange(50);

    expect(storeFake.setPageSize).toHaveBeenCalledWith(50);
  });

  it('mantém as linhas visíveis (só esmaecidas) ao recarregar com a lista já carregada', async () => {
    storeFake.state.set({ data: [openTicket], loading: true, error: null });
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Impressora não funciona');
    expect(fixture.nativeElement.querySelector('table').classList).toContain('is-refreshing');
  });

  it('mostra o erro de uma ação sem "Tentar novamente", e o dispensa pelo botão de fechar', async () => {
    storeFake.mutationError.set('Erro ao excluir o chamado');
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Erro ao excluir o chamado');
    expect(fixture.nativeElement.textContent).not.toContain('Tentar novamente');

    (fixture.nativeElement.querySelector('.alert .btn-close') as HTMLButtonElement).click();
    expect(storeFake.clearMutationError).toHaveBeenCalled();
  });

  it('descarta o erro de uma ação anterior ao abrir o modal de edição', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onStartEdit(openTicket);

    expect(storeFake.clearMutationError).toHaveBeenCalled();
  });

  it('mostra o status Cancelado em badge neutro, não no vermelho de alerta', async () => {
    storeFake.tickets.set([{ ...openTicket, status: TicketStatus.Canceled }]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    const badge = Array.from(fixture.nativeElement.querySelectorAll('.badge') as NodeListOf<HTMLElement>)
      .find(b => b.textContent?.trim() === 'Cancelado');
    expect(badge?.classList).toContain('bg-label-secondary');
  });

  it('mostra "Nada pendente" com atalho pros encerrados quando só "Em aberto" está vazio', async () => {
    storeFake.tickets.set([]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Nada pendente');
    expect(fixture.nativeElement.textContent).not.toContain('Nenhum chamado aberto ainda');
    const button = Array.from(fixture.nativeElement.querySelectorAll('.filtered-empty button') as NodeListOf<HTMLButtonElement>)
      .find(b => b.textContent?.includes('Ver encerrados'))!;
    button.click();
    expect(storeFake.setStatusGroup).toHaveBeenCalledWith(TicketStatusGroup.Finished);
  });

  it('mostra a busca sem resultado com "Limpar busca", que volta ao padrão', async () => {
    storeFake.tickets.set([]);
    // A busca vem da URL (a tela a aplica ao abrir), como quando a pessoa volta pelo navegador.
    await TestBed.inject(Router).navigateByUrl('/?q=impressora');
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Nenhum chamado com “impressora” no título');
    const button = Array.from(fixture.nativeElement.querySelectorAll('.filtered-empty button') as NodeListOf<HTMLButtonElement>)
      .find(b => b.textContent?.includes('Limpar busca'))!;
    button.click();
    expect(storeFake.setSearch).toHaveBeenCalledWith('');
    expect(storeFake.setStatusGroup).toHaveBeenCalledWith(TicketStatusGroup.Active);
  });

  it('mostra "Carregando…" enquanto a sondagem decide entre primeiro uso e nada pendente', async () => {
    storeFake.tickets.set([]);
    storeFake.hasAnyTicket.set(null);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Carregando chamados…');
    expect(fixture.nativeElement.textContent).not.toContain('Nada pendente');
  });

  it('troca o grupo pelo seletor e só mostra "Limpar filtros" fora do padrão', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.btn-clear-filters')).toBeNull();

    const finished = fixture.nativeElement.querySelector('#ticketStatusGroup-finished') as HTMLInputElement;
    finished.click();
    await fixture.whenStable();

    expect(storeFake.setStatusGroup).toHaveBeenCalledWith(TicketStatusGroup.Finished);
    expect(fixture.nativeElement.querySelector('.btn-clear-filters')).not.toBeNull();
  });

  it('aplica o grupo e a busca vindos da URL ao abrir a tela', async () => {
    await TestBed.inject(Router).navigateByUrl('/?status=finished&q=monitor');
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(storeFake.setStatusGroup).toHaveBeenCalledWith(TicketStatusGroup.Finished);
    expect(storeFake.setSearch).toHaveBeenCalledWith('monitor');
    expect((fixture.nativeElement.querySelector('#ticketSearch') as HTMLInputElement).value).toBe('monitor');
  });

  it('leva o filtro aplicado pra URL, sem o padrão (Em aberto, sem busca)', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();
    expect(router.url).toBe('/');

    storeFake.statusGroup.set(null);
    storeFake.search.set('monitor');
    await fixture.whenStable();

    expect(router.url).toBe('/?status=all&q=monitor');
  });

  it('busca pelo título só depois de a pessoa parar de digitar', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();
    storeFake.setSearch.calls.reset();
    const input = fixture.nativeElement.querySelector('#ticketSearch') as HTMLInputElement;

    input.value = 'impr';
    input.dispatchEvent(new Event('input'));
    expect(storeFake.setSearch).not.toHaveBeenCalled();

    await new Promise(resolve => setTimeout(resolve, 350));
    expect(storeFake.setSearch).toHaveBeenCalledWith('impr');
  });

  it('formata a última atividade em tempo relativo curto, e em data depois de uma semana', () => {
    const now = new Date('2026-01-10T12:00:00Z').getTime();

    expect(formatLastActivity('2026-01-10T11:59:40Z', now)).toBe('agora há pouco');
    expect(formatLastActivity('2026-01-10T12:00:30Z', now)).toBe('agora há pouco');
    expect(formatLastActivity('2026-01-10T11:25:00Z', now)).toBe('há 35 min');
    expect(formatLastActivity('2026-01-10T10:00:00Z', now)).toBe('há 2 h');
    expect(formatLastActivity('2026-01-09T10:00:00Z', now)).toBe('ontem');
    expect(formatLastActivity('2026-01-07T12:00:00Z', now)).toBe('há 3 dias');
    expect(formatLastActivity('2026-01-01T12:00:00Z', now)).toBe(new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date('2026-01-01T12:00:00Z')));
  });

  it('mostra "Cancelar chamado" com o tempo que falta pro dono, dentro da janela de 15 min', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    const cancel = Array.from(fixture.nativeElement.querySelectorAll('.dropdown-item') as NodeListOf<HTMLButtonElement>)
      .find(item => item.textContent?.includes('Cancelar chamado'))!;
    expect(cancel).toBeTruthy();
    expect(cancel.querySelector('.cancel-hint')?.textContent?.trim()).toBe('por mais 8 min');
  });

  it('esconde "Cancelar chamado" quando o back-end diz que não dá (canCancel = false)', async () => {
    storeFake.tickets.set([{ ...openTicket, canCancel: false }]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Cancelar chamado');
    expect(fixture.nativeElement.textContent).toContain('Editar descrição');
  });

  it('esconde "Cancelar chamado" do dono quando a janela já venceu, mesmo com canCancel desatualizado', async () => {
    storeFake.tickets.set([{ ...openTicket, ownerCancelDeadlineUtc: minutesFromNow(-1) }]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Cancelar chamado');
  });

  it('com tickets:cancel, mostra "Cancelar chamado" sem prazo e sem contagem', async () => {
    sessionServiceFake.hasPermission.and.callFake((code: string) => code === 'tickets:cancel');
    storeFake.tickets.set([{ ...openTicket, ownerCancelDeadlineUtc: minutesFromNow(-60) }]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Cancelar chamado');
    expect(fixture.nativeElement.querySelector('.cancel-hint')).toBeNull();
  });

  it('com erro de leitura e lista vazia, não mostra "Nada pendente" nem o primeiro uso — o erro não vira dado', async () => {
    storeFake.tickets.set([]);
    storeFake.hasAnyTicket.set(null);
    storeFake.loadError.set('Erro ao carregar chamados');
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Erro ao carregar chamados');
    expect(text).toContain('Não deu pra carregar seus chamados agora');
    expect(text).not.toContain('Nada pendente');
    expect(text).not.toContain('Nenhum chamado aberto ainda');
    expect(text).not.toContain('Carregando chamados…');
  });
});
