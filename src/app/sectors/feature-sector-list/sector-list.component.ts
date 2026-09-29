import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SectorsStore } from '../application/sectors.store';
import { DepartmentsStore } from '../../departments';
import { Sector } from '../entities/sector';

/** Tela administrativa de gestão de setores (CRUD). */
@Component({
    selector: 'app-sector-list',
    imports: [ReactiveFormsModule],
    templateUrl: './sector-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './sector-list.component.css'
})
export class SectorListComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    protected readonly store = inject(SectorsStore);
    protected readonly departmentsStore = inject(DepartmentsStore);

    /** Setor em edição (null quando o modal está no modo "criar"). */
    editingSector = signal<Sector | null>(null);

    form = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(100)]],
        description: ['', [Validators.maxLength(500)]],
        departmentId: ['', [Validators.required]]
    });

    /** Carrega a listagem de setores e de departamentos ao inicializar a tela. */
    ngOnInit(): void {
        this.store.load();
        this.departmentsStore.load();
    }

    /** Resolve o nome do departamento a partir do id, para exibição na tabela. */
    departmentName(departmentId: string): string {
        return this.departmentsStore.departments().find(d => d.id === departmentId)?.name ?? '—';
    }

    /** Prepara o formulário para criação de um novo setor. */
    openCreateModal(): void {
        this.editingSector.set(null);
        this.form.reset({ name: '', description: '', departmentId: '' });
        this.form.controls.departmentId.enable();
    }

    /** Prepara o formulário para edição de um setor existente. */
    openEditModal(sector: Sector): void {
        this.editingSector.set(sector);
        this.form.setValue({
            name: sector.name,
            description: sector.description ?? '',
            departmentId: sector.departmentId
        });
        // Ao editar, o departamento não pode ser trocado pela API atual — mantém apenas leitura.
        this.form.controls.departmentId.disable();
    }

    /** Envia o formulário: cria ou atualiza o setor conforme o modo atual. */
    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const raw = this.form.getRawValue();
        const editing = this.editingSector();

        const onSuccess = () => document.getElementById('sectorModalCloseButton')?.click();

        if (editing) {
            this.store.update(editing.id, { name: raw.name!, description: raw.description ?? undefined }, onSuccess);
        } else {
            this.store.create({ name: raw.name!, description: raw.description ?? undefined, departmentId: raw.departmentId! }, onSuccess);
        }
    }

    /** Solicita confirmação e exclui o setor selecionado. */
    onDelete(sector: Sector): void {
        if (confirm(`Tem certeza que deseja excluir o setor "${sector.name}"?`)) {
            this.store.delete(sector.id);
        }
    }
}
