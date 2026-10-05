import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { of } from 'rxjs';
import { UserListComponent } from './user-list.component';
import { UsersStore } from '../application/users.store';
import { RolesStore } from '../../roles';
import { UserSummary } from '../entities/user-summary';
import { UserFilters } from '../entities/user-filters';
import { Role } from '../../roles';
import { SessionService, ConfirmDialogService, ToastService } from '../../shared';

describe('UserListComponent', () => {
  const activeUser: UserSummary = {
    id: 'u1', email: 'maria@empresa.com', firstName: 'Maria', lastName: 'Silva',
    roles: [{ name: 'Agent' }],
    isActive: true, createdAtUtc: '2026-01-01T12:00:00Z', deactivatedAtUtc: null
  };
  const inactiveUser: UserSummary = {
    id: 'u2', email: 'joao@empresa.com', firstName: 'João', lastName: 'Santos',
    roles: [],
    isActive: false, createdAtUtc: '2026-01-02T12:00:00Z', deactivatedAtUtc: '2026-02-01T12:00:00Z'
  };
  const role: Role = { name: 'Agent', permissionCodes: [], isDefault: false, isAdministrator: false };
  const defaultFilters: UserFilters = { status: 'All', page: 1, pageSize: 20 };

  /** Cria um store de usuários falso com signals reais, para o template reagir como no store verdadeiro. */
  function createUsersStoreFake() {
    return {
      users: signal<UserSummary[]>([activeUser]),
      filters: signal<UserFilters>(defaultFilters),
      listState: signal({ loading: false, error: null as string | null }),
      loading: signal(false),
      updatingProfile: signal(false),
      assigningRoles: signal(false),
      deactivating: signal(false),
      activating: signal(false),
      success: signal(false),
      error: signal<string | null>(null),
      currentPage: signal(1),
      pageSize: signal(20),
      total: signal(1),
      totalPages: signal(1),
      hasPreviousPage: signal(false),
      hasNextPage: signal(false),
      resetState: jasmine.createSpy('resetState'),
      loadAll: jasmine.createSpy('loadAll'),
      clearListMutationError: jasmine.createSpy('clearListMutationError'),
      createUser: jasmine.createSpy('createUser'),
      updateProfile: jasmine.createSpy('updateProfile'),
      assignRoles: jasmine.createSpy('assignRoles'),
      deactivate: jasmine.createSpy('deactivate'),
      activate: jasmine.createSpy('activate'),
      setSearch: jasmine.createSpy('setSearch'),
      setStatus: jasmine.createSpy('setStatus'),
      setPeriod: jasmine.createSpy('setPeriod'),
      goToPage: jasmine.createSpy('goToPage'),
      setPageSize: jasmine.createSpy('setPageSize'),
      clearFilters: jasmine.createSpy('clearFilters')
    };
  }

  let usersStoreFake: ReturnType<typeof createUsersStoreFake>;
  let rolesStoreFake: { roles: ReturnType<typeof signal<Role[]>>; load: jasmine.Spy };
  let sessionServiceFake: { userId: jasmine.Spy };
  let confirmDialogServiceFake: { confirm: jasmine.Spy };
  let toastServiceFake: { show: jasmine.Spy };

  beforeEach(async () => {
    usersStoreFake = createUsersStoreFake();
    rolesStoreFake = { roles: signal<Role[]>([role]), load: jasmine.createSpy('load') };
    sessionServiceFake = { userId: jasmine.createSpy('userId').and.returnValue('admin-id') };
    confirmDialogServiceFake = { confirm: jasmine.createSpy('confirm').and.returnValue(of(true)) };
    toastServiceFake = { show: jasmine.createSpy('show') };

    await TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: UsersStore, useValue: usersStoreFake },
        { provide: RolesStore, useValue: rolesStoreFake },
        { provide: SessionService, useValue: sessionServiceFake },
        { provide: ConfirmDialogService, useValue: confirmDialogServiceFake },
        { provide: ToastService, useValue: toastServiceFake }
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

  it('renderiza os usuários carregados, com status, datas e funções', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Maria Silva');
    expect(text).toContain('maria@empresa.com');
    expect(text).toContain('Agent');
    expect(text).toContain('Ativo');
    expect(text).toContain('01/01/2026');
  });

  it('mantém a lista atual visível (só esmaecida) ao recarregar com filtro/página, em vez de sumir com tudo', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    usersStoreFake.listState.set({ loading: true, error: null });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Maria Silva');
    expect(fixture.nativeElement.querySelector('table').classList).toContain('is-refreshing');
  });

  it('mostra o spinner no lugar da tabela só quando ainda não há nenhum usuário carregado', async () => {
    usersStoreFake.users.set([]);
    usersStoreFake.listState.set({ loading: true, error: null });
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.spinner-border')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Nenhum usuário');
  });

  it('mostra no máximo 2 badges de função e agrupa o restante em "+N"', async () => {
    const userWithManyRoles: UserSummary = {
      ...activeUser,
      roles: [
        { name: 'Agent' },
        { name: 'Supervisor' },
        { name: 'Financeiro' }
      ]
    };
    usersStoreFake.users.set([userWithManyRoles]);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.visibleRoles(userWithManyRoles).map(r => r.name)).toEqual(['Agent', 'Supervisor']);
    expect(fixture.componentInstance.hiddenRolesCount(userWithManyRoles)).toBe(1);
    expect(fixture.componentInstance.hiddenRolesNames(userWithManyRoles)).toBe('Financeiro');
    expect(fixture.nativeElement.textContent).toContain('+1');
  });

  it('busca com debounce de 300ms após parar de digitar', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    fixture.detectChanges();

    fixture.componentInstance.searchInput.set('maria');
    await new Promise(resolve => setTimeout(resolve, 350));

    expect(usersStoreFake.setSearch).toHaveBeenCalledWith('maria');
  });

  it('não dispara a busca antes dos 300ms', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    fixture.detectChanges();

    fixture.componentInstance.searchInput.set('maria');
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(usersStoreFake.setSearch).not.toHaveBeenCalled();
    await new Promise(resolve => setTimeout(resolve, 300));
  });

  it('muda o status selecionado', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onStatusChange('Inactive');

    expect(usersStoreFake.setStatus).toHaveBeenCalledWith('Inactive');
  });

  it('muda o período de cadastro', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onCreatedFromChange('2026-01-01');

    expect(usersStoreFake.setPeriod).toHaveBeenCalledWith('2026-01-01', undefined);
  });

  it('limpa os filtros e o campo de busca local', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.searchInput.set('maria');
    fixture.componentInstance.onClearFilters();

    expect(fixture.componentInstance.searchInput()).toBe('');
    expect(usersStoreFake.clearFilters).toHaveBeenCalled();
  });

  it('navega para a página clicada', async () => {
    usersStoreFake.totalPages.set(3);
    usersStoreFake.hasNextPage.set(true);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const pageButtons = fixture.nativeElement.querySelectorAll('.card-footer button');
    const pageTwoButton = Array.from(pageButtons as NodeListOf<HTMLButtonElement>)
      .find(button => button.textContent?.trim() === '2');
    pageTwoButton?.click();

    expect(usersStoreFake.goToPage).toHaveBeenCalledWith(2);
  });

  it('não mostra os controles de paginação quando há só uma página', async () => {
    usersStoreFake.totalPages.set(1);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Anterior');
    expect(fixture.nativeElement.textContent).not.toContain('Próxima');
  });

  it('usa reticências em vez de um botão por página quando há muitas páginas', async () => {
    usersStoreFake.totalPages.set(50);
    usersStoreFake.currentPage.set(25);
    usersStoreFake.hasPreviousPage.set(true);
    usersStoreFake.hasNextPage.set(true);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.pageNumbers()).toEqual([1, '…', 24, 25, 26, '…', 50]);
    expect(fixture.nativeElement.querySelectorAll('.card-footer button').length).toBeLessThan(10);
  });

  it('muda o tamanho da página', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onPageSizeChange(50);

    expect(usersStoreFake.setPageSize).toHaveBeenCalledWith(50);
  });

  it('calcula o intervalo exibido no rodapé ("Exibindo X–Y de Z")', async () => {
    usersStoreFake.currentPage.set(2);
    usersStoreFake.pageSize.set(20);
    usersStoreFake.total.set(45);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.rangeStart()).toBe(21);
    expect(fixture.componentInstance.rangeEnd()).toBe(40);
  });

  it('pré-preenche o formulário de edição ao abrir o modal de cadastro', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(activeUser);

    expect(fixture.componentInstance.editForm.getRawValue()).toEqual({ firstName: 'Maria', lastName: 'Silva' });
  });

  it('envia a atualização de cadastro com os valores sem espaços nas pontas', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(activeUser);
    fixture.componentInstance.editForm.setValue({ firstName: '  Ana ', lastName: ' Costa  ' });
    fixture.componentInstance.onEditSubmit();

    expect(usersStoreFake.updateProfile).toHaveBeenCalledWith('u1', { firstName: 'Ana', lastName: 'Costa' }, jasmine.any(Function));
  });

  it('não envia a atualização de cadastro quando o formulário estiver inválido', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(activeUser);
    fixture.componentInstance.editForm.setValue({ firstName: '', lastName: 'Costa' });
    fixture.componentInstance.onEditSubmit();

    expect(usersStoreFake.updateProfile).not.toHaveBeenCalled();
  });

  it('limpa o erro de mutação ao abrir o modal de edição, pra não mostrar o erro de uma tentativa anterior', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(activeUser);

    expect(usersStoreFake.clearListMutationError).toHaveBeenCalled();
  });

  it('limpa o erro de mutação ao abrir o modal de atribuição de funções', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openAssignRolesModal(activeUser);

    expect(usersStoreFake.clearListMutationError).toHaveBeenCalled();
  });

  it('reseta o estado de criação ao abrir o modal de novo usuário', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('[data-bs-target="#userCreateModal"]') as HTMLButtonElement;
    button.click();

    expect(usersStoreFake.resetState).toHaveBeenCalled();
  });

  it('alterna os campos de senha do modal de criação entre oculto e texto claro juntos', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const password = fixture.nativeElement.querySelector('input[formcontrolname="password"]') as HTMLInputElement;
    const confirmPassword = fixture.nativeElement.querySelector('input[formcontrolname="confirmPassword"]') as HTMLInputElement;
    expect(password.type).toBe('password');
    expect(confirmPassword.type).toBe('password');

    fixture.componentInstance.togglePasswordsVisibility();
    fixture.detectChanges();

    expect(password.type).toBe('text');
    expect(confirmPassword.type).toBe('text');
  });

  it('pré-marca as roles já atribuídas ao abrir o modal de atribuição', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openAssignRolesModal(activeUser);

    expect(fixture.componentInstance.isChecked('Agent')).toBeTrue();
  });

  it('envia a atribuição de roles marcadas', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openAssignRolesModal(activeUser);
    fixture.componentInstance.toggleRole('Supervisor', true);
    fixture.componentInstance.onAssignRolesSubmit();

    expect(usersStoreFake.assignRoles).toHaveBeenCalledWith('u1', ['Agent', 'Supervisor'], jasmine.any(Function));
  });

  it('mostra um toast de sucesso ao atribuir funções', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openAssignRolesModal(activeUser);
    fixture.componentInstance.onAssignRolesSubmit();
    const onSuccess = usersStoreFake.assignRoles.calls.mostRecent().args[2];
    onSuccess();

    expect(toastServiceFake.show).toHaveBeenCalledWith('Funções de "Maria Silva" atualizadas.');
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

  it('desativa o usuário quando confirmado', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeactivate(activeUser);

    expect(usersStoreFake.deactivate).toHaveBeenCalledWith('u1', jasmine.any(Function));
  });

  it('mostra um toast de sucesso ao desativar', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeactivate(activeUser);
    const onSuccess = usersStoreFake.deactivate.calls.mostRecent().args[1];
    onSuccess();

    expect(toastServiceFake.show).toHaveBeenCalledWith('"Maria Silva" foi desativado.');
  });

  it('não desativa o usuário quando a confirmação for cancelada', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(false));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeactivate(activeUser);

    expect(usersStoreFake.deactivate).not.toHaveBeenCalled();
  });

  it('reativa o usuário quando confirmado', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    usersStoreFake.users.set([inactiveUser]);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onActivate(inactiveUser);

    expect(usersStoreFake.activate).toHaveBeenCalledWith('u2', jasmine.any(Function));
  });

  it('mostra um toast de sucesso ao reativar', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    usersStoreFake.users.set([inactiveUser]);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onActivate(inactiveUser);
    const onSuccess = usersStoreFake.activate.calls.mostRecent().args[1];
    onSuccess();

    expect(toastServiceFake.show).toHaveBeenCalledWith('"João Santos" foi reativado.');
  });

  it('não reativa o usuário quando a confirmação for cancelada', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(false));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onActivate(inactiveUser);

    expect(usersStoreFake.activate).not.toHaveBeenCalled();
  });

  it('mostra "Reativar" para um usuário inativo e "Desativar" para um ativo', async () => {
    usersStoreFake.users.set([activeUser, inactiveUser]);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Desativar');
    expect(text).toContain('Reativar');
    expect(fixture.nativeElement.querySelector('.dropdown-item.text-danger')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.dropdown-item.text-success')).not.toBeNull();
  });

  it('desabilita de verdade o botão de Desativar enquanto a mutação está em andamento', async () => {
    usersStoreFake.deactivating.set(true);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('.dropdown-item.text-danger') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
  });

  it('não mostra nem Desativar nem Reativar para a própria conta logada', async () => {
    sessionServiceFake.userId.and.returnValue('u1');
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.dropdown-item.text-danger')).toBeNull();
    expect(fixture.nativeElement.querySelector('.dropdown-item.text-success')).toBeNull();
  });

  it('deixa a linha de um usuário inativo mais apagada', async () => {
    usersStoreFake.users.set([inactiveUser]);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector('tbody tr') as HTMLTableRowElement;
    expect(row.classList).toContain('opacity-75');
  });

  it('não deixa a linha de um usuário ativo apagada', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector('tbody tr') as HTMLTableRowElement;
    expect(row.classList).not.toContain('opacity-75');
  });

  it('mostra mensagem distinta quando a lista estiver vazia por causa dos filtros', async () => {
    usersStoreFake.users.set([]);
    usersStoreFake.total.set(0);
    usersStoreFake.filters.set({ status: 'Inactive', page: 1, pageSize: 20 });
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Nenhum usuário encontrado com esses filtros.');
  });
});
