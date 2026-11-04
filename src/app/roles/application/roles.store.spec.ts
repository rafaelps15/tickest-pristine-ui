import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
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
    roleDataService = jasmine.createSpyObj('RoleDataService', ['getAll', 'assignPermissions']);
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

  it('exposes the loaded roles', async () => {
    store.load();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.roles()).toEqual(roles);
  });

  it('exposes the loaded permissions catalog', async () => {
    store.loadPermissions();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.permissions()).toEqual(permissions);
  });

  it('exposes the roles load error in listState, with an empty list', async () => {
    roleDataService.getAll.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.load();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.listState().error).toBeTruthy();
    expect(store.roles()).toEqual([]);
  });

  it('exposes the permissions catalog load error in permissionsState', async () => {
    permissionDataService.getAll.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.loadPermissions();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.permissionsState().error).toBeTruthy();
    expect(store.permissions()).toEqual([]);
  });

  it('groups the permissions by group, preserving arrival order', async () => {
    store.loadPermissions();
    await TestBed.inject(ApplicationRef).whenStable();

    const groups = store.permissionGroups();

    expect(groups.map(g => g.title)).toEqual(['Chamados', 'Usuários']);
    expect(groups[0].permissions.map(p => p.code)).toEqual(['tickets:manage', 'tickets:create']);
    expect(groups[1].permissions.map(p => p.code)).toEqual(['users:read']);
  });

  it('resolves the friendly name of a known permission code', async () => {
    store.loadPermissions();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.permissionName('tickets:manage')).toBe('Gerenciar tickets');
  });

  it('returns the code itself when the permission is not found in the catalog', async () => {
    store.loadPermissions();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.permissionName('codigo:inexistente')).toBe('codigo:inexistente');
  });

  it('assigns permissions to a role and reloads the list on success', async () => {
    roleDataService.assignPermissions.and.returnValue(of(undefined));
    const onSuccess = jasmine.createSpy('onSuccess');

    store.assignPermissions('Agent', ['tickets:manage', 'tickets:create'], onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(roleDataService.assignPermissions).toHaveBeenCalledWith('Agent', ['tickets:manage', 'tickets:create']);
    expect(onSuccess).toHaveBeenCalled();
  });

  it('sets assigningPermissions during the assignment, and releases it when done', async () => {
    const subject = new Subject<void>();
    roleDataService.assignPermissions.and.returnValue(subject);

    store.assignPermissions('Agent', ['tickets:manage']);
    expect(store.assigningPermissions()).toBeTrue();

    subject.next();
    subject.complete();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.assigningPermissions()).toBeFalse();
  });

  it('exposes the error message when the permission assignment fails, without leaking outside the modal', async () => {
    roleDataService.assignPermissions.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    store.assignPermissions('Agent', ['tickets:manage']);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.assignPermissionsError()).toBeTruthy();
    expect(store.listState().error).toBeNull();
  });

  it('clears the permission assignment error when calling clearAssignPermissionsError', async () => {
    roleDataService.assignPermissions.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    store.assignPermissions('Agent', ['tickets:manage']);
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.assignPermissionsError()).toBeTruthy();

    store.clearAssignPermissionsError();

    expect(store.assignPermissionsError()).toBeNull();
  });
});
