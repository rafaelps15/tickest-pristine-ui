import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { RoleListComponent } from './role-list.component';
import { RolesStore } from '../application/roles.store';
import { Role } from '../entities/role';
import { Permission } from '../entities/permission';

describe('RoleListComponent', () => {
  const adminRole: Role = { id: 'role-admin', name: 'Admin', permissionCodes: ['users:read'], isDefault: false, isAdministrator: true };
  const agentRole: Role = { id: 'role-agent', name: 'Agent', permissionCodes: ['tickets:manage'], isDefault: false, isAdministrator: false };
  const permissions: Permission[] = [
    { code: 'tickets:manage', name: 'Gerenciar tickets', description: 'Gerencia todos os tickets', group: 'Chamados', isAdministrative: false },
    { code: 'users:read', name: 'Ver usuários', description: 'Lista e visualiza usuários', group: 'Usuários', isAdministrative: true }
  ];

  /** Cria um store falso com signals reais, para o template reagir como no store verdadeiro. */
  function createStoreFake() {
    return {
      roles: signal<Role[]>([adminRole, agentRole]),
      listState: signal({ data: [adminRole, agentRole], loading: false, error: null as string | null }),
      permissionGroups: signal([{ title: 'Chamados', permissions: [permissions[0]] }, { title: 'Usuários', permissions: [permissions[1]] }]),
      permissionName: jasmine.createSpy('permissionName').and.callFake(
        (code: string) => permissions.find(p => p.code === code)?.name ?? code
      ),
      load: jasmine.createSpy('load'),
      loadPermissions: jasmine.createSpy('loadPermissions'),
      create: jasmine.createSpy('create'),
      assignPermissions: jasmine.createSpy('assignPermissions')
    };
  }

  let storeFake: ReturnType<typeof createStoreFake>;

  beforeEach(async () => {
    storeFake = createStoreFake();

    await TestBed.configureTestingModule({
      imports: [RoleListComponent],
      providers: [provideZonelessChangeDetection(), { provide: RolesStore, useValue: storeFake }]
    }).compileComponents();
  });

  it('carrega roles e permissões ao inicializar', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    expect(storeFake.load).toHaveBeenCalled();
    expect(storeFake.loadPermissions).toHaveBeenCalled();
  });

  it('mostra a etiqueta de Administrador e desabilita o botão de permissões para a role administradora', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Administrador');

    const buttons = fixture.nativeElement.querySelectorAll('button[data-bs-target="#rolePermissionsModal"]');
    expect((buttons[0] as HTMLButtonElement).disabled).toBeTrue();
    expect((buttons[1] as HTMLButtonElement).disabled).toBeFalse();
  });

  it('mostra o nome amigável das permissões em vez do código', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Gerenciar tickets');
    expect(fixture.nativeElement.textContent).not.toContain('tickets:manage');
  });

  it('pré-marca as permissões já atribuídas ao abrir o modal', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openPermissionsModal(agentRole);

    expect(fixture.componentInstance.isChecked('tickets:manage')).toBeTrue();
    expect(fixture.componentInstance.isChecked('users:read')).toBeFalse();
  });

  it('envia a atribuição de permissões marcadas', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openPermissionsModal(agentRole);
    fixture.componentInstance.togglePermission('users:read', true);
    fixture.componentInstance.onAssignPermissionsSubmit();

    expect(storeFake.assignPermissions).toHaveBeenCalledWith('role-agent', ['tickets:manage', 'users:read'], jasmine.any(Function));
  });

  it('envia a criação de uma nova role quando o formulário for válido', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    fixture.componentInstance.createForm.setValue({ name: 'Supervisor' });
    fixture.componentInstance.onCreateSubmit();

    expect(storeFake.create).toHaveBeenCalledWith('Supervisor', jasmine.any(Function));
  });
});
