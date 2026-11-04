import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { UsersStore } from './users.store';
import { UserDataService } from '../infrastructure/user.data.service';
import { AuthDataService, PagedResponse } from '../../shared';
import { UserSummary } from '../entities/user-summary';

/** Monta uma página de usuários como a API devolveria, calculando os campos de navegação. */
function buildPage(items: UserSummary[], page = 1, pageSize = 20, totalCount = items.length): PagedResponse<UserSummary> {
  const totalPages = Math.ceil(totalCount / pageSize);
  return {
    items, page, pageSize, totalCount, totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages
  };
}

describe('UsersStore', () => {
  /** Chamadas de `getAll` feitas pela lista (o card Resumo usa o GET de contagem à parte). */
  function listCalls(): number {
    return userDataService.getAll.calls.count();
  }

  const user: UserSummary = {
    id: 'u1', email: 'maria@empresa.com', firstName: 'Maria', lastName: 'Silva', roles: [],
    isActive: true, createdAtUtc: '2026-01-01T00:00:00Z', deactivatedAtUtc: null, pendingActivation: false, invitationExpiresAtUtc: null
  };
  const user2: UserSummary = {
    id: 'u2', email: 'joao@empresa.com', firstName: 'João', lastName: 'Santos', roles: [],
    isActive: true, createdAtUtc: '2026-01-02T00:00:00Z', deactivatedAtUtc: null, pendingActivation: false, invitationExpiresAtUtc: null
  };

  let store: InstanceType<typeof UsersStore>;
  let userDataService: jasmine.SpyObj<UserDataService>;
  let authDataService: jasmine.SpyObj<AuthDataService>;

  beforeEach(() => {
    userDataService = jasmine.createSpyObj('UserDataService', ['getAll', 'getStatusCounts', 'updateProfile', 'assignRoles', 'deactivate', 'activate', 'resendInvitation', 'countOpenAssignedTickets']);
    authDataService = jasmine.createSpyObj('AuthDataService', ['register']);
    userDataService.getAll.and.returnValue(of(buildPage([user])));
    userDataService.getStatusCounts.and.returnValue(of({ totalCount: 1, activeCount: 1, pendingActivationCount: 0, inactiveCount: 0 }));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        UsersStore,
        { provide: UserDataService, useValue: userDataService },
        { provide: AuthDataService, useValue: authDataService }
      ]
    });
    store = TestBed.inject(UsersStore);
  });

  it('exposes the users of the loaded page and the pagination data', async () => {
    userDataService.getAll.and.returnValue(of(buildPage([user], 1, 20, 1)));
    store.loadAll();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.users()).toEqual([user]);
    expect(store.currentPage()).toBe(1);
    expect(store.pageSize()).toBe(20);
    expect(store.total()).toBe(1);
    expect(store.totalPages()).toBe(1);
    expect(store.hasPreviousPage()).toBeFalse();
    expect(store.hasNextPage()).toBeFalse();
  });

  it('loads with the default filters (all statuses, page 1, 20 per page)', async () => {
    store.loadAll();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.getAll).toHaveBeenCalledWith({ status: 'All', page: 1, pageSize: 20 });
  });

  it('sorts each user\'s roles alphabetically, regardless of the order received from the API', async () => {
    userDataService.getAll.and.returnValue(of(buildPage([
      {
        ...user,
        roles: [{ name: 'Requester' }, { name: 'Agent' }]
      }
    ])));

    store.loadAll();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.users()[0].roles.map(role => role.name)).toEqual(['Agent', 'Requester']);
  });

  it('changes the search and goes back to page 1', async () => {
    store.goToPage(3);
    store.setSearch('maria');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.getAll).toHaveBeenCalledWith({ status: 'All', search: 'maria', page: 1, pageSize: 20 });
  });

  it('ignores the same search (empty or with spaces), without going back a page or fetching again', async () => {
    store.goToPage(3);
    await TestBed.inject(ApplicationRef).whenStable();
    const callsBefore = listCalls();

    store.setSearch('');
    store.setSearch('   ');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.filters().page).toBe(3);
    expect(listCalls()).toBe(callsBefore);
  });

  it('trims the spaces of the search term', async () => {
    store.setSearch('  maria ');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.filters().search).toBe('maria');
  });

  it('changes the status and goes back to page 1', async () => {
    store.goToPage(2);
    store.setStatus('Inactive');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.getAll).toHaveBeenCalledWith({ status: 'Inactive', page: 1, pageSize: 20 });
  });

  it('changes the registration period and goes back to page 1', async () => {
    store.goToPage(2);
    store.setPeriod('2026-01-01', '2026-01-31');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.getAll).toHaveBeenCalledWith({
      status: 'All', createdFrom: '2026-01-01', createdTo: '2026-01-31', page: 1, pageSize: 20
    });
  });

  it('navigates to the given page', async () => {
    store.goToPage(2);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.getAll).toHaveBeenCalledWith({ status: 'All', page: 2, pageSize: 20 });
  });

  it('changes the page size', async () => {
    store.setPageSize(50);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.getAll).toHaveBeenCalledWith({ status: 'All', page: 1, pageSize: 50 });
  });

  it('goes back to page 1 when changing the page size, so as not to stay on a page that no longer exists', async () => {
    store.goToPage(5);
    store.setPageSize(100);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.getAll).toHaveBeenCalledWith({ status: 'All', page: 1, pageSize: 100 });
  });

  it('restores the filters at once from the URL, without going back to page 1', async () => {
    store.hydrateFiltersFromUrl({ status: 'Inactive', createdFrom: '2026-01-01', createdTo: '2026-01-31', page: 3, pageSize: 50 });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.getAll).toHaveBeenCalledWith({
      status: 'Inactive', createdFrom: '2026-01-01', createdTo: '2026-01-31', page: 3, pageSize: 50
    });
  });

  it('clears the filters, returning to the default state', async () => {
    store.setSearch('maria');
    store.setStatus('Inactive');
    store.goToPage(3);
    store.clearFilters();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.getAll).toHaveBeenCalledWith({ status: 'All', page: 1, pageSize: 20 });
  });

  it('exposes the server error message when the period is invalid (400)', async () => {
    userDataService.getAll.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 400,
      error: { title: 'Users.InvalidCreatedPeriod', detail: 'A data inicial do período de cadastro não pode ser maior que a data final.' }
    })));

    store.setPeriod('2026-02-01', '2026-01-01');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.listState().error).toBe('A data inicial do período de cadastro não pode ser maior que a data final.');
    expect(store.listLoadFailed()).toBeTrue();
  });

  it('does not flag a load failure when the error comes from an action (deactivate), which reloading does not fix', async () => {
    store.loadAll();
    await TestBed.inject(ApplicationRef).whenStable();
    userDataService.deactivate.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.deactivate('u1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.listState().error).toBe('Erro ao desativar usuário');
    expect(store.listLoadFailed()).toBeFalse();
  });

  it('creates a user, flags success and reloads the listing', async () => {
    authDataService.register.and.returnValue(of('new-id'));

    store.loadAll();
    await TestBed.inject(ApplicationRef).whenStable();

    store.createUser({ firstName: 'Ana', lastName: 'Costa', email: 'ana@empresa.com' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(authDataService.register).toHaveBeenCalled();
    expect(store.success()).toBeTrue();
    expect(listCalls()).toBe(2);
  });

  it('exposes the error message when creation fails with a duplicate email', async () => {
    authDataService.register.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));

    store.createUser({ firstName: 'Ana', lastName: 'Costa', email: 'ana@empresa.com' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.success()).toBeFalse();
    expect(store.error()).toBe('Este e-mail já está cadastrado.');
  });

  it('exposes its own message when creation fails due to lack of permission (401/403)', async () => {
    authDataService.register.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    store.createUser({ firstName: 'Ana', lastName: 'Costa', email: 'ana@empresa.com' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.error()).toBe('Você não tem permissão para solicitar este cadastro.');
  });

  it('resets loading/success/error when calling resetState', () => {
    store.resetState();

    expect(store.loading()).toBeFalse();
    expect(store.success()).toBeFalse();
    expect(store.error()).toBeNull();
  });

  it('updates a user\'s registration and reloads the listing on success', async () => {
    userDataService.updateProfile.and.returnValue(of(undefined));
    const onSuccess = jasmine.createSpy('onSuccess');

    store.updateProfile('u1', { firstName: 'Ana', lastName: 'Costa' }, onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.updateProfile).toHaveBeenCalledWith('u1', { firstName: 'Ana', lastName: 'Costa' });
    expect(onSuccess).toHaveBeenCalled();
    expect(store.profileError()).toBeNull();
  });

  it('creates the user and already assigns the chosen roles with the id returned by the registration', async () => {
    authDataService.register.and.returnValue(of('new-id'));
    userDataService.assignRoles.and.returnValue(of(undefined));

    store.createUser({ firstName: 'Ana', lastName: 'Costa', email: 'ana@empresa.com' }, ['Agent']);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.assignRoles).toHaveBeenCalledWith('new-id', ['Agent']);
    expect(store.success()).toBeTrue();
    expect(store.createdUserId()).toBe('new-id');
    expect(store.createRolesFailed()).toBeFalse();
  });

  it('does not call the role assignment when none was chosen', async () => {
    authDataService.register.and.returnValue(of('new-id'));

    store.createUser({ firstName: 'Ana', lastName: 'Costa', email: 'ana@empresa.com' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.assignRoles).not.toHaveBeenCalled();
    expect(store.success()).toBeTrue();
  });

  it('treats the registration as completed, but signals it, when only the role assignment fails', async () => {
    authDataService.register.and.returnValue(of('new-id'));
    userDataService.assignRoles.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.createUser({ firstName: 'Ana', lastName: 'Costa', email: 'ana@empresa.com' }, ['Agent']);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.success()).toBeTrue();
    expect(store.createRolesFailed()).toBeTrue();
    expect(store.createdUserId()).toBe('new-id');
    expect(store.error()).toBeNull();
    expect(store.loading()).toBeFalse();
  });

  it('returns how many open tickets are assigned to the user', () => {
    userDataService.countOpenAssignedTickets.and.returnValue(of(4));
    const onDone = jasmine.createSpy('onDone');

    store.countOpenAssignedTickets('u1', onDone);

    expect(userDataService.countOpenAssignedTickets).toHaveBeenCalledWith('u1');
    expect(onDone).toHaveBeenCalledWith(4);
  });

  it('returns null when the ticket count fails, so as not to block the deactivation', () => {
    userDataService.countOpenAssignedTickets.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const onDone = jasmine.createSpy('onDone');

    store.countOpenAssignedTickets('u1', onDone);

    expect(onDone).toHaveBeenCalledWith(null);
  });

  it('resends the invitation, reloads the listing and releases the progress indicator', async () => {
    userDataService.resendInvitation.and.returnValue(of(undefined));
    const onSuccess = jasmine.createSpy('onSuccess');

    store.resendInvitation('u1', onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.resendInvitation).toHaveBeenCalledWith('u1');
    expect(onSuccess).toHaveBeenCalled();
    expect(store.resendingInvitationIds()).toEqual([]);
  });

  it('shows the back end reason when the resend is refused (e.g. invitation limit within 24h)', async () => {
    userDataService.resendInvitation.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 409,
      error: { title: 'Users.InvitationLimitReached', detail: 'Este usuário já recebeu 5 convites nas últimas 24 horas. Tente de novo mais tarde.' }
    })));

    store.resendInvitation('u1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.listState().error).toBe('Este usuário já recebeu 5 convites nas últimas 24 horas. Tente de novo mais tarde.');
    expect(store.resendingInvitationIds()).toEqual([]);
  });

  it('exposes the registration update failure in the modal error, without polluting the listing error', async () => {
    userDataService.updateProfile.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.updateProfile('u1', { firstName: 'Ana', lastName: 'Costa' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.profileError()).toBe('Erro ao atualizar cadastro');
    expect(store.listState().error).toBeNull();
  });

  it('exposes the role assignment failure in the modal error, without polluting the listing error', async () => {
    userDataService.assignRoles.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.assignRoles('u1', ['Agent']);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.rolesError()).toBe('Erro ao atribuir funções');
    expect(store.listState().error).toBeNull();
  });

  it('does not let a role assignment error appear in the registration edit modal', async () => {
    userDataService.assignRoles.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    store.assignRoles('u1', ['Agent']);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.profileError()).toBeNull();
  });

  it('clears the errors of both modals at once', async () => {
    userDataService.updateProfile.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    userDataService.assignRoles.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    store.updateProfile('u1', { firstName: 'Ana', lastName: 'Costa' });
    store.assignRoles('u1', ['Agent']);
    await TestBed.inject(ApplicationRef).whenStable();

    store.clearDialogErrors();

    expect(store.profileError()).toBeNull();
    expect(store.rolesError()).toBeNull();
  });

  it('assigns roles to a user and reloads the listing on success', async () => {
    userDataService.assignRoles.and.returnValue(of(undefined));
    const onSuccess = jasmine.createSpy('onSuccess');

    store.assignRoles('u1', ['Agent', 'Requester'], onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.assignRoles).toHaveBeenCalledWith('u1', ['Agent', 'Requester']);
    expect(onSuccess).toHaveBeenCalled();
  });

  it('deactivates a user and reloads the listing on success', async () => {
    userDataService.deactivate.and.returnValue(of(undefined));
    const onSuccess = jasmine.createSpy('onSuccess');

    store.deactivate('u1', onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.deactivate).toHaveBeenCalledWith('u1');
    expect(onSuccess).toHaveBeenCalled();
    expect(store.deactivatingIds()).toEqual([]);
  });

  it('exposes the error message when the user is already deactivated', async () => {
    userDataService.deactivate.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));

    store.deactivate('u1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.listState().error).toBe('Este usuário já está desativado.');
    expect(store.deactivatingIds()).toEqual([]);
  });

  it('reactivates a user and reloads the listing on success', async () => {
    userDataService.activate.and.returnValue(of(undefined));
    const onSuccess = jasmine.createSpy('onSuccess');

    store.activate('u1', onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.activate).toHaveBeenCalledWith('u1');
    expect(onSuccess).toHaveBeenCalled();
    expect(store.activatingIds()).toEqual([]);
  });

  it('exposes the error message when the user is already active', async () => {
    userDataService.activate.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));

    store.activate('u1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.listState().error).toBe('Este usuário já está ativo.');
    expect(store.activatingIds()).toEqual([]);
  });

  it('deactivates several users in bulk, in parallel, and reloads the listing when all succeed', async () => {
    userDataService.getAll.and.returnValue(of(buildPage([user, user2])));
    userDataService.deactivate.and.returnValue(of(undefined));
    const onDone = jasmine.createSpy('onDone');

    store.loadAll();
    await TestBed.inject(ApplicationRef).whenStable();

    store.deactivateMany(['u1', 'u2'], onDone);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.deactivate).toHaveBeenCalledWith('u1');
    expect(userDataService.deactivate).toHaveBeenCalledWith('u2');
    expect(onDone).toHaveBeenCalledWith(jasmine.arrayWithExactContents(['u1', 'u2']), 0);
    expect(store.listState().error).toBeNull();
    expect(store.deactivatingIds()).toEqual([]);
    expect(listCalls()).toBe(2);
  });

  it('reports a partial failure with the name of whoever failed, without undoing whoever succeeded', async () => {
    userDataService.getAll.and.returnValue(of(buildPage([user, user2])));
    userDataService.deactivate.and.callFake((userId: string) =>
      userId === 'u1' ? of(undefined) : throwError(() => new HttpErrorResponse({ status: 500 }))
    );
    const onDone = jasmine.createSpy('onDone');

    store.loadAll();
    await TestBed.inject(ApplicationRef).whenStable();

    store.deactivateMany(['u1', 'u2'], onDone);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(onDone).toHaveBeenCalledWith(['u1'], 1);
    expect(store.listState().error).toBe('Não foi possível desativar: João Santos.');
  });

  it('limits to 10 deactivations in flight at the same time, even when selecting more users than that', async () => {
    const ids = Array.from({ length: 15 }, (_, i) => `u${i + 1}`);
    const subjects = new Map(ids.map(id => [id, new Subject<void>()]));
    userDataService.deactivate.and.callFake((userId: string) => subjects.get(userId)!.asObservable());
    const onDone = jasmine.createSpy('onDone');

    store.deactivateMany(ids, onDone);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.deactivate).toHaveBeenCalledTimes(10); // no máximo 10 em voo, mesmo com 15 selecionados

    subjects.get('u1')!.next();
    subjects.get('u1')!.complete();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.deactivate).toHaveBeenCalledTimes(11); // uma vaga liberada, a 11ª entra

    ids.slice(1).forEach(id => {
      subjects.get(id)!.next();
      subjects.get(id)!.complete();
    });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.deactivate).toHaveBeenCalledTimes(15);
    expect(onDone).toHaveBeenCalledWith(jasmine.arrayWithExactContents(ids), 0);
  });

  it('does not call the API when the list of selected ids is empty', () => {
    store.deactivateMany([]);

    expect(userDataService.deactivate).not.toHaveBeenCalled();
  });

  it('keeps the id in activatingIds while the call is in progress, and removes it on completion', async () => {
    const subject = new Subject<void>();
    userDataService.activate.and.returnValue(subject);

    store.activate('u1');
    expect(store.activatingIds()).toEqual(['u1']);

    subject.next();
    subject.complete();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.activatingIds()).toEqual([]);
  });

  it('marks only the affected id in deactivatingIds, without blocking other users in progress at the same time', async () => {
    const subject = new Subject<void>();
    userDataService.deactivate.and.callFake((userId: string) => userId === 'u1' ? subject : of(undefined));

    store.deactivate('u1');
    expect(store.deactivatingIds()).toEqual(['u1']);

    store.deactivate('u2');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.deactivatingIds()).toEqual(['u1']);

    subject.next();
    subject.complete();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.deactivatingIds()).toEqual([]);
  });

  it('exposes the company totals by status (count GET, not the page) and reloads on deactivation', async () => {
    const counts = { totalCount: 50, activeCount: 42, pendingActivationCount: 5, inactiveCount: 3 };
    userDataService.getStatusCounts.and.returnValue(of(counts));
    store.loadAll();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.statusCounts()).toEqual(counts);

    const summaryCallsBefore = userDataService.getStatusCounts.calls.count();
    userDataService.deactivate.and.returnValue(of(void 0));
    store.deactivate('u1');
    await TestBed.inject(ApplicationRef).whenStable();
    expect(userDataService.getStatusCounts.calls.count()).toBeGreaterThan(summaryCallsBefore);
  });

  it('marks the Resumo as failed, without inventing 0, when the totals do not load', async () => {
    userDataService.getStatusCounts.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    store.loadAll();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.summaryFailed()).toBeTrue();
    expect(store.statusCounts()).toBeNull();
  });

  it('does not open a second ticket count for the same user while the first is in progress', () => {
    const subject = new Subject<number>();
    userDataService.countOpenAssignedTickets.and.returnValue(subject);
    const onDone = jasmine.createSpy('onDone');

    store.countOpenAssignedTickets('u1', onDone);
    store.countOpenAssignedTickets('u1', onDone);

    expect(userDataService.countOpenAssignedTickets).toHaveBeenCalledTimes(1);
    expect(store.countingTicketsIds()).toEqual(['u1']);

    subject.next(2);
    subject.complete();
    expect(onDone).toHaveBeenCalledOnceWith(2);
    expect(store.countingTicketsIds()).toEqual([]);
  });

  it('sums the open tickets of the selected users and counts how many people are assigned to any', () => {
    userDataService.countOpenAssignedTickets.and.callFake((userId: string) => of(userId === 'u1' ? 3 : userId === 'u2' ? 0 : 1));
    const onDone = jasmine.createSpy('onDone');

    store.countOpenAssignedTicketsMany(['u1', 'u2', 'u3'], onDone);

    expect(onDone).toHaveBeenCalledWith({ tickets: 4, people: 2 });
    expect(store.countingTicketsIds()).toEqual([]);
  });

  it('returns null in the bulk count if any query fails, without blocking the deactivation', () => {
    userDataService.countOpenAssignedTickets.and.callFake((userId: string) =>
      userId === 'u2' ? throwError(() => new HttpErrorResponse({ status: 500 })) : of(1));
    const onDone = jasmine.createSpy('onDone');

    store.countOpenAssignedTicketsMany(['u1', 'u2'], onDone);

    expect(onDone).toHaveBeenCalledWith(null);
    expect(store.countingTicketsIds()).toEqual([]);
  });

  it('reactivates several users at once (the bulk "Desfazer") and reloads the listing', async () => {
    userDataService.activate.and.returnValue(of(undefined));
    const onDone = jasmine.createSpy('onDone');
    store.loadAll();
    await TestBed.inject(ApplicationRef).whenStable();
    const callsBefore = listCalls();

    store.activateMany(['u1', 'u2'], onDone);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.activate).toHaveBeenCalledWith('u1');
    expect(userDataService.activate).toHaveBeenCalledWith('u2');
    expect(onDone).toHaveBeenCalledWith(2, 0);
    expect(store.activatingIds()).toEqual([]);
    expect(listCalls()).toBeGreaterThan(callsBefore);
  });

  it('warns above the list when the bulk reactivation fails for someone', () => {
    userDataService.activate.and.callFake((userId: string) =>
      userId === 'u1' ? of(undefined) : throwError(() => new HttpErrorResponse({ status: 500 })));
    const onDone = jasmine.createSpy('onDone');

    store.activateMany(['u1', 'u2'], onDone);

    expect(onDone).toHaveBeenCalledWith(1, 1);
    expect(store.listMutationError()).toContain('Não foi possível reativar');
  });

  it('clears the action error shown above the list', () => {
    userDataService.deactivate.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    store.deactivate('u1');
    expect(store.listMutationError()).not.toBeNull();

    store.clearListMutationError();

    expect(store.listMutationError()).toBeNull();
  });
});
