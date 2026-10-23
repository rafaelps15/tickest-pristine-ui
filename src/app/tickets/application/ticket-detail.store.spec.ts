import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { TicketDetailStore } from './ticket-detail.store';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { TicketDetail } from '../entities/ticket';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { TicketSlaStatus } from '../entities/ticket-sla-status';
import { UserDataService, UserSummary } from '../../users';

describe('TicketDetailStore', () => {
  const ticket: TicketDetail = {
    id: 't1', title: 'Impressora não funciona', description: 'Não imprime.',
    priority: TicketPriority.Medium, status: TicketStatus.Open,
    openedByUserId: 'u1', openedByName: 'Maria Souza', assignedToUserId: null, assignedToName: null,
    sectorId: 's1', sectorName: 'Suporte',
    createdAtUtc: '2026-01-01T12:00:00Z', dueAtUtc: '2026-01-02T12:00:00Z', slaWarningAtUtc: '2026-01-02T06:00:00Z',
    resolvedAtUtc: null, slaStatus: TicketSlaStatus.OnTime
  };
  const candidate: UserSummary = {
    id: 'u2', email: 'joao.pedro@empresa.com', firstName: 'João', lastName: 'Pedro',
    roles: [{ name: 'Atendente' }], isActive: true, createdAtUtc: '2025-01-01T12:00:00Z', deactivatedAtUtc: null
  };

  let store: InstanceType<typeof TicketDetailStore>;
  let dataService: jasmine.SpyObj<TicketDataService>;
  let userDataService: jasmine.SpyObj<UserDataService>;

  beforeEach(() => {
    dataService = jasmine.createSpyObj('TicketDataService', ['getById', 'removeAssignee', 'assignTicket']);
    dataService.getById.and.returnValue(of(ticket));
    dataService.removeAssignee.and.returnValue(of(undefined));
    dataService.assignTicket.and.returnValue(of(undefined));
    userDataService = jasmine.createSpyObj('UserDataService', ['getAll']);
    userDataService.getAll.and.returnValue(of({
      items: [candidate], page: 1, pageSize: 8, totalCount: 1, totalPages: 1, hasPreviousPage: false, hasNextPage: false
    }));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TicketDetailStore,
        { provide: TicketDataService, useValue: dataService },
        { provide: UserDataService, useValue: userDataService }
      ]
    });
    store = TestBed.inject(TicketDetailStore);
  });

  it('não chama a API antes de um ticket ser definido', () => {
    expect(dataService.getById).not.toHaveBeenCalled();
  });

  it('carrega o detalhe do ticket informado', async () => {
    store.loadTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getById).toHaveBeenCalledWith('t1');
    expect(store.ticket()).toEqual(ticket);
  });

  it('expõe mensagem própria quando o ticket não existe (404)', async () => {
    dataService.getById.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

    store.loadTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.state().error).toBe('Não encontramos esse ticket — ele pode ter sido removido.');
  });

  it('expõe mensagem própria quando o usuário não tem acesso (403)', async () => {
    dataService.getById.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    store.loadTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.state().error).toBe('Você não tem acesso a este ticket.');
  });

  describe('removeAssignee', () => {
    beforeEach(async () => {
      store.loadTicket('t1');
      await TestBed.inject(ApplicationRef).whenStable();
    });

    it('remove o responsável, recarrega o detalhe e chama onSuccess', async () => {
      const onSuccess = jasmine.createSpy('onSuccess');

      store.removeAssignee('t1', onSuccess);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(dataService.removeAssignee).toHaveBeenCalledWith('t1');
      expect(dataService.getById).toHaveBeenCalledTimes(2); // 1x no loadTicket, 1x no reload pós-sucesso
      expect(onSuccess).toHaveBeenCalled();
      expect(store.mutationError()).toBeNull();
    });

    it('expõe mensagem própria quando o chamado não está ativo (400 Tickets.NotActive)', async () => {
      dataService.removeAssignee.and.returnValue(throwError(() => new HttpErrorResponse({
        status: 400, error: { title: 'Tickets.NotActive', detail: 'O chamado não está ativo.' }
      })));

      store.removeAssignee('t1');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.mutationError()).toBe('O chamado não está ativo.');
    });

    it('expõe mensagem própria quando falta permissão (403)', async () => {
      dataService.removeAssignee.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

      store.removeAssignee('t1');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.mutationError()).toBe('Você não tem permissão para remover o responsável deste ticket.');
    });

    it('expõe mensagem própria quando o ticket não é encontrado (404)', async () => {
      dataService.removeAssignee.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

      store.removeAssignee('t1');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.mutationError()).toBe('Ticket não encontrado — ele pode ter sido removido.');
    });

    it('expõe mensagem própria em conflito (409)', async () => {
      dataService.removeAssignee.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));

      store.removeAssignee('t1');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.mutationError()).toBe('Não foi possível remover o responsável — tente novamente.');
    });

    it('volta removingAssignee pra false depois do erro', async () => {
      dataService.removeAssignee.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      store.removeAssignee('t1');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.removingAssignee()).toBeFalse();
    });
  });

  describe('assignTicket', () => {
    beforeEach(async () => {
      store.loadTicket('t1');
      await TestBed.inject(ApplicationRef).whenStable();
    });

    it('atribui o responsável, recarrega o detalhe e chama onSuccess', async () => {
      const onSuccess = jasmine.createSpy('onSuccess');

      store.assignTicket('t1', 'u2', onSuccess);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(dataService.assignTicket).toHaveBeenCalledWith('t1', 'u2');
      expect(dataService.getById).toHaveBeenCalledTimes(2); // 1x no loadTicket, 1x no reload pós-sucesso
      expect(onSuccess).toHaveBeenCalled();
      expect(store.mutationError()).toBeNull();
    });

    it('expõe mensagem própria quando o chamado não está ativo (400 Tickets.NotActive)', async () => {
      dataService.assignTicket.and.returnValue(throwError(() => new HttpErrorResponse({
        status: 400, error: { title: 'Tickets.NotActive', detail: 'O chamado não está ativo.' }
      })));

      store.assignTicket('t1', 'u2');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.mutationError()).toBe('O chamado não está ativo.');
    });

    it('expõe a mensagem do back-end com uma dica de ação quando o candidato não pode gerenciar chamados (400 Tickets.AssigneeCannotManageTickets)', async () => {
      dataService.assignTicket.and.returnValue(throwError(() => new HttpErrorResponse({
        status: 400, error: { title: 'Tickets.AssigneeCannotManageTickets', detail: 'O usuário não atende chamados e não pode ser o responsável.' }
      })));

      store.assignTicket('t1', 'u2');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.mutationError()).toBe('O usuário não atende chamados e não pode ser o responsável. Escolha outro usuário na lista.');
    });

    it('expõe mensagem própria quando falta permissão (403)', async () => {
      dataService.assignTicket.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

      store.assignTicket('t1', 'u2');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.mutationError()).toBe('Você não tem permissão para atribuir o responsável deste ticket.');
    });

    it('expõe mensagem própria quando o ticket ou o usuário não é encontrado (404)', async () => {
      dataService.assignTicket.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

      store.assignTicket('t1', 'u2');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.mutationError()).toBe('Ticket ou usuário não encontrado.');
    });

    it('volta assigningTicket pra false depois do erro', async () => {
      dataService.assignTicket.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      store.assignTicket('t1', 'u2');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.assigningTicket()).toBeFalse();
    });
  });

  describe('searchAssignees', () => {
    it('busca usuários ativos pelo termo informado', async () => {
      store.searchAssignees('joão');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(userDataService.getAll).toHaveBeenCalledWith({ status: 'Active', search: 'joão', page: 1, pageSize: 8 });
      expect(store.assigneeCandidates()).toEqual([candidate]);
      expect(store.searchingAssignees()).toBeFalse();
    });

    it('não busca e limpa os candidatos quando o termo é vazio (só espaços)', () => {
      store.searchAssignees('   ');

      expect(userDataService.getAll).not.toHaveBeenCalled();
      expect(store.assigneeCandidates()).toEqual([]);
    });

    it('expõe mensagem própria quando falta a permissão users:read (403)', async () => {
      userDataService.getAll.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

      store.searchAssignees('joão');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.assigneeSearchError()).toBe('Você não tem permissão para buscar usuários.');
      expect(store.assigneeCandidates()).toEqual([]);
    });

    it('clearAssigneeSearch() limpa os candidatos e o erro de busca', async () => {
      store.searchAssignees('joão');
      await TestBed.inject(ApplicationRef).whenStable();

      store.clearAssigneeSearch();

      expect(store.assigneeCandidates()).toEqual([]);
      expect(store.assigneeSearchError()).toBeNull();
    });
  });

  it('clearMutationError() limpa o erro de uma mutação anterior', async () => {
    dataService.removeAssignee.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    store.loadTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();
    store.removeAssignee('t1');
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.mutationError()).not.toBeNull();

    store.clearMutationError();

    expect(store.mutationError()).toBeNull();
  });
});
