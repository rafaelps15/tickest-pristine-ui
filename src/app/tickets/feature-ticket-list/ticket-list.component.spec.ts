import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TicketListComponent } from './ticket-list.component';
import { TicketsStore } from '../application/tickets.store';
import { Ticket } from '../entities/ticket';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { ConfirmDialogService, ToastService } from '../../shared';
import { DepartmentsStore } from '../../departments';

describe('TicketListComponent', () => {
  const openTicket: Ticket = {
    id: 't1', title: 'Impressora não funciona', description: 'A impressora do 3º andar não imprime.',
    priority: TicketPriority.High, status: TicketStatus.Open, openedByUserId: 'u1', assignedToUserId: null,
    createdAtUtc: '2026-01-01T12:00:00Z'
  };
  const resolvedTicket: Ticket = {
    id: 't2', title: 'Monitor com defeito', description: 'Tela piscando.',
    priority: TicketPriority.Low, status: TicketStatus.Resolved, openedByUserId: 'u1', assignedToUserId: 'u2',
    createdAtUtc: '2026-01-02T12:00:00Z'
  };

  /** Cria um store falso com signals reais, para o template reagir como no store verdadeiro. */
  function createStoreFake() {
    return {
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
  let departmentsStoreFake: { departments: ReturnType<typeof signal<{ name: string; sectors: unknown[] }[]>> };

  beforeEach(async () => {
    storeFake = createStoreFake();
    confirmDialogServiceFake = { confirm: jasmine.createSpy('confirm').and.returnValue(of(true)) };
    toastServiceFake = { show: jasmine.createSpy('show') };
    departmentsStoreFake = { departments: signal<{ name: string; sectors: unknown[] }[]>([]) };

    await TestBed.configureTestingModule({
      imports: [TicketListComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TicketsStore, useValue: storeFake },
        { provide: ConfirmDialogService, useValue: confirmDialogServiceFake },
        { provide: ToastService, useValue: toastServiceFake },
        { provide: DepartmentsStore, useValue: departmentsStoreFake }
      ]
    }).compileComponents();
  });

  it('carrega os tickets do usuário logado ao inicializar', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(storeFake.loadForCurrentUser).toHaveBeenCalled();
  });

  it('renderiza os tickets carregados, com prioridade e status', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Impressora não funciona');
    expect(text).toContain('Alta');
    expect(text).toContain('Aberto');
  });

  it('mostra o spinner enquanto carrega', async () => {
    storeFake.state.set({ data: [], loading: true, error: null });
    storeFake.tickets.set([]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.spinner-border')).not.toBeNull();
  });

  it('mostra o estado vazio quando não há tickets', async () => {
    storeFake.tickets.set([]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Nenhum ticket aberto ainda');
    const cta = fixture.nativeElement.querySelector('.first-use a.btn-primary') as HTMLAnchorElement;
    expect(cta.getAttribute('href')).toBe('/tickets/novo');
  });

  it('lista no estado vazio só os departamentos que têm setor para atender', async () => {
    storeFake.tickets.set([]);
    departmentsStoreFake.departments.set([
      { name: 'TI', sectors: [{}] },
      { name: 'RH', sectors: [{}] },
      { name: 'Jurídico', sectors: [] },
      { name: 'Financeiro', sectors: [{}] }
    ]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Atendem tickets: TI, RH e Financeiro.');
  });

  it('mostra a mensagem de erro de carregamento do store', async () => {
    storeFake.loadError.set('Erro ao carregar tickets');
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Erro ao carregar tickets');
  });

  it('recarrega os tickets ao clicar em "Tentar novamente" no alerta de erro', async () => {
    storeFake.loadError.set('Erro ao carregar tickets');
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    const retryButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(button => button.textContent?.includes('Tentar novamente'));
    retryButton?.click();

    expect(storeFake.loadForCurrentUser).toHaveBeenCalledTimes(2);
  });

  it('só mostra "Reabrir" para tickets inativos (Resolvido/Fechado/Cancelado)', async () => {
    storeFake.tickets.set([openTicket, resolvedTicket]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.canReopen(openTicket)).toBeFalse();
    expect(fixture.componentInstance.canReopen(resolvedTicket)).toBeTrue();
    expect(fixture.nativeElement.querySelectorAll('.dropdown-item.text-success').length).toBe(1);
  });

  it('leva ao detalhe pelo título do ticket, sem um botão "Ver detalhes" separado', async () => {
    storeFake.tickets.set([openTicket]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    const titleLink = fixture.nativeElement.querySelector('a.ticket-title') as HTMLAnchorElement;
    expect(titleLink.textContent?.trim()).toBe(openTicket.title);
    expect(titleLink.getAttribute('href')).toBe(`/tickets/${openTicket.id}`);
    expect(fixture.nativeElement.querySelector('.bx-show')).toBeNull();
  });

  it('reabre o ticket pelo modal, com o motivo informado, e fecha o modal em caso de sucesso', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onStartReopen(resolvedTicket);
    await fixture.whenStable();
    expect(storeFake.clearMutationError).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('app-ticket-reopen-dialog')).not.toBeNull();

    fixture.componentInstance.onReopenConfirm('O monitor voltou a piscar.');
    expect(storeFake.reopen).toHaveBeenCalledWith('t2', 'O monitor voltou a piscar.', jasmine.any(Function));

    storeFake.reopen.calls.mostRecent().args[2]();
    expect(toastServiceFake.show).toHaveBeenCalledWith('Ticket reaberto.');
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

    expect(fixture.componentInstance.rangeStart()).toBe(21);
    expect(fixture.componentInstance.rangeEnd()).toBe(40);
  });

  it('usa reticências em vez de um botão por página quando há muitas páginas', async () => {
    storeFake.totalPages.set(50);
    storeFake.currentPage.set(25);
    storeFake.hasPreviousPage.set(true);
    storeFake.hasNextPage.set(true);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.pageNumbers()).toEqual([1, '…', 24, 25, 26, '…', 50]);
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

  it('desabilita as ações e troca o ícone do "⋮" por um spinner no ticket pendente', async () => {
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

  it('mostra Editar descrição/Cancelar ticket no "⋮" só para tickets ativos (Aberto/Em Andamento)', async () => {
    storeFake.tickets.set([openTicket, resolvedTicket]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.isActive(openTicket)).toBeTrue();
    expect(fixture.componentInstance.isActive(resolvedTicket)).toBeFalse();
    // Cada linha tem um único "⋮"; o do ticket ativo (t1) traz as três ações, o do inativo (t2) só Reabrir.
    expect(fixture.nativeElement.querySelectorAll('.btn-row-actions').length).toBe(2);
    const itemLabels = Array.from(fixture.nativeElement.querySelectorAll('.dropdown-item') as NodeListOf<HTMLElement>)
      .map(item => item.textContent?.trim());
    expect(itemLabels).toEqual(['Editar descrição', 'Cancelar ticket', 'Reabrir ticket']);
  });

  it('abre o modal de edição pré-carregando o ticket, e fecha sem salvar', async () => {
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

  it('cancela o ticket quando confirmado, preservando a descrição atual', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onCancelTicket(openTicket);

    // "Voltar" em vez de "Cancelar" ao lado de "Cancelar ticket", pra não ficar ambíguo.
    expect(confirmDialogServiceFake.confirm).toHaveBeenCalledWith(jasmine.objectContaining({ confirmLabel: 'Cancelar ticket', cancelLabel: 'Voltar' }));
    expect(storeFake.update).toHaveBeenCalledWith('t1', { description: openTicket.description, status: TicketStatus.Canceled }, jasmine.any(Function));

    storeFake.update.calls.mostRecent().args[2]();
    expect(toastServiceFake.show).toHaveBeenCalledWith('Ticket cancelado.');
  });

  it('não cancela o ticket quando a confirmação for cancelada', async () => {
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
    storeFake.mutationError.set('Erro ao excluir o ticket');
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Erro ao excluir o ticket');
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
});
