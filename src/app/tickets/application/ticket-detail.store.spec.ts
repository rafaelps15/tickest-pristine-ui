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
import { TicketSla, TicketSlaMetric, TicketSlaObjectiveState } from '../entities/ticket-sla';
import { UserDataService, UserSummary } from '../../users';

describe('TicketDetailStore', () => {
  const sla: TicketSla = {
    serverNowUtc: '2026-01-01T13:00:00Z',
    plan: { policyId: 'p1', policyName: 'Padrão', policyVersion: 1, calendarId: 'c1', calendarName: 'Expediente', isLegacy: false },
    objectives: [
      {
        metric: TicketSlaMetric.FirstResponse, cycle: 1, state: TicketSlaObjectiveState.Running, targetMinutes: 60,
        startedAtUtc: '2026-01-01T12:00:00Z', warningAtUtc: '2026-01-01T12:50:00Z', dueAtUtc: '2026-01-01T13:00:00Z',
        completedAtUtc: null, stoppedAtUtc: null, consumedMinutes: 30, remainingMinutes: 30, isCurrentCycle: true
      },
      {
        metric: TicketSlaMetric.Resolution, cycle: 1, state: TicketSlaObjectiveState.Running, targetMinutes: 480,
        startedAtUtc: '2026-01-01T12:00:00Z', warningAtUtc: '2026-01-02T10:00:00Z', dueAtUtc: '2026-01-02T12:00:00Z',
        completedAtUtc: null, stoppedAtUtc: null, consumedMinutes: 30, remainingMinutes: 450, isCurrentCycle: true
      }
    ]
  };
  const ticket: TicketDetail = {
    id: 't1', title: 'Impressora não funciona', description: 'Não imprime.',
    priority: TicketPriority.Medium, status: TicketStatus.Open,
    openedByUserId: 'u1', openedByName: 'Maria Souza', assignedToUserId: null, assignedToName: null,
    sectorId: 's1', sectorName: 'Suporte',
    createdAtUtc: '2026-01-01T12:00:00Z', dueAtUtc: '2026-01-02T12:00:00Z', slaWarningAtUtc: '2026-01-02T06:00:00Z',
    resolvedAtUtc: null, slaStatus: TicketSlaStatus.OnTime, sla
  };
  const candidate: UserSummary = {
    id: 'u2', email: 'joao.pedro@empresa.com', firstName: 'João', lastName: 'Pedro',
    roles: [{ name: 'Atendente' }], isActive: true, createdAtUtc: '2025-01-01T12:00:00Z', deactivatedAtUtc: null
  };

  let store: InstanceType<typeof TicketDetailStore>;
  let dataService: jasmine.SpyObj<TicketDataService>;
  let userDataService: jasmine.SpyObj<UserDataService>;

  beforeEach(() => {
    dataService = jasmine.createSpyObj('TicketDataService', ['getById', 'removeAssignee', 'assignTicket', 'update', 'reopen', 'getSla']);
    dataService.getById.and.returnValue(of(ticket));
    dataService.removeAssignee.and.returnValue(of(undefined));
    dataService.assignTicket.and.returnValue(of(undefined));
    dataService.update.and.returnValue(of(undefined));
    dataService.reopen.and.returnValue(of(undefined));
    dataService.getSla.and.returnValue(of(sla));
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

  describe('updateStatus', () => {
    beforeEach(async () => {
      store.loadTicket('t1');
      await TestBed.inject(ApplicationRef).whenStable();
    });

    it('muda o status, recarrega o detalhe e chama onSuccess', async () => {
      const onSuccess = jasmine.createSpy('onSuccess');

      store.updateStatus('t1', TicketStatus.InProgress, 'Não imprime.', onSuccess);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(dataService.update).toHaveBeenCalledWith('t1', { description: 'Não imprime.', status: TicketStatus.InProgress });
      expect(dataService.getById).toHaveBeenCalledTimes(2);
      expect(onSuccess).toHaveBeenCalled();
      expect(store.mutationError()).toBeNull();
    });

    it('expõe mensagem própria quando falta permissão (403)', async () => {
      dataService.update.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

      store.updateStatus('t1', TicketStatus.Resolved, 'Não imprime.');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.mutationError()).toBe('Você não tem permissão para mudar o status deste chamado.');
    });

    it('volta updatingStatus pra false depois do erro', async () => {
      dataService.update.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      store.updateStatus('t1', TicketStatus.Resolved, 'Não imprime.');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.updatingStatus()).toBeFalse();
    });
  });

  describe('updateDescription', () => {
    beforeEach(async () => {
      store.loadTicket('t1');
      await TestBed.inject(ApplicationRef).whenStable();
    });

    it('atualiza a descrição mantendo o status, recarrega o detalhe e chama onSuccess', async () => {
      const onSuccess = jasmine.createSpy('onSuccess');

      store.updateDescription('t1', 'Descrição corrigida.', TicketStatus.Open, onSuccess);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(dataService.update).toHaveBeenCalledWith('t1', { description: 'Descrição corrigida.', status: TicketStatus.Open });
      expect(dataService.getById).toHaveBeenCalledTimes(2);
      expect(onSuccess).toHaveBeenCalled();
      expect(store.mutationError()).toBeNull();
    });

    it('expõe mensagem própria quando falta permissão (403)', async () => {
      dataService.update.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

      store.updateDescription('t1', 'Descrição corrigida.', TicketStatus.Open);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.mutationError()).toBe('Você não tem permissão para editar este chamado.');
    });

    it('volta updatingDescription pra false depois do erro', async () => {
      dataService.update.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      store.updateDescription('t1', 'Descrição corrigida.', TicketStatus.Open);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.updatingDescription()).toBeFalse();
    });
  });

  describe('reopen', () => {
    beforeEach(async () => {
      store.loadTicket('t1');
      await TestBed.inject(ApplicationRef).whenStable();
    });

    it('reabre o ticket, recarrega o detalhe e chama onSuccess', async () => {
      const onSuccess = jasmine.createSpy('onSuccess');

      store.reopen('t1', onSuccess);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(dataService.reopen).toHaveBeenCalledWith('t1');
      expect(dataService.getById).toHaveBeenCalledTimes(2);
      expect(onSuccess).toHaveBeenCalled();
      expect(store.mutationError()).toBeNull();
    });

    it('expõe mensagem própria quando falta permissão (403)', async () => {
      dataService.reopen.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

      store.reopen('t1');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.mutationError()).toBe('Você não tem permissão para reabrir este chamado.');
    });

    it('volta reopening pra false depois do erro', async () => {
      dataService.reopen.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      store.reopen('t1');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.reopening()).toBeFalse();
    });
  });

  describe('SLA', () => {
    const refreshedSla: TicketSla = { ...sla, serverNowUtc: '2026-01-01T14:00:00Z' };

    beforeEach(async () => {
      store.loadTicket('t1');
      await TestBed.inject(ApplicationRef).whenStable();
    });

    it('expõe o sla que já vem no detalhe do ticket', () => {
      expect(store.sla()).toEqual(sla);
    });

    it('atualiza o sla ao chamar refreshSla() — ex.: avisada por outra store depois de publicar uma mensagem', async () => {
      dataService.getSla.and.returnValue(of(refreshedSla));

      store.refreshSla();
      await TestBed.inject(ApplicationRef).whenStable();

      expect(dataService.getSla).toHaveBeenCalledWith('t1');
      expect(store.sla()).toEqual(refreshedSla);
    });

    it('expõe mensagem de erro quando a atualização do sla falhar, sem derrubar o sla já exibido', async () => {
      dataService.getSla.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      store.refreshSla();
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.slaError()).toBe('Erro ao atualizar o SLA.');
      expect(store.slaRefreshing()).toBeFalse();
      expect(store.sla()).toEqual(sla);
    });

    it('atualiza o sla depois de mudar o status, descartando um override de refreshSla() anterior', async () => {
      dataService.getSla.and.returnValue(of(refreshedSla));
      store.refreshSla();
      await TestBed.inject(ApplicationRef).whenStable();
      expect(store.sla()).toEqual(refreshedSla);

      store.updateStatus('t1', TicketStatus.InProgress, 'Não imprime.');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.sla()).toEqual(sla);
    });

    it('atualiza o sla depois de reabrir, descartando um override de refreshSla() anterior', async () => {
      dataService.getSla.and.returnValue(of(refreshedSla));
      store.refreshSla();
      await TestBed.inject(ApplicationRef).whenStable();
      expect(store.sla()).toEqual(refreshedSla);

      store.reopen('t1');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.sla()).toEqual(sla);
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
