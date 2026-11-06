import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter, Router, UrlTree } from '@angular/router';
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
import { MyTicketsSummaryStore } from '../application/my-tickets-summary.store';

/** Data UTC a N minutos de agora, pra janela de cancelamento do dono nos testes. */
function minutesFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

/** Botões das ações da linha (à vista, sem "⋮"), com o texto sem a contagem da janela do dono. */
function rowActionLabels(root: HTMLElement): string[] {
  return Array.from(root.querySelectorAll('.row-actions-inline button') as NodeListOf<HTMLButtonElement>).map(button => {
    const clone = button.cloneNode(true) as HTMLElement;
    clone.querySelector('.cancel-hint')?.remove();
    return clone.textContent?.trim() ?? '';
  });
}

/** Primeiro botão das ações da linha com o texto informado. */
function rowAction(root: HTMLElement, text: string): HTMLButtonElement | undefined {
  return Array.from(root.querySelectorAll('.row-actions-inline button') as NodeListOf<HTMLButtonElement>)
    .find(button => button.textContent?.includes(text));
}

/** Permissões do perfil Solicitante, dono dos chamados desta lista. */
const OWNER_PERMISSIONS = (code: string) =>
  code === 'tickets:update-own' || code === 'tickets:reopen-own' || code === 'tickets:create' || code === 'tickets:view-own';

