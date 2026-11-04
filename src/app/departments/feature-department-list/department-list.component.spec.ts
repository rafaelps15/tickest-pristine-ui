import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { of } from 'rxjs';
import { DepartmentListComponent } from './department-list.component';
import { DepartmentsStore } from '../application/departments.store';
import { Department, DepartmentDetail } from '../entities/department';
import { ConfirmDialogService, SessionService, ToastService } from '../../shared';
import { UserSummary } from '../../users';

describe('DepartmentListComponent', () => {
  const informationTechnology: Department = {
    id: 'dep-1',
    name: 'TI',
    description: 'Tecnologia da Informação',
    responsibleUserName: null,
    sectors: [
      { id: 'sec-1', name: 'Helpdesk', description: 'Suporte do dia a dia' },
      { id: 'sec-2', name: 'Infraestrutura', description: null }
    ]
  };
  const commercial: Department = {
    id: 'dep-2',
    name: 'Comercial',
    description: 'Vendas e clientes',
    responsibleUserName: null,
    sectors: []
  };
  /** TI com responsável: só assim a edição busca o id do responsável atual (GET do detalhe). */
  const itWithResponsible: Department = { ...informationTechnology, responsibleUserName: 'Carlos Souza' };

  /** Card do departamento pelo id — a lista põe os sem setor primeiro, então a posição não é a da fixture. */
  function cardOf(root: HTMLElement, departmentId: string): HTMLElement {
    return root.querySelector(`section.card[data-item-id="${departmentId}"]`) as HTMLElement;
  }

  const candidate: UserSummary = {
    id: 'u-1', email: 'carlos@empresa.com', firstName: 'Carlos', lastName: 'Souza',
    roles: [], isActive: true, createdAtUtc: '2026-01-01T12:00:00Z', deactivatedAtUtc: null, pendingActivation: false, invitationExpiresAtUtc: null
  };

  /** Cria um store falso com signals reais, para o template reagir como no store verdadeiro. */
  function createStoreFake() {
    return {
      departments: signal<Department[]>([informationTechnology, commercial]),
      listState: signal({ loading: false, error: null as string | null }),
      mutationError: signal<string | null>(null),
      mutating: signal(false),
      deletingId: signal<string | null>(null),
      deleteError: signal<{ targetId: string; message: string } | null>(null),
      clearDeleteError: jasmine.createSpy('clearDeleteError'),
      responsibleCandidates: signal<UserSummary[]>([]),
      searchingResponsible: signal(false),
      responsibleSearchTerm: signal<string | null>(null),
      responsibleSearchError: signal<string | null>(null),
      load: jasmine.createSpy('load'),
      create: jasmine.createSpy('create'),
      update: jasmine.createSpy('update'),
      delete: jasmine.createSpy('delete'),
      createSector: jasmine.createSpy('createSector'),
      updateSector: jasmine.createSpy('updateSector'),
      deleteSector: jasmine.createSpy('deleteSector'),
      clearMutationError: jasmine.createSpy('clearMutationError'),
      getDepartmentDetail: jasmine.createSpy('getDepartmentDetail'),
      searchResponsibleCandidates: jasmine.createSpy('searchResponsibleCandidates'),
      clearResponsibleSearch: jasmine.createSpy('clearResponsibleSearch')
    };
  }

  let storeFake: ReturnType<typeof createStoreFake>;
  let permissions: Set<string>;
  let confirmDialogServiceFake: jasmine.SpyObj<ConfirmDialogService>;

  beforeEach(async () => {
    storeFake = createStoreFake();
    permissions = new Set(['departments:manage', 'sectors:manage']);
    confirmDialogServiceFake = jasmine.createSpyObj('ConfirmDialogService', ['confirm']);
    confirmDialogServiceFake.confirm.and.returnValue(of(true));

    await TestBed.configureTestingModule({
      imports: [DepartmentListComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: DepartmentsStore, useValue: storeFake },
        { provide: SessionService, useValue: { hasPermission: (code: string) => permissions.has(code) } },
        { provide: ConfirmDialogService, useValue: confirmDialogServiceFake }
      ]
    }).compileComponents();
  });

  it('loads the departments on initialization', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    expect(storeFake.load).toHaveBeenCalled();
  });

  it('a load failure shows only the error with "Tentar novamente", never the "no department" state', async () => {
    storeFake.departments.set([]);
    storeFake.listState.set({ loading: false, error: 'Falha no servidor' });
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Falha no servidor');
    expect(text).toContain('Tentar novamente');
    expect(text).not.toContain('Nenhum departamento cadastrado ainda.');
    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeNull();
    // Falha técnica é neutra: vermelho fica pro risco operacional (DESIGN.md).
    expect(fixture.nativeElement.querySelector('.alert-danger, .btn-outline-danger')).toBeNull();
    expect(fixture.nativeElement.querySelector('.department-load-error .btn-outline-secondary')).not.toBeNull();
  });

  it('shows the sectors inside the department card', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    const itCard = cardOf(fixture.nativeElement, 'dep-1');
    expect(itCard.textContent).toContain('TI');
    expect(itCard.textContent).toContain('Helpdesk');
    expect(itCard.textContent).toContain('Infraestrutura');
    expect(itCard.textContent).toContain('2 setores');
    expect(cardOf(fixture.nativeElement, 'dep-2').textContent).toContain('Nenhum setor ainda');
  });

  it('puts departments with no sector first (the ones that disappear from ticket opening)', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    const ids = Array.from(fixture.nativeElement.querySelectorAll('section.card') as NodeListOf<HTMLElement>)
      .map(card => card.getAttribute('data-item-id'));
    expect(ids).toEqual(['dep-2', 'dep-1']);
  });

  it('highlights the sector that matched the search', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.searchInput.set('help');
    fixture.detectChanges();
    await fixture.whenStable();

    const helpdesk = fixture.nativeElement.querySelector('[data-item-id="sec-1"]') as HTMLElement;
    const infra = fixture.nativeElement.querySelector('[data-item-id="sec-2"]') as HTMLElement;
    expect(helpdesk.classList).toContain('sector-match');
    expect(helpdesk.textContent).toContain('(encontrado pela busca)');
    expect(infra.classList).not.toContain('sector-match');
  });

  it('the card title is just the name (the sector badge stays outside the h2) and labels the section', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    const card = cardOf(fixture.nativeElement, 'dep-1');
    const heading = card.querySelector('h2')!;
    expect(heading.textContent?.trim()).toBe('TI');
    expect(card.getAttribute('aria-labelledby')).toBe(heading.id);
  });

  it('highlights in amber the department with no sector and says when there is no assignee', async () => {
    permissions = new Set(['sectors:manage']);
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    const itCard = cardOf(fixture.nativeElement, 'dep-1');
    const commercialCard = cardOf(fixture.nativeElement, 'dep-2');
    expect(itCard.querySelector('.badge')!.classList).toContain('bg-label-secondary');
    expect(commercialCard.querySelector('.badge')!.classList).toContain('bg-label-warning');
    expect(commercialCard.textContent).toContain('Sem responsável');
  });

  it('for those who manage departments, "Definir responsável" on the card opens the edit with focus on the assignee search', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    const card = cardOf(fixture.nativeElement, 'dep-1');
    const button = Array.from(card.querySelectorAll('button')).find(b => b.textContent?.includes('Definir responsável'))!;
    expect(button.getAttribute('aria-label')).toBe('Definir responsável de TI');
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.editingDepartment()).toEqual(informationTechnology);
    const search = document.querySelector('#departmentResponsibleSearch') as HTMLElement;
    expect(search.hasAttribute('data-dialog-focus')).toBeTrue();
  });

  it('the "Editar departamento" item of the "⋮" does not move focus to the assignee search', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(informationTechnology);
    fixture.detectChanges();
    await fixture.whenStable();

    expect((document.querySelector('#departmentResponsibleSearch') as HTMLElement).hasAttribute('data-dialog-focus')).toBeFalse();
  });

  it('the region that announces "Mostrando X de Y" already exists before the filter, so the screen reader announces the change', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    const live = fixture.nativeElement.querySelector('[aria-live="polite"]') as HTMLElement;
    expect(live).not.toBeNull();
    expect(live.textContent?.trim()).toBe('');

    fixture.componentInstance.issueFilter.set('withoutSectors');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[aria-live="polite"]')).toBe(live);
    expect(live.textContent).toContain('Mostrando 1 de 2 departamentos.');
  });

  it('after the last department of the filtered problem is fixed, the filter clears itself and a toast announces it', async () => {
    const toast = TestBed.inject(ToastService);
    spyOn(toast, 'show');
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.issueFilter.set('withoutSectors');
    fixture.detectChanges();
    await fixture.whenStable();

    const fixed = { ...commercial, sectors: [{ id: 'sec-9', name: 'Vendas', description: null }] };
    storeFake.departments.set([informationTechnology, fixed]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.issueFilter()).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('section.card').length).toBe(2);
    expect(toast.show).toHaveBeenCalledWith('Todos os departamentos têm setor agora.');
  });

  it('when the reload fails (empty list), the problem filter stays and no toast says everything was fixed', async () => {
    const toast = TestBed.inject(ToastService);
    spyOn(toast, 'show');
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.issueFilter.set('withoutSectors');
    fixture.detectChanges();
    await fixture.whenStable();

    storeFake.departments.set([]);
    storeFake.listState.set({ loading: false, error: 'Falha no servidor' });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.issueFilter()).toBe('withoutSectors');
    expect(toast.show).not.toHaveBeenCalled();
  });

  it('filters by the problem chosen in the Resumo and says how many are left; "Limpar filtros" goes back to all', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.issueFilter.set('withoutSectors');
    fixture.detectChanges();
    await fixture.whenStable();

    const cards = fixture.nativeElement.querySelectorAll('section.card') as NodeListOf<HTMLElement>;
    expect(cards.length).toBe(1);
    expect(cards[0].querySelector('h2')!.textContent).toContain('Comercial');
    expect(fixture.nativeElement.textContent).toContain('Mostrando 1 de 2 departamentos.');

    fixture.componentInstance.clearFilters();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('section.card').length).toBe(2);
  });

  it('the "Salvar" button says "Salvando…" during the mutation, with the spinner purely decorative', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();
    fixture.componentInstance.openCreateModal();
    storeFake.mutating.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('#departmentModal button[type="submit"]') as HTMLButtonElement;
    expect(button.textContent?.trim()).toBe('Salvando…');
    expect(button.querySelector('.spinner-border')!.getAttribute('aria-hidden')).toBe('true');
    expect(button.querySelector('[role="status"]')).toBeNull();
  });

  it('announces how many assignee candidates the search found, in a live region that already existed', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();
    fixture.componentInstance.openCreateModal();
    fixture.detectChanges();
    await fixture.whenStable();
    const status = fixture.nativeElement.querySelector('#departmentModal .visually-hidden[role="status"]') as HTMLElement;
    expect(status).not.toBeNull();

    fixture.componentInstance.responsibleSearchInput.set('carlos');
    storeFake.responsibleSearchTerm.set('carlos');
    storeFake.responsibleCandidates.set([candidate]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#departmentModal .visually-hidden[role="status"]')).toBe(status);
    expect(status.textContent?.trim()).toBe('1 usuário encontrado.');
  });

  it('while the assignee search has not responded for the typed text, it says "Buscando", never "Nenhum usuário encontrado"', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();
    fixture.componentInstance.openCreateModal();
    fixture.componentInstance.responsibleSearchInput.set('carl');
    storeFake.responsibleSearchTerm.set('car');
    fixture.detectChanges();
    await fixture.whenStable();

    const modal = fixture.nativeElement.querySelector('#departmentModal') as HTMLElement;
    expect(modal.textContent).toContain('Buscando usuários…');
    expect(modal.textContent).not.toContain('Nenhum usuário encontrado.');
  });

  it('filters by departments with no assignee', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.issueFilter.set('withoutResponsible');

    expect(fixture.componentInstance.filteredDepartments().map(d => d.id)).toEqual(['dep-2', 'dep-1']);
  });

  it('filters by the department name', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.searchInput.set('comercial');

    expect(fixture.componentInstance.filteredDepartments()).toEqual([commercial]);
  });

  it('filters by the name of a sector, keeping the department even if its own name does not match', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.searchInput.set('helpdesk');

    expect(fixture.componentInstance.filteredDepartments()).toEqual([informationTechnology]);
  });

  it('shows a distinct message when the search finds nothing', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.searchInput.set('inexistente');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Nenhum departamento ou setor encontrado para "inexistente".');
  });

  it('when opening the edit modal, shows the already known assignee name and fetches their id', async () => {
    const withResponsible: Department = { ...informationTechnology, responsibleUserName: 'Carlos Souza' };
    const detail: DepartmentDetail = { id: 'dep-1', name: 'TI', description: 'Tecnologia da Informação', responsibleUserId: 'u-1' };
    storeFake.getDepartmentDetail.and.callFake((_id: string, onLoaded: (d: DepartmentDetail) => void) => onLoaded(detail));
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(withResponsible);

    expect(fixture.componentInstance.selectedResponsibleName()).toBe('Carlos Souza');
    expect(storeFake.getDepartmentDetail).toHaveBeenCalledWith('dep-1', jasmine.any(Function), jasmine.any(Function));
    expect(fixture.componentInstance.selectedResponsibleId()).toBe('u-1');
    expect(fixture.componentInstance.loadingCurrentResponsible()).toBeFalse();
  });

  it('ignores the late response for a department if the admin has already switched to another before it arrived', async () => {
    const departmentA: Department = { ...informationTechnology, id: 'dep-a', responsibleUserName: 'Carlos Souza' };
    const departmentB: Department = { ...commercial, id: 'dep-b', responsibleUserName: 'Beatriz Lima' };
    const detailA: DepartmentDetail = { id: 'dep-a', name: 'TI', description: '', responsibleUserId: 'u-carlos' };
    let resolveA!: (detail: DepartmentDetail) => void;
    storeFake.getDepartmentDetail.and.callFake((id: string, onLoaded: (d: DepartmentDetail) => void) => {
      if (id === 'dep-a') resolveA = onLoaded;
    });
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(departmentA);
    fixture.componentInstance.openEditModal(departmentB);
    resolveA(detailA);

    expect(fixture.componentInstance.editingDepartment()?.id).toBe('dep-b');
    expect(fixture.componentInstance.selectedResponsibleId()).toBeNull();
    expect(fixture.componentInstance.selectedResponsibleName()).toBe('Beatriz Lima');
  });

  it('selects a candidate from the search as assignee, and clears the search', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.responsibleSearchInput.set('carlos');
    fixture.componentInstance.onSelectResponsible(candidate);

    expect(fixture.componentInstance.selectedResponsibleId()).toBe('u-1');
    expect(fixture.componentInstance.selectedResponsibleName()).toBe('Carlos Souza');
    expect(fixture.componentInstance.responsibleSearchInput()).toBe('');
    expect(storeFake.clearResponsibleSearch).toHaveBeenCalled();
  });

  it('removes the selected assignee, going back to "sem responsável"', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onSelectResponsible(candidate);
    fixture.componentInstance.onClearResponsible();

    expect(fixture.componentInstance.selectedResponsibleId()).toBeNull();
    expect(fixture.componentInstance.selectedResponsibleName()).toBeNull();
  });

  it('the "Salvar" button of the department modal stays disabled while the current assignee loads, and says why', async () => {
    storeFake.getDepartmentDetail.and.callFake(() => {});
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(itWithResponsible);
    fixture.detectChanges();
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('#departmentModal button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
    expect(button.getAttribute('aria-describedby')).toBe('departmentResponsibleStatus');
    expect(document.getElementById('departmentResponsibleStatus')?.textContent).toContain('Carregando responsável atual');
  });

  it('editing a department with no assignee does not fetch the detail and enables "Salvar alterações" right away', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(informationTechnology);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(storeFake.getDepartmentDetail).not.toHaveBeenCalled();
    const button = fixture.nativeElement.querySelector('#departmentModal button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeFalse();
    expect(button.textContent?.trim()).toBe('Salvar alterações');
  });

  it('when the current assignee fails to load, "Remover responsável" enables "Salvar" and saves with no assignee', async () => {
    storeFake.getDepartmentDetail.and.callFake((_id: string, _onLoaded: unknown, onError: (m: string) => void) => onError('falhou'));
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(itWithResponsible);
    fixture.detectChanges();
    await fixture.whenStable();

    const modal = fixture.nativeElement.querySelector('#departmentModal') as HTMLElement;
    const remove = [...modal.querySelectorAll('button')].find(b => b.textContent?.includes('Remover responsável'))!;
    remove.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect((modal.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBeFalse();
    fixture.componentInstance.onSubmit();
    expect(storeFake.update).toHaveBeenCalledWith('dep-1', jasmine.objectContaining({ responsibleUserId: undefined }), jasmine.any(Function));
  });

  it('closing the dialog discards its save error (it does not linger on screen)', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();
    fixture.componentInstance.openCreateModal();
    storeFake.clearMutationError.calls.reset();

    fixture.componentInstance.closeDialog();

    expect(storeFake.clearMutationError).toHaveBeenCalled();
  });

  it('the submit buttons state the action: "Criar departamento" and "Criar setor"', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openCreateModal();
    fixture.detectChanges();
    await fixture.whenStable();
    expect((fixture.nativeElement.querySelector('#departmentModal button[type="submit"]') as HTMLElement).textContent?.trim()).toBe('Criar departamento');

    fixture.componentInstance.closeDialog();
    fixture.componentInstance.openCreateSectorModal(commercial);
    fixture.detectChanges();
    await fixture.whenStable();
    expect((fixture.nativeElement.querySelector('#sectorModal button[type="submit"]') as HTMLElement).textContent?.trim()).toBe('Criar setor');
  });

  it('"Criar e adicionar outro" creates the sector and leaves the dialog open and clean, saying what it created', async () => {
    const toast = TestBed.inject(ToastService);
    spyOn(toast, 'show');
    storeFake.createSector.and.callFake((_data: unknown, onSuccess: (id: string) => void) => onSuccess('sec-novo'));
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.openCreateSectorModal(commercial);
    component.sectorForm.setValue({ name: 'Vendas', description: '' });
    fixture.detectChanges();
    await fixture.whenStable();
    const addAnother = [...(fixture.nativeElement.querySelectorAll('#sectorModal button') as NodeListOf<HTMLButtonElement>)]
      .find(b => b.textContent?.includes('Criar e adicionar outro'))!;
    addAnother.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(storeFake.createSector).toHaveBeenCalledWith(jasmine.objectContaining({ name: 'Vendas', departmentId: 'dep-2' }), jasmine.any(Function));
    expect(fixture.nativeElement.querySelector('#sectorModal')).not.toBeNull();
    expect(component.sectorForm.value.name).toBe('');
    expect(component.highlightedId()).toBe('sec-novo');
    const status = fixture.nativeElement.querySelector('#sectorModal [role="status"]') as HTMLElement;
    expect(status.textContent).toContain('Setor "Vendas" criado em Comercial. Cadastre o próximo.');
    expect(toast.show).not.toHaveBeenCalled();
  });

  it('when the current assignee fails to load, ends the loading and shows the error in the modal with "Tentar de novo"', async () => {
    storeFake.getDepartmentDetail.and.callFake((_id: string, _onLoaded: unknown, onError: (m: string) => void) =>
      onError('Não foi possível carregar o responsável atual.'));
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(itWithResponsible);
    fixture.detectChanges();
    await fixture.whenStable();

    const modal = fixture.nativeElement.querySelector('#departmentModal') as HTMLElement;
    expect(fixture.componentInstance.loadingCurrentResponsible()).toBeFalse();
    expect(modal.textContent).toContain('Não foi possível carregar o responsável atual.');
    expect(modal.querySelector('.spinner-border')).toBeNull();
    // Salvar sem saber o responsável o apagaria (o PUT grava o que for enviado).
    expect((modal.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBeTrue();

    const retry = [...modal.querySelectorAll('button')].find(b => b.textContent?.includes('Tentar de novo'))!;
    retry.click();
    expect(storeFake.getDepartmentDetail).toHaveBeenCalledTimes(2);
  });

  it('enables "Salvar" after the failure when the admin picks another assignee, and sends that one', async () => {
    storeFake.getDepartmentDetail.and.callFake((_id: string, _onLoaded: unknown, onError: (m: string) => void) => onError('falhou'));
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(itWithResponsible);
    fixture.componentInstance.onSelectResponsible(candidate);
    fixture.detectChanges();
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('#departmentModal button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeFalse();
    expect(fixture.componentInstance.currentResponsibleError()).toBeNull();

    fixture.componentInstance.onSubmit();
    expect(storeFake.update).toHaveBeenCalledWith('dep-1', jasmine.objectContaining({ responsibleUserId: 'u-1' }), jasmine.any(Function));
  });

  it('does not save while the current assignee is unknown, even when calling submit directly', async () => {
    storeFake.getDepartmentDetail.and.callFake(() => {});
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(itWithResponsible);
    fixture.componentInstance.onSubmit();

    expect(storeFake.update).not.toHaveBeenCalled();
  });

  it('the admin choice made while loading wins over the assignee that arrives later', async () => {
    let resolve!: (detail: DepartmentDetail) => void;
    storeFake.getDepartmentDetail.and.callFake((_id: string, onLoaded: (d: DepartmentDetail) => void) => { resolve = onLoaded; });
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(itWithResponsible);
    fixture.componentInstance.onSelectResponsible(candidate);
    resolve({ id: 'dep-1', name: 'TI', description: '', responsibleUserId: 'u-outro' });

    expect(fixture.componentInstance.selectedResponsibleId()).toBe('u-1');
    expect(fixture.componentInstance.loadingCurrentResponsible()).toBeFalse();
  });

  it('the "Salvar" button of the department modal stays disabled during the mutation, not because of an invalid form', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();
    fixture.componentInstance.openCreateModal();
    fixture.detectChanges();
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('#departmentModal button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeFalse();

    storeFake.mutating.set(true);
    fixture.detectChanges();
    expect(button.disabled).toBeTrue();
  });

  it('shows the right error message for the department name, by validation type', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();
    fixture.componentInstance.openCreateModal();
    const name = fixture.componentInstance.form.controls.name;

    name.setValue('');
    name.markAsTouched();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('O nome é obrigatório.');
  });

  it('includes the selected assignee when creating a department', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.openCreateModal();
    component.onSelectResponsible(candidate);
    component.form.setValue({ name: 'Operações', description: 'Logística' });
    component.onSubmit();

    expect(storeFake.create).toHaveBeenCalledWith(
      { name: 'Operações', description: 'Logística', responsibleUserId: 'u-1' },
      jasmine.any(Function)
    );
  });

  it('after creating, the toast offers "Adicionar setor" and opens the sector modal on the new department', async () => {
    storeFake.create.and.callFake((_data: unknown, onSuccess: (id: string) => void) => onSuccess('dep-novo'));
    const toast = TestBed.inject(ToastService);
    spyOn(toast, 'show');
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.openCreateModal();
    component.form.setValue({ name: 'Operações', description: 'Logística' });
    component.onSubmit();

    const [message, variant, action] = (toast.show as jasmine.Spy).calls.mostRecent().args;
    expect(message).toContain('Departamento "Operações" criado.');
    expect(variant).toBe('success');
    expect(action.label).toBe('Adicionar setor');
    expect(component['openDialog']()).toBeNull();

    action.run();
    expect(component['openDialog']()).toBe('sector');
    expect(component.sectorDepartment()?.id).toBe('dep-novo');
    expect(component.sectorDepartment()?.name).toBe('Operações');
  });

  it('sends responsibleUserId undefined when saving with no assignee selected', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.openCreateModal();
    component.form.setValue({ name: 'Operações', description: 'Logística' });
    component.onSubmit();

    expect(storeFake.create).toHaveBeenCalledWith(
      { name: 'Operações', description: 'Logística', responsibleUserId: undefined },
      jasmine.any(Function)
    );
  });

  it('creates the sector in the department of the card where the modal was opened', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.openCreateSectorModal(commercial);
    component.sectorForm.setValue({ name: '  Vendas  ', description: '' });
    component.onSubmitSector();

    expect(storeFake.clearMutationError).toHaveBeenCalled();
    expect(storeFake.createSector).toHaveBeenCalledWith(
      { name: 'Vendas', description: undefined, departmentId: 'dep-2' },
      jasmine.any(Function)
    );
  });

  it('updates the sector being edited without changing the department', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.openEditSectorModal(informationTechnology, informationTechnology.sectors[0]);
    component.sectorForm.controls.name.setValue('Service Desk');
    component.onSubmitSector();

    expect(storeFake.updateSector).toHaveBeenCalledWith(
      'sec-1',
      { name: 'Service Desk', description: 'Suporte do dia a dia' },
      jasmine.any(Function)
    );
  });

  it('warns that the sectors go away along with the department when deleting it', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDelete(informationTechnology);

    const options = confirmDialogServiceFake.confirm.calls.mostRecent().args[0];
    expect(options.message).toContain('Os 2 setores dele também serão excluídos.');
    expect(options.message).toContain('Se algum setor tiver chamados em andamento, a exclusão é recusada.');
    expect(options.confirmLabel).toBe('Excluir departamento e 2 setores');
    expect(storeFake.delete).toHaveBeenCalledWith('dep-1', jasmine.any(Function), jasmine.any(Function));
  });

  it('the delete button of a department without sectors does not mention sectors', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDelete({ ...informationTechnology, sectors: [] });

    expect(confirmDialogServiceFake.confirm.calls.mostRecent().args[0].confirmLabel).toBe('Excluir departamento');
  });

  it('confirms the department deletion with a toast on success', async () => {
    storeFake.delete.and.callFake((_id: string, onSuccess: () => void) => onSuccess());
    const toast = TestBed.inject(ToastService);
    spyOn(toast, 'show');
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDelete(informationTechnology);

    expect(toast.show).toHaveBeenCalledWith('Departamento "TI" excluído.');
  });

  it('deletes the confirmed sector, with a toast', async () => {
    storeFake.deleteSector.and.callFake((_id: string, onSuccess: () => void) => onSuccess());
    const toast = TestBed.inject(ToastService);
    spyOn(toast, 'show');
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeleteSector(informationTechnology, informationTechnology.sectors[1]);

    expect(storeFake.deleteSector).toHaveBeenCalledWith('sec-2', jasmine.any(Function), jasmine.any(Function));
    expect(confirmDialogServiceFake.confirm.calls.mostRecent().args[0].confirmLabel).toBe('Excluir setor');
    expect(toast.show).toHaveBeenCalledWith('Setor "Infraestrutura" excluído de TI.');
  });

  it('shows the deletion failure on the card of the department that owns the sector, and closes on the X', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    storeFake.deleteError.set({ targetId: 'sec-2', message: 'O setor tem chamados em aberto ou em andamento.' });
    fixture.detectChanges();
    await fixture.whenStable();

    const cards = fixture.nativeElement.querySelectorAll('.card') as NodeListOf<HTMLElement>;
    const itCard = [...cards].find(c => c.querySelector('h2')?.textContent?.includes('TI'))!;
    const otherCard = [...cards].find(c => c.querySelector('h2') && !c.querySelector('h2')!.textContent!.includes('TI'))!;
    expect(itCard.querySelector('.alert-danger')?.textContent).toContain('O setor tem chamados em aberto ou em andamento.');
    expect(otherCard.querySelector('.alert-danger')).toBeNull();
    // Não vai mais pro alerta solto no topo da página.
    expect(fixture.nativeElement.querySelector(':scope > .alert-danger')).toBeNull();

    (itCard.querySelector('.alert-danger .btn-close') as HTMLButtonElement).click();
    expect(storeFake.clearDeleteError).toHaveBeenCalled();
  });

  it('marks the card as busy and the "⋮" with a spinner during the deletion', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    storeFake.deletingId.set('dep-1');
    fixture.detectChanges();
    await fixture.whenStable();

    const busyCard = fixture.nativeElement.querySelector('.card[aria-busy="true"]') as HTMLElement;
    expect(busyCard.querySelector('h2')?.textContent).toContain('TI');
    expect(busyCard.querySelector('[data-row-actions="dep-1"] .spinner-border')).not.toBeNull();
  });

  it('does not delete the sector when the confirmation is cancelled', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(false));
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeleteSector(informationTechnology, informationTechnology.sectors[1]);

    expect(storeFake.deleteSector).not.toHaveBeenCalled();
  });

  it('hides the sector actions for those who only manage departments', async () => {
    permissions = new Set(['departments:manage']);
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Adicionar setor');
    expect(fixture.nativeElement.querySelector('.page-actions button')?.textContent).toContain('Novo Departamento');
  });

  it('hides the department actions for those who only manage sectors', async () => {
    permissions = new Set(['sectors:manage']);
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.page-actions button')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Ações para o departamento TI"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Adicionar setor');
  });

  it('groups edit/delete of each department and sector in a "⋮", with no loose red trash icons', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.card .btn-outline-danger')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Ações para o departamento TI"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Excluir departamento');
  });

  it('"Adicionar setor" is the last cell of each department grid (and "o primeiro setor" when there is none)', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    const cards = Array.from(fixture.nativeElement.querySelectorAll('section.card') as NodeListOf<HTMLElement>);
    for (const card of cards) {
      const grid = card.querySelector('.sector-grid') as HTMLElement;
      expect(grid.lastElementChild?.classList).toContain('sector-add-cell');
    }
    const empty = cards.find(card => card.textContent?.includes('Nenhum setor ainda'))!;
    expect(empty.querySelector('.sector-add')?.textContent).toContain('Adicionar o primeiro setor');
    // O nome acessível contém o texto visível (WCAG 2.5.3), pro comando de voz achar o botão.
    expect(empty.querySelector('.sector-add')?.getAttribute('aria-label')).toBe('Adicionar o primeiro setor em Comercial');
    expect(cardOf(fixture.nativeElement, 'dep-1').querySelector('.sector-grid')?.getAttribute('aria-label')).toBe('Setores de TI');
    expect(fixture.nativeElement.querySelector('.btn-add-sector')).toBeNull();
  });

  it('highlights the newly created department and drops the highlight after a few seconds', async () => {
    jasmine.clock().install();
    try {
      storeFake.create.and.callFake((_data: unknown, onSuccess: (id: string) => void) => onSuccess('dep-1'));
      const fixture = TestBed.createComponent(DepartmentListComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance;

      component.openCreateModal();
      component.form.setValue({ name: 'TI', description: 'Tecnologia' });
      component.onSubmit();
      fixture.detectChanges();

      expect(component.highlightedId()).toBe('dep-1');
      expect(fixture.nativeElement.querySelector('[data-item-id="dep-1"]')?.classList).toContain('item-new');

      jasmine.clock().tick(4001);
      expect(component.highlightedId()).toBeNull();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('only scrolls to the new department (and only counts the highlight time) after it arrives in the listing', async () => {
    jasmine.clock().install();
    try {
      const scroll = spyOn(Element.prototype, 'scrollIntoView');
      storeFake.create.and.callFake((_data: unknown, onSuccess: (id: string) => void) => onSuccess('dep-novo'));
      const fixture = TestBed.createComponent(DepartmentListComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance;

      component.openCreateModal();
      component.form.setValue({ name: 'Jurídico', description: 'Contratos' });
      component.onSubmit();
      // A listagem ainda está recarregando: nada pra rolar, e o realce não pode começar a expirar.
      storeFake.listState.set({ loading: true, error: null });
      fixture.detectChanges();
      jasmine.clock().tick(5000);
      expect(scroll).not.toHaveBeenCalled();
      expect(component.highlightedId()).toBe('dep-novo');

      const created: Department = { id: 'dep-novo', name: 'Jurídico', description: 'Contratos', responsibleUserName: null, sectors: [] };
      storeFake.departments.set([informationTechnology, commercial, created]);
      storeFake.listState.set({ loading: false, error: null });
      fixture.detectChanges();

      expect(scroll).toHaveBeenCalled();
      jasmine.clock().tick(4001);
      expect(component.highlightedId()).toBeNull();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('highlights the newly created sector with the id the store returns', async () => {
    storeFake.createSector.and.callFake((_data: unknown, onSuccess: (id: string) => void) => onSuccess('sec-novo'));
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.openCreateSectorModal(commercial);
    component.sectorForm.setValue({ name: 'Vendas', description: '' });
    component.onSubmitSector();

    expect(component.highlightedId()).toBe('sec-novo');
  });
});
