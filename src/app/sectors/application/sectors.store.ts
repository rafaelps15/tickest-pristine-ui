import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { CreateSectorData, Sector, UpdateSectorData } from '../entities/sector';
import { SectorDataService } from '../infrastructure/sector.data.service';
import { extractErrorMessage } from '../../shared';

/** Store da tela de gestão de setores: listagem, criação, atualização e exclusão. */
export const SectorsStore = signalStore(
  { providedIn: 'root' },
  withState({
    /** Erro de uma mutação (create/update/delete); a leitura tem o próprio erro, vindo do resource. */
    mutationError: null as string | null
  }),
  withProps(() => ({
    _sectorDataService: inject(SectorDataService)
  })),
  withProps((store) => ({
    /** Resource de leitura (GET /sectors) — dispara sozinho na criação e via reload(). */
    _listResource: rxResource({ stream: () => store._sectorDataService.getAll() })
  })),
  withComputed((store) => ({
    /** Lista de setores carregada, ou array vazio enquanto não houver dados. */
    sectors: computed(() => store._listResource.value() ?? []),
    /** Estado agregado da listagem: dados, carregamento e erro (leitura ou última mutação). */
    listState: computed(() => {
      const resourceError = store._listResource.error() as HttpErrorResponse | undefined;
      return {
        data: store._listResource.value() ?? ([] as Sector[]),
        loading: store._listResource.isLoading(),
        error: store.mutationError() ?? (resourceError
          ? extractErrorMessage(resourceError, {}, 'Erro ao carregar setores')
          : null)
      };
    })
  })),
  withMethods((store) => ({
    /** Recarrega a listagem de setores (GET /sectors), limpando erro de mutação anterior. */
    load(): void {
      patchState(store, { mutationError: null });
      store._listResource.reload();
    },

    /** Cria um novo setor e recarrega a listagem em caso de sucesso (POST /sectors). */
    create(data: CreateSectorData, onSuccess?: () => void): void {
      store._sectorDataService.create(data).subscribe({
        next: () => {
          patchState(store, { mutationError: null });
          store._listResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, { mutationError: extractErrorMessage(err, {}, 'Erro ao criar setor') });
        }
      });
    },

    /** Atualiza um setor existente e recarrega a listagem em caso de sucesso (PUT /sectors/{sectorId}). */
    update(sectorId: string, data: UpdateSectorData, onSuccess?: () => void): void {
      store._sectorDataService.update(sectorId, data).subscribe({
        next: () => {
          patchState(store, { mutationError: null });
          store._listResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, { mutationError: extractErrorMessage(err, {}, 'Erro ao atualizar setor') });
        }
      });
    },

    /** Exclui um setor e recarrega a listagem em caso de sucesso (DELETE /sectors/{sectorId}). */
    delete(sectorId: string): void {
      store._sectorDataService.delete(sectorId).subscribe({
        next: () => {
          patchState(store, { mutationError: null });
          store._listResource.reload();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, { mutationError: extractErrorMessage(err, {}, 'Erro ao excluir setor') });
        }
      });
    }
  }))
);
