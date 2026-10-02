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
  const user: UserSummary = {
    id: 'u1', email: 'maria@empresa.com', firstName: 'Maria', lastName: 'Silva', roles: [],
    isActive: true, createdAtUtc: '2026-01-01T00:00:00Z', deactivatedAtUtc: null
  };

  let store: InstanceType<typeof UsersStore>;
  let userDataService: jasmine.SpyObj<UserDataService>;
  let authDataService: jasmine.SpyObj<AuthDataService>;

  beforeEach(() => {
    userDataService = jasmine.createSpyObj('UserDataService', ['getAll', 'updateProfile', 'assignRoles', 'deactivate', 'activate']);
    authDataService = jasmine.createSpyObj('AuthDataService', ['register']);
    userDataService.getAll.and.returnValue(of(buildPage([user])));

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

  it('expõe os usuários da página carregada e os dados de paginação', async () => {
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

  it('carrega com os filtros padrão (todos os status, página 1, 20 por página)', async () => {
    store.loadAll();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.getAll).toHaveBeenCalledWith({ status: 'All', page: 1, pageSize: 20 });
  });

  it('ordena as funções de cada usuário alfabeticamente, independente da ordem recebida da API', async () => {
    userDataService.getAll.and.returnValue(of(buildPage([
      {
        ...user,
        roles: [{ id: 'role-2', name: 'Requester' }, { id: 'role-1', name: 'Agent' }]
      }
    ])));

    store.loadAll();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.users()[0].roles.map(role => role.name)).toEqual(['Agent', 'Requester']);
  });

  it('muda a busca e volta pra página 1', async () => {
    store.goToPage(3);
    store.setSearch('maria');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.getAll).toHaveBeenCalledWith({ status: 'All', search: 'maria', page: 1, pageSize: 20 });
  });

  it('muda o status e volta pra página 1', async () => {
    store.goToPage(2);
    store.setStatus('Inactive');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.getAll).toHaveBeenCalledWith({ status: 'Inactive', page: 1, pageSize: 20 });
  });

  it('muda o período de cadastro e volta pra página 1', async () => {
    store.goToPage(2);
    store.setPeriod('2026-01-01', '2026-01-31');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.getAll).toHaveBeenCalledWith({
      status: 'All', createdFrom: '2026-01-01', createdTo: '2026-01-31', page: 1, pageSize: 20
    });
  });

  it('navega para a página informada', async () => {
    store.goToPage(2);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.getAll).toHaveBeenCalledWith({ status: 'All', page: 2, pageSize: 20 });
  });

  it('muda o tamanho da página', async () => {
    store.setPageSize(50);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.getAll).toHaveBeenCalledWith({ status: 'All', page: 1, pageSize: 50 });
  });

  it('volta pra página 1 ao mudar o tamanho da página, pra não ficar numa página que deixou de existir', async () => {
    store.goToPage(5);
    store.setPageSize(100);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.getAll).toHaveBeenCalledWith({ status: 'All', page: 1, pageSize: 100 });
  });

  it('limpa os filtros, voltando ao estado padrão', async () => {
    store.setSearch('maria');
    store.setStatus('Inactive');
    store.goToPage(3);
    store.clearFilters();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.getAll).toHaveBeenCalledWith({ status: 'All', page: 1, pageSize: 20 });
  });

  it('expõe a mensagem de erro do servidor quando o período for inválido (400)', async () => {
    userDataService.getAll.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 400,
      error: { title: 'Users.InvalidCreatedPeriod', detail: 'A data inicial do período de cadastro não pode ser maior que a data final.' }
    })));

    store.setPeriod('2026-02-01', '2026-01-01');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.listState().error).toBe('A data inicial do período de cadastro não pode ser maior que a data final.');
  });

  it('cria um usuário, marca sucesso e recarrega a listagem', async () => {
    authDataService.register.and.returnValue(of('new-id'));

    store.loadAll();
    await TestBed.inject(ApplicationRef).whenStable();

    store.createUser({ firstName: 'Ana', lastName: 'Costa', email: 'ana@empresa.com', password: 'Password123!' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(authDataService.register).toHaveBeenCalled();
    expect(store.success()).toBeTrue();
    expect(userDataService.getAll).toHaveBeenCalledTimes(2);
  });

  it('expõe a mensagem de erro quando a criação falhar com e-mail duplicado', async () => {
    authDataService.register.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));

    store.createUser({ firstName: 'Ana', lastName: 'Costa', email: 'ana@empresa.com', password: 'Password123!' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.success()).toBeFalse();
    expect(store.error()).toBe('Este e-mail já está cadastrado.');
  });

  it('reseta loading/success/error ao chamar resetState', () => {
    store.resetState();

    expect(store.loading()).toBeFalse();
    expect(store.success()).toBeFalse();
    expect(store.error()).toBeNull();
  });

  it('atualiza o cadastro de um usuário e recarrega a listagem em caso de sucesso', async () => {
    userDataService.updateProfile.and.returnValue(of(undefined));
    const onSuccess = jasmine.createSpy('onSuccess');

    store.updateProfile('u1', { firstName: 'Ana', lastName: 'Costa' }, onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.updateProfile).toHaveBeenCalledWith('u1', { firstName: 'Ana', lastName: 'Costa' });
    expect(onSuccess).toHaveBeenCalled();
    expect(store.listState().error).toBeNull();
  });

  it('expõe a mensagem de erro quando a atualização de cadastro falhar', async () => {
    userDataService.updateProfile.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.updateProfile('u1', { firstName: 'Ana', lastName: 'Costa' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.listState().error).toBe('Erro ao atualizar cadastro');
  });

  it('não deixa um erro de atribuição de funções aparecer numa tentativa de atualização de cadastro seguinte', async () => {
    userDataService.assignRoles.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    store.assignRoles('u1', ['role-1']);
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.listState().error).toBe('Erro ao atribuir funções');

    userDataService.updateProfile.and.returnValue(of(undefined));
    store.updateProfile('u1', { firstName: 'Ana', lastName: 'Costa' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.listState().error).toBeNull();
  });

  it('atribui funções a um usuário e recarrega a listagem em caso de sucesso', async () => {
    userDataService.assignRoles.and.returnValue(of(undefined));
    const onSuccess = jasmine.createSpy('onSuccess');

    store.assignRoles('u1', ['role-1', 'role-2'], onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.assignRoles).toHaveBeenCalledWith('u1', ['role-1', 'role-2']);
    expect(onSuccess).toHaveBeenCalled();
  });

  it('desativa um usuário e recarrega a listagem em caso de sucesso', async () => {
    userDataService.deactivate.and.returnValue(of(undefined));
    const onSuccess = jasmine.createSpy('onSuccess');

    store.deactivate('u1', onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.deactivate).toHaveBeenCalledWith('u1');
    expect(onSuccess).toHaveBeenCalled();
    expect(store.deactivating()).toBeFalse();
  });

  it('expõe a mensagem de erro quando o usuário já estiver desativado', async () => {
    userDataService.deactivate.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));

    store.deactivate('u1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.listState().error).toBe('Este usuário já está desativado.');
    expect(store.deactivating()).toBeFalse();
  });

  it('reativa um usuário e recarrega a listagem em caso de sucesso', async () => {
    userDataService.activate.and.returnValue(of(undefined));
    const onSuccess = jasmine.createSpy('onSuccess');

    store.activate('u1', onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.activate).toHaveBeenCalledWith('u1');
    expect(onSuccess).toHaveBeenCalled();
    expect(store.activating()).toBeFalse();
  });

  it('expõe a mensagem de erro quando o usuário já estiver ativo', async () => {
    userDataService.activate.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));

    store.activate('u1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.listState().error).toBe('Este usuário já está ativo.');
    expect(store.activating()).toBeFalse();
  });

  it('mantém activating marcado enquanto a chamada está em andamento, e desmarca ao concluir', async () => {
    const subject = new Subject<void>();
    userDataService.activate.and.returnValue(subject);

    store.activate('u1');
    expect(store.activating()).toBeTrue();

    subject.next();
    subject.complete();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.activating()).toBeFalse();
  });
});
