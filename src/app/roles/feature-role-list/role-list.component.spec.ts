import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { of } from 'rxjs';
import { RoleListComponent } from './role-list.component';
import { RolesStore } from '../application/roles.store';
import { Role } from '../entities/role';
import { Permission } from '../entities/permission';
import { ConfirmDialogService } from '../../shared';

const ROLE_COLOR_STORAGE_KEY = 'tickest.roleColors';

describe('RoleListComponent', () => {
  const adminRole: Role = { name: 'Admin', permissionCodes: ['users:read'], isDefault: false, isAdministrator: true };
  const agentRole: Role = { name: 'Agent', permissionCodes: ['tickets:manage'], isDefault: false, isAdministrator: false };
  const permissions: Permission[] = [
    { code: 'tickets:manage', name: 'Gerenciar tickets', description: 'Gerencia todos os tickets', group: 'Chamados', isAdministrative: false },
    { code: 'users:read', name: 'Ver usuários', description: 'Lista e visualiza usuários', group: 'Usuários', isAdministrative: true }
  ];

  /** Cria um store falso com signals reais, para o template reagir como no store verdadeiro. */
  function createStoreFake() {
    return {
      roles: signal<Role[]>([adminRole, agentRole]),
      listState: signal({ data: [adminRole, agentRole], loading: false, error: null as string | null }),
      createError: signal<string | null>(null),
      assignPermissionsError: signal<string | null>(null),
      assigningPermissions: signal(false),
      permissions: signal<Permission[]>(permissions),
      permissionGroups: signal([{ title: 'Chamados', permissions: [permissions[0]] }, { title: 'Usuários', permissions: [permissions[1]] }]),
      permissionName: jasmine.createSpy('permissionName').and.callFake(
        (code: string) => permissions.find(p => p.code === code)?.name ?? code
      ),
      load: jasmine.createSpy('load'),
      loadPermissions: jasmine.createSpy('loadPermissions'),
      create: jasmine.createSpy('create'),
      assignPermissions: jasmine.createSpy('assignPermissions'),
      clearCreateError: jasmine.createSpy('clearCreateError'),
      clearAssignPermissionsError: jasmine.createSpy('clearAssignPermissionsError')
    };
  }

  let storeFake: ReturnType<typeof createStoreFake>;
  let confirmDialogServiceFake: jasmine.SpyObj<ConfirmDialogService>;

  beforeEach(async () => {
    localStorage.removeItem(ROLE_COLOR_STORAGE_KEY);
    storeFake = createStoreFake();
    confirmDialogServiceFake = jasmine.createSpyObj('ConfirmDialogService', ['confirm']);
    confirmDialogServiceFake.confirm.and.returnValue(of(true));

    await TestBed.configureTestingModule({
      imports: [RoleListComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: RolesStore, useValue: storeFake },
        { provide: ConfirmDialogService, useValue: confirmDialogServiceFake }
      ]
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

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('tbody button') as NodeListOf<HTMLButtonElement>)
      .filter(button => button.textContent?.trim() === 'Permissões');
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

  it('limpa o erro de atribuição ao abrir o modal de permissões de outra role', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openPermissionsModal(agentRole);

    expect(storeFake.clearAssignPermissionsError).toHaveBeenCalled();
  });

  it('limpa o erro de criação ao abrir o modal de nova função', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openCreateModal();

    expect(storeFake.clearCreateError).toHaveBeenCalled();
  });

  it('mostra o erro de criação dentro do modal de nova função, não na página', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    fixture.componentInstance.openCreateModal();
    storeFake.createError.set('Já existe uma função com esse nome.');
    await fixture.whenStable();

    const modalBody = fixture.nativeElement.querySelector('#roleCreateModal .modal-body');
    expect(modalBody.textContent).toContain('Já existe uma função com esse nome.');
  });

  it('mostra o erro de atribuição de permissões dentro do modal de permissões, não na página', async () => {
    storeFake.assignPermissionsError.set('Você não tem permissão para fazer isso.');
    const fixture = TestBed.createComponent(RoleListComponent);
    fixture.componentInstance.openPermissionsModal(agentRole);
    storeFake.assignPermissionsError.set('Você não tem permissão para fazer isso.');
    await fixture.whenStable();

    const modalBody = fixture.nativeElement.querySelector('#rolePermissionsModal .modal-body');
    expect(modalBody.textContent).toContain('Você não tem permissão para fazer isso.');
  });

  it('mostra no máximo 2 badges de permissão e agrupa o restante em "+N"', async () => {
    const roleWithManyPermissions: Role = {
      name: 'Supervisor',
      permissionCodes: ['tickets:manage', 'users:read', 'tickets:create'],
      isDefault: false,
      isAdministrator: false
    };
    storeFake.roles.set([roleWithManyPermissions]);
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.visiblePermissionCodes(roleWithManyPermissions)).toEqual(['tickets:manage', 'users:read']);
    expect(fixture.componentInstance.hiddenPermissionCount(roleWithManyPermissions)).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('+1');
  });

  it('envia a atribuição de permissões marcadas', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openPermissionsModal(agentRole);
    fixture.componentInstance.togglePermission('users:read', true);
    fixture.componentInstance.onAssignPermissionsSubmit();

    expect(storeFake.assignPermissions).toHaveBeenCalledWith('Agent', ['tickets:manage', 'users:read'], jasmine.any(Function));
    expect(confirmDialogServiceFake.confirm).not.toHaveBeenCalled();
  });

  it('pede confirmação extra ao zerar as permissões de uma role sem remover nenhuma administrativa', async () => {
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

  it('não zera as permissões quando a confirmação de "sem permissões" é cancelada', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(false));
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openPermissionsModal(agentRole);
    fixture.componentInstance.togglePermission('tickets:manage', false);
    fixture.componentInstance.onAssignPermissionsSubmit();

    expect(storeFake.assignPermissions).not.toHaveBeenCalled();
  });

  it('o botão "Salvar" do modal de permissões fica desabilitado durante a atribuição', async () => {
    storeFake.assigningPermissions.set(true);
    const fixture = TestBed.createComponent(RoleListComponent);
    fixture.componentInstance.openPermissionsModal(agentRole);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('#rolePermissionsModal button.btn-primary') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
  });

  it('rejeita uma cor clara demais para o badge, sem salvar nem alterar a cor atual', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onPickColor('Agent', '#ffffff');

    expect(fixture.componentInstance.roleColor('Agent')).toBeNull();
    expect(fixture.componentInstance.colorContrastWarning()).toContain('contraste');
  });

  it('pede confirmação extra ao remover uma permissão administrativa já atribuída', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openPermissionsModal(adminRole);
    fixture.componentInstance.togglePermission('users:read', false);
    fixture.componentInstance.onAssignPermissionsSubmit();

    expect(confirmDialogServiceFake.confirm).toHaveBeenCalled();
    const options = confirmDialogServiceFake.confirm.calls.mostRecent().args[0];
    expect(options.message).toContain('Ver usuários');
    expect(storeFake.assignPermissions).toHaveBeenCalledWith('Admin', [], jasmine.any(Function));
  });

  it('não envia a remoção de permissão administrativa quando a confirmação é cancelada', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(false));
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openPermissionsModal(adminRole);
    fixture.componentInstance.togglePermission('users:read', false);
    fixture.componentInstance.onAssignPermissionsSubmit();

    expect(storeFake.assignPermissions).not.toHaveBeenCalled();
  });

  it('envia a criação de uma nova role quando o formulário for válido', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    fixture.componentInstance.openCreateModal();
    await fixture.whenStable();

    fixture.componentInstance.createForm.setValue({ name: 'Supervisor' });
    fixture.componentInstance.onCreateSubmit();

    expect(storeFake.create).toHaveBeenCalledWith('Supervisor', jasmine.any(Function));
  });

  it('salva a cor escolhida no modal ao criar a role com sucesso', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    fixture.componentInstance.createForm.setValue({ name: 'Supervisor' });
    fixture.componentInstance.createColor.set('#2e7d14');
    fixture.componentInstance.onCreateSubmit();

    const onSuccess = storeFake.create.calls.mostRecent().args[1] as () => void;
    onSuccess();

    expect(fixture.componentInstance.roleColor('Supervisor')).toBe('#2e7d14');
  });

  it('não cria a role e avisa dentro do modal quando a cor escolhida deixaria o badge ilegível', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    fixture.componentInstance.openCreateModal();
    await fixture.whenStable();

    fixture.componentInstance.createForm.setValue({ name: 'Supervisor' });
    fixture.componentInstance.createColor.set('#ffff99');
    await fixture.whenStable();
    fixture.componentInstance.onCreateSubmit();

    expect(storeFake.create).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#roleCreateColor-error')?.textContent).toContain('ilegível');
    expect(fixture.nativeElement.querySelector('#roleCreateColor').getAttribute('aria-invalid')).toBe('true');
  });

  it('escolhe e remove a cor de uma função já existente', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.roleColor('Agent')).toBeNull();

    fixture.componentInstance.onPickColor('Agent', '#ff3e1d');
    expect(fixture.componentInstance.roleColor('Agent')).toBe('#ff3e1d');

    fixture.componentInstance.onClearColor('Agent');
    expect(fixture.componentInstance.roleColor('Agent')).toBeNull();
  });

  it('mostra o seletor de cor com a cor escolhida, e o botão "Remover cor" só quando há uma cor customizada', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    let colorInput = fixture.nativeElement.querySelector('input[type="color"].role-color-input') as HTMLInputElement;
    expect(colorInput).toBeTruthy();
    expect(fixture.nativeElement.textContent).not.toContain('Remover cor');

    fixture.componentInstance.onPickColor('Admin', '#ff3e1d');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Remover cor');
  });

  it('na Nova Função, "Criar" fica habilitado e um envio vazio diz o que falta', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    fixture.componentInstance.openCreateModal();
    await fixture.whenStable();

    const submit = fixture.nativeElement.querySelector('#roleCreateModal button[type="submit"]') as HTMLButtonElement;
    expect(submit.disabled).toBeFalse();
    submit.click();
    await fixture.whenStable();

    expect(storeFake.create).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#roleCreateModal').textContent).toContain('Dê um nome à função.');
  });
});