describe('TicketListComponent', () => {
  const openTicket: Ticket = {
    id: 't1', title: 'Impressora não funciona', description: 'A impressora do 3º andar não imprime.',
    priority: TicketPriority.High, status: TicketStatus.Open, openedByUserId: 'u1', assignedToUserId: null,
    assignedToName: null, sectorId: 's1', sectorName: 'Helpdesk', createdAtUtc: '2026-01-01T12:00:00Z',
    dueAtUtc: '2026-01-02T12:00:00Z', slaStatus: TicketSlaStatus.OnTime,
    currentDueAtUtc: '2026-01-02T12:00:00Z', currentSlaStatus: TicketSlaStatus.OnTime, lastActivityAtUtc: '2026-01-01T12:00:00Z',
    canCancel: true, ownerCancelDeadlineUtc: minutesFromNow(8)
  };
  const resolvedTicket: Ticket = {
    id: 't2', title: 'Monitor com defeito', description: 'Tela piscando.',
    priority: TicketPriority.Low, status: TicketStatus.Resolved, openedByUserId: 'u1', assignedToUserId: 'u2',
    assignedToName: 'Ana Souza', sectorId: 's2', sectorName: 'Infraestrutura', createdAtUtc: '2026-01-02T12:00:00Z',
    dueAtUtc: '2026-01-03T12:00:00Z', slaStatus: TicketSlaStatus.Met,
    currentDueAtUtc: '2026-01-03T12:00:00Z', currentSlaStatus: TicketSlaStatus.Met, lastActivityAtUtc: '2026-01-02T15:00:00Z',
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
  let summaryStoreFake: { activeCount: ReturnType<typeof signal<number | null>>; finishedCount: ReturnType<typeof signal<number | null>>; totalCount: ReturnType<typeof signal<number | null>>; reload: jasmine.Spy };
  let departmentsStoreFake: { departments: ReturnType<typeof signal<{ name: string; sectors: unknown[] }[]>> };

  beforeEach(async () => {
    storeFake = createStoreFake();
    confirmDialogServiceFake = { confirm: jasmine.createSpy('confirm').and.returnValue(of(true)) };
    toastServiceFake = { show: jasmine.createSpy('show') };
    sessionServiceFake = { hasPermission: jasmine.createSpy('hasPermission').and.callFake(OWNER_PERMISSIONS) };
    summaryStoreFake = { activeCount: signal<number | null>(3), finishedCount: signal<number | null>(5), totalCount: signal<number | null>(8), reload: jasmine.createSpy('reload') };
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
        { provide: MyTicketsSummaryStore, useValue: summaryStoreFake },
        { provide: DepartmentsStore, useValue: departmentsStoreFake }
      ]
    }).compileComponents();
  });

  it('loads the logged-in user\'s tickets on init', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(storeFake.loadForCurrentUser).toHaveBeenCalled();
    expect(summaryStoreFake.reload).toHaveBeenCalled();
  });

  it('renders each ticket with assignee, sector, due date as text, status and last activity, without the priority', async () => {
    storeFake.tickets.set([openTicket, resolvedTicket]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Impressora não funciona');
    expect(text).toContain('Aguardando atendimento');
    expect(text).toContain('Helpdesk');
    expect(text).toContain('Ana Souza');
    expect(text).toContain('No prazo');
    expect(text).toContain('Resolvido no prazo');
    expect(text).toContain('Aberto');
    expect(text).not.toContain('Alta');
    // O Status é a única pílula da linha; o prazo é texto com ícone.
    expect(fixture.nativeElement.querySelectorAll('tbody tr:first-child .badge').length).toBe(1);
    const time = fixture.nativeElement.querySelector('time') as HTMLTimeElement;
    expect(time.getAttribute('datetime')).toBe(openTicket.lastActivityAtUtc);
  });

  it('in a reopened ticket, the Prazo column shows the due date and status of the current cycle, not those of the first cycle', async () => {
    // Resolvido no prazo, reaberto: o primeiro ciclo continua "Met", o ciclo novo já passou do prazo.
    storeFake.tickets.set([{
      ...resolvedTicket, status: TicketStatus.Open,
      currentDueAtUtc: '2026-01-05T18:30:00Z', currentSlaStatus: TicketSlaStatus.Breached
    }]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    const due = fixture.nativeElement.querySelector('td[data-label="Prazo"]') as HTMLElement;
    expect(due.textContent).toContain('Atrasado');
    expect(due.textContent).not.toContain('Resolvido no prazo');
    expect(due.querySelector('.due-danger, .due')?.classList).toContain('due-danger');
    expect(due.querySelector('.due-date')?.textContent).toContain('05/01/2026');
    expect(due.querySelector('.due-date')?.textContent).toContain('venceu em');
  });

  it('says "Sem responsável" (and not "Aguardando atendimento") on a closed ticket that nobody took', async () => {
    storeFake.tickets.set([{ ...resolvedTicket, assignedToName: null }]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Sem responsável');
    expect(fixture.nativeElement.textContent).not.toContain('Aguardando atendimento');
  });

  it('shows the spinner while loading', async () => {
    storeFake.state.set({ data: [], loading: true, error: null });
    storeFake.tickets.set([]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.spinner-border')).not.toBeNull();
  });

  it('does not offer "Novo Chamado" without tickets:create, in the header nor in the first-use state', async () => {
    sessionServiceFake.hasPermission.and.callFake((code: string) => code === 'tickets:view-own');
    storeFake.tickets.set([]);
    storeFake.hasAnyTicket.set(false);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('a[href="/tickets/novo"]')).toBeNull();
  });

  it('shows the first-use empty state when the person has no tickets at all', async () => {
    storeFake.tickets.set([]);
    storeFake.hasAnyTicket.set(false);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Nenhum chamado aberto ainda');
    const cta = fixture.nativeElement.querySelector('.first-use a.btn-primary') as HTMLAnchorElement;
    expect(cta.getAttribute('href')).toBe('/tickets/novo');
  });

  it('lists in the empty state only the departments that have a sector to serve', async () => {
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

  it('shows the store loading error message', async () => {
    storeFake.loadError.set('Erro ao carregar chamados');
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Erro ao carregar chamados');
  });

  it('reloads the tickets when clicking "Tentar novamente" in the error alert', async () => {
    storeFake.loadError.set('Erro ao carregar chamados');
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    const retryButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(button => button.textContent?.includes('Tentar novamente'));
    retryButton?.click();

    expect(storeFake.loadForCurrentUser).toHaveBeenCalledTimes(2);
  });

  it('hides "Editar" and "Reabrir" from anyone without tickets:update-own or tickets:reopen-own (the API would respond 403)', async () => {
    sessionServiceFake.hasPermission.and.returnValue(false);
    storeFake.tickets.set([{ ...openTicket, canCancel: false }, resolvedTicket]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(rowActionLabels(fixture.nativeElement)).toEqual([]);
  });

  it('does not show "Reabrir" to the owner with tickets:manage but without tickets:reopen-own: the back end requires reopen-own from the owner', async () => {
    sessionServiceFake.hasPermission.and.callFake((code: string) => code === 'tickets:manage' || code === 'tickets:view-own');
    storeFake.tickets.set([resolvedTicket]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(rowActionLabels(fixture.nativeElement)).not.toContain('Reabrir');
  });

  it('only shows "Reabrir" for inactive tickets (Resolvido/Fechado/Cancelado)', async () => {
    storeFake.tickets.set([openTicket, resolvedTicket]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.canReopen(openTicket)).toBeFalse();
    expect(fixture.componentInstance.canReopen(resolvedTicket)).toBeTrue();
    expect(rowActionLabels(fixture.nativeElement).filter(label => label === 'Reabrir').length).toBe(1);
  });

  it('goes to the detail through the ticket title, without a separate "Ver detalhes" button', async () => {
    storeFake.tickets.set([openTicket]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    const titleLink = fixture.nativeElement.querySelector('a.ticket-title') as HTMLAnchorElement;
    expect(titleLink.textContent?.trim()).toBe(openTicket.title);
    expect(titleLink.getAttribute('href')).toBe(`/tickets/${openTicket.id}`);
    expect(fixture.nativeElement.querySelector('.bx-show')).toBeNull();
  });

  it('reopens the ticket through the modal, with the given reason, and closes the modal on success', async () => {
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

  it('does not offer "Excluir" to the requester', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.bx-trash')).toBeNull();
  });
  it('calculates the range shown in the footer ("Exibindo X–Y de Z")', async () => {
    storeFake.currentPage.set(2);
    storeFake.currentPageSize.set(20);
    storeFake.total.set(45);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.card-footer').textContent).toContain('Exibindo 21–40 de');
  });

  it('uses ellipses instead of one button per page when there are many pages', async () => {
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

  it('does not show the pagination controls when there is only one page', async () => {
    storeFake.totalPages.set(1);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Anterior');
    expect(fixture.nativeElement.textContent).not.toContain('Próxima');
  });

  it('navigates to the clicked page', async () => {
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

  it('marks the current page with aria-current', async () => {
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

  it('disables the actions and shows a spinner only on the row of the pending ticket', async () => {
    storeFake.tickets.set([openTicket, resolvedTicket]);
    storeFake.pendingTicketIds.set(['t2']);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.isPending(resolvedTicket)).toBeTrue();
    expect(fixture.componentInstance.isPending(openTicket)).toBeFalse();

    expect(rowAction(fixture.nativeElement, 'Reabrir')!.disabled).toBeTrue();
    const groups = fixture.nativeElement.querySelectorAll('.row-actions-inline');
    expect(groups[1].querySelector('.spinner-border')).not.toBeNull();
    expect(groups[1].getAttribute('aria-busy')).toBe('true');
    expect(groups[0].querySelector('.spinner-border')).toBeNull();
  });

  it('shows the actions on the row itself, without "⋮": Editar and Cancelar on active tickets, Reabrir on closed ones', async () => {
    storeFake.tickets.set([openTicket, resolvedTicket]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.isActive(openTicket)).toBeTrue();
    expect(fixture.componentInstance.isActive(resolvedTicket)).toBeFalse();
    expect(fixture.nativeElement.querySelector('.btn-row-actions')).toBeNull();
    expect(rowActionLabels(fixture.nativeElement)).toEqual(['Editar', 'Cancelar', 'Reabrir']);
    expect(rowAction(fixture.nativeElement, 'Editar')!.getAttribute('aria-label')).toBe('Editar a descrição do chamado ' + openTicket.title);
  });

  it('opens the edit modal preloading the ticket, and closes without saving', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onStartEdit(openTicket);
    expect(fixture.componentInstance.editingTicket()).toBe(openTicket);

    fixture.componentInstance.onEditClosed();
    expect(fixture.componentInstance.editingTicket()).toBeNull();
  });

  it('saves the description edited in the modal keeping the current status, and closes the edit on success', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onStartEdit(openTicket);
    fixture.componentInstance.onEditSave('Descrição corrigida com mais detalhes.');

    expect(storeFake.update).toHaveBeenCalledWith('t1', { description: 'Descrição corrigida com mais detalhes.', status: TicketStatus.Open }, jasmine.any(Function));

    storeFake.update.calls.mostRecent().args[2]();
    expect(fixture.componentInstance.editingTicket()).toBeNull();
    expect(toastServiceFake.show).toHaveBeenCalledWith('Descrição atualizada.');
  });

  it('renders the edit modal when clicking "Editar"', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    rowAction(fixture.nativeElement, 'Editar')!.click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-ticket-edit-dialog')).not.toBeNull();
  });

  it('cancels the ticket when confirmed, preserving the current description, and says where it went', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onCancelTicket(openTicket);

    // "Voltar" em vez de "Cancelar" ao lado de "Cancelar chamado", pra não ficar ambíguo.
    expect(confirmDialogServiceFake.confirm).toHaveBeenCalledWith(jasmine.objectContaining({ confirmLabel: 'Cancelar chamado', cancelLabel: 'Voltar' }));
    expect(storeFake.update).toHaveBeenCalledWith('t1', { description: openTicket.description, status: TicketStatus.Canceled }, jasmine.any(Function));

    // Na aba "Em aberto" o chamado cancelado some da lista: o toast diz onde ele está agora.
    storeFake.update.calls.mostRecent().args[2]();
    expect(toastServiceFake.show).toHaveBeenCalledWith('Chamado cancelado — agora está em Encerrados.');
    expect(summaryStoreFake.reload).toHaveBeenCalled();
  });

  it('does not cancel the ticket when the confirmation is canceled', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(false));
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onCancelTicket(openTicket);

    expect(storeFake.update).not.toHaveBeenCalled();
  });

  it('changes the page size', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onPageSizeChange(50);

    expect(storeFake.setPageSize).toHaveBeenCalledWith(50);
  });

  it('keeps the rows visible (only faded) when reloading with the list already loaded', async () => {
    storeFake.state.set({ data: [openTicket], loading: true, error: null });
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Impressora não funciona');
    expect(fixture.nativeElement.querySelector('table').classList).toContain('is-refreshing');
    // O esmaecido é só visual: o leitor de tela fica sabendo da recarga pelo aria-busy.
    expect(fixture.nativeElement.querySelector('table').getAttribute('aria-busy')).toBe('true');
  });

  it('shows an action error without "Tentar novamente", and dismisses it with the close button', async () => {
    storeFake.mutationError.set('Erro ao excluir o chamado');
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Erro ao excluir o chamado');
    expect(fixture.nativeElement.textContent).not.toContain('Tentar novamente');

    (fixture.nativeElement.querySelector('.alert .btn-close') as HTMLButtonElement).click();
    expect(storeFake.clearMutationError).toHaveBeenCalled();
  });

  it('discards the error from a previous action when opening the edit modal', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onStartEdit(openTicket);

    expect(storeFake.clearMutationError).toHaveBeenCalled();
  });

  it('shows the Cancelado status in a neutral badge, not in the alert red', async () => {
    storeFake.tickets.set([{ ...openTicket, status: TicketStatus.Canceled }]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    const badge = Array.from(fixture.nativeElement.querySelectorAll('.badge') as NodeListOf<HTMLElement>)
      .find(b => b.textContent?.trim() === 'Cancelado');
    expect(badge?.classList).toContain('bg-label-secondary');
  });

  it('shows "Nada pendente" with a shortcut to the closed tickets when only "Em aberto" is empty', async () => {
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

  it('shows the no-results search with "Limpar busca", which clears only the search', async () => {
    storeFake.tickets.set([]);
    // A busca vem da URL (a tela a aplica ao abrir), como quando a pessoa volta pelo navegador.
    await TestBed.inject(Router).navigateByUrl('/?q=impressora');
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Nenhum chamado com “impressora” no título');
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('.filtered-empty button') as NodeListOf<HTMLButtonElement>);
    storeFake.setStatusGroup.calls.reset();
    buttons.find(b => b.textContent?.includes('Limpar busca'))!.click();
    expect(storeFake.setSearch).toHaveBeenCalledWith('');
    // Limpa só a busca: o grupo escolhido continua.
    expect(storeFake.setStatusGroup).not.toHaveBeenCalled();
  });

  it('shows "Carregando…" while the probe decides between first use and nothing pending', async () => {
    storeFake.tickets.set([]);
    storeFake.hasAnyTicket.set(null);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Carregando chamados…');
    expect(fixture.nativeElement.textContent).not.toContain('Nada pendente');
  });

  it('switches the group through the selector and only shows "Limpar filtros" when away from the default', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.btn-clear-filters')).toBeNull();

    const finished = fixture.nativeElement.querySelector('#ticketStatusGroup-finished') as HTMLInputElement;
    finished.click();
    await fixture.whenStable();

    expect(storeFake.setStatusGroup).toHaveBeenCalledWith(TicketStatusGroup.Finished);
    expect(fixture.nativeElement.querySelector('.btn-clear-filters')).not.toBeNull();
  });

  it('applies the group and the search coming from the URL when opening the screen', async () => {
    await TestBed.inject(Router).navigateByUrl('/?status=finished&q=monitor');
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(storeFake.setStatusGroup).toHaveBeenCalledWith(TicketStatusGroup.Finished);
    expect(storeFake.setSearch).toHaveBeenCalledWith('monitor');
    expect((fixture.nativeElement.querySelector('#ticketSearch') as HTMLInputElement).value).toBe('monitor');
  });

  it('carries the applied filter to the URL, without the default (Em aberto, no search)', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();
    expect(router.url).toBe('/');

    storeFake.statusGroup.set(null);
    storeFake.search.set('monitor');
    await fixture.whenStable();

    expect(router.url).toBe('/?status=all&q=monitor');
  });

  it('says the search looks in the title or the description, as the back end does', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect((fixture.nativeElement.querySelector('#ticketSearch') as HTMLInputElement).placeholder).toBe('Título ou descrição');
  });

  it('searches by title or description only after the person stops typing', async () => {
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

  it('formats the last activity as a short relative time, and as a date after one week', () => {
    const now = new Date('2026-01-10T12:00:00Z').getTime();

    expect(formatLastActivity('2026-01-10T11:59:40Z', now)).toBe('agora há pouco');
    expect(formatLastActivity('2026-01-10T12:00:30Z', now)).toBe('agora há pouco');
    expect(formatLastActivity('2026-01-10T11:25:00Z', now)).toBe('há 35 min');
    expect(formatLastActivity('2026-01-10T10:00:00Z', now)).toBe('há 2 h');
    expect(formatLastActivity('2026-01-09T10:00:00Z', now)).toBe('ontem');
    expect(formatLastActivity('2026-01-07T12:00:00Z', now)).toBe('há 3 dias');
    expect(formatLastActivity('2026-01-01T12:00:00Z', now)).toBe(new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date('2026-01-01T12:00:00Z')));
  });

  it('shows "Cancelar" with the remaining time for the owner, within the 15 min window', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    const cancel = rowAction(fixture.nativeElement, 'Cancelar')!;
    expect(cancel).toBeTruthy();
    expect(cancel.querySelector('.cancel-hint')?.textContent?.trim()).toBe('por mais 8 min');
    expect(cancel.getAttribute('aria-label')).toContain('disponível por mais 8 min');
  });

  it('hides "Cancelar" when the back end says it is not possible (canCancel = false)', async () => {
    storeFake.tickets.set([{ ...openTicket, canCancel: false }]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(rowAction(fixture.nativeElement, 'Cancelar')).toBeUndefined();
    expect(rowAction(fixture.nativeElement, 'Editar')).toBeTruthy();
  });

  it('hides "Cancelar" from the owner when the window has already expired, even with a stale canCancel', async () => {
    storeFake.tickets.set([{ ...openTicket, ownerCancelDeadlineUtc: minutesFromNow(-1) }]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(rowAction(fixture.nativeElement, 'Cancelar')).toBeUndefined();
  });

  it('with tickets:cancel, shows "Cancelar" without a deadline and without a countdown', async () => {
    sessionServiceFake.hasPermission.and.callFake((code: string) => code === 'tickets:cancel' || OWNER_PERMISSIONS(code));
    storeFake.tickets.set([{ ...openTicket, ownerCancelDeadlineUtc: minutesFromNow(-60) }]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(rowAction(fixture.nativeElement, 'Cancelar')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.cancel-hint')).toBeNull();
  });

  it('with a read error and an empty list, shows neither "Nada pendente" nor the first use, since the error does not become data', async () => {
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

  it('with a read error and an empty list, states the error only once, in the empty state, with "Tentar novamente" inside it', async () => {
    storeFake.tickets.set([]);
    storeFake.hasAnyTicket.set(null);
    storeFake.loadError.set('Erro ao carregar chamados');
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    const alerts = fixture.nativeElement.querySelectorAll('[role="alert"]') as NodeListOf<HTMLElement>;
    expect(alerts.length).toBe(1);
    const retry = Array.from(alerts[0].querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(button => button.textContent?.includes('Tentar novamente'))!;
    retry.click();
    expect(storeFake.loadForCurrentUser).toHaveBeenCalledTimes(2);
  });

  it('with a read error over old rows, keeps the rows and shows the warning above the table', async () => {
    storeFake.tickets.set([openTicket]);
    storeFake.loadError.set('Erro ao carregar chamados');
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.alert-danger')?.textContent).toContain('Erro ao carregar chamados');
    expect(fixture.nativeElement.textContent).toContain(openTicket.title);
    expect(fixture.nativeElement.textContent).not.toContain('Não deu pra carregar seus chamados agora');
  });

  it('in an empty search within a group, offers "Buscar em todos os chamados" and explains the scope', async () => {
    storeFake.tickets.set([]);
    await TestBed.inject(Router).navigateByUrl('/?q=monitor');
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('A busca vale só para em aberto.');
    const all = Array.from(fixture.nativeElement.querySelectorAll('.filtered-empty button') as NodeListOf<HTMLButtonElement>)
      .find(b => b.textContent?.includes('Buscar em todos os chamados'))!;
    all.click();
    expect(storeFake.setStatusGroup).toHaveBeenCalledWith(null);
  });

  it('does not offer "Buscar em todos" when the search is already across all', async () => {
    storeFake.tickets.set([]);
    await TestBed.inject(Router).navigateByUrl('/?status=all&q=monitor');
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Buscar em todos os chamados');
    expect(fixture.nativeElement.textContent).toContain('Confira o termo digitado.');
  });

  it('shows the count of each group in the selector, and none while the summary has not arrived', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    const counts = Array.from(fixture.nativeElement.querySelectorAll('.status-group-count') as NodeListOf<HTMLElement>).map(c => c.textContent?.trim());
    // O número à vista e, só pro leitor de tela, o substantivo ("3 chamados") — sem aria-label num <span>.
    expect(counts).toEqual(['3 chamados', '5 chamados', '8 chamados']);
    expect(fixture.nativeElement.querySelector('.status-group-count .visually-hidden')?.textContent).toBe(' chamados');

    summaryStoreFake.activeCount.set(null);
    summaryStoreFake.finishedCount.set(null);
    summaryStoreFake.totalCount.set(null);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('.status-group-count').length).toBe(0);
  });

  it('shows the due date "Perto de vencer" and "Atrasado" with an attention tone, and "Sem prazo" without a date', async () => {
    storeFake.tickets.set([
      { ...openTicket, id: 'a', slaStatus: TicketSlaStatus.AtRisk, currentSlaStatus: TicketSlaStatus.AtRisk },
      { ...openTicket, id: 'b', slaStatus: TicketSlaStatus.Breached, currentSlaStatus: TicketSlaStatus.Breached },
      { ...resolvedTicket, id: 'c', slaStatus: TicketSlaStatus.NotApplicable, currentSlaStatus: TicketSlaStatus.NotApplicable }
    ]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    const dues = Array.from(fixture.nativeElement.querySelectorAll('.due') as NodeListOf<HTMLElement>);
    expect(dues[0].classList).toContain('due-warning');
    expect(dues[0].textContent).toContain('Perto de vencer');
    expect(dues[1].classList).toContain('due-danger');
    expect(dues[1].textContent).toContain('Atrasado');
    expect(dues[2].textContent).toContain('Sem prazo');
    expect(dues[2].querySelector('.due-date')).toBeNull();
  });

  it('on an overdue ticket, offers "Cobrar no chamado" leading to the ticket itself, and only on the overdue one', async () => {
    storeFake.tickets.set([
      { ...openTicket, id: 'atrasado', slaStatus: TicketSlaStatus.Breached, currentSlaStatus: TicketSlaStatus.Breached },
      { ...openTicket, id: 'em-risco', slaStatus: TicketSlaStatus.AtRisk, currentSlaStatus: TicketSlaStatus.AtRisk },
      { ...resolvedTicket, id: 'resolvido', slaStatus: TicketSlaStatus.Missed, currentSlaStatus: TicketSlaStatus.Missed }
    ]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    const links = Array.from(fixture.nativeElement.querySelectorAll('.due-nudge') as NodeListOf<HTMLAnchorElement>);
    expect(links.length).toBe(1);
    expect(links[0].textContent?.trim()).toBe('Cobrar no chamado');
    expect(links[0].getAttribute('href')).toBe('/tickets/atrasado');
    expect(links[0].getAttribute('aria-label')).toBe('Cobrar no chamado ' + openTicket.title);
  });

  it('clicking "Cobrar no chamado" navigates to the ticket detail', async () => {
    storeFake.tickets.set([{ ...openTicket, id: 'atrasado', slaStatus: TicketSlaStatus.Breached, currentSlaStatus: TicketSlaStatus.Breached }]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();
    const router = TestBed.inject(Router);
    const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);

    (fixture.nativeElement.querySelector('.due-nudge') as HTMLAnchorElement).click();

    expect(navigate).toHaveBeenCalled();
    expect(router.serializeUrl(navigate.calls.mostRecent().args[0] as UrlTree)).toBe('/tickets/atrasado');
  });

  it('when reopening within "Encerrados", the toast says the ticket went to "Em aberto"', async () => {
    await TestBed.inject(Router).navigateByUrl('/?status=finished');
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onStartReopen(resolvedTicket);
    fixture.componentInstance.onReopenConfirm(null);
    storeFake.reopen.calls.mostRecent().args[2]();

    expect(toastServiceFake.show).toHaveBeenCalledWith('Chamado reaberto — agora está em Em aberto.');
    expect(fixture.componentInstance.reopeningTicket()).toBeNull();
  });
});
