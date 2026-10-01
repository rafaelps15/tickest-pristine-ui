import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { UsersStore } from './users.store';
import { UserDataService } from '../infrastructure/user.data.service';
import { AuthDataService } from '../../shared';
import { UserSummary } from '../entities/user-summary';

describe('UsersStore', () => {
  const users: UserSummary[] = [
    { id: 'u1', email: 'maria@empresa.com', firstName: 'Maria', lastName: 'Silva', roles: [] }
  ];

  let store: InstanceType<typeof UsersStore>;
  let userDataService: jasmine.SpyObj<UserDataService>;
  let authDataService: jasmine.SpyObj<AuthDataService>;

  beforeEach(() => {
    userDataService = jasmine.createSpyObj('UserDataService', ['getAll', 'updateProfile', 'assignRoles']);
    authDataService = jasmine.createSpyObj('AuthDataService', ['register']);
    userDataService.getAll.and.returnValue(of(users));

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

  it('expõe os usuários carregados', async () => {
    store.loadAll();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.users()).toEqual(users);
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
});
