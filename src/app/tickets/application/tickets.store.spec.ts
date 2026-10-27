import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError, Subject } from 'rxjs';
import { TicketsStore } from './tickets.store';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { TicketMessageDataService } from '../infrastructure/ticket-message.data.service';
import { Ticket } from '../entities/ticket';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { TicketSlaStatus } from '../entities/ticket-sla-status';
import { TicketStatusGroup } from '../entities/ticket-status-group';
import { PagedResponse, SessionService } from '../../shared';

describe('TicketsStore', () => {
  const ticket: Ticket = {
    id: 't1', title: 'Impressora não funciona', description: 'Não imprime.',
    priority: TicketPriority.Medium, status: TicketStatus.Open,
    openedByUserId: 'u1', assignedToUserId: null, assignedToName: null, sectorId: 's1', sectorName: 'Helpdesk',
    createdAtUtc: '2026-01-01T12:00:00Z', dueAtUtc: '2026-01-02T12:00:00Z', slaStatus: TicketSlaStatus.OnTime,
    lastActivityAtUtc: '2026-01-01T12:00:00Z'
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
  let messageDataService: jasmine.SpyObj<TicketMessageDataService>;

  beforeEach(() => {
    dataService = jasmine.createSpyObj('TicketDataService', ['getMine', 'create', 'update', 'reopen', 'delete']);
    dataService.getMine.and.returnValue(of(pageOf([ticket], 1, 1)));
    messageDataService = jasmine.createSpyObj('TicketMessageDataService', ['post']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TicketsStore,
        { provide: TicketDataService, useValue: dataService },
        { provide: TicketMessageDataService, useValue: messageDataService },
        { provide: SessionService, useValue: { userId: signal('u1') } }
      ]
    });
    store = TestBed.inject(TicketsStore);
  });

  it('carrega a primeira página dos chamados do usuário logado', async () => {
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getMine).toHaveBeenCalledWith(1, 20, TicketStatusGroup.Active, '');
    expect(store.tickets()).toEqual([ticket]);
    expect(store.total()).toBe(1);
  });

  it('busca a página pedida ao trocar de página', async () => {
    dataService.getMine.and.returnValue(of(pageOf([ticket], 1, 45)));
    await TestBed.inject(ApplicationRef).whenStable();

    store.goToPage(2);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getMine).toHaveBeenCalledWith(2, 20, TicketStatusGroup.Active, '');
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

    expect(dataService.getMine).toHaveBeenCalledWith(1, 50, TicketStatusGroup.Active, '');
  });

  it('volta uma página ao excluir o último chamado de uma página que não é a primeira', async () => {
    dataService.getMine.and.returnValues(of(pageOf([ticket], 1, 21)), of(pageOf([ticket], 2, 21)), of(pageOf([ticket], 1, 20)));
    dataService.delete.and.returnValue(of(undefined));
    await TestBed.inject(ApplicationRef).whenStable();
    store.goToPage(2);
    await TestBed.inject(ApplicationRef).whenStable();

    store.remove('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getMine.calls.mostRecent().args).toEqual([1, 20, TicketStatusGroup.Active, '']);
  });

  it('cria um chamado, volta para a primeira página e recarrega a listagem', async () => {
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

    expect(store.state().error).toBe('Erro ao abrir o chamado');
  });

  it('atualiza um chamado e recarrega a listagem', async () => {
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

    expect(store.state().error).toBe('Erro ao atualizar o chamado');
  });

  it('chama onSuccess ao atualizar um chamado com sucesso', async () => {
    dataService.update.and.returnValue(of(undefined));
    const onSuccess = jasmine.createSpy('onSuccess');
    await TestBed.inject(ApplicationRef).whenStable();

    store.update('t1', { description: 'Atualizado', status: TicketStatus.Canceled }, onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(onSuccess).toHaveBeenCalled();
  });

  it('marca o chamado como pendente durante a atualização, e libera ao terminar', async () => {
    const subject = new Subject<void>();
    dataService.update.and.returnValue(subject);
    await TestBed.inject(ApplicationRef).whenStable();

    store.update('t1', { description: 'Atualizado', status: TicketStatus.Canceled });
    expect(store.pendingTicketIds()).toEqual(['t1']);

    subject.next();
    subject.complete();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.pendingTicketIds()).toEqual([]);
  });

  it('reabre um chamado e recarrega a listagem', async () => {
    dataService.reopen.and.returnValue(of(undefined));
    await TestBed.inject(ApplicationRef).whenStable();

    store.reopen('t1', null);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.reopen).toHaveBeenCalledWith('t1');
    expect(dataService.getMine).toHaveBeenCalledTimes(2);
    expect(store.state().error).toBeNull();
  });

  it('expõe mensagem de erro quando a reabertura falhar', async () => {
    dataService.reopen.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await TestBed.inject(ApplicationRef).whenStable();

    store.reopen('t1', null);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.state().error).toBe('Erro ao reabrir o chamado');
  });

  it('expõe mensagem de erro quando a exclusão falhar', async () => {
    dataService.delete.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await TestBed.inject(ApplicationRef).whenStable();

    store.remove('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.state().error).toBe('Erro ao excluir o chamado');
  });

  it('marca o chamado como pendente durante a reabertura, e libera ao terminar', async () => {
    const subject = new Subject<void>();
    dataService.reopen.and.returnValue(subject);
    await TestBed.inject(ApplicationRef).whenStable();

    store.reopen('t1', null);
    expect(store.pendingTicketIds()).toEqual(['t1']);

    subject.next();
    subject.complete();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.pendingTicketIds()).toEqual([]);
  });

  it('libera o chamado pendente mesmo quando a exclusão falha', async () => {
    const subject = new Subject<void>();
    dataService.delete.and.returnValue(subject);
    await TestBed.inject(ApplicationRef).whenStable();

    store.remove('t1');
    expect(store.pendingTicketIds()).toEqual(['t1']);

    subject.error(new HttpErrorResponse({ status: 500 }));
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.pendingTicketIds()).toEqual([]);
  });

  it('separa o erro de mutação do erro de leitura, e descarta o de mutação sob pedido', async () => {
    dataService.delete.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await TestBed.inject(ApplicationRef).whenStable();

    store.remove('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.loadError()).toBeNull();
    expect(store.mutationError()).toBe('Erro ao excluir o chamado');

    store.clearMutationError();
    expect(store.mutationError()).toBeNull();
  });

  it('chama onSuccess ao reabrir e ao excluir um chamado com sucesso', async () => {
    dataService.reopen.and.returnValue(of(undefined));
    dataService.delete.and.returnValue(of(undefined));
    await TestBed.inject(ApplicationRef).whenStable();
    const onReopened = jasmine.createSpy('onReopened');
    const onRemoved = jasmine.createSpy('onRemoved');

    store.reopen('t1', null, onReopened);
    store.remove('t2', onRemoved);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(onReopened).toHaveBeenCalled();
    expect(onRemoved).toHaveBeenCalled();
  });

  it('publica o motivo como mensagem depois de reabrir, quando informado', async () => {
    dataService.reopen.and.returnValue(of(undefined));
    messageDataService.post.and.returnValue(of('m1'));
    await TestBed.inject(ApplicationRef).whenStable();
    const onSuccess = jasmine.createSpy('onSuccess');

    store.reopen('t1', 'O problema voltou depois da atualização.', onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(messageDataService.post).toHaveBeenCalledWith('t1', 'O problema voltou depois da atualização.');
    expect(onSuccess).toHaveBeenCalled();
    expect(store.mutationError()).toBeNull();
  });

  it('não publica mensagem ao reabrir sem motivo', async () => {
    dataService.reopen.and.returnValue(of(undefined));
    await TestBed.inject(ApplicationRef).whenStable();

    store.reopen('t1', null);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(messageDataService.post).not.toHaveBeenCalled();
  });

  it('mantém o chamado reaberto e avisa quando só a publicação do motivo falha', async () => {
    dataService.reopen.and.returnValue(of(undefined));
    messageDataService.post.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await TestBed.inject(ApplicationRef).whenStable();
    const onSuccess = jasmine.createSpy('onSuccess');

    store.reopen('t1', 'Motivo qualquer.', onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(onSuccess).toHaveBeenCalled();
    expect(store.mutationError()).toContain('o motivo não foi publicado');
    expect(store.pendingTicketIds()).toEqual([]);
  });

  it('começa em "Em aberto" e sem busca, e volta para a primeira página ao trocar o grupo ou a busca', async () => {
    dataService.getMine.and.returnValue(of(pageOf([ticket], 1, 45)));
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.statusGroup()).toBe(TicketStatusGroup.Active);
    store.goToPage(2);
    await TestBed.inject(ApplicationRef).whenStable();

    store.setStatusGroup(TicketStatusGroup.Finished);
    await TestBed.inject(ApplicationRef).whenStable();
    expect(dataService.getMine).toHaveBeenCalledWith(1, 20, TicketStatusGroup.Finished, '');

    store.setStatusGroup(null);
    store.setSearch('  impressora  ');
    await TestBed.inject(ApplicationRef).whenStable();
    expect(dataService.getMine.calls.mostRecent().args).toEqual([1, 20, null, 'impressora']);
    expect(store.isFiltered()).toBeTrue();
  });

  it('não refaz a busca quando o grupo ou o termo não mudam', async () => {
    await TestBed.inject(ApplicationRef).whenStable();
    const calls = dataService.getMine.calls.count();

    store.setStatusGroup(TicketStatusGroup.Active);
    store.setSearch('   ');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getMine.calls.count()).toBe(calls);
  });

  it('com a lista filtrada vazia, sonda sem filtro se a pessoa tem algum chamado', async () => {
    dataService.getMine.and.callFake((page: number, pageSize: number, statusGroup?: TicketStatusGroup | null) =>
      of(statusGroup === undefined ? pageOf([ticket], 1, 3, 1) : pageOf([], 1, 0)));
    await TestBed.inject(ApplicationRef).whenStable();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getMine).toHaveBeenCalledWith(1, 1);
    expect(store.tickets()).toEqual([]);
    expect(store.hasAnyTicket()).toBeTrue();
  });

  it('sabe que é o primeiro uso quando nem a sondagem acha chamado', async () => {
    dataService.getMine.and.returnValue(of(pageOf([], 1, 0)));
    await TestBed.inject(ApplicationRef).whenStable();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.hasAnyTicket()).toBeFalse();
  });

  it('com a sondagem em erro, assume que há chamados em vez de carregar pra sempre', async () => {
    dataService.getMine.and.callFake((page: number, pageSize: number, statusGroup?: TicketStatusGroup | null) =>
      statusGroup === undefined ? throwError(() => new HttpErrorResponse({ status: 500 })) : of(pageOf([], 1, 0)));
    await TestBed.inject(ApplicationRef).whenStable();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.hasAnyTicket()).toBeTrue();
  });

  it('não sonda quando a lista filtrada tem chamados', async () => {
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getMine).not.toHaveBeenCalledWith(1, 1);
    expect(store.hasAnyTicket()).toBeTrue();
  });

  it('com a leitura em erro, expõe a lista vazia e o erro, sem lançar exceção', async () => {
    dataService.getMine.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.tickets()).toEqual([]);
    expect(store.total()).toBe(0);
    expect(store.hasAnyTicket()).toBeNull();
    expect(store.loadError()).toBe('Erro ao carregar chamados');
  });
});
