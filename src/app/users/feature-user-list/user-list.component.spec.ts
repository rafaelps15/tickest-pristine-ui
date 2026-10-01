import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { UserListComponent } from './user-list.component';
import { UsersStore } from '../application/users.store';
import { RolesStore } from '../../roles';
import { UserSummary } from '../entities/user-summary';
import { Role } from '../../roles';

describe('UserListComponent', () => {
  const user: UserSummary = {
    id: 'u1',
    email: 'maria@empresa.com',
    firstName: 'Maria',
    lastName: 'Silva',
    roles: [{ id: 'role-1', name: 'Agent' }]
  };
  const role: Role = { id: 'role-1', name: 'Agent', permissionCodes: [], isDefault: false, isAdministrator: false };

  /** Cria um store de usuários falso com signals reais, para o template reagir como no store verdadeiro. */
  function createUsersStoreFake() {
    return {
      users: signal<UserSummary[]>([user]),
      listState: signal({ data: [user], loading: false, error: null as string | null }),
      loading: signal(false),
      success: signal(false),
      error: signal<string | null>(null),
      resetState: jasmine.createSpy('resetState'),
      loadAll: jasmine.createSpy('loadAll'),
      createUser: jasmine.createSpy('createUser'),
      updateProfile: jasmine.createSpy('updateProfile'),
      assignRoles: jasmine.createSpy('assignRoles')
    };
  }

  let usersStoreFake: ReturnType<typeof createUsersStoreFake>;
  let rolesStoreFake: { roles: ReturnType<typeof signal<Role[]>>; load: jasmine.Spy };

  beforeEach(async () => {
    usersStoreFake = createUsersStoreFake();
    rolesStoreFake = { roles: signal<Role[]>([role]), load: jasmine.createSpy('load') };

    await TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: UsersStore, useValue: usersStoreFake },
        { provide: RolesStore, useValue: rolesStoreFake }
      ]
    }).compileComponents();
  });

  it('carrega usuários e roles ao inicializar', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(usersStoreFake.resetState).toHaveBeenCalled();
    expect(usersStoreFake.loadAll).toHaveBeenCalled();
    expect(rolesStoreFake.load).toHaveBeenCalled();
  });

  it('renderiza os usuários carregados', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Maria Silva');
    expect(fixture.nativeElement.textContent).toContain('maria@empresa.com');
    expect(fixture.nativeElement.textContent).toContain('Agent');
  });

  it('pré-preenche o formulário de edição ao abrir o modal de cadastro', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(user);

    expect(fixture.componentInstance.editForm.getRawValue()).toEqual({ firstName: 'Maria', lastName: 'Silva' });
  });

  it('envia a atualização de cadastro com os valores sem espaços nas pontas', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(user);
    fixture.componentInstance.editForm.setValue({ firstName: '  Ana ', lastName: ' Costa  ' });
    fixture.componentInstance.onEditSubmit();

    expect(usersStoreFake.updateProfile).toHaveBeenCalledWith('u1', { firstName: 'Ana', lastName: 'Costa' }, jasmine.any(Function));
  });

  it('não envia a atualização de cadastro quando o formulário estiver inválido', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(user);
    fixture.componentInstance.editForm.setValue({ firstName: '', lastName: 'Costa' });
    fixture.componentInstance.onEditSubmit();

    expect(usersStoreFake.updateProfile).not.toHaveBeenCalled();
  });

  it('pré-marca as roles já atribuídas ao abrir o modal de atribuição', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openAssignRolesModal(user);

    expect(fixture.componentInstance.isChecked('role-1')).toBeTrue();
  });

  it('envia a atribuição de roles marcadas', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openAssignRolesModal(user);
    fixture.componentInstance.toggleRole('role-2', true);
    fixture.componentInstance.onAssignRolesSubmit();

    expect(usersStoreFake.assignRoles).toHaveBeenCalledWith('u1', ['role-1', 'role-2'], jasmine.any(Function));
  });

  it('envia a criação de usuário quando o formulário for válido', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.createForm.setValue({
      firstName: 'Ana',
      lastName: 'Costa',
      email: 'ana@empresa.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
    fixture.componentInstance.onCreateSubmit();

    expect(usersStoreFake.createUser).toHaveBeenCalledWith({
      firstName: 'Ana',
      lastName: 'Costa',
      email: 'ana@empresa.com',
      password: 'Password123!'
    });
  });
});
