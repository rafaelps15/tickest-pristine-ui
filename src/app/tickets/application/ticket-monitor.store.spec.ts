import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { TicketMonitorStore } from './ticket-monitor.store';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { TicketAwaiting } from '../entities/ticket-awaiting';
import { TicketMonitorItem } from '../entities/ticket-monitor-item';
import { TicketSlaSummary } from '../entities/ticket-sla-summary';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { TicketSlaStatus } from '../entities/ticket-sla-status';
import { TicketSortOrder } from '../entities/ticket-sort-order';
import { PagedResponse } from '../../shared';
import { UserDataService, UserSummary } from '../../users';

describe('TicketMonitorStore', () => {
  const ticket: TicketMonitorItem = {
    id: 't1', title: 'Impressora não funciona', priority: TicketPriority.High, status: TicketStatus.Open,
    requesterId: 'u1', requesterName: 'Maria Silva', requesterEmail: 'maria@empresa.com',
    assignedToUserId: null, assignedToName: null, sectorId: 's1', sectorName: 'Suporte',
    createdAtUtc: '2026-01-01T12:00:00Z', dueAtUtc: '2026-01-02T12:00:00Z', slaWarningAtUtc: '2026-01-02T06:00:00Z',
    resolvedAtUtc: null, slaStatus: TicketSlaStatus.OnTime
  };
  const slaSummary: TicketSlaSummary = { activeCount: 10, onTimeCount: 6, atRiskCount: 3, breachedCount: 1, serverNowUtc: '2026-01-01T12:00:00Z' };

  function pageOf(items: TicketMonitorItem[], page = 1, totalCount = items.length, pageSize = 20): PagedResponse<TicketMonitorItem> {
    const totalPages = Math.ceil(totalCount / pageSize);
    return { items, page, pageSize, totalCount, totalPages, hasPreviousPage: page > 1, hasNextPage: page < totalPages };
  }

  const candidate: UserSummary = {
    id: 'u2', email: 'joao.pedro@empresa.com', firstName: 'João', lastName: 'Pedro',
    roles: [{ name: 'Atendente' }], isActive: true, createdAtUtc: '2025-01-01T12:00:00Z', deactivatedAtUtc: null, pendingActivation: false, invitationExpiresAtUtc: null
  };

  let store: InstanceType<typeof TicketMonitorStore>;
  let dataService: jasmine.SpyObj<TicketDataService>;
  let userDataService: jasmine.SpyObj<UserDataService>;

  beforeEach(() => {
    dataService = jasmine.createSpyObj('TicketDataService', ['getAll', 'getSlaSummary', 'assignTicket']);
    dataService.getAll.and.returnValue(of(pageOf([ticket])));
    dataService.getSlaSummary.and.returnValue(of(slaSummary));
    userDataService = jasmine.createSpyObj('UserDataService', ['getAll']);
    userDataService.getAll.and.returnValue(of({
      items: [candidate], page: 1, pageSize: 8, totalCount: 1, totalPages: 1, hasPreviousPage: false, hasNextPage: false
    }));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TicketMonitorStore,
        { provide: TicketDataService, useValue: dataService },
        { provide: UserDataService, useValue: userDataService }
      ]
    });
    store = TestBed.inject(TicketMonitorStore);
  });

  it('carrega a primeira página de chamados e o resumo de SLA com os filtros padrão', async () => {
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith({ sort: TicketSortOrder.Newest, page: 1, pageSize: 20 });
    expect(dataService.getSlaSummary).toHaveBeenCalledWith(undefined);
    expect(store.tickets()).toEqual([ticket]);
    expect(store.total()).toBe(1);
    expect(store.slaSummary()).toEqual(slaSummary);
  });

  it('expõe a mensagem de erro quando a listagem falhar', async () => {
    dataService.getAll.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    store.load();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.listState().error).toBe('Você não tem permissão para monitorar os chamados do sistema.');
  });

  it('expõe a mensagem de erro quando o resumo de SLA falhar, e recarrega ao chamar reloadSlaSummary', async () => {
    dataService.getSlaSummary.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.load();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.slaSummaryState().error).toBe('Erro ao carregar o resumo de SLA');

    dataService.getSlaSummary.calls.reset();
    dataService.getSlaSummary.and.returnValue(of(slaSummary));
    store.reloadSlaSummary();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getSlaSummary).toHaveBeenCalled();
    expect(store.slaSummaryState().error).toBeNull();
  });

  it('limpa o erro de atribuição ao chamar clearMutationError', async () => {
    dataService.assignTicket.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    store.assignToMe('t1', 'u1');
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.mutationError()).toBeTruthy();

    store.clearMutationError();

    expect(store.mutationError()).toBeNull();
  });

  it('filtra por status e volta pra primeira página', async () => {
    await TestBed.inject(ApplicationRef).whenStable();
    store.goToPage(1);

    store.setStatus(TicketStatus.Open);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ status: TicketStatus.Open, page: 1 }));
  });

  it('filtra por prioridade', async () => {
    await TestBed.inject(ApplicationRef).whenStable();

    store.setPriority(TicketPriority.Urgent);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ priority: TicketPriority.Urgent }));
  });

  it('filtra por setor e refaz o resumo de SLA só para esse setor', async () => {
    await TestBed.inject(ApplicationRef).whenStable();

    store.setSectorIds(['s1']);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ sectorIds: ['s1'] }));
    expect(dataService.getSlaSummary).toHaveBeenCalledWith('s1');
  });

  it('com vários setores, filtra a lista por todos e o resumo de SLA fica com a empresa toda (ele aceita um setor só)', async () => {
    await TestBed.inject(ApplicationRef).whenStable();

    store.setSectorIds(['s1', 's2']);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ sectorIds: ['s1', 's2'] }));
    expect(dataService.getSlaSummary).toHaveBeenCalledWith(undefined);
  });

  it('filtra pelo período de abertura e por "aguardando", voltando pra página 1', async () => {
    store.goToPage(3);
    store.setCreatedRange('2026-10-01', '2026-10-28');
    store.setAwaiting(TicketAwaiting.Agent);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({
      createdFrom: '2026-10-01', createdTo: '2026-10-28', awaiting: TicketAwaiting.Agent, page: 1
    }));
  });

  it('filtra por situação de SLA', async () => {
    await TestBed.inject(ApplicationRef).whenStable();

    store.setSlaStatus(TicketSlaStatus.Breached);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ slaStatus: TicketSlaStatus.Breached }));
  });

  it('busca por termo', async () => {
    await TestBed.inject(ApplicationRef).whenStable();

    store.setSearch('impressora');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ search: 'impressora' }));
  });

  it('filtra só por chamados sem responsável', async () => {
    await TestBed.inject(ApplicationRef).whenStable();

    store.setUnassignedOnly(true);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ unassignedOnly: true, page: 1 }));
  });

  it('filtra pelos chamados de um responsável, desligando "só sem responsável" (e vice-versa)', () => {
    store.setUnassignedOnly(true);
    store.setAssignedToUserId('u1');
    expect(store.filters()).toEqual(jasmine.objectContaining({ assignedToUserId: 'u1', unassignedOnly: undefined, page: 1 }));

    store.setUnassignedOnly(true);
    expect(store.filters()).toEqual(jasmine.objectContaining({ assignedToUserId: undefined, unassignedOnly: true }));
  });

  it('muda a ordenação', async () => {
    await TestBed.inject(ApplicationRef).whenStable();

    store.setSort(TicketSortOrder.DueDate);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ sort: TicketSortOrder.DueDate }));
  });

  it('navega para a página informada', async () => {
    dataService.getAll.and.returnValue(of(pageOf([ticket], 1, 45)));
    await TestBed.inject(ApplicationRef).whenStable();

    store.goToPage(2);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ page: 2 }));
  });

  it('muda o tamanho da página e volta pra primeira', async () => {
    await TestBed.inject(ApplicationRef).whenStable();
    store.goToPage(2);

    store.setPageSize(50);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith(jasmine.objectContaining({ pageSize: 50, page: 1 }));
  });

  it('atribui o chamado ao usuário informado e recarrega a listagem', async () => {
    dataService.assignTicket.and.returnValue(of(undefined));
    await TestBed.inject(ApplicationRef).whenStable();
    dataService.getAll.calls.reset();

    store.assignToMe('t1', 'u-current');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.assignTicket).toHaveBeenCalledWith('t1', 'u-current');
    expect(dataService.getAll).toHaveBeenCalled();
    expect(store.mutationError()).toBeNull();
    expect(store.assigningToMeIds()).toEqual([]);
  });

  it('marca só o chamado em questão como "atribuindo", sem afetar outros, enquanto a atribuição está em voo', async () => {
    let resolveAssign!: () => void;
    dataService.assignTicket.and.returnValue(new Observable<void>(subscriber => {
      resolveAssign = () => { subscriber.next(); subscriber.complete(); };
    }));
    await TestBed.inject(ApplicationRef).whenStable();

    store.assignToMe('t1', 'u-current');

    expect(store.assigningToMeIds()).toEqual(['t1']);
    expect(store.assigningToMeIds()).not.toContain('t2');

    resolveAssign();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.assigningToMeIds()).toEqual([]);
  });

  it('mostra uma mensagem específica por código de erro ao falhar a atribuição, sem recarregar a listagem', async () => {
    dataService.assignTicket.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    await TestBed.inject(ApplicationRef).whenStable();
    dataService.getAll.calls.reset();

    store.assignToMe('t1', 'u-current');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.mutationError()).toContain('já ter outro responsável');
    expect(store.assigningToMeIds()).toEqual([]);
    expect(dataService.getAll).not.toHaveBeenCalled();
  });

  it('chama onSuccess depois de recarregar a listagem, ao atribuir com sucesso', async () => {
    dataService.assignTicket.and.returnValue(of(undefined));
    await TestBed.inject(ApplicationRef).whenStable();
    const onSuccess = jasmine.createSpy('onSuccess');

    store.assignToMe('t1', 'u-current', onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(onSuccess).toHaveBeenCalled();
  });

  it('não busca candidatos a responsável com o termo vazio', () => {
    store.searchResponsibleCandidates('');

    expect(userDataService.getAll).not.toHaveBeenCalled();
    expect(store.responsibleCandidates()).toEqual([]);
  });

  it('busca candidatos a responsável pelo termo informado', async () => {
    store.searchResponsibleCandidates('joão');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.getAll).toHaveBeenCalledWith({ status: 'Active', search: 'joão', page: 1, pageSize: 8 });
    expect(store.responsibleCandidates()).toEqual([candidate]);
  });

  it('mostra mensagem própria quando falta permissão pra buscar usuários (403)', async () => {
    userDataService.getAll.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    store.searchResponsibleCandidates('joão');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.responsibleSearchError()).toBe('Você não tem permissão para buscar usuários.');
    expect(store.responsibleCandidates()).toEqual([]);
  });

  it('limpa a busca de candidatos a responsável', () => {
    store.searchResponsibleCandidates('joão');
    store.clearResponsibleSearch();

    expect(store.responsibleCandidates()).toEqual([]);
    expect(store.responsibleSearchError()).toBeNull();
  });

  it('atribui o responsável escolhido, recarrega a listagem e chama onSuccess', async () => {
    dataService.assignTicket.and.returnValue(of(undefined));
    await TestBed.inject(ApplicationRef).whenStable();
    dataService.getAll.calls.reset();
    const onSuccess = jasmine.createSpy('onSuccess');

    store.assignResponsible('t1', 'u2', onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.assignTicket).toHaveBeenCalledWith('t1', 'u2');
    expect(dataService.getAll).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
    expect(store.assigningResponsible()).toBeFalse();
    expect(store.mutationError()).toBeNull();
  });

  it('mostra uma mensagem específica por código de erro ao falhar a atribuição de responsável, sem recarregar a listagem', async () => {
    dataService.assignTicket.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    await TestBed.inject(ApplicationRef).whenStable();
    dataService.getAll.calls.reset();

    store.assignResponsible('t1', 'u2');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.mutationError()).toBe('Chamado ou usuário não encontrado.');
    expect(store.assigningResponsible()).toBeFalse();
    expect(dataService.getAll).not.toHaveBeenCalled();
  });

  it('limpa os filtros, voltando ao estado padrão', async () => {
    await TestBed.inject(ApplicationRef).whenStable();
    store.setStatus(TicketStatus.Open);
    store.setSearch('impressora');

    store.clearFilters();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith({ sort: TicketSortOrder.Newest, page: 1, pageSize: 20 });
  });
});
