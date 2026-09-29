import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { Role } from '../entities/role';
import { RoleDataService } from '../infrastructure/role.data.service';
import { PermissionDataService } from '../infrastructure/permission.data.service';
import { extractErrorMessage } from '../../shared';

/** Store de roles: listagem, criação e atribuição de permissões (RBAC: Users -> Roles -> Permissions). */
export const RolesStore = signalStore(
  { providedIn: 'root' },
  withState({
    mutationError: null as string | null,
    permissionsMutationError: null as string | null
  }),
  withProps(() => ({
    _roleDataService: inject(RoleDataService),
    _permissionDataService: inject(PermissionDataService)
  })),
  withProps((store) => ({
    _listResource: rxResource({ stream: () => store._roleDataService.getAll() }),
    _permissionsResource: rxResource({ stream: () => store._permissionDataService.getAll() })
  })),
  withComputed((store) => ({
    /** Roles carregadas (GET /roles), usadas tanto na tela de roles quanto no checklist de atribuição de usuários. */
    roles: computed(() => store._listResource.value() ?? []),
    /** Estado agregado da listagem de roles (dados, carregamento e erro). */
    listState: computed(() => {
      const resourceError = store._listResource.error() as HttpErrorResponse | undefined;
      return {
        data: store._listResource.value() ?? ([] as Role[]),
        loading: store._listResource.isLoading(),
        error: store.mutationError() ?? (resourceError
          ? extractErrorMessage(resourceError, {}, 'Erro ao carregar funções')
          : null)
      };
    }),
    /** Códigos de permissão disponíveis no sistema (GET /permissions). */
    permissionCodes: computed(() => store._permissionsResource.value() ?? []),
    /** Estado agregado da listagem de permissões (dados, carregamento e erro). */
    permissionsState: computed(() => {
      const resourceError = store._permissionsResource.error() as HttpErrorResponse | undefined;
      return {
        data: store._permissionsResource.value() ?? ([] as string[]),
        loading: store._permissionsResource.isLoading(),
        error: store.permissionsMutationError() ?? (resourceError
          ? extractErrorMessage(resourceError, {}, 'Erro ao carregar permissões')
          : null)
      };
    })
  })),
  withMethods((store) => ({
    /** Recarrega a listagem de roles (GET /roles). */
    load(): void {
      patchState(store, { mutationError: null });
      store._listResource.reload();
    },

    /** Recarrega os códigos de permissão disponíveis (GET /permissions). */
    loadPermissions(): void {
      patchState(store, { permissionsMutationError: null });
      store._permissionsResource.reload();
    },

    /** Cria uma nova role (POST /roles) e recarrega a listagem em caso de sucesso. */
    create(name: string, onSuccess?: () => void): void {
      store._roleDataService.create(name).subscribe({
        next: () => {
          patchState(store, { mutationError: null });
          store._listResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, { mutationError: extractErrorMessage(err, {}, 'Erro ao criar função') });
        }
      });
    },

    /** Substitui as permissões associadas a uma role (PUT /roles/{id}/permissions) e recarrega a listagem em caso de sucesso. */
    assignPermissions(roleId: string, permissionCodes: string[], onSuccess?: () => void): void {
      store._roleDataService.assignPermissions(roleId, permissionCodes).subscribe({
        next: () => {
          patchState(store, { mutationError: null });
          store._listResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, { mutationError: extractErrorMessage(err, {}, 'Erro ao atribuir permissões') });
        }
      });
    }
  }))
);
