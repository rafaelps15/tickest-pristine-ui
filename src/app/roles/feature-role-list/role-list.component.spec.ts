import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { of } from 'rxjs';
import { RoleListComponent } from './role-list.component';
import { RolesStore } from '../application/roles.store';
import { Role } from '../entities/role';
import { Permission } from '../entities/permission';
import { ConfirmDialogService, SessionService, ToastService } from '../../shared';


describe('RoleListComponent', () => {
  const adminRole: Role = { name: 'Admin', permissionCodes: ['users:read'], isDefault: false, isAdministrator: true };
  const agentRole: Role = { name: 'Agent', permissionCodes: ['tickets:manage'], isDefault: false, isAdministrator: false };
  const supervisorRole: Role = { name: 'Supervisor', permissionCodes: ['tickets:manage', 'users:read'], isDefault: false, isAdministrator: false };
  const permissions: Permission[] = [
    { code: 'tickets:manage', name: 'Gerenciar tickets', description: 'Gerencia todos os tickets', group: 'Chamados', isAdministrative: false },
    { code: 'tickets:create', name: 'Abrir tickets', description: 'Abre novos tickets', group: 'Chamados', isAdministrative: false },
    { code: 'users:read', name: 'Ver usuários', description: 'Lista e visualiza usuários', group: 'Usuários', isAdministrative: true }
  ];
  const ticketPermissions = [permissions[0], permissions[1]];

  /** Cria um store falso com signals reais, para o template reagir como no store verdadeiro. */
  function createStoreFake() {
    return {
      roles: signal<Role[]>([adminRole, agentRole]),
      listState: signal({ data: [adminRole, agentRole], loading: false, error: null as string | null }),
      assignPermissionsError: signal<string | null>(null),
      assigningPermissions: signal(false),
      permissions: signal<Permission[]>(permissions),
      permissionsState: signal({ data: permissions, loading: false, error: null as string | null }),
      permissionGroups: signal([{ title: 'Chamados', permissions: ticketPermissions }, { title: 'Usuários', permissions: [permissions[2]] }]),
      permissionName: jasmine.createSpy('permissionName').and.callFake(
        (code: string) => permissions.find(p => p.code === code)?.name ?? code
      ),
      load: jasmine.createSpy('load'),
      loadPermissions: jasmine.createSpy('loadPermissions'),
      assignPermissions: jasmine.createSpy('assignPermissions'),
      clearAssignPermissionsError: jasmine.createSpy('clearAssignPermissionsError')
    };
  }

  let storeFake: ReturnType<typeof createStoreFake>;
  let confirmDialogServiceFake: jasmine.SpyObj<ConfirmDialogService>;
  let toastServiceFake: jasmine.SpyObj<ToastService>;
  /** Sessão falsa: por padrão, quem usa a tela tem todas as permissões (consulta e gestão de funções). */
  let sessionServiceFake: { hasPermission: jasmine.Spy };

  beforeEach(async () => {
    storeFake = createStoreFake();
    confirmDialogServiceFake = jasmine.createSpyObj('ConfirmDialogService', ['confirm']);
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    toastServiceFake = jasmine.createSpyObj('ToastService', ['show']);
    sessionServiceFake = { hasPermission: jasmine.createSpy('hasPermission').and.returnValue(true) };

    await TestBed.configureTestingModule({
      imports: [RoleListComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: RolesStore, useValue: storeFake },
        { provide: ConfirmDialogService, useValue: confirmDialogServiceFake },
        { provide: ToastService, useValue: toastServiceFake },
        { provide: SessionService, useValue: sessionServiceFake }
      ]
    }).compileComponents();
  });

  it('loads roles and permissions on init', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    expect(storeFake.load).toHaveBeenCalled();
    expect(storeFake.loadPermissions).toHaveBeenCalled();
  });

  it('does not offer creating a role: the back end has no such endpoint', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Nova Função');
  });

  it('shows the Administrador badge and offers "Ver permissões" for it and "Editar permissões" for the others', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Administrador');
    const labels = Array.from(fixture.nativeElement.querySelectorAll('tbody .dropdown-item') as NodeListOf<HTMLButtonElement>)
      .map(button => button.textContent?.trim());
    expect(labels.filter(label => label === 'Ver permissões').length).toBe(1);
    expect(labels.filter(label => label === 'Editar permissões').length).toBe(1);
    expect(fixture.nativeElement.querySelector('tbody .dropdown-item[disabled]')).toBeNull();
  });

  it('opens the Administrador permissions read-only, without saving', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    fixture.componentInstance.openPermissionsModal(adminRole);
    await fixture.whenStable();

    const modal = fixture.nativeElement.querySelector('#rolePermissionsModal') as HTMLElement;
    expect(modal.textContent).toContain('gerenciadas pelo sistema');
    const inputs = Array.from(modal.querySelectorAll('.permission-option input') as NodeListOf<HTMLInputElement>);
    expect(inputs.length).toBeGreaterThan(0);
    expect(inputs.every(input => input.disabled)).toBeTrue();
    expect(modal.querySelector('.modal-footer .btn-primary')).toBeNull();

    fixture.componentInstance.togglePermission('users:read', false);
    fixture.componentInstance.onAssignPermissionsSubmit();
    expect(storeFake.assignPermissions).not.toHaveBeenCalled();
  });

  it('with only roles:read, offers "Ver permissões" on every role and opens the dialog read-only, without saving', async () => {
    sessionServiceFake.hasPermission.and.callFake((code: string) => code === 'roles:read');
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    const labels = Array.from(fixture.nativeElement.querySelectorAll('tbody .dropdown-item') as NodeListOf<HTMLButtonElement>)
      .map(button => button.textContent?.trim());
    expect(labels).toEqual(['Ver permissões', 'Ver permissões']);
    expect(fixture.nativeElement.querySelector('app-page-header')?.textContent).toContain('Aqui você consulta as permissões');

    fixture.componentInstance.openPermissionsModal(agentRole);
    await fixture.whenStable();

    const modal = fixture.nativeElement.querySelector('#rolePermissionsModal') as HTMLElement;
    expect(modal.textContent).toContain('Você pode consultar as permissões das funções, mas não alterá-las.');
    const inputs = Array.from(modal.querySelectorAll('.permission-option input') as NodeListOf<HTMLInputElement>);
    expect(inputs.length).toBeGreaterThan(0);
    expect(inputs.every(input => input.disabled)).toBeTrue();
    expect(modal.querySelector('.permission-group-all')).toBeNull();
    expect(modal.querySelector('.modal-footer .btn-primary')).toBeNull();

    fixture.componentInstance.togglePermission('tickets:create', true);
    fixture.componentInstance.onAssignPermissionsSubmit();
    expect(storeFake.assignPermissions).not.toHaveBeenCalled();
  });

  it('with roles:manage, offers "Editar permissões" and says the screen adjusts them', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-page-header')?.textContent).toContain('Aqui você ajusta as permissões');
    expect(fixture.nativeElement.textContent).toContain('Editar permissões');
  });

  it('shows the friendly name of the permissions instead of the code', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Gerenciar tickets');
    expect(fixture.nativeElement.textContent).not.toContain('tickets:manage');
  });

  it('pre-checks the already assigned permissions when opening the modal', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openPermissionsModal(agentRole);

    expect(fixture.componentInstance.isChecked('tickets:manage')).toBeTrue();
    expect(fixture.componentInstance.isChecked('users:read')).toBeFalse();
  });

  it('clears the assignment error when opening the permissions modal of another role', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openPermissionsModal(agentRole);

    expect(storeFake.clearAssignPermissionsError).toHaveBeenCalled();
  });

  it('shows the permission assignment error inside the permissions modal, not on the page', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    fixture.componentInstance.openPermissionsModal(agentRole);
    storeFake.assignPermissionsError.set('Você não tem permissão para fazer isso.');
    await fixture.whenStable();

    const modalBody = fixture.nativeElement.querySelector('#rolePermissionsModal .modal-body');
    expect(modalBody.textContent).toContain('Você não tem permissão para fazer isso.');
  });

  it('shows at most 2 permission badges and groups the rest into "+N"', async () => {
    const roleWithManyPermissions: Role = { ...supervisorRole, permissionCodes: ['tickets:manage', 'users:read', 'tickets:create'] };
    storeFake.roles.set([roleWithManyPermissions]);
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.visiblePermissionCodes(roleWithManyPermissions)).toEqual(['tickets:manage', 'users:read']);
    expect(fixture.componentInstance.hiddenPermissionCount(roleWithManyPermissions)).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('+1');
  });

  it('the "+N" hides the number from the screen reader and delivers the hidden names as text', async () => {
    storeFake.roles.set([{ ...supervisorRole, permissionCodes: ['tickets:manage', 'tickets:create', 'users:read'] }]);
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    const cell = fixture.nativeElement.querySelector('td[data-label="Permissões"]') as HTMLElement;
    expect(cell.querySelector('[aria-hidden="true"]')?.textContent).toBe('+1');
    expect(cell.querySelector('.visually-hidden')?.textContent).toContain('Ver usuários');
  });

  it('on reload with the list on screen, keeps the rows faded instead of the spinner', async () => {
    storeFake.listState.set({ data: [adminRole, agentRole], loading: true, error: null });
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('table').classList).toContain('is-refreshing');
    expect(fixture.nativeElement.textContent).toContain('Agent');
    expect(fixture.nativeElement.querySelector('app-loading-state')).toBeNull();
  });

  it('a load failure with no list does not become the "nenhuma função" empty state and offers retry, without red', async () => {
    storeFake.roles.set([]);
    storeFake.listState.set({ data: [], loading: false, error: 'Erro ao carregar funções' });
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Não foi possível carregar as funções.');
    expect(text).not.toContain('Nenhuma função disponível');
    expect(fixture.nativeElement.querySelector('.alert-danger')).toBeNull();

    (fixture.nativeElement.querySelector('.role-notice button') as HTMLButtonElement).click();
    expect(storeFake.load).toHaveBeenCalledTimes(2);
  });

  it('a failed reload with the list on screen keeps the rows and warns above them', async () => {
    storeFake.listState.set({ data: [adminRole, agentRole], loading: false, error: 'Erro ao carregar funções' });
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('mostrando a última carregada');
    expect(fixture.nativeElement.textContent).toContain('Agent');
  });

  it('with no role at all, explains where they come from without promising to create one', async () => {
    storeFake.roles.set([]);
    storeFake.listState.set({ data: [], loading: false, error: null });
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Nenhuma função disponível.');
    expect(fixture.nativeElement.querySelector('app-empty-state button')).toBeNull();
  });

  it('submits the assignment of the checked permissions', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openPermissionsModal(agentRole);
    fixture.componentInstance.togglePermission('users:read', true);
    fixture.componentInstance.onAssignPermissionsSubmit();

    expect(storeFake.assignPermissions).toHaveBeenCalledWith('Agent', ['tickets:manage', 'users:read'], jasmine.any(Function));
    expect(confirmDialogServiceFake.confirm).not.toHaveBeenCalled();
  });

  it('asks for extra confirmation when clearing a role permissions without removing any administrative one', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openPermissionsModal(agentRole);
    fixture.componentInstance.togglePermission('tickets:manage', false);
    fixture.componentInstance.onAssignPermissionsSubmit();

    expect(confirmDialogServiceFake.confirm).toHaveBeenCalled();
    const options = confirmDialogServiceFake.confirm.calls.mostRecent().args[0];
    expect(options.title).toContain('sem nenhuma permissão');
    expect(storeFake.assignPermissions).toHaveBeenCalledWith('Agent', [], jasmine.any(Function));
  });

  it('does not clear the permissions when the "sem permissões" confirmation is canceled', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(false));
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openPermissionsModal(agentRole);
    fixture.componentInstance.togglePermission('tickets:manage', false);
    fixture.componentInstance.onAssignPermissionsSubmit();

    expect(storeFake.assignPermissions).not.toHaveBeenCalled();
  });

  it('asks for extra confirmation when removing an already assigned administrative permission', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openPermissionsModal(supervisorRole);
    fixture.componentInstance.togglePermission('users:read', false);
    fixture.componentInstance.onAssignPermissionsSubmit();

    expect(confirmDialogServiceFake.confirm).toHaveBeenCalled();
    const options = confirmDialogServiceFake.confirm.calls.mostRecent().args[0];
    expect(options.message).toContain('Ver usuários');
    expect(options.message).not.toContain('não só você');
    expect(storeFake.assignPermissions).toHaveBeenCalledWith('Supervisor', ['tickets:manage'], jasmine.any(Function));
  });

  it('does not submit the removal of an administrative permission when the confirmation is canceled', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(false));
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openPermissionsModal(supervisorRole);
    fixture.componentInstance.togglePermission('users:read', false);
    fixture.componentInstance.onAssignPermissionsSubmit();

    expect(storeFake.assignPermissions).not.toHaveBeenCalled();
  });

  it('the "Salvar" button of the permissions modal is disabled during the assignment, as is "Cancelar"', async () => {
    storeFake.assigningPermissions.set(true);
    const fixture = TestBed.createComponent(RoleListComponent);
    fixture.componentInstance.openPermissionsModal(agentRole);
    fixture.componentInstance.togglePermission('users:read', true);
    await fixture.whenStable();

    const footer = fixture.nativeElement.querySelector('#rolePermissionsModal .modal-footer') as HTMLElement;
    expect((footer.querySelector('.btn-primary') as HTMLButtonElement).disabled).toBeTrue();
    expect((footer.querySelector('.btn-outline-secondary') as HTMLButtonElement).disabled).toBeTrue();
  });

  it('in the permissions dialog, "Salvar" only enables with a change and the footer summarizes what changed', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    fixture.componentInstance.openPermissionsModal(agentRole);
    await fixture.whenStable();

    const save = () => fixture.nativeElement.querySelector('#rolePermissionsModal .modal-footer .btn-primary') as HTMLButtonElement;
    expect(save().disabled).toBeTrue();
    expect(fixture.componentInstance.permissionChangeSummary()).toBe('Nenhuma alteração');

    fixture.componentInstance.togglePermission('tickets:create', true);
    fixture.componentInstance.togglePermission('users:read', true);
    fixture.componentInstance.togglePermission('tickets:manage', false);
    await fixture.whenStable();

    expect(save().disabled).toBeFalse();
    expect(fixture.componentInstance.permissionChangeSummary()).toBe('2 adicionadas e 1 removida');
    expect(fixture.nativeElement.querySelectorAll('#rolePermissionsModal .permission-option.is-changed').length).toBe(3);
  });

  it('"Todas" checks the whole group and is indeterminate with only part of it checked', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    fixture.componentInstance.openPermissionsModal(agentRole);
    await fixture.whenStable();

    const groupBox = fixture.nativeElement.querySelector('#perm-group-0') as HTMLInputElement;
    expect(groupBox.indeterminate).toBeTrue();

    groupBox.checked = true;
    groupBox.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(fixture.componentInstance.isChecked('tickets:create')).toBeTrue();
    expect(fixture.componentInstance.groupSelection(ticketPermissions)).toBe('all');

    fixture.componentInstance.toggleGroup(ticketPermissions, false);
    expect(fixture.componentInstance.groupSelection(ticketPermissions)).toBe('none');
  });

  describe('administrative permissions the session does not have (PrivilegeEscalationGuard of the back end)', () => {
    /** Permissão administrativa de chamados, no mesmo grupo de duas que não são. */
    const assign: Permission = { code: 'tickets:assign', name: 'Atribuir chamados', description: 'Define outra pessoa como responsável', group: 'Chamados', isAdministrative: true };
    const ticketGroup = [...ticketPermissions, assign];

    beforeEach(() => {
      // Gerencia funções e atende a fila, mas não tem "Ver usuários" nem "Atribuir chamados".
      sessionServiceFake.hasPermission.and.callFake((code: string) =>
        code === 'roles:read' || code === 'roles:manage' || code === 'tickets:manage');
      storeFake.permissions.set([...permissions, assign]);
      storeFake.permissionGroups.set([{ title: 'Chamados', permissions: ticketGroup }, { title: 'Usuários', permissions: [permissions[2]] }]);
    });

    it('keeps the box in the saved state, unchecked or checked, disabled and saying why', async () => {
      const fixture = TestBed.createComponent(RoleListComponent);
      fixture.componentInstance.openPermissionsModal(agentRole);
      await fixture.whenStable();

      const box = (code: string) => fixture.nativeElement.querySelector(`[id="perm-${code}"]`) as HTMLInputElement;
      expect(box('users:read').disabled).toBeTrue();
      expect(box('users:read').checked).toBeFalse();
      expect(box('users:read').getAttribute('aria-describedby')).toContain('perm-lock-users:read');
      expect(fixture.nativeElement.querySelector('[id="perm-lock-users:read"]')?.textContent).toContain('Só quem tem esta permissão pode concedê-la ou removê-la.');
      expect(box('tickets:create').disabled).toBeFalse();
      expect(fixture.nativeElement.querySelector('[id="perm-lock-tickets:create"]')).toBeNull();

      fixture.componentInstance.openPermissionsModal(supervisorRole);
      await fixture.whenStable();
      expect(box('users:read').disabled).toBeTrue();
      expect(box('users:read').checked).toBeTrue();
    });

    it('neither the box nor "Todas" grant it, and the submission sends only what the session may change', async () => {
      const fixture = TestBed.createComponent(RoleListComponent);
      fixture.componentInstance.openPermissionsModal(agentRole);
      await fixture.whenStable();

      fixture.componentInstance.togglePermission('tickets:assign', true);
      fixture.componentInstance.toggleGroup(ticketGroup, true);
      expect(fixture.componentInstance.isChecked('tickets:assign')).toBeFalse();
      expect(fixture.componentInstance.isChecked('tickets:create')).toBeTrue();
      expect(fixture.componentInstance.groupSelection(ticketGroup)).toBe('all');

      fixture.componentInstance.onAssignPermissionsSubmit();
      expect(storeFake.assignPermissions).toHaveBeenCalledWith('Agent', ['tickets:manage', 'tickets:create'], jasmine.any(Function));
    });

    it('nor remove it, when the role already has it', async () => {
      const fixture = TestBed.createComponent(RoleListComponent);
      fixture.componentInstance.openPermissionsModal(supervisorRole);
      await fixture.whenStable();

      fixture.componentInstance.togglePermission('users:read', false);
      fixture.componentInstance.togglePermission('tickets:create', true);
      fixture.componentInstance.onAssignPermissionsSubmit();

      expect(confirmDialogServiceFake.confirm).not.toHaveBeenCalled();
      expect(storeFake.assignPermissions).toHaveBeenCalledWith('Supervisor', ['tickets:manage', 'users:read', 'tickets:create'], jasmine.any(Function));
    });
  });

  it('in the permissions dialog with no catalog, shows the error with "Tentar novamente" and locks "Salvar"', async () => {
    storeFake.permissions.set([]);
    storeFake.permissionGroups.set([]);
    storeFake.permissionsState.set({ data: [], loading: false, error: 'Erro ao carregar permissões' });
    const fixture = TestBed.createComponent(RoleListComponent);
    fixture.componentInstance.openPermissionsModal(agentRole);
    await fixture.whenStable();

    const modal = fixture.nativeElement.querySelector('#rolePermissionsModal') as HTMLElement;
    expect(modal.textContent).toContain('Não foi possível carregar a lista de permissões.');
    expect((modal.querySelector('.modal-footer .btn-primary') as HTMLButtonElement).disabled).toBeTrue();

    (modal.querySelector('.role-notice button') as HTMLButtonElement).click();
    expect(storeFake.loadPermissions).toHaveBeenCalledTimes(2);
  });

  it('asks for confirmation before discarding unsaved selections, and closes directly with no changes', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(false));
    const fixture = TestBed.createComponent(RoleListComponent);
    fixture.componentInstance.openPermissionsModal(agentRole);
    await fixture.whenStable();

    fixture.componentInstance.requestClosePermissions();
    await fixture.whenStable();
    expect(confirmDialogServiceFake.confirm).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#rolePermissionsModal')).toBeNull();

    fixture.componentInstance.openPermissionsModal(agentRole);
    fixture.componentInstance.togglePermission('users:read', true);
    fixture.componentInstance.requestClosePermissions();
    await fixture.whenStable();

    expect(confirmDialogServiceFake.confirm).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#rolePermissionsModal')).not.toBeNull();
  });

  it('does not offer a color of its own for the role: the back end does not store color, and neither does the browser', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Cor do badge');
    expect(fixture.nativeElement.querySelector('input[type="color"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.role-color-swatch')).toBeNull();
    expect(localStorage.getItem('tickest.roleColors')).toBeNull();
  });
});
