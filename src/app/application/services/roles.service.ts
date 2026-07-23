import { inject, Injectable, signal, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { RoleRepository } from '../../domain/interfaces/role.repository';
import { Role } from '../../domain/models/role.model';

/** Serviço de gerenciamento de roles (RBAC: Users -> Roles -> Permissions). */
@Injectable({ providedIn: 'root' })
export class RolesService {
    private readonly repository = inject(RoleRepository);

    /** Resource de leitura (GET /roles) — dispara sozinho na criação e via reload(). */
    private readonly listResource = rxResource({
        stream: () => this.repository.getAll()
    });

    /** Erro de uma mutação (create/assignPermissions); a leitura tem o próprio erro, vindo do resource. */
    private readonly mutationError = signal<string | null>(null);

    state = computed(() => {
        const result = this.listResource.value();
        const readError = result && !result.isSuccess
            ? (result.error?.message ?? 'Erro ao carregar funções')
            : null;

        return {
            data: result?.isSuccess ? result.value : [] as Role[],
            loading: this.listResource.isLoading(),
            error: this.mutationError() ?? readError
        };
    });

    roles = computed(() => this.state().data);

    load() {
        this.mutationError.set(null);
        this.listResource.reload();
    }

    create(name: string, onSuccess?: () => void) {
        this.repository.create(name).subscribe(res => {
            if (res.isSuccess) {
                this.mutationError.set(null);
                this.listResource.reload();
                onSuccess?.();
            } else {
                this.mutationError.set(res.error?.message ?? 'Erro ao criar função');
            }
        });
    }

    assignPermissions(roleId: string, permissionCodes: string[], onSuccess?: () => void) {
        this.repository.assignPermissions(roleId, permissionCodes).subscribe(res => {
            if (res.isSuccess) {
                this.mutationError.set(null);
                this.listResource.reload();
                onSuccess?.();
            } else {
                this.mutationError.set(res.error?.message ?? 'Erro ao atribuir permissões');
            }
        });
    }
}
