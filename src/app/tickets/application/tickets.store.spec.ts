import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError, Subject } from 'rxjs';
import { TicketsStore } from './tickets.store';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { Ticket } from '../entities/ticket';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { PagedResponse, SessionService } from '../../shared';

describe('TicketsStore', () => {
  const ticket: Ticket = {
    id: 't1', title: 'Impressora não funciona', description: 'Não imprime.',
    priority: TicketPriority.Medium, status: TicketStatus.Open,
    openedByUserId: 'u1', assignedToUserId: null, createdAtUtc: '2026-01-01T12:00:00Z'
  };

  /** Monta uma página paginada por offset com os tickets informados. */
  function pageOf(items: Ticket[], page: number, totalCount: number, pageSize = 20): PagedResponse<Ticket> {
    const totalPages = Math.ceil(totalCount / pageSize);
    return {
      items, page, pageSize, totalCount, totalPages,
      hasPreviousPage: page > 1, hasNextPage: page < totalPages
    };
  }

  let store: InstanceType<typeof TicketsStore>;
  let dataService: jasmine.SpyObj<TicketDataService>;

  beforeEach(() => {
    dataService = jasmine.createSpyObj('TicketDataService', ['getMine', 'create', 'update', 'reopen', 'delete']);
    dataService.getMine.and.returnValue(of(pageOf([ticket], 1, 1)));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TicketsStore,
        { provide: TicketDataService, useValue: dataService },
        { provide: SessionService, useValue: { userId: signal('u1') } }
      ]
    });
    store = TestBed.inject(TicketsStore);
  });

  it('carrega a primeira página dos tickets do usuário logado', async () => {
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getMine).toHaveBeenCalledWith(1, 20);
    expect(store.tickets()).toEqual([ticket]);
    expect(store.total()).toBe(1);
  });

  it('busca a página pedida ao trocar de página', async () => {
    dataService.getMine.and.returnValue(of(pageOf([ticket], 1, 45)));
    await TestBed.inject(ApplicationRef).whenStable();

    store.goToPage(2);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getMine).toHaveBeenCalledWith(2, 20);
  });

  it('ignora páginas fora do intervalo', async () => {
    await TestBed.inject(ApplicationRef).whenStable();

    store.goToPage(5);
    store.goToPage(0);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getMine).toHaveBeenCalledTimes(1);
  });

  it('volta para a primeira página ao trocar o tamanho da página', async () => {
    dataService.getMine.and.returnValue(of(pageOf([ticket], 1, 45)));
    await TestBed.inject(ApplicationRef).whenStable();
    store.goToPage(2);
    await TestBed.inject(ApplicationRef).whenStable();

    store.setPageSize(50);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getMine).toHaveBeenCalledWith(1, 50);
  });

  it('volta uma página ao excluir o último ticket de uma página que não é a primeira', async () => {
    dataService.getMine.and.returnValues(of(pageOf([ticket], 1, 21)), of(pageOf([ticket], 2, 21)), of(pageOf([ticket], 1, 20)));
    dataService.delete.and.returnValue(of(undefined));
    await TestBed.inject(ApplicationRef).whenStable();
    store.goToPage(2);
    await TestBed.inject(ApplicationRef).whenStable();

    store.remove('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getMine.calls.mostRecent().args).toEqual([1, 20]);
  });

  it('cria um ticket, volta para a primeira página e recarrega a listagem', async () => {
    dataService.create.and.returnValue(of('t2'));
    const onSuccess = jasmine.createSpy('onSuccess');
    await TestBed.inject(ApplicationRef).whenStable();
    store.goToPage(1);

    store.create({ title: 'Impressora', description: 'Não liga', priority: TicketPriority.High, sectorId: 's1' }, onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.create).toHaveBeenCalledWith({ title: 'Impressora', description: 'Não liga', priority: TicketPriority.High, sectorId: 's1' });
    expect(onSuccess).toHaveBeenCalled();
    expect(store.state().error).toBeNull();
  });

  it('marca creating durante a criação, e libera ao terminar', async () => {
    const subject = new Subject<string>();
    dataService.create.and.returnValue(subject);
    await TestBed.inject(ApplicationRef).whenStable();

    store.create({ title: 'Impressora', description: 'Não liga', priority: TicketPriority.High, sectorId: 's1' });
    expect(store.creating()).toBeTrue();

    subject.next('t2');
    subject.complete();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.creating()).toBeFalse();
  });

  it('libera creating mesmo quando a criação falha', async () => {
    const subject = new Subject<string>();
    dataService.create.and.returnValue(subject);
    await TestBed.inject(ApplicationRef).whenStable();

    store.create({ title: 'Impressora', description: 'Não liga', priority: TicketPriority.High, sectorId: 's1' });
    expect(store.creating()).toBeTrue();

    subject.error(new HttpErrorResponse({ status: 500 }));
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.creating()).toBeFalse();
  });

  it('expõe mensagem de erro quando a criação falhar', async () => {
    dataService.create.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await TestBed.inject(ApplicationRef).whenStable();

    store.create({ title: 'Impressora', description: 'Não liga', priority: TicketPriority.High, sectorId: 's1' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.state().error).toBe('Erro ao abrir o ticket');
  });

  it('atualiza um ticket e recarrega a listagem', async () => {
    dataService.update.and.returnValue(of(undefined));
    await TestBed.inject(ApplicationRef).whenStable();

    store.update('t1', { description: 'Atualizado', status: TicketStatus.InProgress });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.update).toHaveBeenCalledWith('t1', { description: 'Atualizado', status: TicketStatus.InProgress });
    expect(dataService.getMine).toHaveBeenCalledTimes(2);
    expect(store.state().error).toBeNull();
  });

  it('expõe mensagem de erro quando a atualização falhar', async () => {
    dataService.update.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await TestBed.inject(ApplicationRef).whenStable();

    store.update('t1', { description: 'Atualizado', status: TicketStatus.InProgress });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.state().error).toBe('Erro ao atualizar o ticket');
  });

  it('reabre um ticket e recarrega a listagem', async () => {
    dataService.reopen.and.returnValue(of(undefined));
    await TestBed.inject(ApplicationRef).whenStable();

    store.reopen('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.reopen).toHaveBeenCalledWith('t1');
    expect(dataService.getMine).toHaveBeenCalledTimes(2);
    expect(store.state().error).toBeNull();
  });

  it('expõe mensagem de erro quando a reabertura falhar', async () => {
    dataService.reopen.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await TestBed.inject(ApplicationRef).whenStable();

    store.reopen('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.state().error).toBe('Erro ao reabrir o ticket');
  });

  it('expõe mensagem de erro quando a exclusão falhar', async () => {
    dataService.delete.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await TestBed.inject(ApplicationRef).whenStable();

    store.remove('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.state().error).toBe('Erro ao excluir o ticket');
  });

  it('marca o ticket como pendente durante a reabertura, e libera ao terminar', async () => {
    const subject = new Subject<void>();
    dataService.reopen.and.returnValue(subject);
    await TestBed.inject(ApplicationRef).whenStable();

    store.reopen('t1');
    expect(store.pendingTicketIds()).toEqual(['t1']);

    subject.next();
    subject.complete();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.pendingTicketIds()).toEqual([]);
  });

  it('libera o ticket pendente mesmo quando a exclusão falha', async () => {
    const subject = new Subject<void>();
    dataService.delete.and.returnValue(subject);
    await TestBed.inject(ApplicationRef).whenStable();

    store.remove('t1');
    expect(store.pendingTicketIds()).toEqual(['t1']);

    subject.error(new HttpErrorResponse({ status: 500 }));
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.pendingTicketIds()).toEqual([]);
  });
});
