import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { of } from 'rxjs';
import { RoleListComponent } from './role-list.component';
import { RolesStore } from '../application/roles.store';
import { Role } from '../entities/role';
import { Permission } from '../entities/permission';
import { ConfirmDialogService, ToastService } from '../../shared';


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

  beforeEach(async () => {
    storeFake = createStoreFake();
    confirmDialogServiceFake = jasmine.createSpyObj('ConfirmDialogService', ['confirm']);
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    toastServiceFake = jasmine.createSpyObj('ToastService', ['show']);

    await TestBed.configureTestingModule({
      imports: [RoleListComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: RolesStore, useValue: storeFake },
        { provide: ConfirmDialogService, useValue: confirmDialogServiceFake },
        { provide: ToastService, useValue: toastServiceFake }
      ]
    }).compileComponents();
  });

  it('carrega roles e permissões ao inicializar', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    expect(storeFake.load).toHaveBeenCalled();
    expect(storeFake.loadPermissions).toHaveBeenCalled();
  });

  it('não oferece criar função: o back-end não tem esse endpoint', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Nova Função');
  });

  it('mostra a etiqueta de Administrador e oferece "Ver permissões" pra ele e "Editar permissões" pras demais', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Administrador');
    const labels = Array.from(fixture.nativeElement.querySelectorAll('tbody .dropdown-item') as NodeListOf<HTMLButtonElement>)
      .map(button => button.textContent?.trim());
    expect(labels.filter(label => label === 'Ver permissões').length).toBe(1);
    expect(labels.filter(label => label === 'Editar permissões').length).toBe(1);
    expect(fixture.nativeElement.querySelector('tbody .dropdown-item[disabled]')).toBeNull();
  });

  it('abre as permissões do Administrador só pra consulta, sem salvar', async () => {
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

  it('mostra o erro de atribuição de permissões dentro do modal de permissões, não na página', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    fixture.componentInstance.openPermissionsModal(agentRole);
    storeFake.assignPermissionsError.set('Você não tem permissão para fazer isso.');
    await fixture.whenStable();

    const modalBody = fixture.nativeElement.querySelector('#rolePermissionsModal .modal-body');
    expect(modalBody.textContent).toContain('Você não tem permissão para fazer isso.');
  });

  it('mostra no máximo 2 badges de permissão e agrupa o restante em "+N"', async () => {
    const roleWithManyPermissions: Role = { ...supervisorRole, permissionCodes: ['tickets:manage', 'users:read', 'tickets:create'] };
    storeFake.roles.set([roleWithManyPermissions]);
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.visiblePermissionCodes(roleWithManyPermissions)).toEqual(['tickets:manage', 'users:read']);
    expect(fixture.componentInstance.hiddenPermissionCount(roleWithManyPermissions)).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('+1');
  });

  it('o "+N" esconde o número do leitor de tela e entrega os nomes ocultos em texto', async () => {
    storeFake.roles.set([{ ...supervisorRole, permissionCodes: ['tickets:manage', 'tickets:create', 'users:read'] }]);
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    const cell = fixture.nativeElement.querySelector('td[data-label="Permissões"]') as HTMLElement;
    expect(cell.querySelector('[aria-hidden="true"]')?.textContent).toBe('+1');
    expect(cell.querySelector('.visually-hidden')?.textContent).toContain('Ver usuários');
  });

  it('na recarga com a lista na tela, mantém as linhas esmaecidas em vez do spinner', async () => {
    storeFake.listState.set({ data: [adminRole, agentRole], loading: true, error: null });
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('table').classList).toContain('is-refreshing');
    expect(fixture.nativeElement.textContent).toContain('Agent');
    expect(fixture.nativeElement.querySelector('app-loading-state')).toBeNull();
  });

  it('falha de carga sem lista não vira o vazio "nenhuma função" e oferece tentar de novo, sem vermelho', async () => {
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

  it('recarga que falhou com a lista na tela mantém as linhas e avisa acima delas', async () => {
    storeFake.listState.set({ data: [adminRole, agentRole], loading: false, error: 'Erro ao carregar funções' });
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('mostrando a última carregada');
    expect(fixture.nativeElement.textContent).toContain('Agent');
  });

  it('sem nenhuma função, explica de onde elas vêm sem prometer criar uma', async () => {
    storeFake.roles.set([]);
    storeFake.listState.set({ data: [], loading: false, error: null });
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Nenhuma função disponível.');
    expect(fixture.nativeElement.querySelector('app-empty-state button')).toBeNull();
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

  it('pede confirmação extra ao remover uma permissão administrativa já atribuída', async () => {
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

  it('não envia a remoção de permissão administrativa quando a confirmação é cancelada', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(false));
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openPermissionsModal(supervisorRole);
    fixture.componentInstance.togglePermission('users:read', false);
    fixture.componentInstance.onAssignPermissionsSubmit();

    expect(storeFake.assignPermissions).not.toHaveBeenCalled();
  });

  it('o botão "Salvar" do modal de permissões fica desabilitado durante a atribuição, assim como o "Cancelar"', async () => {
    storeFake.assigningPermissions.set(true);
    const fixture = TestBed.createComponent(RoleListComponent);
    fixture.componentInstance.openPermissionsModal(agentRole);
    fixture.componentInstance.togglePermission('users:read', true);
    await fixture.whenStable();

    const footer = fixture.nativeElement.querySelector('#rolePermissionsModal .modal-footer') as HTMLElement;
    expect((footer.querySelector('.btn-primary') as HTMLButtonElement).disabled).toBeTrue();
    expect((footer.querySelector('.btn-outline-secondary') as HTMLButtonElement).disabled).toBeTrue();
  });

  it('no diálogo de permissões, "Salvar" só habilita com mudança e o rodapé resume o que mudou', async () => {
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

  it('"Todas" marca o grupo inteiro e fica indeterminada com só parte dele marcada', async () => {
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

  it('no diálogo de permissões sem catálogo, mostra o erro com "Tentar novamente" e trava o "Salvar"', async () => {
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

  it('pede confirmação antes de descartar marcações não salvas, e fecha direto sem mudanças', async () => {
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

  it('não oferece cor própria para a função: o back-end não guarda cor, e o navegador também não', async () => {
    const fixture = TestBed.createComponent(RoleListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Cor do badge');
    expect(fixture.nativeElement.querySelector('input[type="color"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.role-color-swatch')).toBeNull();
    expect(localStorage.getItem('tickest.roleColors')).toBeNull();
  });
});
