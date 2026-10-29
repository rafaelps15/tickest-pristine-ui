import { Component, inject, OnInit, ChangeDetectionStrategy, computed, signal, viewChild, afterNextRender, Injector, effect, untracked, DestroyRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { DepartmentsStore } from '../application/departments.store';
import { Department, DepartmentSector } from '../entities/department';
import { ConfirmDialogService, SessionService , ToastService} from '../../shared';
import { UserSummary } from '../../users';
import { DepartmentGuideComponent } from './department-guide.component';
import { DepartmentInsightsComponent, DepartmentIssue } from './department-insights.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { EmptyStateComponent, LoadingStateComponent } from '../../shared/ui/data-state/data-state.components';
import { RowActionsComponent } from '../../shared/ui/row-actions/row-actions.component';
import { DialogComponent } from '../../shared/ui/dialog/dialog.component';

/** Por quanto tempo o departamento/setor recém-criado fica destacado (mesmo tempo da linha nova de Usuários). */
const NEW_ITEM_HIGHLIGHT_MS = 4000;

/**
 * Tela administrativa de departamentos e setores: cada departamento mostra os seus setores, e o setor é
 * sempre cadastrado a partir do departamento a que pertence.
 */
@Component({
    selector: 'app-department-list',
    imports: [ReactiveFormsModule, PageHeaderComponent, DepartmentGuideComponent, DepartmentInsightsComponent, EmptyStateComponent, LoadingStateComponent, DialogComponent, RowActionsComponent],
    templateUrl: './department-list.component.html',
    styleUrl: './department-list.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DepartmentListComponent implements OnInit {
    /** Diálogo aberto agora (renderizado com `@if`, via `<app-dialog>`), ou `null`. */
    protected readonly openDialog = signal<'department' | 'sector' | null>(null);

    /**
     * Fecha o diálogo aberto (X, Esc, clique fora, "Cancelar" ou depois de salvar) e descarta o erro de
     * salvar dele — o erro mora no diálogo e não pode sobrar na tela depois que ele fecha.
     */
    closeDialog(): void {
        this.openDialog.set(null);
        this.sectorAddedMessage.set('');
        this.store.clearMutationError();
    }

    /** Construtor dos formulários reativos dos diálogos. */
    private readonly fb = inject(FormBuilder);
    /** Store de departamentos e setores (listagem, mutações e busca de responsável). */
    protected readonly store = inject(DepartmentsStore);
    /** Diálogo de confirmação do sistema, usado antes de excluir. */
    private readonly confirmDialogService = inject(ConfirmDialogService);
    /** Sessão do usuário logado, pra checar as permissões de gestão. */
    private readonly sessionService = inject(SessionService);
    /** Toasts de confirmação das ações feitas fora de diálogo. */
    private readonly toastService = inject(ToastService);
    /** Injector usado pelos `afterNextRender` disparados fora do contexto de injeção. */
    private readonly injector = inject(Injector);
    /** Encerra os timers do realce de item novo quando a tela é destruída. */
    private readonly destroyRef = inject(DestroyRef);

    /** Cabeçalho da página — recebe o foco depois que o card excluído some. */
    private readonly pageHeader = viewChild(PageHeaderComponent);

    /** Se o usuário logado pode criar, editar e excluir departamentos. */
    readonly canManageDepartments = computed(() => this.sessionService.hasPermission('departments:manage'));

    /** Se o usuário logado pode criar, editar e excluir setores. */
    readonly canManageSectors = computed(() => this.sessionService.hasPermission('sectors:manage'));

    /** Departamento em edição (null quando o modal está no modo "criar"). */
    editingDepartment = signal<Department | null>(null);

    /** Departamento ao qual o setor do modal pertence. */
    sectorDepartment = signal<Department | null>(null);

    /** Setor em edição (null quando o modal de setor está no modo "criar"). */
    editingSector = signal<DepartmentSector | null>(null);

    /** Texto digitado na busca por nome de departamento ou de setor. */
    searchInput = signal('');

    /** Texto digitado na busca de usuário responsável, no formulário de departamento. */
    responsibleSearchInput = signal('');

    /** Id do usuário selecionado como responsável no formulário de departamento (null = sem responsável). */
    selectedResponsibleId = signal<string | null>(null);

    /** Nome do responsável selecionado, pra exibir sem precisar re-buscar (vem da listagem ou da busca). */
    selectedResponsibleName = signal<string | null>(null);

    /** Enquanto busca o id do responsável atual (GET /departments/{id}) ao abrir o modal de edição. */
    loadingCurrentResponsible = signal(false);

    /** Departamento ou setor recém-criado, destacado por {@link NEW_ITEM_HIGHLIGHT_MS} pra quem acabou de salvar achar o que criou. */
    readonly highlightedId = signal<string | null>(null);

    /** Falha ao buscar o responsável atual no modal de edição (mostrada ali, com "Tentar de novo"), ou `null`. */
    currentResponsibleError = signal<string | null>(null);

    /**
     * Se já se sabe quem é o responsável a gravar. Na edição, só depois de carregar o atual ou de o admin
     * escolher/remover um — o PUT grava o que for enviado, então salvar sem saber apagaria o responsável.
     */
    responsibleKnown = signal(true);

    /** Problema escolhido num aviso do Resumo ("sem setor"/"sem responsável"), ou `null` pra todos. */
    readonly issueFilter = signal<DepartmentIssue | null>(null);

    /** Se o modal de departamento abre com o foco na busca de responsável ("Definir responsável" do card). */
    readonly focusResponsible = signal(false);

    /** Se há algum filtro ligado (busca ou problema do Resumo) — o "Limpar" da barra aparece. */
    readonly hasFilters = computed(() => this.searchInput().trim() !== '' || this.issueFilter() !== null);

    /**
     * Departamentos que batem com a busca (nome do departamento ou de algum dos seus setores) e com o
     * problema escolhido no Resumo. Os sem nenhum setor vêm primeiro (são os únicos que somem da abertura
     * de chamados); dentro de cada grupo, a ordem alfabética da API se mantém (`sort` é estável).
     */
    readonly filteredDepartments = computed(() => {
        const query = this.searchInput().trim().toLowerCase();
        const issue = this.issueFilter();

        return this.store.departments().filter(department => {
            if (issue === 'withoutSectors' && department.sectors.length > 0) return false;
            if (issue === 'withoutResponsible' && department.responsibleUserName) return false;
            if (!query) return true;
            return department.name.toLowerCase().includes(query) ||
                department.sectors.some(sector => sector.name.toLowerCase().includes(query));
        }).sort((a, b) => Number(a.sectors.length > 0) - Number(b.sectors.length > 0));
    });

    /** Ids dos setores cujo nome bate com a busca — ficam marcados, pra mostrar o que a busca encontrou. */
    readonly matchedSectorIds = computed(() => {
        const query = this.searchInput().trim().toLowerCase();
        if (!query) return new Set<string>();
        return new Set(this.store.departments()
            .flatMap(department => department.sectors)
            .filter(sector => sector.name.toLowerCase().includes(query))
            .map(sector => sector.id));
    });

    /** Departamento com uma exclusão em voo (dele ou de um setor dele) — o card fica `aria-busy` —, ou `null`. */
    readonly deletingDepartmentId = computed(() => this.departmentOf(this.store.deletingId()));

    /** Falha da última exclusão e o departamento em cujo card ela aparece (dele ou de um setor dele), ou `null`. */
    readonly deleteErrorPlacement = computed(() => {
        const error = this.store.deleteError();
        const departmentId = this.departmentOf(error?.targetId ?? null);
        return error && departmentId ? { departmentId, message: error.message } : null;
    });

    /** Id do departamento que é ou que contém o departamento/setor informado, ou `null`. */
    private departmentOf(itemId: string | null): string | null {
        if (!itemId) return null;
        return this.store.departments().find(department =>
            department.id === itemId || department.sectors.some(sector => sector.id === itemId))?.id ?? null;
    }

    /** Desliga a busca e o filtro de problema, voltando a mostrar todos, e devolve o foco à busca (o botão some). */
    clearFilters(): void {
        this.searchInput.set('');
        this.issueFilter.set(null);
        this.focusElement('#departmentSearch');
    }

    /**
     * Se a busca de responsável ainda não respondeu pelo que está digitado (em voo ou no debounce) — sem
     * isso, "Nenhum usuário encontrado" piscava a cada tecla.
     */
    readonly responsibleSearchPending = computed(() => {
        const term = this.responsibleSearchInput().trim();
        return term !== '' && (this.store.searchingResponsible() || this.store.responsibleSearchTerm() !== term);
    });

    /**
     * Texto da região viva do bloco Responsável. A região existe sempre e só o texto muda — criada junto
     * com o texto (dentro de um `@if`), o leitor de tela não anunciava.
     */
    readonly responsibleStatusMessage = computed(() => {
        if (this.loadingCurrentResponsible()) return 'Carregando responsável atual…';
        if (this.responsibleSearchPending()) return 'Buscando usuários…';
        if (this.store.responsibleSearchError() || !this.responsibleSearchInput().trim()) return '';
        const count = this.store.responsibleCandidates().length;
        if (count === 0) return 'Nenhum usuário encontrado.';
        return `${count} ${count === 1 ? 'usuário encontrado' : 'usuários encontrados'}.`;
    });

    /**
     * Confirmação do "Criar e adicionar outro" no diálogo de setor (região viva sempre presente, só o
     * texto muda); vazio quando não há.
     */
    readonly sectorAddedMessage = signal('');

    /** Formulário do modal de departamento (criação e edição). */
    form = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(100)]],
        description: ['', [Validators.required, Validators.maxLength(500)]]
    });

    /** Formulário do modal de setor (criação e edição); o departamento vem de {@link sectorDepartment}. */
    sectorForm = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(100)]],
        description: ['', [Validators.maxLength(500)]]
    });

    /** Verifica se um campo do formulário de departamento está inválido e já foi tocado. */
    isFieldInvalid(fieldName: keyof typeof this.form.controls): boolean {
        const control = this.form.controls[fieldName];
        return control.invalid && (control.dirty || control.touched);
    }

    /** Verifica se um campo do formulário de setor está inválido e já foi tocado. */
    isSectorFieldInvalid(fieldName: keyof typeof this.sectorForm.controls): boolean {
        const control = this.sectorForm.controls[fieldName];
        return control.invalid && (control.dirty || control.touched);
    }

    /** Liga a busca de responsável com debounce e a saída automática do filtro de problema. */
    constructor() {
        // Espera ~300ms após a última tecla antes de buscar, pra não buscar a cada letra digitada.
        toObservable(this.responsibleSearchInput).pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntilDestroyed()
        ).subscribe(search => this.store.searchResponsibleCandidates(search));

        // Corrigiu o último departamento com o problema filtrado: o chip some, então o filtro sai junto
        // (senão a lista caía num "nenhum departamento" sem o controle que o desligaria). Com a recarga
        // falhando, a lista vem vazia — isso não é "todos corrigidos", então o filtro fica.
        effect(() => {
            const issue = this.issueFilter();
            if (!issue || this.store.listState().loading || this.store.listState().error) return;
            const remaining = this.store.departments().some(department =>
                issue === 'withoutSectors' ? department.sectors.length === 0 : !department.responsibleUserName);
            if (remaining) return;
            untracked(() => {
                this.issueFilter.set(null);
                this.toastService.show(issue === 'withoutSectors'
                    ? 'Todos os departamentos têm setor agora.'
                    : 'Todos os departamentos têm responsável agora.');
            });
        });
    }

    /** Carrega os departamentos, já com os setores de cada um. */
    ngOnInit(): void {
        this.store.load();
    }

    /** Prepara o modal de departamento para criação. */
    openCreateModal(): void {
        this.focusResponsible.set(false);
        this.openDialog.set('department');
        this.store.clearMutationError();
        this.store.clearResponsibleSearch();
        this.editingDepartment.set(null);
        this.form.reset({ name: '', description: '' });
        this.responsibleSearchInput.set('');
        this.selectedResponsibleId.set(null);
        this.selectedResponsibleName.set(null);
        this.loadingCurrentResponsible.set(false);
        this.currentResponsibleError.set(null);
        this.responsibleKnown.set(true);
    }

    /**
     * Prepara o modal de departamento para edição do departamento informado. O nome do responsável
     * atual já vem na listagem, mas o id não — busca o detalhe (GET /departments/{id}) pra saber
     * quem está selecionado antes do admin trocar. Sem responsável na listagem, não há o que buscar:
     * o "Salvar" já fica liberado (antes, uma falha nesse GET travava até renomear).
     */
    openEditModal(department: Department, focusResponsible = false): void {
        this.focusResponsible.set(focusResponsible);
        this.openDialog.set('department');
        this.store.clearMutationError();
        this.store.clearResponsibleSearch();
        this.editingDepartment.set(department);
        this.form.setValue({ name: department.name, description: department.description });
        this.responsibleSearchInput.set('');
        this.selectedResponsibleId.set(null);
        this.selectedResponsibleName.set(department.responsibleUserName);
        this.currentResponsibleError.set(null);
        this.loadingCurrentResponsible.set(false);

        if (!department.responsibleUserName) {
            this.responsibleKnown.set(true);
            return;
        }
        this.responsibleKnown.set(false);
        this.loadCurrentResponsible(department);
    }

    /** "Tentar de novo" do responsável atual: busca outra vez e leva o foco à busca (o botão vira spinner). */
    retryCurrentResponsible(): void {
        const department = this.editingDepartment();
        if (!department) return;
        this.loadCurrentResponsible(department);
        this.focusElement('#departmentResponsibleSearch');
    }

    /**
     * Busca o id do responsável atual do departamento em edição (GET /departments/{id}). Também é o
     * "Tentar de novo" do modal quando a busca falha.
     */
    loadCurrentResponsible(department: Department): void {
        this.loadingCurrentResponsible.set(true);
        this.currentResponsibleError.set(null);

        // Nos dois callbacks, ignora a resposta se o admin já trocou de departamento no modal antes dela
        // chegar (ex.: abriu "editar" em A e, antes de carregar, abriu "editar" em B).
        const stillEditing = () => this.editingDepartment()?.id === department.id;

        this.store.getDepartmentDetail(department.id, detail => {
            if (!stillEditing()) return;

            this.loadingCurrentResponsible.set(false);
            // O admin pode ter escolhido outro responsável enquanto carregava: a escolha dele vale.
            if (this.responsibleKnown()) return;
            this.selectedResponsibleId.set(detail.responsibleUserId);
            this.responsibleKnown.set(true);
        }, message => {
            if (!stillEditing()) return;

            this.loadingCurrentResponsible.set(false);
            this.currentResponsibleError.set(message);
        });
    }

    /**
     * Seleciona um candidato da busca como responsável do departamento, no formulário. A lista de
     * candidatos some, então o foco volta pra busca.
     */
    onSelectResponsible(candidate: UserSummary): void {
        this.responsibleKnown.set(true);
        this.currentResponsibleError.set(null);
        this.selectedResponsibleId.set(candidate.id);
        this.selectedResponsibleName.set(`${candidate.firstName} ${candidate.lastName}`);
        this.responsibleSearchInput.set('');
        this.store.clearResponsibleSearch();
        this.focusElement('#departmentResponsibleSearch');
    }

    /**
     * Remove o responsável selecionado no formulário de departamento (volta a "sem responsável"). Também
     * é a saída quando o responsável atual não carregou. O botão some, então o foco vai pra busca.
     */
    onClearResponsible(): void {
        this.responsibleKnown.set(true);
        this.currentResponsibleError.set(null);
        this.loadingCurrentResponsible.set(false);
        this.selectedResponsibleId.set(null);
        this.selectedResponsibleName.set(null);
        this.focusElement('#departmentResponsibleSearch');
    }

    /** Salva o departamento do modal (cria ou atualiza) e fecha o modal em caso de sucesso. */
    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        if (!this.responsibleKnown()) return;

        const raw = this.form.getRawValue();
        const data = {
            name: raw.name!.trim(),
            description: raw.description!.trim(),
            responsibleUserId: this.selectedResponsibleId() ?? undefined
        };
        const editing = this.editingDepartment();

        if (editing) {
            this.store.update(editing.id, data, () => {
                this.closeDialog();
                this.toastService.show(`Departamento "${data.name}" atualizado.`);
            });
        } else {
            // Departamento novo ainda não aparece na abertura de chamados: o toast já leva ao primeiro setor.
            this.store.create(data, departmentId => {
                this.closeDialog();
                this.highlight(departmentId);
                this.toastService.show(`Departamento "${data.name}" criado. Ele só aparece na abertura de chamados depois do primeiro setor.`, 'success', {
                    label: 'Adicionar setor',
                    run: () => this.openCreateSectorModal(this.store.departments().find(d => d.id === departmentId)
                        ?? { id: departmentId, name: data.name, description: data.description, responsibleUserName: null, sectors: [] })
                });
            });
        }
    }

    /**
     * Confirma e exclui o departamento selecionado. O botão diz o tamanho do estrago (os setores saem
     * junto) e a mensagem antecipa a recusa do back quando há chamados em andamento (RN-10). No sucesso,
     * toast e foco no título (o card some); na falha, foco de volta no "⋮" do card, onde o erro aparece.
     */
    onDelete(department: Department): void {
        const sectorCount = department.sectors.length;
        const sectorsNotice = sectorCount === 0
            ? ''
            : sectorCount === 1
                ? ' O setor dele também será excluído.'
                : ` Os ${sectorCount} setores dele também serão excluídos.`;

        this.confirmDialogService.confirm({
            title: `Excluir o departamento "${department.name}"?`,
            message: `Ele deixa de aparecer na abertura de chamados.${sectorsNotice} Se algum setor tiver chamados em andamento, a exclusão é recusada. Essa ação não pode ser desfeita.`,
            confirmLabel: sectorCount === 0
                ? 'Excluir departamento'
                : `Excluir departamento e ${sectorCount === 1 ? '1 setor' : `${sectorCount} setores`}`,
            variant: 'danger'
        }).subscribe(confirmed => {
            if (!confirmed) {
                this.focusRowActions(department.id);
                return;
            }
            this.store.delete(department.id, () => {
                this.toastService.show(`Departamento "${department.name}" excluído.`);
                this.pageHeader()?.focus();
            }, () => this.focusRowActions(department.id));
        });
    }

    /**
     * Destaca o departamento ou setor recém-criado e rola até ele: a lista recarrega em ordem
     * alfabética e o item novo podia nascer fora da tela, sem sinal de onde foi parar. A rolagem e a
     * contagem do realce esperam o item chegar na listagem recarregada (ver o efeito no construtor) —
     * antes, rolavam pra um elemento que ainda não existia. Com `prefers-reduced-motion`, fica só o fundo.
     */
    private highlight(id: string): void {
        this.highlightedId.set(id);
        this.pendingHighlightId.set(id);
    }

    /** Item recém-criado esperando aparecer na listagem recarregada pra receber a rolagem, ou `null`. */
    private readonly pendingHighlightId = signal<string | null>(null);

    /**
     * Quando o item pendente já está na listagem (e ela não está recarregando), rola até ele e começa a
     * contar o tempo do realce.
     */
    private readonly revealNewItem = effect(() => {
        const id = this.pendingHighlightId();
        if (!id || this.store.listState().loading) return;
        const arrived = this.store.departments().some(department =>
            department.id === id || department.sectors.some(sector => sector.id === id));
        if (!arrived) return;

        untracked(() => this.pendingHighlightId.set(null));
        afterNextRender(() => {
            // Com movimento reduzido, salta direto (DESIGN.md: só o fundo, sem animação).
            const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
            document.querySelector<HTMLElement>(`[data-item-id="${id}"]`)
                ?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
        }, { injector: this.injector });
        const timer = setTimeout(() => {
            if (this.highlightedId() === id) this.highlightedId.set(null);
        }, NEW_ITEM_HIGHLIGHT_MS);
        untracked(() => this.destroyRef.onDestroy(() => clearTimeout(timer)));
    });

    /** Devolve o foco ao botão "⋮" do departamento ou setor (o modal de confirmação o tirou dali). */
    private focusRowActions(rowKey: string): void {
        this.focusElement(`[data-row-actions="${rowKey}"]`);
    }

    /** Põe o foco no elemento do seletor depois da próxima renderização (o controle acionado pode ter sumido). */
    private focusElement(selector: string): void {
        afterNextRender(() => {
            document.querySelector<HTMLElement>(selector)?.focus();
        }, { injector: this.injector });
    }

    /** Prepara o modal de setor para criar um setor dentro do departamento informado. */
    openCreateSectorModal(department: Department): void {
        this.openDialog.set('sector');
        this.store.clearMutationError();
        this.sectorAddedMessage.set('');
        this.sectorDepartment.set(department);
        this.editingSector.set(null);
        this.sectorForm.reset({ name: '', description: '' });
    }

    /** Prepara o modal de setor para edição do setor informado. */
    openEditSectorModal(department: Department, sector: DepartmentSector): void {
        this.openDialog.set('sector');
        this.store.clearMutationError();
        this.sectorAddedMessage.set('');
        this.sectorDepartment.set(department);
        this.editingSector.set(sector);
        this.sectorForm.setValue({ name: sector.name, description: sector.description ?? '' });
    }

    /**
     * Salva o setor do modal (cria no departamento escolhido ou atualiza). Com `addAnother` ("Criar e
     * adicionar outro"), o diálogo fica aberto e limpo pro próximo setor, com a confirmação dita ali —
     * montar a estrutura custava um diálogo inteiro por setor.
     */
    onSubmitSector(addAnother = false): void {
        const department = this.sectorDepartment();

        if (this.sectorForm.invalid || !department) {
            this.sectorForm.markAllAsTouched();
            return;
        }

        const raw = this.sectorForm.getRawValue();
        const data = { name: raw.name!.trim(), description: raw.description?.trim() || undefined };
        const editing = this.editingSector();

        if (editing) {
            this.store.updateSector(editing.id, data, () => {
                this.closeDialog();
                this.toastService.show(`Setor "${data.name}" atualizado.`);
            });
            return;
        }

        this.store.createSector({ ...data, departmentId: department.id }, sectorId => {
            this.highlight(sectorId);
            if (addAnother) {
                this.sectorForm.reset({ name: '', description: '' });
                this.sectorAddedMessage.set(`Setor "${data.name}" criado em ${department.name}. Cadastre o próximo.`);
                this.focusElement('#sectorName');
                return;
            }
            this.closeDialog();
            this.toastService.show(`Setor "${data.name}" criado em ${department.name}.`);
        });
    }

    /**
     * Confirma e exclui o setor selecionado. No sucesso, toast e foco no "⋮" do departamento (a linha do
     * setor some); na falha, foco de volta no "⋮" do setor, com o erro no card.
     */
    onDeleteSector(department: Department, sector: DepartmentSector): void {
        this.confirmDialogService.confirm({
            title: `Excluir o setor "${sector.name}"?`,
            message: `Ele deixa de aparecer em ${department.name} na abertura de chamados. Se ele tiver chamados em andamento, a exclusão é recusada. Essa ação não pode ser desfeita.`,
            confirmLabel: 'Excluir setor',
            variant: 'danger'
        }).subscribe(confirmed => {
            if (!confirmed) {
                this.focusRowActions(sector.id);
                return;
            }
            this.store.deleteSector(sector.id, () => {
                this.toastService.show(`Setor "${sector.name}" excluído de ${department.name}.`);
                this.focusRowActions(department.id);
            }, () => this.focusRowActions(sector.id));
        });
    }
}
