import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { Department, DepartmentData } from '../entities/department';
import { DepartmentDataService } from '../infrastructure/department.data.service';
import { extractErrorMessage } from '../../shared';

/** Store de departamentos: listagem e mutações (criação, atualização e exclusão). */
export const DepartmentsStore = signalStore(
  { providedIn: 'root' },
  withState({
    mutationError: null as string | null
  }),
  withProps(() => ({
    _departmentDataService: inject(DepartmentDataService)
  })),
  withProps((store) => ({
    _listResource: rxResource({ stream: () => store._departmentDataService.getAll() })
  })),
  withComputed((store) => ({
    departments: computed(() => store._listResource.value() ?? []),
    listState: computed(() => {
      const resourceError = store._listResource.error() as HttpErrorResponse | undefined;
      return {
        data: store._listResource.value() ?? ([] as Department[]),
        loading: store._listResource.isLoading(),
        error: store.mutationError() ?? (resourceError
          ? extractErrorMessage(resourceError, {}, 'Erro ao carregar departamentos')
          : null)
      };
    })
  })),
  withMethods((store) => ({
    /** Recarrega a listagem de departamentos (GET /departments). */
    load(): void {
      patchState(store, { mutationError: null });
      store._listResource.reload();
    },

    /** Cria um novo departamento e recarrega a listagem em caso de sucesso (POST /departments). */
    create(data: DepartmentData, onSuccess?: () => void): void {
      store._departmentDataService.create(data).subscribe({
        next: () => {
          patchState(store, { mutationError: null });
          store._listResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, { mutationError: extractErrorMessage(err, {}, 'Erro ao criar departamento') });
        }
      });
    },

    /** Atualiza um departamento existente e recarrega a listagem em caso de sucesso (PUT /departments/{id}). */
    update(departmentId: string, data: DepartmentData, onSuccess?: () => void): void {
      store._departmentDataService.update(departmentId, data).subscribe({
        next: () => {
          patchState(store, { mutationError: null });
          store._listResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, { mutationError: extractErrorMessage(err, {}, 'Erro ao atualizar departamento') });
        }
      });
    },

    /** Exclui um departamento e recarrega a listagem em caso de sucesso (DELETE /departments/{id}). */
    delete(departmentId: string): void {
      store._departmentDataService.delete(departmentId).subscribe({
        next: () => {
          patchState(store, { mutationError: null });
          store._listResource.reload();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, { mutationError: extractErrorMessage(err, {}, 'Erro ao excluir departamento') });
        }
      });
    }
  }))
);
