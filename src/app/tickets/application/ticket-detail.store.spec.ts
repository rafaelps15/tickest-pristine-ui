import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { TicketDetailStore } from './ticket-detail.store';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { TicketDetail } from '../entities/ticket';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { TicketSlaStatus } from '../entities/ticket-sla-status';
import { TicketSla, TicketSlaMetric, TicketSlaObjectiveState } from '../entities/ticket-sla';
import { TicketAssignee } from '../entities/ticket-assignee';
import { environment } from '../../../environments/environment';

/** Prazo do dono ainda aberto (o relógio dos testes nunca chega lá). */
const FAR_FUTURE = '2999-01-01T00:00:00Z';

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
    openedByUserId: 'u1', openedByName: 'Maria Souza', canCancel: true, ownerCancelDeadlineUtc: FAR_FUTURE, assignedToUserId: null, assignedToName: null,
    sectorId: 's1', sectorName: 'Suporte',
    createdAtUtc: '2026-01-01T12:00:00Z', dueAtUtc: '2026-01-02T12:00:00Z', slaWarningAtUtc: '2026-01-02T06:00:00Z',
    resolvedAtUtc: null, slaStatus: TicketSlaStatus.OnTime, sla
  };
  const candidate: TicketAssignee = { id: 'u2', fullName: 'João Pedro', sectorId: 's1', sectorName: 'Suporte' };

  let store: InstanceType<typeof TicketDetailStore>;
  let dataService: jasmine.SpyObj<TicketDataService>;

  beforeEach(() => {
    dataService = jasmine.createSpyObj('TicketDataService', ['getById', 'removeAssignee', 'assignTicket', 'update', 'close', 'reopen', 'getSla', 'getAssignees']);
    dataService.getById.and.returnValue(of(ticket));
    dataService.removeAssignee.and.returnValue(of(undefined));
    dataService.assignTicket.and.returnValue(of(undefined));
    dataService.update.and.returnValue(of(undefined));
    dataService.close.and.returnValue(of(undefined));
    dataService.reopen.and.returnValue(of(undefined));
    dataService.getSla.and.returnValue(of(sla));
    dataService.getAssignees.and.returnValue(of({
      items: [candidate], page: 1, pageSize: 8, totalCount: 1, totalPages: 1, hasPreviousPage: false, hasNextPage: false
    }));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TicketDetailStore,
        { provide: TicketDataService, useValue: dataService }
      ]
    });
    store = TestBed.inject(TicketDetailStore);
  });

  it('does not call the API before a ticket is set', () => {
    expect(dataService.getById).not.toHaveBeenCalled();
  });

  it('loads the detail of the given ticket', async () => {
    store.loadTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getById).toHaveBeenCalledWith('t1');
    expect(store.ticket()).toEqual(ticket);
  });

  it('exposes a specific message when the ticket does not exist (404)', async () => {
    dataService.getById.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

    store.loadTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.state().error).toBe('Não encontramos esse chamado — ele pode ter sido removido.');
  });

  it('exposes a specific message when the user has no access (403)', async () => {
    dataService.getById.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    store.loadTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.state().error).toBe('Você não tem acesso a este chamado.');
  });

  describe('removeAssignee', () => {
    beforeEach(async () => {
      store.loadTicket('t1');
      await TestBed.inject(ApplicationRef).whenStable();
    });

    it('removes the assignee, reloads the detail and calls onSuccess', async () => {
      const onSuccess = jasmine.createSpy('onSuccess');

      store.removeAssignee('t1', onSuccess);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(dataService.removeAssignee).toHaveBeenCalledWith('t1');
      expect(dataService.getById).toHaveBeenCalledTimes(2); // 1x no loadTicket, 1x no reload pós-sucesso
      expect(onSuccess).toHaveBeenCalled();
      expect(store.mutationError()).toBeNull();
    });

    it('exposes a specific message when the ticket is not active (400 Chamados.NotActive)', async () => {
      dataService.removeAssignee.and.returnValue(throwError(() => new HttpErrorResponse({
        status: 400, error: { title: 'Tickets.NotActive', detail: 'O chamado não está ativo.' }
      })));

      store.removeAssignee('t1');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.mutationError()).toBe('O chamado não está ativo.');
    });

    it('exposes a specific message when permission is missing (403)', async () => {
      dataService.removeAssignee.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

      store.removeAssignee('t1');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.mutationError()).toBe('Você não tem permissão para remover o responsável deste chamado.');
    });

    it('exposes a specific message when the ticket is not found (404)', async () => {
      dataService.removeAssignee.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

      store.removeAssignee('t1');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.mutationError()).toBe('Chamado não encontrado — ele pode ter sido removido.');
    });

    it('exposes a specific message on conflict (409)', async () => {
      dataService.removeAssignee.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));

      store.removeAssignee('t1');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.mutationError()).toBe('Não foi possível remover o responsável — tente novamente.');
    });

    it('sets removingAssignee back to false after the error', async () => {
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

    it('assigns the assignee, reloads the detail and calls onSuccess', async () => {
      const onSuccess = jasmine.createSpy('onSuccess');

      store.assignTicket('t1', 'u2', onSuccess);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(dataService.assignTicket).toHaveBeenCalledWith('t1', 'u2');
      expect(dataService.getById).toHaveBeenCalledTimes(2); // 1x no loadTicket, 1x no reload pós-sucesso
      expect(onSuccess).toHaveBeenCalled();
      expect(store.mutationError()).toBeNull();
    });

    it('exposes a specific message when the ticket is not active (400 Chamados.NotActive)', async () => {
      dataService.assignTicket.and.returnValue(throwError(() => new HttpErrorResponse({
        status: 400, error: { title: 'Tickets.NotActive', detail: 'O chamado não está ativo.' }
      })));

      store.assignTicket('t1', 'u2');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.mutationError()).toBe('O chamado não está ativo.');
    });

    it('exposes the back-end message with an action hint when the candidate cannot manage tickets (400 Tickets.AssigneeNotAttendant)', async () => {
      dataService.assignTicket.and.returnValue(throwError(() => new HttpErrorResponse({
        status: 400, error: { title: 'Tickets.AssigneeNotAttendant', detail: 'O usuário não atende chamados e não pode ser o responsável.' }
      })));

      store.assignTicket('t1', 'u2');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.mutationError()).toBe('O usuário não atende chamados e não pode ser o responsável. Escolha outro usuário na lista.');
    });

    it('exposes a specific message when permission is missing (403)', async () => {
      dataService.assignTicket.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

      store.assignTicket('t1', 'u2');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.mutationError()).toBe('Você não tem permissão para atribuir o responsável deste chamado.');
    });

    it('exposes a specific message when the ticket or the user is not found (404)', async () => {
      dataService.assignTicket.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

      store.assignTicket('t1', 'u2');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.mutationError()).toBe('Chamado ou usuário não encontrado.');
    });

    it('sets assigningTicket back to false after the error', async () => {
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

    it('changes the status, reloads the detail and calls onSuccess', async () => {
      const onSuccess = jasmine.createSpy('onSuccess');

      store.updateStatus('t1', TicketStatus.InProgress, onSuccess);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(dataService.update).toHaveBeenCalledWith('t1', { description: 'Não imprime.', status: TicketStatus.InProgress });
      // A carga, a releitura logo antes do PUT e a recarga depois dele.
      expect(dataService.getById).toHaveBeenCalledTimes(3);
      expect(onSuccess).toHaveBeenCalled();
      expect(store.mutationError()).toBeNull();
    });

    it('closes through POST close, without the PUT, reloads the detail and calls onSuccess', async () => {
      const onSuccess = jasmine.createSpy('onSuccess');

      store.updateStatus('t1', TicketStatus.Closed, onSuccess);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(dataService.close).toHaveBeenCalledOnceWith('t1');
      expect(dataService.update).not.toHaveBeenCalled();
      expect(dataService.getById).toHaveBeenCalledTimes(2);
      expect(onSuccess).toHaveBeenCalled();
    });

    for (const status of [TicketStatus.InProgress, TicketStatus.Resolved, TicketStatus.Canceled]) {
      it(`keeps the status ${status} on the PUT, without the close route`, async () => {
        store.updateStatus('t1', status);
        await TestBed.inject(ApplicationRef).whenStable();

        expect(dataService.update).toHaveBeenCalledOnceWith('t1', { description: 'Não imprime.', status });
        expect(dataService.close).not.toHaveBeenCalled();
      });
    }

    it('exposes the permission message when closing is refused (403)', async () => {
      dataService.close.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

      store.updateStatus('t1', TicketStatus.Closed);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.mutationError()).toBe('Você não tem permissão para mudar o status deste chamado.');
      expect(store.updatingStatus()).toBeFalse();
    });

    it('exposes a specific message when permission is missing (403)', async () => {
      dataService.update.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

      store.updateStatus('t1', TicketStatus.Resolved);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.mutationError()).toBe('Você não tem permissão para mudar o status deste chamado.');
    });

    it('cancels with the description re-read just before the PUT, not the one loaded on the screen (DIV-3)', async () => {
      dataService.getById.and.returnValue(of({ ...ticket, description: 'Descrição mudada por outra pessoa depois da carga.' }));

      store.updateStatus('t1', TicketStatus.Canceled);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(dataService.update).toHaveBeenCalledOnceWith('t1', { description: 'Descrição mudada por outra pessoa depois da carga.', status: TicketStatus.Canceled });
    });

    it('does not send the PUT when the re-read fails, and shows the error', async () => {
      dataService.getById.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

      store.updateStatus('t1', TicketStatus.Canceled);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(dataService.update).not.toHaveBeenCalled();
      expect(store.mutationError()).toBe('Chamado não encontrado — ele pode ter sido removido.');
      expect(store.updatingStatus()).toBeFalse();
    });

    it('sets updatingStatus back to false after the error', async () => {
      dataService.update.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      store.updateStatus('t1', TicketStatus.Resolved);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.updatingStatus()).toBeFalse();
    });
  });

  describe('updateDescription', () => {
    beforeEach(async () => {
      store.loadTicket('t1');
      await TestBed.inject(ApplicationRef).whenStable();
    });

    it('updates the description keeping the status, reloads the detail and calls onSuccess', async () => {
      const onSuccess = jasmine.createSpy('onSuccess');

      store.updateDescription('t1', 'Descrição corrigida.', onSuccess);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(dataService.update).toHaveBeenCalledWith('t1', { description: 'Descrição corrigida.', status: TicketStatus.Open });
      // A carga, a releitura logo antes do PUT e a recarga depois dele.
      expect(dataService.getById).toHaveBeenCalledTimes(3);
      expect(onSuccess).toHaveBeenCalled();
      expect(store.mutationError()).toBeNull();
    });

    it('exposes a specific message when permission is missing (403)', async () => {
      dataService.update.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

      store.updateDescription('t1', 'Descrição corrigida.');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.mutationError()).toBe('Você não tem permissão para editar este chamado.');
    });

    it('keeps the status re-read just before the PUT, not the one loaded on the screen (DIV-3)', async () => {
      dataService.getById.and.returnValue(of({ ...ticket, status: TicketStatus.InProgress }));

      store.updateDescription('t1', 'Descrição corrigida.');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(dataService.update).toHaveBeenCalledOnceWith('t1', { description: 'Descrição corrigida.', status: TicketStatus.InProgress });
    });

    it('does not send the PUT when the re-read fails, and shows the error', async () => {
      dataService.getById.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

      store.updateDescription('t1', 'Descrição corrigida.');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(dataService.update).not.toHaveBeenCalled();
      expect(store.mutationError()).toBe('Você não tem permissão para editar este chamado.');
      expect(store.updatingDescription()).toBeFalse();
    });

    it('sets updatingDescription back to false after the error', async () => {
      dataService.update.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      store.updateDescription('t1', 'Descrição corrigida.');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.updatingDescription()).toBeFalse();
    });
  });

  describe('reopen', () => {
    beforeEach(async () => {
      store.loadTicket('t1');
      await TestBed.inject(ApplicationRef).whenStable();
    });

    it('reopens the ticket, reloads the detail and calls onSuccess', async () => {
      const onSuccess = jasmine.createSpy('onSuccess');

      store.reopen('t1', null, onSuccess);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(dataService.reopen).toHaveBeenCalledWith('t1', null);
      expect(dataService.getById).toHaveBeenCalledTimes(2);
      expect(onSuccess).toHaveBeenCalled();
      expect(store.mutationError()).toBeNull();
    });

    it('exposes a specific message when permission is missing (403)', async () => {
      dataService.reopen.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

      store.reopen('t1', null);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.mutationError()).toBe('Você não tem permissão para reabrir este chamado.');
    });

    it('sets reopening back to false after the error', async () => {
      dataService.reopen.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      store.reopen('t1', null);
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

    it('exposes the sla that already comes in the ticket detail', () => {
      expect(store.sla()).toEqual(sla);
    });

    it('updates the sla when calling refreshSla() — e.g. notified by another store after publishing a message', async () => {
      dataService.getSla.and.returnValue(of(refreshedSla));

      store.refreshSla();
      await TestBed.inject(ApplicationRef).whenStable();

      expect(dataService.getSla).toHaveBeenCalledWith('t1');
      expect(store.sla()).toEqual(refreshedSla);
    });

    it('exposes an error message when the sla update fails, without dropping the sla already displayed', async () => {
      dataService.getSla.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      store.refreshSla();
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.slaError()).toBe('Erro ao atualizar o SLA.');
      expect(store.slaRefreshing()).toBeFalse();
      expect(store.sla()).toEqual(sla);
    });

    it('updates the sla after changing the status, discarding an earlier refreshSla() override', async () => {
      dataService.getSla.and.returnValue(of(refreshedSla));
      store.refreshSla();
      await TestBed.inject(ApplicationRef).whenStable();
      expect(store.sla()).toEqual(refreshedSla);

      store.updateStatus('t1', TicketStatus.InProgress);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.sla()).toEqual(sla);
    });

    it('updates the sla after reopening, discarding an earlier refreshSla() override', async () => {
      dataService.getSla.and.returnValue(of(refreshedSla));
      store.refreshSla();
      await TestBed.inject(ApplicationRef).whenStable();
      expect(store.sla()).toEqual(refreshedSla);

      store.reopen('t1', null);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.sla()).toEqual(sla);
    });
  });

  describe('searchAssignees', () => {
    it('searches only the eligible assignees (GET /tickets/assignees) by the given term', async () => {
      store.searchAssignees('joão');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(dataService.getAssignees).toHaveBeenCalledWith('joão', undefined, 1, 8);
      expect(store.assigneeCandidates()).toEqual([candidate]);
      expect(store.searchingAssignees()).toBeFalse();
    });

    it('does not search and clears the candidates when the term is empty (only spaces)', () => {
      store.searchAssignees('   ');

      expect(dataService.getAssignees).not.toHaveBeenCalled();
      expect(store.assigneeCandidates()).toEqual([]);
    });

    it('exposes a specific message when the search is denied (403)', async () => {
      dataService.getAssignees.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

      store.searchAssignees('joão');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.assigneeSearchError()).toBe('Você não tem permissão para buscar responsáveis.');
      expect(store.assigneeCandidates()).toEqual([]);
    });

    it('clearAssigneeSearch() clears the candidates and the search error', async () => {
      store.searchAssignees('joão');
      await TestBed.inject(ApplicationRef).whenStable();

      store.clearAssigneeSearch();

      expect(store.assigneeCandidates()).toEqual([]);
      expect(store.assigneeSearchError()).toBeNull();
    });
  });

  it('clearMutationError() clears the error from a previous mutation', async () => {
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

describe('TicketDetailStore with the real TicketDataService (DIV-3)', () => {
  const url = `${environment.apiUrl}/tickets/t1`;
  let store: InstanceType<typeof TicketDetailStore>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(), TicketDetailStore]
    });
    store = TestBed.inject(TicketDetailStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('cancelling in the detail re-reads the ticket just before the PUT and sends the re-read description', () => {
    const onSuccess = jasmine.createSpy('onSuccess');

    store.updateStatus('t1', TicketStatus.Canceled, onSuccess);

    http.expectNone({ method: 'PUT', url });
    http.expectOne({ method: 'GET', url }).flush({ id: 't1', description: 'Descrição mudada por outra pessoa depois da carga.', status: TicketStatus.Open });
    const put = http.expectOne({ method: 'PUT', url });
    expect(put.request.body).toEqual({ description: 'Descrição mudada por outra pessoa depois da carga.', status: TicketStatus.Canceled });
    put.flush(null);
    expect(onSuccess).toHaveBeenCalled();
  });

  it('when the re-read fails, sends no PUT and shows the error', () => {
    store.updateStatus('t1', TicketStatus.Canceled);

    http.expectOne({ method: 'GET', url }).flush(null, { status: 500, statusText: 'Server Error' });
    http.expectNone({ method: 'PUT', url });
    expect(store.mutationError()).toBe('Erro ao mudar o status do chamado.');
  });
});
