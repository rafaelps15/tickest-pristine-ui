import { inject, Injectable, signal, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { DepartmentRepository } from '../../domain/interfaces/department.repository';
import { Department, DepartmentData } from '../../domain/models/department.model';

/** Serviço de gerenciamento de departamentos. */
@Injectable({ providedIn: 'root' })
export class DepartmentsService {
    private readonly repository = inject(DepartmentRepository);

    /** Resource de leitura (GET /departments) — dispara sozinho na criação e via reload(). */
    private readonly listResource = rxResource({
        stream: () => this.repository.getAll()
    });

    /** Erro de uma mutação (create/update/delete); a leitura tem o próprio erro, vindo do resource. */
    private readonly mutationError = signal<string | null>(null);

    state = computed(() => {
        const result = this.listResource.value();
        const readError = result && !result.isSuccess
            ? (result.error?.message ?? 'Erro ao carregar departamentos')
            : null;

        return {
            data: result?.isSuccess ? result.value : [] as Department[],
            loading: this.listResource.isLoading(),
            error: this.mutationError() ?? readError
        };
    });

    departments = computed(() => this.state().data);

    load() {
        this.mutationError.set(null);
        this.listResource.reload();
    }

    create(data: DepartmentData, onSuccess?: () => void) {
        this.repository.create(data).subscribe(res => {
            if (res.isSuccess) {
                this.mutationError.set(null);
                this.listResource.reload();
                onSuccess?.();
            } else {
                this.mutationError.set(res.error?.message ?? 'Erro ao criar departamento');
            }
        });
    }

    update(departmentId: string, data: DepartmentData, onSuccess?: () => void) {
        this.repository.update(departmentId, data).subscribe(res => {
            if (res.isSuccess) {
                this.mutationError.set(null);
                this.listResource.reload();
                onSuccess?.();
            } else {
                this.mutationError.set(res.error?.message ?? 'Erro ao atualizar departamento');
            }
        });
    }

    delete(departmentId: string) {
        this.repository.delete(departmentId).subscribe(res => {
            if (res.isSuccess) this.listResource.reload();
        });
    }
}
