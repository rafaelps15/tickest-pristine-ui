import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { Role } from '../entities/role';
import { Permission } from '../entities/permission';
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
    /** Catálogo de permissões disponíveis no sistema, com nome/descrição/grupo (GET /permissions). */
    permissions: computed(() => store._permissionsResource.value() ?? []),
    /** Estado agregado do catálogo de permissões (dados, carregamento e erro). */
    permissionsState: computed(() => {
      const resourceError = store._permissionsResource.error() as HttpErrorResponse | undefined;
      return {
        data: store._permissionsResource.value() ?? ([] as Permission[]),
        loading: store._permissionsResource.isLoading(),
        error: store.permissionsMutationError() ?? (resourceError
          ? extractErrorMessage(resourceError, {}, 'Erro ao carregar permissões')
          : null)
      };
    })
  })),
  withComputed((store) => ({
    /** Catálogo de permissões agrupado por `group`, preservando a ordem de grupos e permissões como vieram da API. */
    permissionGroups: computed(() => {
      const groups: { title: string; permissions: Permission[] }[] = [];
      const indexByTitle = new Map<string, number>();

      for (const permission of store.permissions()) {
        let index = indexByTitle.get(permission.group);
        if (index === undefined) {
          index = groups.length;
          indexByTitle.set(permission.group, index);
          groups.push({ title: permission.group, permissions: [] });
        }
        groups[index].permissions.push(permission);
      }

      return groups;
    })
  })),
  withMethods((store) => ({
    /** Nome amigável de um código de permissão; devolve o próprio código se não encontrado no catálogo. */
    permissionName(code: string): string {
      return store.permissions().find(permission => permission.code === code)?.name ?? code;
    },

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
