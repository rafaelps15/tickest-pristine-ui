import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { of } from 'rxjs';
import { DepartmentListComponent } from './department-list.component';
import { DepartmentsStore } from '../application/departments.store';
import { Department, DepartmentDetail } from '../entities/department';
import { ConfirmDialogService, SessionService } from '../../shared';
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

  const candidate: UserSummary = {
    id: 'u-1', email: 'carlos@empresa.com', firstName: 'Carlos', lastName: 'Souza',
    roles: [], isActive: true, createdAtUtc: '2026-01-01T12:00:00Z', deactivatedAtUtc: null
  };

  /** Cria um store falso com signals reais, para o template reagir como no store verdadeiro. */
  function createStoreFake() {
    return {
      departments: signal<Department[]>([informationTechnology, commercial]),
      listState: signal({ data: [informationTechnology, commercial], loading: false, error: null as string | null }),
      mutationError: signal<string | null>(null),
      responsibleCandidates: signal<UserSummary[]>([]),
      searchingResponsible: signal(false),
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

  it('carrega os departamentos ao inicializar', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    expect(storeFake.load).toHaveBeenCalled();
  });

  it('mostra os setores dentro do card do departamento', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    const cards = fixture.nativeElement.querySelectorAll('.card');
    expect(cards[0].textContent).toContain('TI');
    expect(cards[0].textContent).toContain('Helpdesk');
    expect(cards[0].textContent).toContain('Infraestrutura');
    expect(cards[0].textContent).toContain('2 setores');
    expect(cards[1].textContent).toContain('Nenhum setor ainda');
  });

  it('filtra pelo nome do departamento', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.searchInput.set('comercial');

    expect(fixture.componentInstance.filteredDepartments()).toEqual([commercial]);
  });

  it('filtra pelo nome de um setor, mantendo o departamento mesmo sem bater no nome dele', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.searchInput.set('helpdesk');

    expect(fixture.componentInstance.filteredDepartments()).toEqual([informationTechnology]);
  });

  it('mostra mensagem distinta quando a busca não encontra nada', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.searchInput.set('inexistente');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Nenhum departamento ou setor encontrado para "inexistente".');
  });

  it('ao abrir o modal de edição, mostra o nome do responsável já conhecido e busca o id dele', async () => {
    const withResponsible: Department = { ...informationTechnology, responsibleUserName: 'Carlos Souza' };
    const detail: DepartmentDetail = { id: 'dep-1', name: 'TI', description: 'Tecnologia da Informação', responsibleUserId: 'u-1' };
    storeFake.getDepartmentDetail.and.callFake((_id: string, onLoaded: (d: DepartmentDetail) => void) => onLoaded(detail));
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(withResponsible);

    expect(fixture.componentInstance.selectedResponsibleName()).toBe('Carlos Souza');
    expect(storeFake.getDepartmentDetail).toHaveBeenCalledWith('dep-1', jasmine.any(Function));
    expect(fixture.componentInstance.selectedResponsibleId()).toBe('u-1');
    expect(fixture.componentInstance.loadingCurrentResponsible()).toBeFalse();
  });

  it('seleciona um candidato da busca como responsável, e limpa a busca', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.responsibleSearchInput.set('carlos');
    fixture.componentInstance.onSelectResponsible(candidate);

    expect(fixture.componentInstance.selectedResponsibleId()).toBe('u-1');
    expect(fixture.componentInstance.selectedResponsibleName()).toBe('Carlos Souza');
    expect(fixture.componentInstance.responsibleSearchInput()).toBe('');
    expect(storeFake.clearResponsibleSearch).toHaveBeenCalled();
  });

  it('remove o responsável selecionado, voltando a "sem responsável"', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onSelectResponsible(candidate);
    fixture.componentInstance.onClearResponsible();

    expect(fixture.componentInstance.selectedResponsibleId()).toBeNull();
    expect(fixture.componentInstance.selectedResponsibleName()).toBeNull();
  });

  it('inclui o responsável selecionado ao criar um departamento', async () => {
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

  it('envia responsibleUserId indefinido ao salvar sem nenhum responsável selecionado', async () => {
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

  it('cria o setor no departamento do card em que foi aberto o modal', async () => {
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

  it('atualiza o setor em edição sem mudar o departamento', async () => {
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

  it('avisa que os setores saem junto ao excluir o departamento', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDelete(informationTechnology);

    const options = confirmDialogServiceFake.confirm.calls.mostRecent().args[0];
    expect(options.message).toContain('Os 2 setores dele também serão excluídos.');
    expect(storeFake.delete).toHaveBeenCalledWith('dep-1');
  });

  it('exclui o setor confirmado', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeleteSector(informationTechnology, informationTechnology.sectors[1]);

    expect(storeFake.deleteSector).toHaveBeenCalledWith('sec-2');
  });

  it('não exclui o setor quando a confirmação é cancelada', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(false));
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDeleteSector(informationTechnology, informationTechnology.sectors[1]);

    expect(storeFake.deleteSector).not.toHaveBeenCalled();
  });

  it('esconde as ações de setor para quem só gerencia departamentos', async () => {
    permissions = new Set(['departments:manage']);
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Adicionar setor');
    expect(fixture.nativeElement.querySelector('button[data-bs-target="#departmentModal"]')).not.toBeNull();
  });

  it('esconde as ações de departamento para quem só gerencia setores', async () => {
    permissions = new Set(['sectors:manage']);
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('button[data-bs-target="#departmentModal"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Excluir o departamento TI"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Adicionar setor');
  });
});
