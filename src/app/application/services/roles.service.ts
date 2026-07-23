import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { RoleRepository } from '../../domain/interfaces/role.repository';
import { Role } from '../../domain/models/role.model';
import { extractErrorMessage } from '../../core/utils/http-error.util';

/** Serviço de gerenciamento de roles (RBAC: Users -> Roles -> Permissions). */
@Injectable({ providedIn: 'root' })
export class RolesService {
    private readonly repository = inject(RoleRepository);

    state = signal({
        data: [] as Role[],
        loading: false,
        error: null as string | null
    });

    roles = computed(() => this.state().data);

    load() {
        this.state.update(s => ({ ...s, loading: true, error: null }));

        this.repository.getAll()
            .pipe(finalize(() => this.state.update(s => ({ ...s, loading: false }))))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.state.update(s => ({ ...s, data: res.value }));
                    } else {
                        this.state.update(s => ({ ...s, error: res.error?.message ?? 'Erro ao carregar roles' }));
                    }
                },
                error: (err: HttpErrorResponse) => {
                    const message = extractErrorMessage(err, {}, 'Não foi possível carregar as roles.');
                    this.state.update(s => ({ ...s, error: message }));
                }
            });
    }

    create(name: string, onSuccess?: () => void) {
        this.repository.create(name).subscribe(res => {
            if (res.isSuccess) {
                this.load();
                onSuccess?.();
            } else {
                this.state.update(s => ({ ...s, error: res.error?.message ?? 'Erro ao criar role' }));
            }
        });
    }

    assignPermissions(roleId: string, permissionCodes: string[], onSuccess?: () => void) {
        this.repository.assignPermissions(roleId, permissionCodes).subscribe(res => {
            if (res.isSuccess) {
                this.load();
                onSuccess?.();
            } else {
                this.state.update(s => ({ ...s, error: res.error?.message ?? 'Erro ao atribuir permissões' }));
            }
        });
    }
}
