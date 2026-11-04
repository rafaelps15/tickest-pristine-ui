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
import { SessionService, ConfirmDialogService, ToastService } from '../../shared';

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
      listMutationError: signal<string | null>(null),
      clearListMutationError: jasmine.createSpy('clearListMutationError'),
      usersPage: signal<object | undefined>({}),
      statusCounts: signal<{ totalCount: number; activeCount: number; pendingActivationCount: number; inactiveCount: number } | null>(
        { totalCount: 12, activeCount: 10, pendingActivationCount: 0, inactiveCount: 2 }),
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
      countingTicketsIds: signal<string[]>([]),
      resendInvitation: jasmine.createSpy('resendInvitation'),
      countOpenAssignedTickets: jasmine.createSpy('countOpenAssignedTickets')
        .and.callFake((_userId: string, onDone: (count: number | null) => void) => onDone(0)),
      countOpenAssignedTicketsMany: jasmine.createSpy('countOpenAssignedTicketsMany')
        .and.callFake((_userIds: string[], onDone: (result: { tickets: number; people: number } | null) => void) => onDone({ tickets: 0, people: 0 })),
      activateMany: jasmine.createSpy('activateMany'),
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
  let sessionServiceFake: { userId: jasmine.Spy; hasPermission: jasmine.Spy };
  let confirmDialogServiceFake: { confirm: jasmine.Spy };
  let toastServiceFake: { show: jasmine.Spy };

  beforeEach(async () => {
    usersStoreFake = createUsersStoreFake();
    rolesStoreFake = { roles: signal<Role[]>([role]), load: jasmine.createSpy('load') };
    sessionServiceFake = { userId: jasmine.createSpy('userId').and.returnValue('admin-id'), hasPermission: jasmine.createSpy('hasPermission').and.returnValue(true) };
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

  it('loads users and roles on init', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(usersStoreFake.resetState).toHaveBeenCalled();
    expect(usersStoreFake.loadAll).toHaveBeenCalled();
    expect(rolesStoreFake.load).toHaveBeenCalled();
  });

  it('does not request the roles from someone without roles:read (the API would respond 403)', async () => {
    sessionServiceFake.hasPermission.and.callFake((code: string) => code !== 'roles:read');
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(usersStoreFake.loadAll).toHaveBeenCalled();
    expect(rolesStoreFake.load).not.toHaveBeenCalled();
  });

  it('restores status, period, page and page size from the query string on init', async () => {
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

  it('falls back to the default when a URL parameter is invalid (status outside the enum, malformed date, non-numeric page), without breaking (EC-08)', async () => {
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

  it('does not include the free-text search term in the URL', async () => {
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigate');
    usersStoreFake.filters.set({ status: 'Inactive', search: 'maria@empresa.com', page: 1, pageSize: 20 });

    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalled();
    const queryParams = navigateSpy.calls.mostRecent().args[1]!.queryParams as Record<string, unknown>;
    expect(Object.keys(queryParams)).not.toContain('search');
    expect(queryParams['status']).toBe('Inactive');
  });

  it('reflects a non-default filter/page in the URL, without stacking history', async () => {
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigate');
    usersStoreFake.filters.set({ status: 'Inactive', page: 2, pageSize: 20 });

    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(navigateSpy).toHaveBeenCalledWith([], jasmine.objectContaining({
      queryParams: jasmine.objectContaining({ status: 'Inactive', page: 2 }),
      replaceUrl: true
    }));
  });

  it('does not navigate again when the filters already match the current URL (avoids a loop)', async () => {
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigate');

    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('restores the selected user from the "userId" query string parameter on init', async () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { queryParamMap: convertToParamMap({ userId: 'u1' }) } }
    });
    spyOn(TestBed.inject(Router), 'navigate');

    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.infoPanelUserId()).toBe('u1');
  });

  it('selects a user when the row is clicked, shows the panel, and deselects on a second click', async () => {
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

  it('opens and closes the panel through the name button, once per click (without firing again from the row click)', async () => {
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

  it('keeps the <tr> as a table row, with no button role and no focus of its own', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector('tbody tr.user-row') as HTMLTableRowElement;
    expect(row.getAttribute('role')).toBeNull();
    expect(row.hasAttribute('tabindex')).toBeFalse();
    expect(row.querySelector('button.btn-row-name')).toBeTruthy();
  });

  it('breaks the email before the "@", not in the middle of the domain (R-06)', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const cell = fixture.nativeElement.querySelector('tbody tr.user-row td.d-md-table-cell') as HTMLTableCellElement;
    expect(cell.textContent?.trim()).toBe('maria@empresa.com');
    const wbr = cell.querySelector('wbr');
    expect(wbr?.nextSibling?.textContent).toBe('@empresa.com');
  });

  it('marks the row with the open panel using a class distinct from the batch selection', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector('tbody tr.user-row') as HTMLTableRowElement;
    expect(row.classList).not.toContain('user-row-info-open');

    row.click();
    await fixture.whenStable();

    expect(row.classList).toContain('user-row-info-open');
  });

  it('gives the name button its visible text as the accessible name, with no label repeating the state (WCAG 2.5.3)', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const nameButton = fixture.nativeElement.querySelector('tbody tr.user-row .btn-row-name') as HTMLButtonElement;
    expect(nameButton.hasAttribute('aria-label')).toBeFalse();
    expect(nameButton.hasAttribute('aria-pressed')).toBeFalse();
    expect(nameButton.textContent?.trim()).toBe('Maria Silva');
  });

  it('shows a note that the batch selection only applies to the current page, when there is more than one page', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.toggleSelection('u1', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('só desta página');

    usersStoreFake.totalPages.set(3);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('só desta página');
  });


  it('does not toggle the row selection when the batch selection checkbox or the actions menu is clicked', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector('tbody tr.user-row') as HTMLTableRowElement;
    const checkbox = row.querySelector('input[type="checkbox"]') as HTMLInputElement;
    checkbox.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await fixture.whenStable();

    expect(fixture.componentInstance.infoPanelUserId()).toBeUndefined();
  });

  it('marks the user for the batch action when tapping anywhere in the 44px area of the cell, without opening the panel', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const hitArea = fixture.nativeElement.querySelector('tbody tr.user-row .select-hit') as HTMLLabelElement;
    hitArea.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.selectedUserIds().has('u1')).toBeTrue();
    expect(fixture.componentInstance.infoPanelUserId()).toBeUndefined();
  });

  it('closes the panel with the Esc key, from anywhere on the screen, and returns focus to whoever opened it', async () => {
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

  it('does not close the panel when Esc originates inside a modal (only the modal closes)', async () => {
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

  it('does not close the panel when Esc originates inside the "⋮" actions menu (only the menu closes)', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.selectRow('u1');
    await fixture.whenStable();

    const menuButton = fixture.nativeElement.querySelector('.btn-row-actions') as HTMLButtonElement;
    menuButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();

    expect(fixture.componentInstance.infoPanelUserId()).toBe('u1');
  });

  it('switches the panel to modal mode (overlay) only below "lg"', async () => {
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

  it('does nothing when Esc is pressed with no panel open', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))).not.toThrow();
  });

  it('closes the panel when the backdrop (small-screen overlay) is clicked, and returns focus to whoever opened it', async () => {
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

  it('does not toggle the row selection when the actions menu button is clicked', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector('tbody tr.user-row') as HTMLTableRowElement;
    const menuButton = row.querySelector('.btn-row-actions') as HTMLButtonElement;
    menuButton.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.infoPanelUserId()).toBeUndefined();
  });

  it('reflects the selected user in the URL, without navigating to another route', async () => {
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

  it('the "Editar cadastro" shortcut in the panel opens the edit modal for the selected user', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.infoPanelUserId.set('u1');
    await fixture.whenStable();

    fixture.componentInstance.onPanelEdit();

    expect(fixture.componentInstance.editForm.getRawValue()).toEqual({ firstName: 'Maria', lastName: 'Silva' });
  });

  it('the "Atribuir funções" shortcut in the panel opens the roles modal for the selected user', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.infoPanelUserId.set('u1');
    await fixture.whenStable();

    fixture.componentInstance.onPanelAssignRoles();

    expect(fixture.componentInstance.selectedRoleNames().has('Agent')).toBeTrue();
  });

  it('the activate/deactivate shortcut in the panel calls deactivate for an active user, and activate for an inactive one', async () => {
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

  it('renders the loaded users, with status, dates and roles', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Maria Silva');
    expect(text).toContain('maria@empresa.com');
    expect(text).toContain('Agent');
    expect(text).toContain('Ativo');
    expect(text).toContain('01/01/2026');
  });

  it('keeps the list readable when reloading with a filter/page (without fading) and shows "Atualizando…" in the bar', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    usersStoreFake.listState.set({ loading: true, error: null });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Maria Silva');
    expect(fixture.nativeElement.querySelector('table').classList).not.toContain('is-refreshing');
    expect(fixture.nativeElement.querySelector('.user-toolbar-status').textContent).toContain('Atualizando…');
  });

  it('does not trigger the search on its own when the screen opens (the page coming from the link does not reset to 1)', async () => {
    jasmine.clock().install();
    try {
      const fixture = TestBed.createComponent(UserListComponent);
      fixture.detectChanges();
      jasmine.clock().tick(400);
      fixture.detectChanges();

      expect(usersStoreFake.setSearch).not.toHaveBeenCalled();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('shows "Limpar filtros" in the bar only when a filter is applied, with the result count', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.user-clear')).toBeNull();

    usersStoreFake.filters.set({ status: 'Inactive', page: 1, pageSize: 20 });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.user-clear')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.user-toolbar-status').textContent).toContain('1 usuário encontrado.');
  });

  it('keeps the period collapsed until requested, and visible when one is already applied', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#userPeriod')).toBeNull();

    (fixture.nativeElement.querySelector('.user-period-toggle') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#userPeriod legend').textContent).toContain('Período de cadastro');
    expect(fixture.nativeElement.querySelector('label[for="userCreatedFrom"]').textContent).toContain('De');

    usersStoreFake.filters.set({ status: 'All', createdFrom: '2026-01-01', page: 1, pageSize: 20 });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.user-period-toggle')).toBeNull();
    expect(fixture.nativeElement.querySelector('#userPeriod')).not.toBeNull();
  });

  it('shows the spinner in place of the table only when no user has been loaded yet', async () => {
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

  it('shows at most 2 role badges and groups the rest into "+N"', async () => {
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

  it('keeps "+N" out of the Tab order and reads the hidden names to the screen reader', async () => {
    usersStoreFake.users.set([{ ...activeUser, roles: [{ name: 'Agent' }, { name: 'Supervisor' }, { name: 'Financeiro' }] }]);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const overflow = fixture.nativeElement.querySelector('.badge-roles-overflow') as HTMLElement;
    expect(overflow.hasAttribute('tabindex')).toBeFalse();
    expect(overflow.hasAttribute('aria-label')).toBeFalse();
    expect(overflow.querySelector('.visually-hidden')?.textContent).toContain('Financeiro');
  });

  it('announces the batch selection in an aria-live region that already exists before the first selection', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const live = fixture.nativeElement.querySelector('.visually-hidden[aria-live="polite"]') as HTMLElement;
    expect(live).toBeTruthy();
    expect(live.textContent?.trim()).toBe('');

    fixture.componentInstance.toggleSelection('u1', true);
    await fixture.whenStable();
    expect(live.textContent?.trim()).toBe('1 usuário selecionado');
  });

  it('shows live what the "Salvar" of the roles modal will add and remove', async () => {
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

  it('warns (without blocking) when the selection would leave the user with no role at all', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openAssignRolesModal(activeUser);
    fixture.componentInstance.toggleRole('Agent', false);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#userRolesModal').textContent).toContain('não consegue fazer nada');
    fixture.componentInstance.onAssignRolesSubmit();
    expect(usersStoreFake.assignRoles).toHaveBeenCalledWith('u1', [], jasmine.any(Function));
  });

  it('prevents the logged-in admin from removing their own last administrator role', async () => {
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

  it('lets another administrator remove the administrator role from someone', async () => {
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

  it('shows the roles in the system indigo badge, with no color stored in the browser', async () => {
    localStorage.setItem('tickest.roleColors', JSON.stringify({ Agent: '#ff3e1d' }));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();
    localStorage.removeItem('tickest.roleColors');

    const badge = fixture.nativeElement.querySelector('td .badge') as HTMLElement;
    expect(badge.classList).toContain('bg-label-primary');
    expect(badge.style.getPropertyValue('--role-color')).toBe('');
  });

  it('searches with a 300ms debounce after typing stops', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    fixture.detectChanges();

    fixture.componentInstance.searchInput.set('maria');
    await new Promise(resolve => setTimeout(resolve, 350));

    expect(usersStoreFake.setSearch).toHaveBeenCalledWith('maria');
  });

  it('does not trigger the search before 300ms', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    fixture.detectChanges();

    fixture.componentInstance.searchInput.set('maria');
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(usersStoreFake.setSearch).not.toHaveBeenCalled();
    await new Promise(resolve => setTimeout(resolve, 300));
  });

  it('changes the selected status', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onStatusChange('Inactive');

    expect(usersStoreFake.setStatus).toHaveBeenCalledWith('Inactive');
  });

  it('changes the registration period', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onCreatedFromChange('2026-01-01');

    expect(usersStoreFake.setPeriod).toHaveBeenCalledWith('2026-01-01', undefined);
  });

  it('clears the filters and the local search field', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.searchInput.set('maria');
    fixture.componentInstance.onClearFilters();

    expect(fixture.componentInstance.searchInput()).toBe('');
    expect(usersStoreFake.clearFilters).toHaveBeenCalled();
  });

  it('navigates to the clicked page', async () => {
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

  it('marks the current page with aria-current, so it is announced by the screen reader', async () => {
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

  it('does not show the pagination controls when there is only one page', async () => {
    usersStoreFake.totalPages.set(1);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Anterior');
    expect(fixture.nativeElement.textContent).not.toContain('Próxima');
  });

  it('uses an ellipsis instead of one button per page when there are many pages', async () => {
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

  it('changes the page size', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onPageSizeChange(50);

    expect(usersStoreFake.setPageSize).toHaveBeenCalledWith(50);
  });

  it('computes the range shown in the footer ("Exibindo X–Y de Z")', async () => {
    usersStoreFake.currentPage.set(2);
    usersStoreFake.pageSize.set(20);
    usersStoreFake.total.set(45);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.card-footer').textContent).toContain('Exibindo 21–40 de');
  });

  it('pre-fills the edit form when the registration modal opens', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(activeUser);

    expect(fixture.componentInstance.editForm.getRawValue()).toEqual({ firstName: 'Maria', lastName: 'Silva' });
  });

  it('submits the registration update with the values trimmed of surrounding whitespace', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(activeUser);
    fixture.componentInstance.editForm.setValue({ firstName: '  Ana ', lastName: ' Costa  ' });
    fixture.componentInstance.onEditSubmit();

    expect(usersStoreFake.updateProfile).toHaveBeenCalledWith('u1', { firstName: 'Ana', lastName: 'Costa' }, jasmine.any(Function));
  });

  it('does not submit the registration update when the form is invalid', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(activeUser);
    fixture.componentInstance.editForm.setValue({ firstName: '', lastName: 'Costa' });
    fixture.componentInstance.onEditSubmit();

    expect(usersStoreFake.updateProfile).not.toHaveBeenCalled();
  });

  it('clears the modal errors when the edit modal opens, so the error from a previous attempt is not shown', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(activeUser);

    expect(usersStoreFake.clearDialogErrors).toHaveBeenCalled();
  });

  it('clears the modal errors when the role assignment modal opens', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openAssignRolesModal(activeUser);

    expect(usersStoreFake.clearDialogErrors).toHaveBeenCalled();
  });

  it('shows in the edit modal only the edit error, not the list loading error', async () => {
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

  it('shows the assignment error inside the roles modal, instead of only at the top of the page (covered by the modal)', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();
    fixture.componentInstance.openAssignRolesModal(activeUser);

    usersStoreFake.rolesError.set('Erro ao atribuir funções');
    await fixture.whenStable();

    const rolesModal = fixture.nativeElement.querySelector('#userRolesModal') as HTMLElement;
    expect(rolesModal.querySelector('[role="alert"]')?.textContent).toContain('Erro ao atribuir funções');
  });

  it('resets the creation state when the new user modal opens', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('.page-actions button') as HTMLButtonElement;
    button.click();

    expect(usersStoreFake.resetState).toHaveBeenCalled();
  });

  it('pre-checks the roles already assigned when the assignment modal opens', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openAssignRolesModal(activeUser);

    expect(fixture.componentInstance.selectedRoleNames().has('Agent')).toBeTrue();
  });

  it('submits the assignment of the checked roles', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openAssignRolesModal(activeUser);
    fixture.componentInstance.toggleRole('Supervisor', true);
    fixture.componentInstance.onAssignRolesSubmit();

    expect(usersStoreFake.assignRoles).toHaveBeenCalledWith('u1', ['Agent', 'Supervisor'], jasmine.any(Function));
  });

  it('shows a success toast when roles are assigned', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openAssignRolesModal(activeUser);
    fixture.componentInstance.onAssignRolesSubmit();
    const onSuccess = usersStoreFake.assignRoles.calls.mostRecent().args[2];
    onSuccess();

    expect(toastServiceFake.show).toHaveBeenCalledWith('Funções de "Maria Silva" atualizadas.');
  });

  it('submits the user creation when the form is valid', async () => {
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

  it('pre-checks the default roles when the creation modal opens, and submits the checked ones along with the registration', async () => {
    rolesStoreFake.roles.set([role, { name: 'Requester', permissionCodes: ['tickets:create'], isDefault: true, isAdministrator: false }]);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openCreateModal();
    expect(fixture.componentInstance.createRoleNames().has('Requester')).toBeTrue();
    expect(fixture.componentInstance.createRoleNames().has('Agent')).toBeFalse();

    fixture.componentInstance.toggleCreateRole('Agent', true);
    fixture.componentInstance.createForm.setValue({
      firstName: 'Ana', lastName: 'Costa', email: 'ana@empresa.com'
    });
    fixture.componentInstance.onCreateSubmit();

    expect(usersStoreFake.createUser).toHaveBeenCalledWith(jasmine.any(Object), ['Requester', 'Agent']);
  });

  it('"Criar e cadastrar outro" keeps the modal open, clears the form, keeps the roles and returns focus to Nome', async () => {
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
    expect(fixture.componentInstance.createRoleNames().has('Agent')).toBeTrue();
    expect(document.activeElement?.id).toBe('userCreateFirstName');
    expect(fixture.componentInstance.createAnnouncement()).toContain('Convite enviado para Ana Costa');

    fixture.nativeElement.remove();
  });

  it('"Criar" closes the modal and highlights the row of the user just created', async () => {
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
      expect(row.classList).toContain('item-new-row');

      jasmine.clock().tick(4001);
      fixture.detectChanges();
      expect(row.classList).not.toContain('item-new-row');
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('warns how to finish when the user was created but the roles were not assigned', async () => {
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

  it('the "Criar" button is not disabled because of an invalid form, only while loading', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    fixture.componentInstance.openCreateModal();
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('#userCreateModal button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeFalse();
  });

  it('shows the right error message for the name in the creation modal, per validation type', async () => {
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

  it('does not submit the edit and marks the fields as touched when the name is empty', async () => {
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

  it('shows a success toast when a user is created', async () => {
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

  it('shows a success toast when a user registration is edited', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(activeUser);
    fixture.componentInstance.editForm.setValue({ firstName: 'Ana', lastName: 'Costa' });
    fixture.componentInstance.onEditSubmit();
    const onSuccess = usersStoreFake.updateProfile.calls.mostRecent().args[2];
    onSuccess();

    expect(toastServiceFake.show).toHaveBeenCalledWith('Cadastro de "Ana Costa" atualizado.');
  });

  it('deactivates the user when confirmed', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeactivate(activeUser);

    expect(usersStoreFake.deactivate).toHaveBeenCalledWith('u1', jasmine.any(Function));
  });

  it('shows an action error in red, without "Tentar novamente" (reloading does not fix it), and closes with the X', async () => {
    usersStoreFake.listMutationError.set('Erro ao desativar usuário');
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const alert = fixture.nativeElement.querySelector('.alert-danger') as HTMLElement;
    expect(alert.textContent).toContain('Erro ao desativar usuário');
    expect(alert.textContent).not.toContain('Tentar novamente');
    (alert.querySelector('.btn-close') as HTMLButtonElement).click();

    expect(usersStoreFake.clearListMutationError).toHaveBeenCalled();
  });

  it('the "Desfazer" in the deactivation toast reactivates the user immediately', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeactivate(activeUser);
    (usersStoreFake.deactivate.calls.mostRecent().args[1] as () => void)();
    const action = toastServiceFake.show.calls.mostRecent().args[2] as { run: () => void };
    action.run();

    expect(usersStoreFake.activate).toHaveBeenCalledWith('u1', jasmine.any(Function));
  });

  it('warns in the confirmation how many open tickets the person handles, and that they stay assigned', async () => {
    usersStoreFake.countOpenAssignedTickets.and.callFake((_id: string, onDone: (count: number | null) => void) => onDone(3));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeactivate(activeUser);
    const options = confirmDialogServiceFake.confirm.calls.mostRecent().args[0] as { message: string };

    expect(usersStoreFake.countOpenAssignedTickets).toHaveBeenCalledWith('u1', jasmine.any(Function));
    expect(options.message).toContain('Maria Silva atende 3 chamados em aberto, que continuam atribuídos a essa pessoa');
    expect(options.message).toContain('reatribua em Monitorar Chamados');
  });

  it('uses the singular when there is 1 open ticket', async () => {
    usersStoreFake.countOpenAssignedTickets.and.callFake((_id: string, onDone: (count: number | null) => void) => onDone(1));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeactivate(activeUser);
    const options = confirmDialogServiceFake.confirm.calls.mostRecent().args[0] as { message: string };

    expect(options.message).toContain('atende 1 chamado em aberto, que continua atribuído');
  });

  it('confirms without the tickets warning when the count fails, without blocking the deactivation', async () => {
    usersStoreFake.countOpenAssignedTickets.and.callFake((_id: string, onDone: (count: number | null) => void) => onDone(null));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeactivate(activeUser);
    const options = confirmDialogServiceFake.confirm.calls.mostRecent().args[0] as { message: string };

    expect(options.message).toBe('O acesso de Maria Silva ao Tickest é bloqueado na hora. Dá pra reativar depois.');
  });

  it('does not query tickets for someone who has not activated the account yet', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeactivate({ ...activeUser, pendingActivation: true, invitationExpiresAtUtc: null });

    expect(usersStoreFake.countOpenAssignedTickets).not.toHaveBeenCalled();
    expect(confirmDialogServiceFake.confirm).toHaveBeenCalled();
  });

  it('uses grammatically gender-neutral text in the deactivation confirmation', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeactivate(activeUser);
    const options = confirmDialogServiceFake.confirm.calls.mostRecent().args[0] as { message: string };

    expect(options.message).toBe('O acesso de Maria Silva ao Tickest é bloqueado na hora. Dá pra reativar depois.');
  });

  it('warns when no deactivation in the batch succeeded', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.toggleSelection('u1', true);
    fixture.componentInstance.onBulkDeactivate();
    usersStoreFake.listMutationError.set('Não foi possível desativar: Maria Silva.');
    (usersStoreFake.deactivateMany.calls.mostRecent().args[1] as (ok: string[], failed: number) => void)([], 1);

    // O motivo vai no próprio toast — antes ele mandava "olhar acima da lista".
    expect(toastServiceFake.show).toHaveBeenCalledWith('Nenhum usuário foi desativado. Não foi possível desativar: Maria Silva.', 'danger');
  });

  it('shows "Convite pendente" with the expiry, and "Convite expirado" when there is no valid link', async () => {
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

  it('offers "Reenviar convite" in the ⋮ only for someone who has not activated the account yet, and calls the store', async () => {
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

  it('when reactivating someone who never activated the account, warns that the invitation still needs to be resent and offers the resend in the toast', async () => {
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

  it('the creation modal does not ask for a password and explains the email invitation', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    fixture.componentInstance.openCreateModal();
    await fixture.whenStable();

    const modal = fixture.nativeElement.querySelector('#userCreateModal') as HTMLElement;
    expect(modal.querySelector('input[type="password"]')).toBeNull();
    expect(modal.querySelector('#userCreateInvitationHint')?.textContent).toContain('Um convite vai para esse e-mail');
    expect(modal.querySelector('#userCreateEmail')?.getAttribute('aria-describedby')).toContain('userCreateInvitationHint');
  });

  it('shows a success toast when deactivating', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeactivate(activeUser);
    const onSuccess = usersStoreFake.deactivate.calls.mostRecent().args[1];
    onSuccess();

    expect(toastServiceFake.show).toHaveBeenCalledWith('Acesso de "Maria Silva" desativado.', 'success', jasmine.objectContaining({ label: 'Desfazer' }));
  });

  it('does not deactivate the user when the confirmation is canceled', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(false));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeactivate(activeUser);

    expect(usersStoreFake.deactivate).not.toHaveBeenCalled();
  });

  it('reactivates the user when confirmed', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    usersStoreFake.users.set([inactiveUser]);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onActivate(inactiveUser);

    expect(usersStoreFake.activate).toHaveBeenCalledWith('u2', jasmine.any(Function));
  });

  it('shows a success toast when reactivating', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    usersStoreFake.users.set([inactiveUser]);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onActivate(inactiveUser);
    const onSuccess = usersStoreFake.activate.calls.mostRecent().args[1];
    onSuccess();

    expect(toastServiceFake.show).toHaveBeenCalledWith('Acesso de "João Santos" reativado.');
  });

  it('does not reactivate the user when the confirmation is canceled', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(false));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onActivate(inactiveUser);

    expect(usersStoreFake.activate).not.toHaveBeenCalled();
  });

  it('shows "Reativar" for an inactive user and "Desativar" for an active one', async () => {
    usersStoreFake.users.set([activeUser, inactiveUser]);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Desativar');
    expect(text).toContain('Reativar');
    expect(fixture.nativeElement.querySelector('.dropdown-item.text-danger')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.dropdown-item.text-success')).not.toBeNull();
  });

  it('truly disables the Desativar button while the mutation is in progress', async () => {
    usersStoreFake.deactivatingIds.set(['u1']);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('.dropdown-item.text-danger') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
  });

  it('does not disable another user is Desativar button while only one is in progress', async () => {
    const activeUser2: UserSummary = { ...activeUser, id: 'u3', firstName: 'Ana', lastName: 'Costa' };
    usersStoreFake.users.set([activeUser, activeUser2]);
    usersStoreFake.deactivatingIds.set(['u1']);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const buttons = fixture.nativeElement.querySelectorAll('.dropdown-item.text-danger') as NodeListOf<HTMLButtonElement>;
    expect(buttons[0].disabled).toBeTrue();
    expect(buttons[1].disabled).toBeFalse();
  });

  it('shows neither Desativar nor Reativar for the logged-in account itself', async () => {
    sessionServiceFake.userId.and.returnValue('u1');
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.dropdown-item.text-danger')).toBeNull();
    expect(fixture.nativeElement.querySelector('.dropdown-item.text-success')).toBeNull();
  });

  it('only shows the batch selection checkbox for active users other than the logged-in account itself', async () => {
    const activeUser2: UserSummary = { ...activeUser, id: 'u3', firstName: 'Ana', lastName: 'Costa' };
    sessionServiceFake.userId.and.returnValue('u3');
    usersStoreFake.users.set([activeUser, inactiveUser, activeUser2]);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance.canSelectForBulk(activeUser)).toBeTrue();
    expect(fixture.componentInstance.canSelectForBulk(inactiveUser)).toBeFalse();
    expect(fixture.componentInstance.canSelectForBulk(activeUser2)).toBeFalse();
  });

  it('checks and unchecks users in the batch selection', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.toggleSelection('u1', true);
    expect(fixture.componentInstance.selectedUserIds().has('u1')).toBeTrue();
    expect(fixture.componentInstance.selectedCount()).toBe(1);

    fixture.componentInstance.toggleSelection('u1', false);
    expect(fixture.componentInstance.selectedUserIds().has('u1')).toBeFalse();
    expect(fixture.componentInstance.selectedCount()).toBe(0);
  });

  it('"selecionar todos" checks only the eligible ones on the page, and becomes indeterminate with a partial selection', async () => {
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

  it('clears the batch selection when any filter changes', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.toggleSelection('u1', true);
    expect(fixture.componentInstance.selectedCount()).toBe(1);

    usersStoreFake.filters.set({ status: 'Inactive', page: 1, pageSize: 20 });
    await fixture.whenStable();

    expect(fixture.componentInstance.selectedCount()).toBe(0);
  });

  it('asks for confirmation and deactivates the selected users in batch', async () => {
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

  it('does not deactivate in batch when the confirmation is canceled', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(false));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.toggleSelection('u1', true);
    fixture.componentInstance.onBulkDeactivate();

    expect(usersStoreFake.deactivateMany).not.toHaveBeenCalled();
  });

  it('does nothing when the batch deactivation is called with no selection', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onBulkDeactivate();

    expect(confirmDialogServiceFake.confirm).not.toHaveBeenCalled();
    expect(usersStoreFake.deactivateMany).not.toHaveBeenCalled();
  });

  it('clears the selection and shows a toast when the batch deactivation completes without failures', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.toggleSelection('u1', true);
    fixture.componentInstance.onBulkDeactivate();
    const onDone = usersStoreFake.deactivateMany.calls.mostRecent().args[1];
    onDone(['u1'], 0);

    expect(fixture.componentInstance.selectedCount()).toBe(0);
    expect(toastServiceFake.show).toHaveBeenCalledWith('1 usuário desativado.', 'success', { label: 'Desfazer', run: jasmine.any(Function) });
  });

  it('the batch "Desfazer" reactivates only those just deactivated', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.toggleSelection('u1', true);
    fixture.componentInstance.onBulkDeactivate();
    usersStoreFake.deactivateMany.calls.mostRecent().args[1](['u1'], 1);
    (toastServiceFake.show.calls.mostRecent().args[2] as { run: () => void }).run();

    expect(usersStoreFake.activateMany).toHaveBeenCalledWith(['u1'], jasmine.any(Function));
  });

  it('shows a toast reporting a partial failure in the batch deactivation, still with "Desfazer"', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.toggleSelection('u1', true);
    fixture.componentInstance.onBulkDeactivate();
    const onDone = usersStoreFake.deactivateMany.calls.mostRecent().args[1];
    onDone(['u1'], 1);

    expect(toastServiceFake.show).toHaveBeenCalledWith('1 de 2 usuários desativados.', 'info', { label: 'Desfazer', run: jasmine.any(Function) });
  });

  it('warns in the batch confirmation how many open tickets the selected users handle', async () => {
    usersStoreFake.countOpenAssignedTicketsMany.and.callFake((_ids: string[], onDone: (r: { tickets: number; people: number }) => void) => onDone({ tickets: 5, people: 2 }));
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.toggleSelection('u1', true);
    fixture.componentInstance.onBulkDeactivate();
    const options = confirmDialogServiceFake.confirm.calls.mostRecent().args[0] as { message: string };

    expect(usersStoreFake.countOpenAssignedTicketsMany).toHaveBeenCalledWith(['u1'], jasmine.any(Function));
    expect(options.message).toContain('2 dessas pessoas atendem 5 chamados em aberto, que continuam atribuídos');
    expect(options.message).toContain('reatribua em Monitorar Chamados');
  });

  it('lists up to 8 names in the batch confirmation and summarizes the rest as "e mais N"', async () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ ...activeUser, id: `m${i}`, firstName: `Pessoa${i}`, lastName: 'Teste' }));
    usersStoreFake.users.set(many);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.toggleSelectAll(true);
    fixture.componentInstance.onBulkDeactivate();
    const options = confirmDialogServiceFake.confirm.calls.mostRecent().args[0] as { message: string };

    expect(options.message).toContain('Pessoa7 Teste e mais 2');
    expect(options.message).not.toContain('Pessoa9');
  });

  it('shows the batch action bar only when there is an active selection', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.bulk-actions-bar')).toBeNull();

    fixture.componentInstance.toggleSelection('u1', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.bulk-actions-bar')).not.toBeNull();
  });

  it('shows the deactivation date inside the registration cell, only when the user was deactivated', async () => {
    usersStoreFake.users.set([activeUser, inactiveUser]);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect((rows[0] as HTMLElement).textContent).not.toContain('Desativado em');
    expect((rows[1] as HTMLElement).textContent).toContain('Desativado em');
    expect((rows[1] as HTMLElement).textContent).toContain('01/02/2026');
  });

  it('marks the row of an inactive user without fading it with opacity (which would drop the contrast)', async () => {
    usersStoreFake.users.set([inactiveUser]);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector('tbody tr') as HTMLTableRowElement;
    expect(row.classList).toContain('user-row-inactive');
    expect(row.classList).not.toContain('opacity-75');
  });

  it('does not mark the row of an active user as inactive', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector('tbody tr') as HTMLTableRowElement;
    expect(row.classList).not.toContain('user-row-inactive');
  });

  it('shows a distinct message when the list is empty because of the filters', async () => {
    usersStoreFake.users.set([]);
    usersStoreFake.total.set(0);
    usersStoreFake.filters.set({ status: 'Inactive', page: 1, pageSize: 20 });
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Nenhum usuário encontrado com esses filtros.');
  });

  it('offers "Limpar filtros" in the filter-caused empty state, and clears when clicked', async () => {
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

  it('offers "Novo Usuário" in the first-use empty state', async () => {
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

  it('offers reloading the list when loading fails, in a neutral notice (a technical failure is not a risk)', async () => {
    usersStoreFake.listState.set({ loading: false, error: 'Erro ao carregar usuários' });
    usersStoreFake.listLoadFailed.set(true);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();
    usersStoreFake.loadAll.calls.reset();

    expect(fixture.nativeElement.querySelector('.alert-danger')).toBeNull();
    const alert = fixture.nativeElement.querySelector('.alert-secondary') as HTMLElement;
    expect(alert.textContent).toContain('Erro ao carregar usuários');
    (alert.querySelector('button') as HTMLButtonElement).click();

    expect(usersStoreFake.loadAll).toHaveBeenCalled();
  });

  it('does not turn the load failure into "Nenhum usuário cadastrado ainda"', async () => {
    usersStoreFake.users.set([]);
    usersStoreFake.total.set(0);
    usersStoreFake.listState.set({ loading: false, error: 'Erro ao carregar usuários' });
    usersStoreFake.listLoadFailed.set(true);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Nenhum usuário cadastrado ainda');
    expect(fixture.nativeElement.querySelector('.empty-state')).toBeNull();
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('A lista não carregou');
  });

  it('marks the own account with "Você", explains why it has no checkbox and removes Desativar from the ⋮', async () => {
    usersStoreFake.users.set([{ ...activeUser, id: 'admin-id' }]);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector('tbody tr') as HTMLElement;
    expect(row.querySelector('.badge.bg-label-primary')?.textContent).toContain('Você');
    expect(row.querySelector('.col-select input')).toBeNull();
    expect(row.querySelector('.col-select .visually-hidden')?.textContent).toContain('Sua conta não entra na desativação em lote');
    expect(row.textContent).toContain('Sua própria conta não pode ser desativada.');
    expect(row.querySelector('.dropdown-item.text-danger')).toBeNull();
  });

  it('gives mobile a visible "selecionar todos" (the table header is hidden there)', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    const mobile = fixture.nativeElement.querySelector('.select-all-mobile') as HTMLElement;
    expect(mobile.textContent).toContain('Selecionar todos desta página');
    (mobile.querySelector('input') as HTMLInputElement).click();

    expect(fixture.componentInstance.selectedUserIds().has('u1')).toBeTrue();
  });

  it('links each row is ⋮ to the id (to return focus) and shows a spinner while counting the tickets', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    usersStoreFake.countingTicketsIds.set(['u1']);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[data-row-actions="u1"] .spinner-border')).not.toBeNull();
  });

  it('says "Convite expirado" with the resend path when the invitation has expired', async () => {
    usersStoreFake.users.set([{ ...activeUser, pendingActivation: true, invitationExpiresAtUtc: null }]);
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.invitation-expired').textContent).toContain('Convite expirado: reenvie pelo ⋮');
  });

  it('does not apply an inverted period and explains the problem below the fields', async () => {
    usersStoreFake.filters.set({ status: 'All', createdTo: '2026-01-10', page: 1, pageSize: 20 });
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onCreatedFromChange('2026-02-01');
    await fixture.whenStable();

    expect(usersStoreFake.setPeriod).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#userPeriod-error')?.textContent).toContain('anterior à data final');
    expect(fixture.nativeElement.querySelector('#userCreatedFrom').getAttribute('aria-invalid')).toBe('true');
  });

  it('applies the period and removes the error when it becomes consistent again', async () => {
    usersStoreFake.filters.set({ status: 'All', createdTo: '2026-01-10', page: 1, pageSize: 20 });
    const fixture = TestBed.createComponent(UserListComponent);
    await fixture.whenStable();
    fixture.componentInstance.onCreatedFromChange('2026-02-01');

    fixture.componentInstance.onCreatedFromChange('2026-01-05');
    await fixture.whenStable();

    expect(usersStoreFake.setPeriod).toHaveBeenCalledWith('2026-01-05', '2026-01-10');
    expect(fixture.nativeElement.querySelector('#userPeriod-error')).toBeNull();
  });

  it('locks closing the edit dialog while saving (the X is disabled)', async () => {
    const fixture = TestBed.createComponent(UserListComponent);
    fixture.componentInstance.openEditModal(activeUser);
    usersStoreFake.updatingProfile.set(true);
    await fixture.whenStable();

    expect((fixture.nativeElement.querySelector('#userEditModal .btn-close') as HTMLButtonElement).disabled).toBeTrue();
  });
});
