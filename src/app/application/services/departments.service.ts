import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { DepartmentRepository } from '../../domain/interfaces/department.repository';
import { Department, DepartmentData } from '../../domain/models/department.model';
import { extractErrorMessage } from '../../core/utils/http-error.util';

/** Serviço de gerenciamento de departamentos. */
@Injectable({ providedIn: 'root' })
export class DepartmentsService {
    private readonly repository = inject(DepartmentRepository);

    state = signal({
        data: [] as Department[],
        loading: false,
        error: null as string | null
    });

    departments = computed(() => this.state().data);

    load() {
        this.state.update(s => ({ ...s, loading: true, error: null }));

        this.repository.getAll()
            .pipe(finalize(() => this.state.update(s => ({ ...s, loading: false }))))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.state.update(s => ({ ...s, data: res.value }));
                    } else {
                        this.state.update(s => ({ ...s, error: res.error?.message ?? 'Erro ao carregar departamentos' }));
                    }
                },
                error: (err: HttpErrorResponse) => {
                    const message = extractErrorMessage(err, {}, 'Não foi possível carregar os departamentos.');
                    this.state.update(s => ({ ...s, error: message }));
                }
            });
    }

    create(data: DepartmentData, onSuccess?: () => void) {
        this.repository.create(data).subscribe(res => {
            if (res.isSuccess) {
                this.load();
                onSuccess?.();
            } else {
                this.state.update(s => ({ ...s, error: res.error?.message ?? 'Erro ao criar departamento' }));
            }
        });
    }

    update(departmentId: string, data: DepartmentData, onSuccess?: () => void) {
        this.repository.update(departmentId, data).subscribe(res => {
            if (res.isSuccess) {
                this.load();
                onSuccess?.();
            } else {
                this.state.update(s => ({ ...s, error: res.error?.message ?? 'Erro ao atualizar departamento' }));
            }
        });
    }

    delete(departmentId: string) {
        this.repository.delete(departmentId).subscribe(res => {
            if (res.isSuccess) this.load();
        });
    }
}
