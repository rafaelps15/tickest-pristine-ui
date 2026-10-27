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
    userDataService = jasmine.createSpyObj('UserDataService', ['getAll', 'updateProfile', 'assignRoles', 'deactivate', 'activate', 'resendInvitation']);
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
        roles: [{ name: 'Requester' }, { name: 'Agent' }]
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

  it('restaura os filtros de uma vez a partir da URL, sem voltar pra página 1', async () => {
    store.hydrateFiltersFromUrl({ status: 'Inactive', createdFrom: '2026-01-01', createdTo: '2026-01-31', page: 3, pageSize: 50 });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.getAll).toHaveBeenCalledWith({
      status: 'Inactive', createdFrom: '2026-01-01', createdTo: '2026-01-31', page: 3, pageSize: 50
    });
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
    expect(store.listLoadFailed()).toBeTrue();
  });

  it('não marca falha de carga quando o erro é de uma ação (desativar), que recarregar não resolve', async () => {
    store.loadAll();
    await TestBed.inject(ApplicationRef).whenStable();
    userDataService.deactivate.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.deactivate('u1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.listState().error).toBe('Erro ao desativar usuário');
    expect(store.listLoadFailed()).toBeFalse();
  });

  it('cria um usuário, marca sucesso e recarrega a listagem', async () => {
    authDataService.register.and.returnValue(of('new-id'));

    store.loadAll();
    await TestBed.inject(ApplicationRef).whenStable();

    store.createUser({ firstName: 'Ana', lastName: 'Costa', email: 'ana@empresa.com' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(authDataService.register).toHaveBeenCalled();
    expect(store.success()).toBeTrue();
    expect(userDataService.getAll).toHaveBeenCalledTimes(2);
  });

  it('expõe a mensagem de erro quando a criação falhar com e-mail duplicado', async () => {
    authDataService.register.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));

    store.createUser({ firstName: 'Ana', lastName: 'Costa', email: 'ana@empresa.com' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.success()).toBeFalse();
    expect(store.error()).toBe('Este e-mail já está cadastrado.');
  });

  it('expõe mensagem própria quando a criação falhar por falta de permissão (401/403)', async () => {
    authDataService.register.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    store.createUser({ firstName: 'Ana', lastName: 'Costa', email: 'ana@empresa.com' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.error()).toBe('Você não tem permissão para solicitar este cadastro.');
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
    expect(store.profileError()).toBeNull();
  });

  it('cria o usuário e já atribui as funções escolhidas com o id devolvido pelo cadastro', async () => {
    authDataService.register.and.returnValue(of('new-id'));
    userDataService.assignRoles.and.returnValue(of(undefined));

    store.createUser({ firstName: 'Ana', lastName: 'Costa', email: 'ana@empresa.com' }, ['Agent']);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.assignRoles).toHaveBeenCalledWith('new-id', ['Agent']);
    expect(store.success()).toBeTrue();
    expect(store.createdUserId()).toBe('new-id');
    expect(store.createRolesFailed()).toBeFalse();
  });

  it('não chama a atribuição de funções quando nenhuma foi escolhida', async () => {
    authDataService.register.and.returnValue(of('new-id'));

    store.createUser({ firstName: 'Ana', lastName: 'Costa', email: 'ana@empresa.com' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.assignRoles).not.toHaveBeenCalled();
    expect(store.success()).toBeTrue();
  });

  it('trata como cadastro concluído, mas sinaliza, quando só a atribuição de funções falha', async () => {
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

  it('reenvia o convite, recarrega a listagem e libera o indicador de andamento', async () => {
    userDataService.resendInvitation.and.returnValue(of(undefined));
    const onSuccess = jasmine.createSpy('onSuccess');

    store.resendInvitation('u1', onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.resendInvitation).toHaveBeenCalledWith('u1');
    expect(onSuccess).toHaveBeenCalled();
    expect(store.resendingInvitationIds()).toEqual([]);
  });

  it('mostra o motivo do back-end quando o reenvio é recusado (ex.: limite de convites em 24h)', async () => {
    userDataService.resendInvitation.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 409,
      error: { title: 'Users.InvitationLimitReached', detail: 'Este usuário já recebeu 5 convites nas últimas 24 horas. Tente de novo mais tarde.' }
    })));

    store.resendInvitation('u1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.listState().error).toBe('Este usuário já recebeu 5 convites nas últimas 24 horas. Tente de novo mais tarde.');
    expect(store.resendingInvitationIds()).toEqual([]);
  });

  it('expõe a falha de atualização de cadastro no erro do modal, sem poluir o erro da listagem', async () => {
    userDataService.updateProfile.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.updateProfile('u1', { firstName: 'Ana', lastName: 'Costa' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.profileError()).toBe('Erro ao atualizar cadastro');
    expect(store.listState().error).toBeNull();
  });

  it('expõe a falha de atribuição de funções no erro do modal, sem poluir o erro da listagem', async () => {
    userDataService.assignRoles.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.assignRoles('u1', ['Agent']);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.rolesError()).toBe('Erro ao atribuir funções');
    expect(store.listState().error).toBeNull();
  });

  it('não deixa um erro de atribuição de funções aparecer no modal de edição de cadastro', async () => {
    userDataService.assignRoles.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    store.assignRoles('u1', ['Agent']);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.profileError()).toBeNull();
  });

  it('limpa os erros dos dois modais de uma vez', async () => {
    userDataService.updateProfile.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    userDataService.assignRoles.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    store.updateProfile('u1', { firstName: 'Ana', lastName: 'Costa' });
    store.assignRoles('u1', ['Agent']);
    await TestBed.inject(ApplicationRef).whenStable();

    store.clearDialogErrors();

    expect(store.profileError()).toBeNull();
    expect(store.rolesError()).toBeNull();
  });

  it('atribui funções a um usuário e recarrega a listagem em caso de sucesso', async () => {
    userDataService.assignRoles.and.returnValue(of(undefined));
    const onSuccess = jasmine.createSpy('onSuccess');

    store.assignRoles('u1', ['Agent', 'Requester'], onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.assignRoles).toHaveBeenCalledWith('u1', ['Agent', 'Requester']);
    expect(onSuccess).toHaveBeenCalled();
  });

  it('desativa um usuário e recarrega a listagem em caso de sucesso', async () => {
    userDataService.deactivate.and.returnValue(of(undefined));
    const onSuccess = jasmine.createSpy('onSuccess');

    store.deactivate('u1', onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.deactivate).toHaveBeenCalledWith('u1');
    expect(onSuccess).toHaveBeenCalled();
    expect(store.deactivatingIds()).toEqual([]);
  });

  it('expõe a mensagem de erro quando o usuário já estiver desativado', async () => {
    userDataService.deactivate.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));

    store.deactivate('u1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.listState().error).toBe('Este usuário já está desativado.');
    expect(store.deactivatingIds()).toEqual([]);
  });

  it('reativa um usuário e recarrega a listagem em caso de sucesso', async () => {
    userDataService.activate.and.returnValue(of(undefined));
    const onSuccess = jasmine.createSpy('onSuccess');

    store.activate('u1', onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.activate).toHaveBeenCalledWith('u1');
    expect(onSuccess).toHaveBeenCalled();
    expect(store.activatingIds()).toEqual([]);
  });

  it('expõe a mensagem de erro quando o usuário já estiver ativo', async () => {
    userDataService.activate.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));

    store.activate('u1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.listState().error).toBe('Este usuário já está ativo.');
    expect(store.activatingIds()).toEqual([]);
  });

  it('desativa vários usuários em lote, em paralelo, e recarrega a listagem quando todos têm sucesso', async () => {
    userDataService.getAll.and.returnValue(of(buildPage([user, user2])));
    userDataService.deactivate.and.returnValue(of(undefined));
    const onDone = jasmine.createSpy('onDone');

    store.loadAll();
    await TestBed.inject(ApplicationRef).whenStable();

    store.deactivateMany(['u1', 'u2'], onDone);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(userDataService.deactivate).toHaveBeenCalledWith('u1');
    expect(userDataService.deactivate).toHaveBeenCalledWith('u2');
    expect(onDone).toHaveBeenCalledWith(2, 0);
    expect(store.listState().error).toBeNull();
    expect(store.deactivatingIds()).toEqual([]);
    expect(userDataService.getAll).toHaveBeenCalledTimes(2);
  });

  it('reporta falha parcial com o nome de quem falhou, sem desfazer quem teve sucesso', async () => {
    userDataService.getAll.and.returnValue(of(buildPage([user, user2])));
    userDataService.deactivate.and.callFake((userId: string) =>
      userId === 'u1' ? of(undefined) : throwError(() => new HttpErrorResponse({ status: 500 }))
    );
    const onDone = jasmine.createSpy('onDone');

    store.loadAll();
    await TestBed.inject(ApplicationRef).whenStable();

    store.deactivateMany(['u1', 'u2'], onDone);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(onDone).toHaveBeenCalledWith(1, 1);
    expect(store.listState().error).toBe('Não foi possível desativar: João Santos.');
  });

  it('limita a 10 desativações em voo ao mesmo tempo, mesmo selecionando mais usuários que isso', async () => {
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
    expect(onDone).toHaveBeenCalledWith(15, 0);
  });

  it('não chama a API quando a lista de ids selecionados estiver vazia', () => {
    store.deactivateMany([]);

    expect(userDataService.deactivate).not.toHaveBeenCalled();
  });

  it('mantém o id em activatingIds enquanto a chamada está em andamento, e remove ao concluir', async () => {
    const subject = new Subject<void>();
    userDataService.activate.and.returnValue(subject);

    store.activate('u1');
    expect(store.activatingIds()).toEqual(['u1']);

    subject.next();
    subject.complete();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.activatingIds()).toEqual([]);
  });

  it('marca só o id afetado em deactivatingIds, sem travar outros usuários em andamento ao mesmo tempo', async () => {
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
});
