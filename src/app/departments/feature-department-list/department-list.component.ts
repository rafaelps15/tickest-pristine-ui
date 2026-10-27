import { Component, inject, OnInit, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { DepartmentsStore } from '../application/departments.store';
import { Department, DepartmentSector } from '../entities/department';
import { ConfirmDialogService, SessionService , ToastService} from '../../shared';
import { UserSummary } from '../../users';
import { DepartmentGuideComponent } from './department-guide.component';
import { DepartmentInsightsComponent } from './department-insights.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { FilterBarComponent } from '../../shared/ui/filter-bar/filter-bar.component';
import { EmptyStateComponent, LoadingStateComponent } from '../../shared/ui/data-state/data-state.components';
import { RowActionsComponent } from '../../shared/ui/row-actions/row-actions.component';
import { DialogComponent } from '../../shared/ui/dialog/dialog.component';

/**
 * Tela administrativa de departamentos e setores: cada departamento mostra os seus setores, e o setor é
 * sempre cadastrado a partir do departamento a que pertence.
 */
@Component({
    selector: 'app-department-list',
    imports: [ReactiveFormsModule, PageHeaderComponent, DepartmentGuideComponent, DepartmentInsightsComponent, FilterBarComponent, EmptyStateComponent, LoadingStateComponent, DialogComponent, RowActionsComponent],
    templateUrl: './department-list.component.html',
    styleUrl: './department-list.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DepartmentListComponent implements OnInit {
    /** Diálogo aberto agora (renderizado com `@if`, via `<app-dialog>`), ou `null`. */
    protected readonly openDialog = signal<'department' | 'sector' | null>(null);

    /** Fecha o diálogo aberto (X, Esc, clique fora, "Cancelar" ou depois de salvar). */
    closeDialog(): void {
        this.openDialog.set(null);
    }

    private readonly fb = inject(FormBuilder);
    protected readonly store = inject(DepartmentsStore);
    private readonly confirmDialogService = inject(ConfirmDialogService);
    private readonly sessionService = inject(SessionService);
    private readonly toastService = inject(ToastService);

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

    /** Falha ao buscar o responsável atual no modal de edição (mostrada ali, com "Tentar de novo"), ou `null`. */
    currentResponsibleError = signal<string | null>(null);

    /**
     * Se já se sabe quem é o responsável a gravar. Na edição, só depois de carregar o atual ou de o admin
     * escolher/remover um — o PUT grava o que for enviado, então salvar sem saber apagaria o responsável.
     */
    responsibleKnown = signal(true);

    /** Departamentos que batem com a busca — por nome do departamento ou de algum dos seus setores. */
    readonly filteredDepartments = computed(() => {
        const query = this.searchInput().trim().toLowerCase();
        const departments = this.store.departments();
        if (!query) return departments;

        return departments.filter(department =>
            department.name.toLowerCase().includes(query) ||
            department.sectors.some(sector => sector.name.toLowerCase().includes(query))
        );
    });

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

    constructor() {
        // Espera ~300ms após a última tecla antes de buscar, pra não buscar a cada letra digitada.
        toObservable(this.responsibleSearchInput).pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntilDestroyed()
        ).subscribe(search => this.store.searchResponsibleCandidates(search));
    }

    /** Carrega os departamentos, já com os setores de cada um. */
    ngOnInit(): void {
        this.store.load();
    }

    /** Prepara o modal de departamento para criação. */
    openCreateModal(): void {
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
     * quem está selecionado antes do admin trocar.
     */
    openEditModal(department: Department): void {
        this.openDialog.set('department');
        this.store.clearMutationError();
        this.store.clearResponsibleSearch();
        this.editingDepartment.set(department);
        this.form.setValue({ name: department.name, description: department.description });
        this.responsibleSearchInput.set('');
        this.selectedResponsibleId.set(null);
        this.selectedResponsibleName.set(department.responsibleUserName);
        this.responsibleKnown.set(false);
        this.loadCurrentResponsible(department);
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

    /** Seleciona um candidato da busca como responsável do departamento, no formulário. */
    onSelectResponsible(candidate: UserSummary): void {
        this.responsibleKnown.set(true);
        this.currentResponsibleError.set(null);
        this.selectedResponsibleId.set(candidate.id);
        this.selectedResponsibleName.set(`${candidate.firstName} ${candidate.lastName}`);
        this.responsibleSearchInput.set('');
        this.store.clearResponsibleSearch();
    }

    /** Remove o responsável selecionado no formulário de departamento (volta a "sem responsável"). */
    onClearResponsible(): void {
        this.responsibleKnown.set(true);
        this.currentResponsibleError.set(null);
        this.selectedResponsibleId.set(null);
        this.selectedResponsibleName.set(null);
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

        const onSuccess = () => {
            this.closeDialog();
            this.toastService.show(editing ? `Departamento "${data.name}" atualizado.` : `Departamento "${data.name}" criado.`);
        };

        if (editing) {
            this.store.update(editing.id, data, onSuccess);
        } else {
            this.store.create(data, onSuccess);
        }
    }

    /** Confirma e exclui o departamento selecionado, avisando que os setores dele saem junto. */
    onDelete(department: Department): void {
        const sectorCount = department.sectors.length;
        const sectorsNotice = sectorCount === 0
            ? ''
            : sectorCount === 1
                ? ' O setor dele também será excluído.'
                : ` Os ${sectorCount} setores dele também serão excluídos.`;

        this.confirmDialogService.confirm({
            title: `Excluir o departamento "${department.name}"?`,
            message: `Ele deixa de aparecer na abertura de chamados.${sectorsNotice} Essa ação não pode ser desfeita.`,
            confirmLabel: 'Excluir',
            variant: 'danger'
        }).subscribe(confirmed => {
            if (confirmed) this.store.delete(department.id);
        });
    }

    /** Prepara o modal de setor para criar um setor dentro do departamento informado. */
    openCreateSectorModal(department: Department): void {
        this.openDialog.set('sector');
        this.store.clearMutationError();
        this.sectorDepartment.set(department);
        this.editingSector.set(null);
        this.sectorForm.reset({ name: '', description: '' });
    }

    /** Prepara o modal de setor para edição do setor informado. */
    openEditSectorModal(department: Department, sector: DepartmentSector): void {
        this.openDialog.set('sector');
        this.store.clearMutationError();
        this.sectorDepartment.set(department);
        this.editingSector.set(sector);
        this.sectorForm.setValue({ name: sector.name, description: sector.description ?? '' });
    }

    /** Salva o setor do modal (cria no departamento escolhido ou atualiza) e fecha o modal em caso de sucesso. */
    onSubmitSector(): void {
        const department = this.sectorDepartment();

        if (this.sectorForm.invalid || !department) {
            this.sectorForm.markAllAsTouched();
            return;
        }

        const raw = this.sectorForm.getRawValue();
        const data = { name: raw.name!.trim(), description: raw.description?.trim() || undefined };
        const editing = this.editingSector();

        const onSuccess = () => {
            this.closeDialog();
            this.toastService.show(editing ? `Setor "${data.name}" atualizado.` : `Setor "${data.name}" criado em ${department.name}.`);
        };

        if (editing) {
            this.store.updateSector(editing.id, data, onSuccess);
        } else {
            this.store.createSector({ ...data, departmentId: department.id }, onSuccess);
        }
    }

    /** Confirma e exclui o setor selecionado. */
    onDeleteSector(department: Department, sector: DepartmentSector): void {
        this.confirmDialogService.confirm({
            title: `Excluir o setor "${sector.name}"?`,
            message: `Ele deixa de aparecer em ${department.name} na abertura de chamados. Essa ação não pode ser desfeita.`,
            confirmLabel: 'Excluir',
            variant: 'danger'
        }).subscribe(confirmed => {
            if (confirmed) this.store.deleteSector(sector.id);
        });
    }
}
