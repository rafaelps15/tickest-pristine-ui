import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentsStore } from '../application/departments.store';
import { Department } from '../entities/department';

/** Tela administrativa de gestão de departamentos (CRUD). */
@Component({
    selector: 'app-department-list',
    imports: [ReactiveFormsModule],
    templateUrl: './department-list.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './department-list.component.css'
})
export class DepartmentListComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    protected readonly store = inject(DepartmentsStore);

    /** Departamento em edição (null quando o modal está no modo "criar"). */
    editingDepartment = signal<Department | null>(null);

    form = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(100)]],
        description: ['', [Validators.required, Validators.maxLength(500)]]
    });

    ngOnInit(): void {
        this.store.load();
    }

    openCreateModal(): void {
        this.editingDepartment.set(null);
        this.form.reset({ name: '', description: '' });
    }

    openEditModal(department: Department): void {
        this.editingDepartment.set(department);
        this.form.setValue({ name: department.name, description: department.description });
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const raw = this.form.getRawValue();
        const data = { name: raw.name!, description: raw.description! };
        const editing = this.editingDepartment();

        const onSuccess = () => document.getElementById('departmentModalCloseButton')?.click();

        if (editing) {
            this.store.update(editing.id, data, onSuccess);
        } else {
            this.store.create(data, onSuccess);
        }
    }

    onDelete(department: Department): void {
        if (confirm(`Tem certeza que deseja excluir o departamento "${department.name}"?`)) {
            this.store.delete(department.id);
        }
    }
}
