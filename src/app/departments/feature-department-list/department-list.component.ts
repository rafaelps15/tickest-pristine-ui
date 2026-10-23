import { Component, inject, OnInit, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentsStore } from '../application/departments.store';
import { Department, DepartmentSector } from '../entities/department';
import { ConfirmDialogService, SessionService } from '../../shared';

/**
 * Tela administrativa de departamentos e setores: cada departamento mostra os seus setores, e o setor é
 * sempre cadastrado a partir do departamento a que pertence.
 */
@Component({
    selector: 'app-department-list',
    imports: [ReactiveFormsModule],
    templateUrl: './department-list.component.html',
    styleUrl: './department-list.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DepartmentListComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    protected readonly store = inject(DepartmentsStore);
    private readonly confirmDialogService = inject(ConfirmDialogService);
    private readonly sessionService = inject(SessionService);

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

    /** Carrega os departamentos, já com os setores de cada um. */
    ngOnInit(): void {
        this.store.load();
    }

    /** Prepara o modal de departamento para criação. */
    openCreateModal(): void {
        this.store.clearMutationError();
        this.editingDepartment.set(null);
        this.form.reset({ name: '', description: '' });
    }

    /** Prepara o modal de departamento para edição do departamento informado. */
    openEditModal(department: Department): void {
        this.store.clearMutationError();
        this.editingDepartment.set(department);
        this.form.setValue({ name: department.name, description: department.description });
    }

    /** Salva o departamento do modal (cria ou atualiza) e fecha o modal em caso de sucesso. */
    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const raw = this.form.getRawValue();
        const data = { name: raw.name!.trim(), description: raw.description!.trim() };
        const editing = this.editingDepartment();

        const onSuccess = () => document.getElementById('departmentModalCloseButton')?.click();

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
        this.store.clearMutationError();
        this.sectorDepartment.set(department);
        this.editingSector.set(null);
        this.sectorForm.reset({ name: '', description: '' });
    }

    /** Prepara o modal de setor para edição do setor informado. */
    openEditSectorModal(department: Department, sector: DepartmentSector): void {
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

        const onSuccess = () => document.getElementById('sectorModalCloseButton')?.click();

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
