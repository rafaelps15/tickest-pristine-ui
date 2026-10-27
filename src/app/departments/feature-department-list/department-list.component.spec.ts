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

  const candidate: UserSummary = {
    id: 'u-1', email: 'carlos@empresa.com', firstName: 'Carlos', lastName: 'Souza',
    roles: [], isActive: true, createdAtUtc: '2026-01-01T12:00:00Z', deactivatedAtUtc: null, pendingActivation: false, invitationExpiresAtUtc: null
  };

  /** Cria um store falso com signals reais, para o template reagir como no store verdadeiro. */
  function createStoreFake() {
    return {
      departments: signal<Department[]>([informationTechnology, commercial]),
      listState: signal({ data: [informationTechnology, commercial], loading: false, error: null as string | null }),
      mutationError: signal<string | null>(null),
      mutating: signal(false),
      deletingId: signal<string | null>(null),
      deleteError: signal<{ targetId: string; message: string } | null>(null),
      clearDeleteError: jasmine.createSpy('clearDeleteError'),
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

    const cards = fixture.nativeElement.querySelectorAll('section.card');
    expect(cards[0].textContent).toContain('TI');
    expect(cards[0].textContent).toContain('Helpdesk');
    expect(cards[0].textContent).toContain('Infraestrutura');
    expect(cards[0].textContent).toContain('2 setores');
    expect(cards[1].textContent).toContain('Nenhum setor ainda');
  });

  it('o título do card é só o nome (o badge de setores fica fora do h2) e rotula a seção', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    const card = fixture.nativeElement.querySelector('section.card') as HTMLElement;
    const heading = card.querySelector('h2')!;
    expect(heading.textContent?.trim()).toBe('TI');
    expect(card.getAttribute('aria-labelledby')).toBe(heading.id);
  });

  it('destaca em âmbar o departamento sem setor e diz quando não há responsável', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    const [itCard, commercialCard] = fixture.nativeElement.querySelectorAll('section.card') as NodeListOf<HTMLElement>;
    expect(itCard.querySelector('.badge')!.classList).toContain('bg-label-secondary');
    expect(commercialCard.querySelector('.badge')!.classList).toContain('bg-label-warning');
    expect(commercialCard.textContent).toContain('Sem responsável');
  });

  it('filtra pelo problema escolhido no Resumo e diz quantos sobraram; "Limpar filtros" volta a todos', async () => {
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

  it('filtra pelos departamentos sem responsável', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.issueFilter.set('withoutResponsible');

    expect(fixture.componentInstance.filteredDepartments().map(d => d.id)).toEqual(['dep-1', 'dep-2']);
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
    expect(storeFake.getDepartmentDetail).toHaveBeenCalledWith('dep-1', jasmine.any(Function), jasmine.any(Function));
    expect(fixture.componentInstance.selectedResponsibleId()).toBe('u-1');
    expect(fixture.componentInstance.loadingCurrentResponsible()).toBeFalse();
  });

  it('ignora a resposta tardia de um departamento se o admin já trocou para outro antes dela chegar', async () => {
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

  it('o botão "Salvar" do modal de departamento fica desabilitado enquanto o responsável atual carrega', async () => {
    storeFake.getDepartmentDetail.and.callFake(() => {});
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(informationTechnology);
    fixture.detectChanges();
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('#departmentModal button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
  });

  it('quando o responsável atual não carrega, encerra o loading e mostra o erro no modal com "Tentar de novo"', async () => {
    storeFake.getDepartmentDetail.and.callFake((_id: string, _onLoaded: unknown, onError: (m: string) => void) =>
      onError('Não foi possível carregar o responsável atual.'));
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(informationTechnology);
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

  it('libera o "Salvar" depois da falha quando o admin escolhe outro responsável, e envia esse', async () => {
    storeFake.getDepartmentDetail.and.callFake((_id: string, _onLoaded: unknown, onError: (m: string) => void) => onError('falhou'));
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(informationTechnology);
    fixture.componentInstance.onSelectResponsible(candidate);
    fixture.detectChanges();
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('#departmentModal button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeFalse();
    expect(fixture.componentInstance.currentResponsibleError()).toBeNull();

    fixture.componentInstance.onSubmit();
    expect(storeFake.update).toHaveBeenCalledWith('dep-1', jasmine.objectContaining({ responsibleUserId: 'u-1' }), jasmine.any(Function));
  });

  it('não salva enquanto o responsável atual é desconhecido, mesmo chamando o submit direto', async () => {
    storeFake.getDepartmentDetail.and.callFake(() => {});
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(informationTechnology);
    fixture.componentInstance.onSubmit();

    expect(storeFake.update).not.toHaveBeenCalled();
  });

  it('a escolha do admin feita enquanto carregava vale mais que o responsável que chega depois', async () => {
    let resolve!: (detail: DepartmentDetail) => void;
    storeFake.getDepartmentDetail.and.callFake((_id: string, onLoaded: (d: DepartmentDetail) => void) => { resolve = onLoaded; });
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.openEditModal(informationTechnology);
    fixture.componentInstance.onSelectResponsible(candidate);
    resolve({ id: 'dep-1', name: 'TI', description: '', responsibleUserId: 'u-outro' });

    expect(fixture.componentInstance.selectedResponsibleId()).toBe('u-1');
    expect(fixture.componentInstance.loadingCurrentResponsible()).toBeFalse();
  });

  it('o botão "Salvar" do modal de departamento fica desabilitado durante a mutação, não por formulário inválido', async () => {
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

  it('mostra a mensagem de erro certa para o nome do departamento, por tipo de validação', async () => {
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
    expect(options.message).toContain('Se algum setor tiver chamados em andamento, a exclusão é recusada.');
    expect(options.confirmLabel).toBe('Excluir departamento e 2 setores');
    expect(storeFake.delete).toHaveBeenCalledWith('dep-1', jasmine.any(Function), jasmine.any(Function));
  });

  it('o botão de excluir departamento sem setores não fala em setores', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDelete({ ...informationTechnology, sectors: [] });

    expect(confirmDialogServiceFake.confirm.calls.mostRecent().args[0].confirmLabel).toBe('Excluir departamento');
  });

  it('confirma a exclusão do departamento com toast quando dá certo', async () => {
    storeFake.delete.and.callFake((_id: string, onSuccess: () => void) => onSuccess());
    const toast = TestBed.inject(ToastService);
    spyOn(toast, 'show');
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    fixture.componentInstance.onDelete(informationTechnology);

    expect(toast.show).toHaveBeenCalledWith('Departamento "TI" excluído.');
  });

  it('exclui o setor confirmado, com toast', async () => {
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

  it('mostra a falha da exclusão no card do departamento dono do setor, e fecha no X', async () => {
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

  it('marca o card como ocupado e o "⋮" com spinner durante a exclusão', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    storeFake.deletingId.set('dep-1');
    fixture.detectChanges();
    await fixture.whenStable();

    const busyCard = fixture.nativeElement.querySelector('.card[aria-busy="true"]') as HTMLElement;
    expect(busyCard.querySelector('h2')?.textContent).toContain('TI');
    expect(busyCard.querySelector('[data-row-actions="dep-1"] .spinner-border')).not.toBeNull();
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
    expect(fixture.nativeElement.querySelector('.page-actions button')?.textContent).toContain('Novo Departamento');
  });

  it('esconde as ações de departamento para quem só gerencia setores', async () => {
    permissions = new Set(['sectors:manage']);
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.page-actions button')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Ações para o departamento TI"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Adicionar setor');
  });

  it('agrupa editar/excluir de cada departamento e setor num "⋮", sem lixeiras vermelhas soltas', async () => {
    const fixture = TestBed.createComponent(DepartmentListComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.card .btn-outline-danger')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Ações para o departamento TI"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Excluir departamento');
  });
});
