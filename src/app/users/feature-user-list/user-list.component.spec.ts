import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { UserListComponent } from './user-list.component';
import { UsersStore } from '../application/users.store';
import { RolesStore } from '../../roles';
import { UserSummary } from '../entities/user-summary';
import { UserFilters } from '../entities/user-filters';
import { Role } from '../../roles';
import { SessionService, ConfirmDialogService, ToastService, setRoleColor } from '../../shared';

const ROLE_COLOR_STORAGE_KEY = 'tickest.roleColors';

describe('UserListComponent', () => {
  const activeUser: UserSummary = {
    id: 'u1', email: 'maria@empresa.com', firstName: 'Maria', lastName: 'Silva',
    roles: [{ name: 'Agent' }],
    isActive: true, createdAtUtc: '2026-01-01T12:00:00Z', deactivatedAtUtc: null, pendingActivation: false, invitationExpiresAtUtc: null
  };
  const inactiveUser: UserSummary = {
    id: 'u2', email: 'joao@empresa.com', firstName: 'João', lastName: 'Santos',
    roles: [],
    isActive: false, createdAtUtc: '2026-01-02T12:00:00Z', deactivatedAtUtc: '2026-02-01T12:00:00Z', pendingActivation: false, invitationExpiresAtUtc: null
  };
  const role: Role = { name: 'Agent', permissionCodes: [], isDefault: false, isAdministrator: false };
  const defaultFilters: UserFilters = { status: 'All', page: 1, pageSize: 20 };

  /** Cria um store de usuários falso com signals reais, para o template reagir como no store verdadeiro. */
  function createUsersStoreFake() {
    return {
      users: signal<UserSummary[]>([activeUser]),
      filters: signal<UserFilters>(defaultFilters),
      listState: signal({ loading: false, error: null as string | null }),
      listLoadFailed: signal(false),
      activeCount: signal<number | null>(10),
      inactiveCount: signal<number | null>(2),
      summaryLoading: signal(false),
      summaryFailed: signal(false),
      profileError: signal<string | null>(null),
      rolesError: signal<string | null>(null),
      loading: signal(false),
      updatingProfile: signal(false),
      assigningRoles: signal(false),
      deactivatingIds: signal<string[]>([]),
      activatingIds: signal<string[]>([]),
      resendingInvitationIds: signal<string[]>([]),
      resendInvitation: jasmine.createSpy('resendInvitation'),
      countOpenAssignedTickets: jasmine.createSpy('countOpenAssignedTickets')
        .and.callFake((_userId: string, onDone: (count: number | null) => void) => onDone(0)),
      success: signal(false),
      error: signal<string | null>(null),
      createdUserId: signal<string | null>(null),
      createRolesFailed: signal(false),
      currentPage: signal(1),
      pageSize: signal(20),
      total: signal(1),
      totalPages: signal(1),
      hasPreviousPage: signal(false),
      hasNextPage: signal(false),
      resetState: jasmine.createSpy('resetState'),
      loadAll: jasmine.createSpy('loadAll'),
      clearDialogErrors: jasmine.createSpy('clearDialogErrors'),
      createUser: jasmine.createSpy('createUser'),
      updateProfile: jasmine.createSpy('updateProfile'),
      assignRoles: jasmine.createSpy('assignRoles'),
      deactivate: jasmine.createSpy('deactivate'),
      deactivateMany: jasmine.createSpy('deactivateMany'),
      activate: jasmine.createSpy('activate'),
      setSearch: jasmine.createSpy('setSearch'),
      setStatus: jasmine.createSpy('setStatus'),
      setPeriod: jasmine.createSpy('setPeriod'),
      goToPage: jasmine.createSpy('goToPage'),
      setPageSize: jasmine.createSpy('setPageSize'),
      clearFilters: jasmine.createSpy('clearFilters'),
      hydrateFiltersFromUrl: jasmine.createSpy('hydrateFiltersFromUrl')
    };
  }

  let usersStoreFake: ReturnType<typeof createUsersStoreFake>;
  let rolesStoreFake: { roles: ReturnType<typeof signal<Role[]>>; load: jasmine.Spy };
  let sessionServiceFake: { userId: jasmine.Spy };
  let confirmDialogServiceFake: { confirm: jasmine.Spy };
  let toastServiceFake: { show: jasmine.Spy };

  beforeEach(async () => {
    localStorage.removeItem(ROLE_COLOR_STORAGE_KEY);
    usersStoreFake = createUsersStoreFake();
    rolesStoreFake = { roles: signal<Role[]>([role]), load: jasmine.createSpy('load') };
    sessionServiceFake = { userId: jasmine.createSpy('userId').and.returnValue('admin-id') };
    confirmDialogServiceFake = { confirm: jasmine.createSpy('confirm').and.returnValue(of(true)) };
    toastServiceFake = { show: jasmine.createSpy('show') };

    await TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
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

  it('restaura status, período, página e tamanho de página a partir da query string ao inicializar', async () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: {
        snapshot: {
          queryParamMap: convertToParamMap({
            status: 'Inactive', createdFrom: '2026-01-01', createdTo: '2026-01-31', page: '3', pageSize: '50'
          })
        }
      }
    });
    spyOn(TestBed.inject(Router), 'navigate');

    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(usersStoreFake.hydrateFiltersFromUrl).toHaveBeenCalledWith({
      status: 'Inactive', createdFrom: '2026-01-01', createdTo: '2026-01-31', page: 3, pageSize: 50
    });
  });

  it('volta ao padrão quando um parâmetro da URL é inválido (status fora do enum, data mal formatada, página não numérica), sem quebrar (EC-08)', async () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: {
        snapshot: {
          queryParamMap: convertToParamMap({ status: 'Banido', createdFrom: '01-01-2026', page: 'abc', pageSize: '7' })
        }
      }
    });
    spyOn(TestBed.inject(Router), 'navigate');

    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(usersStoreFake.hydrateFiltersFromUrl).toHaveBeenCalledWith({
      status: 'All', createdFrom: undefined, createdTo: undefined, page: 1, pageSize: 20
    });
  });

  it('não inclui o termo de busca livre na URL', async () => {
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigate');
    usersStoreFake.filters.set({ status: 'Inactive', search: 'maria@empresa.com', page: 1, pageSize: 20 });

    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalled();
    const queryParams = navigateSpy.calls.mostRecent().args[1]!.queryParams as Record<string, unknown>;
    expect(Object.keys(queryParams)).not.toContain('search');
    expect(queryParams['status']).toBe('Inactive');
  });

  it('reflete filtro/página não-padrão na URL, sem empilhar histórico', async () => {
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigate');
    usersStoreFake.filters.set({ status: 'Inactive', page: 2, pageSize: 20 });

    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalledWith([], jasmine.objectContaining({
      queryParams: jasmine.objectContaining({ status: 'Inactive', page: 2 }),
      replaceUrl: true
    }));
  });

  it('não navega de novo quando os filtros já batem com a URL atual (evita loop)', async () => {
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigate');

    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('restaura o usuário selecionado a partir do "userId" da query string ao inicializar', async () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { queryParamMap: convertToParamMap({ userId: 'u1' }) } }
    });
    spyOn(TestBed.inject(Router), 'navigate');

    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.infoPanelUserId()).toBe('u1');
  });

  it('seleciona um usuário ao clicar na linha, mostra o painel, e desseleciona ao clicar de novo', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector('tbody tr.user-row') as HTMLTableRowElement;
    const nameButton = row.querySelector('.btn-row-name') as HTMLButtonElement;
    expect(nameButton.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('app-user-list-info-panel')).toBeNull();

    row.click();
    await fixture.whenStable();
    expect(nameButton.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('app-user-list-info-panel')).toBeTruthy();

    row.click();
    await fixture.whenStable();
    expect(nameButton.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('app-user-list-info-panel')).toBeNull();
  });

  it('abre e fecha o painel pelo botão do nome, uma vez por clique (sem disparar de novo pelo clique da linha)', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const nameButton = fixture.nativeElement.querySelector('tbody tr.user-row .btn-row-name') as HTMLButtonElement;
    nameButton.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.infoPanelUserId()).toBe('u1');

    nameButton.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.infoPanelUserId()).toBeUndefined();
  });

  it('mantém o <tr> como linha de tabela, sem papel de botão nem foco próprio', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector('tbody tr.user-row') as HTMLTableRowElement;
    expect(row.getAttribute('role')).toBeNull();
    expect(row.hasAttribute('tabindex')).toBeFalse();
    expect(row.querySelector('button.btn-row-name')).toBeTruthy();
  });

  it('marca a linha com o painel aberto com uma classe distinta da seleção em lote', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector('tbody tr.user-row') as HTMLTableRowElement;
    expect(row.classList).not.toContain('user-row-info-open');

    row.click();
    await fixture.whenStable();

    expect(row.classList).toContain('user-row-info-open');
  });

  it('dá ao botão do nome o texto visível como nome acessível, sem rótulo que repita o estado (WCAG 2.5.3)', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const nameButton = fixture.nativeElement.querySelector('tbody tr.user-row .btn-row-name') as HTMLButtonElement;
    expect(nameButton.hasAttribute('aria-label')).toBeFalse();
    expect(nameButton.hasAttribute('aria-pressed')).toBeFalse();
    expect(nameButton.textContent?.trim()).toBe('Maria Silva');
  });

  it('mostra uma nota de que a seleção em lote vale só pra página atual, quando há mais de uma página', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.toggleSelection('u1', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('só desta página');

    usersStoreFake.totalPages.set(3);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('só desta página');
  });


  it('não alterna a seleção da linha ao clicar na checkbox de seleção em lote ou no menu de ações', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector('tbody tr.user-row') as HTMLTableRowElement;
    const checkbox = row.querySelector('input[type="checkbox"]') as HTMLInputElement;
    checkbox.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await fixture.whenStable();

    expect(fixture.componentInstance.infoPanelUserId()).toBeUndefined();
  });

  it('marca o usuário pra ação em lote ao tocar em qualquer ponto da área de 44px da célula, sem abrir o painel', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const hitArea = fixture.nativeElement.querySelector('tbody tr.user-row .select-hit') as HTMLLabelElement;
    hitArea.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.isSelected('u1')).toBeTrue();
    expect(fixture.componentInstance.infoPanelUserId()).toBeUndefined();
  });

  it('fecha o painel com a tecla Esc, de qualquer lugar da tela, e devolve o foco a quem o abriu', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const nameButton = fixture.nativeElement.querySelector('tbody tr.user-row .btn-row-name') as HTMLButtonElement;
    nameButton.focus();
    nameButton.click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-user-list-info-panel')).toBeTruthy();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-user-list-info-panel')).toBeNull();
    expect(document.activeElement).toBe(nameButton);
  });

  it('não fecha o painel quando o Esc nasce dentro de um modal (só fecha o modal)', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.selectRow('u1');
    fixture.componentInstance.onPanelEdit();
    await fixture.whenStable();

    const modalInput = fixture.nativeElement.querySelector('#userEditFirstName') as HTMLInputElement;
    modalInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();

    expect(fixture.componentInstance.infoPanelUserId()).toBe('u1');
  });

  it('não fecha o painel quando o Esc nasce dentro do menu de ações "⋮" (só fecha o menu)', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.selectRow('u1');
    await fixture.whenStable();

    const menuButton = fixture.nativeElement.querySelector('.btn-row-actions') as HTMLButtonElement;
    menuButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();

    expect(fixture.componentInstance.infoPanelUserId()).toBe('u1');
  });

  it('passa o painel pro modo modal (overlay) só abaixo de "lg"', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();
    fixture.componentInstance.selectRow('u1');

    fixture.componentInstance.isOverlayViewport.set(true);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.info-panel').getAttribute('aria-modal')).toBe('true');

    fixture.componentInstance.isOverlayViewport.set(false);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.info-panel').hasAttribute('aria-modal')).toBeFalse();
  });

  it('não faz nada ao apertar Esc sem nenhum painel aberto', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))).not.toThrow();
  });

  it('fecha o painel ao clicar no backdrop (overlay de telas pequenas), e devolve o foco a quem o abriu', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.info-panel-backdrop')).toBeNull();

    const nameButton = fixture.nativeElement.querySelector('tbody tr.user-row .btn-row-name') as HTMLButtonElement;
    nameButton.focus();
    nameButton.click();
    await fixture.whenStable();

    const backdrop = fixture.nativeElement.querySelector('.info-panel-backdrop') as HTMLElement;
    expect(backdrop).toBeTruthy();
    backdrop.click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-user-list-info-panel')).toBeNull();
    expect(fixture.nativeElement.querySelector('.info-panel-backdrop')).toBeNull();
    expect(document.activeElement).toBe(nameButton);
  });

  it('não alterna a seleção da linha ao clicar no botão de menu de ações', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector('tbody tr.user-row') as HTMLTableRowElement;
    const menuButton = row.querySelector('.btn-row-actions') as HTMLButtonElement;
    menuButton.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.infoPanelUserId()).toBeUndefined();
  });

  it('reflete o usuário selecionado na URL, sem navegar pra outra rota', async () => {
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigate');

    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();
    navigateSpy.calls.reset();

    const row = fixture.nativeElement.querySelector('tbody tr.user-row') as HTMLTableRowElement;
    row.click();
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalledWith([], jasmine.objectContaining({
      queryParams: jasmine.objectContaining({ userId: 'u1' }),
      replaceUrl: true
    }));
  });

  it('o atalho "Editar cadastro" do painel abre o modal de edição pro usuário selecionado', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.infoPanelUserId.set('u1');
    await fixture.whenStable();

    fixture.componentInstance.onPanelEdit();

    expect(fixture.componentInstance.editForm.getRawValue()).toEqual({ firstName: 'Maria', lastName: 'Silva' });
  });

  it('o atalho "Atribuir funções" do painel abre o modal de roles pro usuário selecionado', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.infoPanelUserId.set('u1');
    await fixture.whenStable();

    fixture.componentInstance.onPanelAssignRoles();

    expect(fixture.componentInstance.isChecked('Agent')).toBeTrue();
  });

  it('o atalho de ativar/desativar do painel chama desativar pra um usuário ativo, e ativar pra um inativo', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    usersStoreFake.users.set([activeUser, inactiveUser]);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.infoPanelUserId.set('u1');
    await fixture.whenStable();
    fixture.componentInstance.onPanelToggleActive();
    expect(usersStoreFake.deactivate).toHaveBeenCalledWith('u1', jasmine.any(Function));

    fixture.componentInstance.infoPanelUserId.set('u2');
    await fixture.whenStable();
    fixture.componentInstance.onPanelToggleActive();
    expect(usersStoreFake.activate).toHaveBeenCalledWith('u2', jasmine.any(Function));
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

    const status = fixture.nativeElement.querySelector('app-loading-state') as HTMLElement;
    expect(status.querySelector('.spinner-border')).not.toBeNull();
    expect(status.getAttribute('role')).toBe('status');
    expect(status.textContent).toContain('Carregando usuários');
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

  it('deixa o "+N" fora da ordem de Tab e lê os nomes ocultos pro leitor de tela', async () => {
    usersStoreFake.users.set([{ ...activeUser, roles: [{ name: 'Agent' }, { name: 'Supervisor' }, { name: 'Financeiro' }] }]);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const overflow = fixture.nativeElement.querySelector('.badge-roles-overflow') as HTMLElement;
    expect(overflow.hasAttribute('tabindex')).toBeFalse();
    expect(overflow.hasAttribute('aria-label')).toBeFalse();
    expect(overflow.querySelector('.visually-hidden')?.textContent).toContain('Financeiro');
  });

  it('anuncia a seleção em lote numa região aria-live que já existe antes da primeira marcação', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const live = fixture.nativeElement.querySelector('.visually-hidden[aria-live="polite"]') as HTMLElement;
    expect(live).toBeTruthy();
    expect(live.textContent?.trim()).toBe('');

    fixture.componentInstance.toggleSelection('u1', true);
    await fixture.whenStable();
    expect(live.textContent?.trim()).toBe('1 usuário selecionado');
  });

  it('mostra ao vivo o que o "Salvar" do modal de funções vai adicionar e remover', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openAssignRolesModal(activeUser);
    await fixture.whenStable();
    const diff = fixture.nativeElement.querySelector('#userRolesModal .roles-diff') as HTMLElement;
    expect(diff.textContent).toContain('Nenhuma alteração ainda.');

    fixture.componentInstance.toggleRole('Agent', false);
    fixture.componentInstance.toggleRole('Supervisor', true);
    await fixture.whenStable();

    expect(fixture.componentInstance.rolesDiff()).toEqual({ added: ['Supervisor'], removed: ['Agent'] });
    expect(diff.textContent).toContain('Vai adicionar: Supervisor');
    expect(diff.textContent).toContain('Vai remover: Agent');
  });

  it('avisa (sem bloquear) quando a seleção deixaria o usuário sem nenhuma função', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openAssignRolesModal(activeUser);
    fixture.componentInstance.toggleRole('Agent', false);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#userRolesModal').textContent).toContain('não consegue fazer nada');
    fixture.componentInstance.onAssignRolesSubmit();
    expect(usersStoreFake.assignRoles).toHaveBeenCalledWith('u1', [], jasmine.any(Function));
  });

  it('impede o admin logado de tirar de si a última função de administrador', async () => {
    rolesStoreFake.roles.set([role, { name: 'Admin', permissionCodes: ['users:manage'], isDefault: false, isAdministrator: true }]);
    sessionServiceFake.userId.and.returnValue('u1');
    const self: UserSummary = { ...activeUser, roles: [{ name: 'Admin' }, { name: 'Agent' }] };
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openAssignRolesModal(self);
    fixture.componentInstance.toggleRole('Admin', false);
    await fixture.whenStable();

    expect(fixture.componentInstance.removesOwnAdminAccess()).toBeTrue();
    const saveButton = fixture.nativeElement.querySelector('#userRolesModal .modal-footer .btn-primary') as HTMLButtonElement;
    expect(saveButton.disabled).toBeTrue();
    expect(fixture.nativeElement.querySelector('#userRolesOwnAdmin')).toBeTruthy();

    fixture.componentInstance.onAssignRolesSubmit();
    expect(usersStoreFake.assignRoles).not.toHaveBeenCalled();
  });

  it('deixa outro administrador tirar a função de administrador de alguém', async () => {
    rolesStoreFake.roles.set([role, { name: 'Admin', permissionCodes: ['users:manage'], isDefault: false, isAdministrator: true }]);
    const otherAdmin: UserSummary = { ...activeUser, roles: [{ name: 'Admin' }] };
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openAssignRolesModal(otherAdmin);
    fixture.componentInstance.toggleRole('Admin', false);

    expect(fixture.componentInstance.removesOwnAdminAccess()).toBeFalse();
    fixture.componentInstance.onAssignRolesSubmit();
    expect(usersStoreFake.assignRoles).toHaveBeenCalled();
  });

  it('usa a cor customizada da função quando escolhida (prévia local), e o acento padrão quando não há', async () => {
    setRoleColor('Agent', '#ff3e1d');
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const badge = fixture.nativeElement.querySelector('td .badge') as HTMLElement;
    expect(badge.classList).toContain('badge-role-custom');
    expect(badge.classList).not.toContain('bg-label-primary');
    expect(badge.style.getPropertyValue('--role-color')).toBe('#ff3e1d');
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

  it('marca a página atual com aria-current, pra ser anunciada por leitor de tela', async () => {
    usersStoreFake.totalPages.set(3);
    usersStoreFake.currentPage.set(1);
    usersStoreFake.hasNextPage.set(true);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const pageButtons = Array.from(fixture.nativeElement.querySelectorAll('.card-footer button') as NodeListOf<HTMLButtonElement>);
    const pageOneButton = pageButtons.find(button => button.textContent?.trim() === '1');
    const pageTwoButton = pageButtons.find(button => button.textContent?.trim() === '2');

    expect(pageOneButton?.getAttribute('aria-current')).toBe('page');
    expect(pageTwoButton?.getAttribute('aria-current')).toBeNull();
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

    const windowItems = Array.from(fixture.nativeElement.querySelectorAll('.btn-page-number, .page-ellipsis') as NodeListOf<HTMLElement>)
      .map(item => item.textContent?.trim());
    expect(windowItems).toEqual(['1', '…', '24', '25', '26', '…', '50']);
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

    expect(fixture.nativeElement.querySelector('.card-footer').textContent).toContain('Exibindo 21–40 de');
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

  it('limpa os erros dos modais ao abrir o modal de edição, pra não mostrar o erro de uma tentativa anterior', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(activeUser);

    expect(usersStoreFake.clearDialogErrors).toHaveBeenCalled();
  });

  it('limpa os erros dos modais ao abrir o modal de atribuição de funções', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openAssignRolesModal(activeUser);

    expect(usersStoreFake.clearDialogErrors).toHaveBeenCalled();
  });

  it('mostra no modal de edição só o erro da edição, não o erro de carregamento da lista', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    usersStoreFake.listState.set({ loading: false, error: 'Erro ao carregar usuários' });
    fixture.componentInstance.openEditModal(activeUser);
    await fixture.whenStable();

    const editModal = fixture.nativeElement.querySelector('#userEditModal') as HTMLElement;
    expect(editModal.textContent).not.toContain('Erro ao carregar usuários');

    usersStoreFake.profileError.set('Erro ao atualizar cadastro');
    await fixture.whenStable();
    expect(editModal.querySelector('[role="alert"]')?.textContent).toContain('Erro ao atualizar cadastro');
  });

  it('mostra dentro do modal de funções o erro da atribuição, em vez de só no topo da página (coberto pelo modal)', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();
    fixture.componentInstance.openAssignRolesModal(activeUser);

    usersStoreFake.rolesError.set('Erro ao atribuir funções');
    await fixture.whenStable();

    const rolesModal = fixture.nativeElement.querySelector('#userRolesModal') as HTMLElement;
    expect(rolesModal.querySelector('[role="alert"]')?.textContent).toContain('Erro ao atribuir funções');
  });

  it('reseta o estado de criação ao abrir o modal de novo usuário', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('.page-actions button') as HTMLButtonElement;
    button.click();

    expect(usersStoreFake.resetState).toHaveBeenCalled();
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
      email: 'ana@empresa.com'
    });
    fixture.componentInstance.onCreateSubmit();

    expect(usersStoreFake.createUser).toHaveBeenCalledWith({
      firstName: 'Ana',
      lastName: 'Costa',
      email: 'ana@empresa.com'
    }, []);
  });

  it('pré-marca as funções padrão ao abrir o modal de criação, e envia as marcadas junto do cadastro', async () => {
    rolesStoreFake.roles.set([role, { name: 'Requester', permissionCodes: ['tickets:create'], isDefault: true, isAdministrator: false }]);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openCreateModal();
    expect(fixture.componentInstance.isCreateRoleChecked('Requester')).toBeTrue();
    expect(fixture.componentInstance.isCreateRoleChecked('Agent')).toBeFalse();

    fixture.componentInstance.toggleCreateRole('Agent', true);
    fixture.componentInstance.createForm.setValue({
      firstName: 'Ana', lastName: 'Costa', email: 'ana@empresa.com'
    });
    fixture.componentInstance.onCreateSubmit();

    expect(usersStoreFake.createUser).toHaveBeenCalledWith(jasmine.any(Object), ['Requester', 'Agent']);
  });

  it('"Criar e cadastrar outro" mantém o modal aberto, limpa o formulário, mantém as funções e devolve o foco ao Nome', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();

    fixture.componentInstance.openCreateModal();
    await fixture.whenStable();
    fixture.componentInstance.toggleCreateRole('Agent', true);
    fixture.componentInstance.createForm.setValue({
      firstName: 'Ana', lastName: 'Costa', email: 'ana@empresa.com'
    });
    fixture.componentInstance.onCreateSubmit(true);
    usersStoreFake.createdUserId.set('new-id');
    usersStoreFake.success.set(true);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#userCreateModal')).not.toBeNull();
    expect(fixture.componentInstance.createForm.getRawValue().email).toBe('');
    expect(fixture.componentInstance.isCreateRoleChecked('Agent')).toBeTrue();
    expect(document.activeElement?.id).toBe('userCreateFirstName');
    expect(fixture.componentInstance.createAnnouncement()).toContain('Convite enviado para Ana Costa');

    fixture.nativeElement.remove();
  });

  it('"Criar" fecha o modal e destaca a linha de quem acabou de ser criado', async () => {
    usersStoreFake.users.set([activeUser]);
    const fixture = TestBed.createComponent(UserListComponent);
    fixture.componentInstance.openCreateModal();
    await fixture.whenStable();

    jasmine.clock().install();
    try {
      fixture.componentInstance.createForm.setValue({
        firstName: 'Maria', lastName: 'Silva', email: 'maria@empresa.com'
      });
      fixture.componentInstance.onCreateSubmit();
      usersStoreFake.createdUserId.set('u1');
      usersStoreFake.success.set(true);
      // Relógio falso instalado: render síncrono, sem esperar o agendador (que usa setTimeout).
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('#userCreateModal')).toBeNull();
      const row = fixture.nativeElement.querySelector('tbody tr.user-row') as HTMLTableRowElement;
      expect(row.classList).toContain('user-row-new');

      jasmine.clock().tick(4001);
      fixture.detectChanges();
      expect(row.classList).not.toContain('user-row-new');
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('avisa como concluir quando o usuário foi criado mas as funções não foram atribuídas', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.createForm.setValue({
      firstName: 'Ana', lastName: 'Costa', email: 'ana@empresa.com'
    });
    usersStoreFake.createRolesFailed.set(true);
    usersStoreFake.success.set(true);
    await fixture.whenStable();

    expect(toastServiceFake.show).toHaveBeenCalledWith(jasmine.stringContaining('sem as funções escolhidas'), 'info');
  });

  it('o botão "Criar" não fica desabilitado por formulário inválido, só durante o carregamento', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    fixture.componentInstance.openCreateModal();
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('#userCreateModal button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeFalse();
  });

  it('mostra a mensagem de erro certa para o nome no modal de criação, por tipo de validação', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    fixture.componentInstance.openCreateModal();
    await fixture.whenStable();
    const firstName = fixture.componentInstance.createForm.controls.firstName;

    firstName.setValue('A');
    firstName.markAsTouched();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('O nome deve ter no mínimo 2 caracteres.');
  });

  it('não envia a edição e marca os campos tocados quando o nome estiver vazio', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();
    fixture.componentInstance.openEditModal(activeUser);

    fixture.componentInstance.editForm.controls.firstName.setValue('');
    fixture.componentInstance.onEditSubmit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(usersStoreFake.updateProfile).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('O nome é obrigatório.');
  });

  it('mostra um toast de sucesso ao criar um usuário', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.createForm.setValue({
      firstName: 'Ana',
      lastName: 'Costa',
      email: 'ana@empresa.com'
    });
    usersStoreFake.success.set(true);
    await fixture.whenStable();

    expect(toastServiceFake.show).toHaveBeenCalledWith('Convite enviado para ana@empresa.com.');
  });

  it('mostra um toast de sucesso ao editar o cadastro de um usuário', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(activeUser);
    fixture.componentInstance.editForm.setValue({ firstName: 'Ana', lastName: 'Costa' });
    fixture.componentInstance.onEditSubmit();
    const onSuccess = usersStoreFake.updateProfile.calls.mostRecent().args[2];
    onSuccess();

    expect(toastServiceFake.show).toHaveBeenCalledWith('Cadastro de "Ana Costa" atualizado.');
  });

  it('desativa o usuário quando confirmado', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeactivate(activeUser);

    expect(usersStoreFake.deactivate).toHaveBeenCalledWith('u1', jasmine.any(Function));
  });

  it('não oferece "Recarregar lista" para erro de uma ação (recarregar não resolve)', async () => {
    usersStoreFake.listState.set({ loading: false, error: 'Erro ao desativar usuário' });
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const alert = fixture.nativeElement.querySelector('.alert-danger') as HTMLElement;
    expect(alert.textContent).toContain('Erro ao desativar usuário');
    expect(alert.querySelector('button')).toBeNull();
  });

  it('o "Desfazer" do toast de desativação reativa o usuário na hora', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeactivate(activeUser);
    (usersStoreFake.deactivate.calls.mostRecent().args[1] as () => void)();
    const action = toastServiceFake.show.calls.mostRecent().args[2] as { run: () => void };
    action.run();

    expect(usersStoreFake.activate).toHaveBeenCalledWith('u1', jasmine.any(Function));
  });

  it('avisa na confirmação quantos chamados em aberto a pessoa atende, e que continuam atribuídos', async () => {
    usersStoreFake.countOpenAssignedTickets.and.callFake((_id: string, onDone: (count: number | null) => void) => onDone(3));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeactivate(activeUser);
    const options = confirmDialogServiceFake.confirm.calls.mostRecent().args[0] as { message: string };

    expect(usersStoreFake.countOpenAssignedTickets).toHaveBeenCalledWith('u1', jasmine.any(Function));
    expect(options.message).toContain('Maria Silva atende 3 chamados em aberto, que continuam atribuídos a essa pessoa');
    expect(options.message).toContain('reatribua em Monitorar Chamados');
  });

  it('usa o singular quando é 1 chamado em aberto', async () => {
    usersStoreFake.countOpenAssignedTickets.and.callFake((_id: string, onDone: (count: number | null) => void) => onDone(1));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeactivate(activeUser);
    const options = confirmDialogServiceFake.confirm.calls.mostRecent().args[0] as { message: string };

    expect(options.message).toContain('atende 1 chamado em aberto, que continua atribuído');
  });

  it('confirma sem o aviso de chamados quando a contagem falha, sem bloquear a desativação', async () => {
    usersStoreFake.countOpenAssignedTickets.and.callFake((_id: string, onDone: (count: number | null) => void) => onDone(null));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeactivate(activeUser);
    const options = confirmDialogServiceFake.confirm.calls.mostRecent().args[0] as { message: string };

    expect(options.message).toBe('O acesso de Maria Silva ao Tickest é bloqueado na hora. Dá pra reativar depois.');
  });

  it('não consulta chamados de quem ainda não ativou a conta', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeactivate({ ...activeUser, pendingActivation: true, invitationExpiresAtUtc: null });

    expect(usersStoreFake.countOpenAssignedTickets).not.toHaveBeenCalled();
    expect(confirmDialogServiceFake.confirm).toHaveBeenCalled();
  });

  it('usa texto sem gênero gramatical na confirmação de desativação', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeactivate(activeUser);
    const options = confirmDialogServiceFake.confirm.calls.mostRecent().args[0] as { message: string };

    expect(options.message).toBe('O acesso de Maria Silva ao Tickest é bloqueado na hora. Dá pra reativar depois.');
  });

  it('avisa quando nenhuma desativação do lote deu certo', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.toggleSelection('u1', true);
    fixture.componentInstance.onBulkDeactivate();
    (usersStoreFake.deactivateMany.calls.mostRecent().args[1] as (ok: number, failed: number) => void)(0, 1);

    expect(toastServiceFake.show).toHaveBeenCalledWith('Nenhum usuário foi desativado. O motivo está acima da lista.', 'danger');
  });

  it('mostra "Convite pendente" com a validade, e "Convite expirado" quando não há link válido', async () => {
    usersStoreFake.users.set([
      { ...activeUser, pendingActivation: true, invitationExpiresAtUtc: '2026-11-01T15:00:00Z' },
      { ...activeUser, id: 'u7', email: 'bia@empresa.com', firstName: 'Bia', pendingActivation: true, invitationExpiresAtUtc: null }
    ]);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr.user-row') as NodeListOf<HTMLTableRowElement>;
    expect(rows[0].textContent).toContain('Convite pendente');
    expect(rows[0].textContent).toContain('Vale até 01/11');
    expect(rows[1].textContent).toContain('Convite expirado');
  });

  it('oferece "Reenviar convite" no ⋮ só pra quem ainda não ativou a conta, e chama o store', async () => {
    const pending: UserSummary = { ...activeUser, pendingActivation: true, invitationExpiresAtUtc: null };
    usersStoreFake.users.set([pending, inactiveUser]);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr.user-row') as NodeListOf<HTMLTableRowElement>;
    const resend = Array.from(rows[0].querySelectorAll('.dropdown-item') as NodeListOf<HTMLButtonElement>)
      .find(button => button.textContent?.includes('Reenviar convite'));
    expect(resend).toBeTruthy();
    expect(rows[1].textContent).not.toContain('Reenviar convite');

    resend!.click();
    expect(usersStoreFake.resendInvitation).toHaveBeenCalledWith('u1', jasmine.any(Function));
    (usersStoreFake.resendInvitation.calls.mostRecent().args[1] as () => void)();
    expect(toastServiceFake.show).toHaveBeenCalledWith('Novo convite enviado para maria@empresa.com. O anterior deixou de valer.');
  });

  it('ao reativar quem nunca ativou a conta, avisa que falta reenviar o convite e oferece o reenvio no toast', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const pendingInactive: UserSummary = { ...inactiveUser, pendingActivation: true, invitationExpiresAtUtc: null };
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onActivate(pendingInactive);
    (usersStoreFake.activate.calls.mostRecent().args[1] as () => void)();
    const [message, variant, action] = toastServiceFake.show.calls.mostRecent().args as [string, string, { label: string; run: () => void }];

    expect(message).toContain('Falta reenviar o convite');
    expect(variant).toBe('info');
    expect(action.label).toBe('Reenviar convite');
    action.run();
    expect(usersStoreFake.resendInvitation).toHaveBeenCalledWith('u2', jasmine.any(Function));
  });

  it('o modal de criação não pede senha e explica o convite por e-mail', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    fixture.componentInstance.openCreateModal();
    await fixture.whenStable();

    const modal = fixture.nativeElement.querySelector('#userCreateModal') as HTMLElement;
    expect(modal.querySelector('input[type="password"]')).toBeNull();
    expect(modal.querySelector('#userCreateInvitationHint')?.textContent).toContain('Um convite vai para esse e-mail');
    expect(modal.querySelector('#userCreateEmail')?.getAttribute('aria-describedby')).toContain('userCreateInvitationHint');
  });

  it('mostra um toast de sucesso ao desativar', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeactivate(activeUser);
    const onSuccess = usersStoreFake.deactivate.calls.mostRecent().args[1];
    onSuccess();

    expect(toastServiceFake.show).toHaveBeenCalledWith('Acesso de "Maria Silva" desativado.', 'success', jasmine.objectContaining({ label: 'Desfazer' }));
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

    expect(toastServiceFake.show).toHaveBeenCalledWith('Acesso de "João Santos" reativado.');
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
    usersStoreFake.deactivatingIds.set(['u1']);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('.dropdown-item.text-danger') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
  });

  it('não desabilita o botão de Desativar de outro usuário enquanto só um está em andamento', async () => {
    const activeUser2: UserSummary = { ...activeUser, id: 'u3', firstName: 'Ana', lastName: 'Costa' };
    usersStoreFake.users.set([activeUser, activeUser2]);
    usersStoreFake.deactivatingIds.set(['u1']);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const buttons = fixture.nativeElement.querySelectorAll('.dropdown-item.text-danger') as NodeListOf<HTMLButtonElement>;
    expect(buttons[0].disabled).toBeTrue();
    expect(buttons[1].disabled).toBeFalse();
  });

  it('não mostra nem Desativar nem Reativar para a própria conta logada', async () => {
    sessionServiceFake.userId.and.returnValue('u1');
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.dropdown-item.text-danger')).toBeNull();
    expect(fixture.nativeElement.querySelector('.dropdown-item.text-success')).toBeNull();
  });

  it('só mostra checkbox de seleção em lote para usuários ativos e diferentes da própria conta logada', async () => {
    const activeUser2: UserSummary = { ...activeUser, id: 'u3', firstName: 'Ana', lastName: 'Costa' };
    sessionServiceFake.userId.and.returnValue('u3');
    usersStoreFake.users.set([activeUser, inactiveUser, activeUser2]);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.canSelectForBulk(activeUser)).toBeTrue();
    expect(fixture.componentInstance.canSelectForBulk(inactiveUser)).toBeFalse();
    expect(fixture.componentInstance.canSelectForBulk(activeUser2)).toBeFalse();
  });

  it('marca e desmarca usuários na seleção em lote', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.toggleSelection('u1', true);
    expect(fixture.componentInstance.isSelected('u1')).toBeTrue();
    expect(fixture.componentInstance.selectedCount()).toBe(1);

    fixture.componentInstance.toggleSelection('u1', false);
    expect(fixture.componentInstance.isSelected('u1')).toBeFalse();
    expect(fixture.componentInstance.selectedCount()).toBe(0);
  });

  it('"selecionar todos" marca só os elegíveis da página, e fica indeterminado com seleção parcial', async () => {
    const activeUser2: UserSummary = { ...activeUser, id: 'u3', firstName: 'Ana', lastName: 'Costa' };
    usersStoreFake.users.set([activeUser, inactiveUser, activeUser2]);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.toggleSelectAll(true);
    expect(fixture.componentInstance.selectedCount()).toBe(2);
    expect(fixture.componentInstance.allEligibleSelected()).toBeTrue();

    fixture.componentInstance.toggleSelection('u1', false);
    expect(fixture.componentInstance.someEligibleSelected()).toBeTrue();
    expect(fixture.componentInstance.allEligibleSelected()).toBeFalse();

    fixture.componentInstance.toggleSelectAll(false);
    expect(fixture.componentInstance.selectedCount()).toBe(0);
  });

  it('limpa a seleção em lote ao trocar qualquer filtro', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.toggleSelection('u1', true);
    expect(fixture.componentInstance.selectedCount()).toBe(1);

    usersStoreFake.filters.set({ status: 'Inactive', page: 1, pageSize: 20 });
    await fixture.whenStable();

    expect(fixture.componentInstance.selectedCount()).toBe(0);
  });

  it('pede confirmação e desativa em lote os usuários selecionados', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const activeUser2: UserSummary = { ...activeUser, id: 'u3', firstName: 'Ana', lastName: 'Costa' };
    usersStoreFake.users.set([activeUser, activeUser2]);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.toggleSelectAll(true);
    fixture.componentInstance.onBulkDeactivate();

    expect(confirmDialogServiceFake.confirm).toHaveBeenCalled();
    const options = confirmDialogServiceFake.confirm.calls.mostRecent().args[0];
    expect(options.title).toContain('2 usuários selecionados');
    expect(options.message).toContain('Maria Silva');
    expect(options.message).toContain('Ana Costa');
    expect(usersStoreFake.deactivateMany).toHaveBeenCalledWith(['u1', 'u3'], jasmine.any(Function));
  });

  it('não desativa em lote quando a confirmação é cancelada', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(false));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.toggleSelection('u1', true);
    fixture.componentInstance.onBulkDeactivate();

    expect(usersStoreFake.deactivateMany).not.toHaveBeenCalled();
  });

  it('não faz nada ao chamar a desativação em lote sem nenhuma seleção', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onBulkDeactivate();

    expect(confirmDialogServiceFake.confirm).not.toHaveBeenCalled();
    expect(usersStoreFake.deactivateMany).not.toHaveBeenCalled();
  });

  it('limpa a seleção e mostra um toast ao concluir a desativação em lote sem falhas', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.toggleSelection('u1', true);
    fixture.componentInstance.onBulkDeactivate();
    const onDone = usersStoreFake.deactivateMany.calls.mostRecent().args[1];
    onDone(1, 0);

    expect(fixture.componentInstance.selectedCount()).toBe(0);
    expect(toastServiceFake.show).toHaveBeenCalledWith('1 usuário desativado.');
  });

  it('mostra um toast informando falha parcial na desativação em lote', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.toggleSelection('u1', true);
    fixture.componentInstance.onBulkDeactivate();
    const onDone = usersStoreFake.deactivateMany.calls.mostRecent().args[1];
    onDone(1, 1);

    expect(toastServiceFake.show).toHaveBeenCalledWith('1 de 2 usuários desativados.', 'info');
  });

  it('mostra a barra de ação em lote só quando há seleção ativa', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.bulk-actions-bar')).toBeNull();

    fixture.componentInstance.toggleSelection('u1', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.bulk-actions-bar')).not.toBeNull();
  });

  it('mostra a data de desativação dentro da célula de cadastro, só quando o usuário foi desativado', async () => {
    usersStoreFake.users.set([activeUser, inactiveUser]);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect((rows[0] as HTMLElement).textContent).not.toContain('Desativado em');
    expect((rows[1] as HTMLElement).textContent).toContain('Desativado em');
    expect((rows[1] as HTMLElement).textContent).toContain('01/02/2026');
  });

  it('marca a linha de um usuário inativo sem apagá-la com opacidade (que derrubaria o contraste)', async () => {
    usersStoreFake.users.set([inactiveUser]);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector('tbody tr') as HTMLTableRowElement;
    expect(row.classList).toContain('user-row-inactive');
    expect(row.classList).not.toContain('opacity-75');
  });

  it('não marca como inativa a linha de um usuário ativo', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector('tbody tr') as HTMLTableRowElement;
    expect(row.classList).not.toContain('user-row-inactive');
  });

  it('mostra mensagem distinta quando a lista estiver vazia por causa dos filtros', async () => {
    usersStoreFake.users.set([]);
    usersStoreFake.total.set(0);
    usersStoreFake.filters.set({ status: 'Inactive', page: 1, pageSize: 20 });
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Nenhum usuário encontrado com esses filtros.');
  });

  it('oferece "Limpar filtros" no estado vazio por filtro, e limpa ao clicar', async () => {
    usersStoreFake.users.set([]);
    usersStoreFake.total.set(0);
    usersStoreFake.filters.set({ status: 'Inactive', page: 1, pageSize: 20 });
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('.empty-state button') as HTMLButtonElement;
    expect(button.textContent).toContain('Limpar filtros');
    button.click();

    expect(usersStoreFake.clearFilters).toHaveBeenCalled();
  });

  it('oferece "Novo Usuário" no estado vazio de primeiro uso', async () => {
    usersStoreFake.users.set([]);
    usersStoreFake.total.set(0);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('.empty-state button') as HTMLButtonElement;
    expect(button.textContent).toContain('Novo Usuário');
    button.click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#userCreateModal')).not.toBeNull();
  });

  it('oferece recarregar a lista quando o carregamento falha', async () => {
    usersStoreFake.listState.set({ loading: false, error: 'Erro ao carregar usuários' });
    usersStoreFake.listLoadFailed.set(true);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();
    usersStoreFake.loadAll.calls.reset();

    const alert = fixture.nativeElement.querySelector('.alert-danger') as HTMLElement;
    (alert.querySelector('button') as HTMLButtonElement).click();

    expect(usersStoreFake.loadAll).toHaveBeenCalled();
  });

  it('não aplica um período invertido e explica o problema abaixo dos campos', async () => {
    usersStoreFake.filters.set({ status: 'All', createdTo: '2026-01-10', page: 1, pageSize: 20 });
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onCreatedFromChange('2026-02-01');
    await fixture.whenStable();

    expect(usersStoreFake.setPeriod).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#userPeriod-error')?.textContent).toContain('anterior à data final');
    expect(fixture.nativeElement.querySelector('#userCreatedFrom').getAttribute('aria-invalid')).toBe('true');
  });

  it('aplica o período e some com o erro quando ele volta a ser coerente', async () => {
    usersStoreFake.filters.set({ status: 'All', createdTo: '2026-01-10', page: 1, pageSize: 20 });
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();
    fixture.componentInstance.onCreatedFromChange('2026-02-01');

    fixture.componentInstance.onCreatedFromChange('2026-01-05');
    await fixture.whenStable();

    expect(usersStoreFake.setPeriod).toHaveBeenCalledWith('2026-01-05', '2026-01-10');
    expect(fixture.nativeElement.querySelector('#userPeriod-error')).toBeNull();
  });

  it('trava o fechamento do diálogo de edição enquanto salva (o X fica desabilitado)', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    fixture.componentInstance.openEditModal(activeUser);
    usersStoreFake.updatingProfile.set(true);
    await fixture.whenStable();

    expect((fixture.nativeElement.querySelector('#userEditModal .btn-close') as HTMLButtonElement).disabled).toBeTrue();
  });
});
