import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { RolesStore } from './roles.store';
import { RoleDataService } from '../infrastructure/role.data.service';
import { PermissionDataService } from '../infrastructure/permission.data.service';
import { Role } from '../entities/role';
import { Permission } from '../entities/permission';

describe('RolesStore', () => {
  const roles: Role[] = [
    { name: 'Agent', permissionCodes: ['tickets:manage'], isDefault: false, isAdministrator: false }
  ];
  const permissions: Permission[] = [
    { code: 'tickets:manage', name: 'Gerenciar tickets', description: 'Gerencia todos os tickets', group: 'Chamados', isAdministrative: false },
    { code: 'tickets:create', name: 'Abrir tickets', description: 'Abre novos tickets', group: 'Chamados', isAdministrative: false },
    { code: 'users:read', name: 'Ver usuários', description: 'Lista e visualiza usuários', group: 'Usuários', isAdministrative: true }
  ];

  let store: InstanceType<typeof RolesStore>;
  let roleDataService: jasmine.SpyObj<RoleDataService>;
  let permissionDataService: jasmine.SpyObj<PermissionDataService>;

  beforeEach(() => {
    roleDataService = jasmine.createSpyObj('RoleDataService', ['getAll', 'create', 'assignPermissions']);
    permissionDataService = jasmine.createSpyObj('PermissionDataService', ['getAll']);
    roleDataService.getAll.and.returnValue(of(roles));
    permissionDataService.getAll.and.returnValue(of(permissions));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        RolesStore,
        { provide: RoleDataService, useValue: roleDataService },
        { provide: PermissionDataService, useValue: permissionDataService }
      ]
    });
    store = TestBed.inject(RolesStore);
  });

  it('expõe as roles carregadas', async () => {
    store.load();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.roles()).toEqual(roles);
  });

  it('expõe o catálogo de permissões carregado', async () => {
    store.loadPermissions();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.permissions()).toEqual(permissions);
  });

  it('agrupa as permissões por grupo, preservando a ordem de chegada', async () => {
    store.loadPermissions();
    await TestBed.inject(ApplicationRef).whenStable();

    const groups = store.permissionGroups();

    expect(groups.map(g => g.title)).toEqual(['Chamados', 'Usuários']);
    expect(groups[0].permissions.map(p => p.code)).toEqual(['tickets:manage', 'tickets:create']);
    expect(groups[1].permissions.map(p => p.code)).toEqual(['users:read']);
  });

  it('resolve o nome amigável de um código de permissão conhecido', async () => {
    store.loadPermissions();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.permissionName('tickets:manage')).toBe('Gerenciar tickets');
  });

  it('devolve o próprio código quando a permissão não é encontrada no catálogo', async () => {
    store.loadPermissions();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.permissionName('codigo:inexistente')).toBe('codigo:inexistente');
  });

  it('cria uma role e recarrega a listagem em caso de sucesso', async () => {
    roleDataService.create.and.returnValue(of('new-id'));
    const onSuccess = jasmine.createSpy('onSuccess');

    store.create('Supervisor', onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(roleDataService.create).toHaveBeenCalledWith('Supervisor');
    expect(onSuccess).toHaveBeenCalled();
    expect(store.createError()).toBeNull();
  });

  it('expõe a mensagem de erro quando a criação de role falhar, sem vazar pra fora do modal', async () => {
    roleDataService.create.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));

    store.create('Agent');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.createError()).toBeTruthy();
    expect(store.listState().error).toBeNull();
  });

  it('atribui permissões a uma role e recarrega a listagem em caso de sucesso', async () => {
    roleDataService.assignPermissions.and.returnValue(of(undefined));
    const onSuccess = jasmine.createSpy('onSuccess');

    store.assignPermissions('Agent', ['tickets:manage', 'tickets:create'], onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(roleDataService.assignPermissions).toHaveBeenCalledWith('Agent', ['tickets:manage', 'tickets:create']);
    expect(onSuccess).toHaveBeenCalled();
  });

  it('expõe a mensagem de erro quando a atribuição de permissões falhar, sem vazar pra fora do modal', async () => {
    roleDataService.assignPermissions.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    store.assignPermissions('Agent', ['tickets:manage']);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.assignPermissionsError()).toBeTruthy();
    expect(store.listState().error).toBeNull();
  });

  it('limpa o erro de criação ao chamar clearCreateError', async () => {
    roleDataService.create.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    store.create('Agent');
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.createError()).toBeTruthy();

    store.clearCreateError();

    expect(store.createError()).toBeNull();
  });

  it('limpa o erro de atribuição de permissões ao chamar clearAssignPermissionsError', async () => {
    roleDataService.assignPermissions.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    store.assignPermissions('Agent', ['tickets:manage']);
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.assignPermissionsError()).toBeTruthy();

    store.clearAssignPermissionsError();

    expect(store.assignPermissionsError()).toBeNull();
  });
});
