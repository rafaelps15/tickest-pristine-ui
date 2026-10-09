import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TicketListComponent } from './ticket-list.component';
import { TicketsStore } from '../application/tickets.store';
import { Ticket } from '../entities/ticket';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { ConfirmDialogService } from '../../shared';

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
      loadForCurrentUser: jasmine.createSpy('loadForCurrentUser'),
      goToPage: jasmine.createSpy('goToPage'),
      setPageSize: jasmine.createSpy('setPageSize'),
      reopen: jasmine.createSpy('reopen'),
      remove: jasmine.createSpy('remove')
    };
  }

  let storeFake: ReturnType<typeof createStoreFake>;
  let confirmDialogServiceFake: { confirm: jasmine.Spy };

  beforeEach(async () => {
    storeFake = createStoreFake();
    confirmDialogServiceFake = { confirm: jasmine.createSpy('confirm').and.returnValue(of(true)) };

    await TestBed.configureTestingModule({
      imports: [TicketListComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TicketsStore, useValue: storeFake },
        { provide: ConfirmDialogService, useValue: confirmDialogServiceFake }
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

    expect(fixture.nativeElement.textContent).toContain('Você ainda não abriu nenhum ticket.');
  });

  it('mostra a mensagem de erro do store', async () => {
    storeFake.state.set({ data: [openTicket], loading: false, error: 'Erro ao carregar tickets' });
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Erro ao carregar tickets');
  });

  it('só mostra "Reabrir" para tickets inativos (Resolvido/Fechado/Cancelado)', async () => {
    storeFake.tickets.set([openTicket, resolvedTicket]);
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.canReopen(openTicket)).toBeFalse();
    expect(fixture.componentInstance.canReopen(resolvedTicket)).toBeTrue();
    expect(fixture.nativeElement.querySelectorAll('.dropdown-item.text-success').length).toBe(1);
  });

  it('reabre o ticket selecionado', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onReopen(resolvedTicket);

    expect(storeFake.reopen).toHaveBeenCalledWith('t2');
  });

  it('exclui o ticket quando confirmado', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDelete(openTicket);

    expect(storeFake.remove).toHaveBeenCalledWith('t1');
  });

  it('não exclui o ticket quando a confirmação for cancelada', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(false));
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDelete(openTicket);

    expect(storeFake.remove).not.toHaveBeenCalled();
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

  it('muda o tamanho da página', async () => {
    const fixture = TestBed.createComponent(TicketListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onPageSizeChange(50);

    expect(storeFake.setPageSize).toHaveBeenCalledWith(50);
  });
});
