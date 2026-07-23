import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SectorsService } from '../../../../application/services/sectors.service';
import { DepartmentsService } from '../../../../application/services/departments.service';
import { Sector } from '../../../../domain/models/sector.model';

/** Tela administrativa de gestão de setores (CRUD). */
@Component({
    selector: 'app-sector-list',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './sector-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './sector-list.component.css'
})
export class SectorListComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    protected readonly sectorsService = inject(SectorsService);
    protected readonly departmentsService = inject(DepartmentsService);

    /** Setor em edição (null quando o modal está no modo "criar"). */
    editingSector = signal<Sector | null>(null);

    form = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(100)]],
        description: ['', [Validators.maxLength(500)]],
        departmentId: ['', [Validators.required]]
    });

    ngOnInit(): void {
        this.sectorsService.load();
        this.departmentsService.load();
    }

    departmentName(departmentId: string): string {
        return this.departmentsService.departments().find(d => d.id === departmentId)?.name ?? '—';
    }

    openCreateModal(): void {
        this.editingSector.set(null);
        this.form.reset({ name: '', description: '', departmentId: '' });
        this.form.controls.departmentId.enable();
    }

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

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const raw = this.form.getRawValue();
        const editing = this.editingSector();

        const onSuccess = () => document.getElementById('sectorModalCloseButton')?.click();

        if (editing) {
            this.sectorsService.update(editing.id, { name: raw.name!, description: raw.description ?? undefined }, onSuccess);
        } else {
            this.sectorsService.create({ name: raw.name!, description: raw.description ?? undefined, departmentId: raw.departmentId! }, onSuccess);
        }
    }

    onDelete(sector: Sector): void {
        if (confirm(`Tem certeza que deseja excluir o setor "${sector.name}"?`)) {
            this.sectorsService.delete(sector.id);
        }
    }
}
