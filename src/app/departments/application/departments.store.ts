import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Department, DepartmentData, DepartmentDetail } from '../entities/department';
import { CreateSectorData, UpdateSectorData } from '../entities/sector';
import { DepartmentDataService } from '../infrastructure/department.data.service';
import { SectorDataService } from '../infrastructure/sector.data.service';
import { extractErrorMessage, valueOf } from '../../shared';
import { UserDataService, UserSummary } from '../../users';

/**
 * Store de departamentos e dos setores dentro deles: listagem (GET /departments, com os setores aninhados)
 * e mutações de ambos, mais a busca de usuário candidato a responsável do departamento (GET /users).
 * Toda mutação de setor recarrega a listagem de departamentos.
 */
export const DepartmentsStore = signalStore(
  { providedIn: 'root' },
  withState({
    mutationError: null as string | null,
    /** Em voo uma criação/atualização/exclusão de departamento ou setor — evita duplo submit. */
    mutating: false,
    /** Candidatos a responsável encontrados na busca do formulário de departamento. */
    responsibleCandidates: [] as UserSummary[],
    searchingResponsible: false,
    responsibleSearchError: null as string | null
  }),
  withProps(() => ({
    _departmentDataService: inject(DepartmentDataService),
    _sectorDataService: inject(SectorDataService),
    _userDataService: inject(UserDataService)
  })),
  withProps((store) => ({
    _listResource: rxResource({ stream: () => store._departmentDataService.getAll() })
  })),
  withComputed((store) => ({
    departments: computed(() => valueOf(store._listResource) ?? []),
    listState: computed(() => {
      const resourceError = store._listResource.error() as HttpErrorResponse | undefined;
      return {
        data: valueOf(store._listResource) ?? ([] as Department[]),
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
      patchState(store, { mutating: true });
      store._departmentDataService.create(data).pipe(
        finalize(() => patchState(store, { mutating: false }))
      ).subscribe({
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
      patchState(store, { mutating: true });
      store._departmentDataService.update(departmentId, data).pipe(
        finalize(() => patchState(store, { mutating: false }))
      ).subscribe({
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

    /**
     * Busca o detalhe de um departamento, incluindo o id do responsável (GET /departments/{id}) —
     * a listagem só traz o nome dele. Usado ao abrir o modal de edição, pra saber quem já está
     * selecionado antes do admin trocar. A falha vai pro `onError` (o modal mostra ali mesmo), não pro
     * erro de mutação — senão apareceria também no alerta da página, atrás do modal. A mensagem é
     * sempre a do modal (a da API, tipo "Falha no servidor", não diz o que ficou faltando), exceto sem
     * conexão.
     */
    getDepartmentDetail(departmentId: string, onLoaded: (detail: DepartmentDetail) => void, onError?: (message: string) => void): void {
      store._departmentDataService.getById(departmentId).subscribe({
        next: onLoaded,
        error: (err: HttpErrorResponse) => {
          onError?.(err.status === 0
            ? extractErrorMessage(err)
            : 'Não foi possível carregar o responsável atual.');
        }
      });
    },

    /** Busca usuários ativos candidatos a responsável do departamento, pelo nome/sobrenome/e-mail (GET /users). */
    searchResponsibleCandidates(search: string): void {
      const trimmed = search.trim();
      if (!trimmed) {
        patchState(store, { responsibleCandidates: [], searchingResponsible: false, responsibleSearchError: null });
        return;
      }

      patchState(store, { searchingResponsible: true, responsibleSearchError: null });

      store._userDataService.getAll({ status: 'Active', search: trimmed, page: 1, pageSize: 8 }).pipe(
        finalize(() => patchState(store, { searchingResponsible: false }))
      ).subscribe({
        next: (page) => patchState(store, { responsibleCandidates: page.items }),
        error: (err: HttpErrorResponse) => patchState(store, {
          responsibleCandidates: [],
          responsibleSearchError: extractErrorMessage(err, {}, 'Erro ao buscar usuários')
        })
      });
    },

    /** Limpa a busca e os candidatos a responsável (ex.: ao fechar/reabrir o modal de departamento). */
    clearResponsibleSearch(): void {
      patchState(store, { responsibleCandidates: [], responsibleSearchError: null });
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
    },

    /** Cria um setor dentro de um departamento e recarrega a listagem em caso de sucesso (POST /sectors). */
    createSector(data: CreateSectorData, onSuccess?: () => void): void {
      patchState(store, { mutating: true });
      store._sectorDataService.create(data).pipe(
        finalize(() => patchState(store, { mutating: false }))
      ).subscribe({
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
    updateSector(sectorId: string, data: UpdateSectorData, onSuccess?: () => void): void {
      patchState(store, { mutating: true });
      store._sectorDataService.update(sectorId, data).pipe(
        finalize(() => patchState(store, { mutating: false }))
      ).subscribe({
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
    deleteSector(sectorId: string): void {
      store._sectorDataService.delete(sectorId).subscribe({
        next: () => {
          patchState(store, { mutationError: null });
          store._listResource.reload();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, { mutationError: extractErrorMessage(err, {}, 'Erro ao excluir setor') });
        }
      });
    },

    /** Limpa o erro da última mutação (ex.: ao abrir um formulário novo). */
    clearMutationError(): void {
      patchState(store, { mutationError: null });
    }
  }))
);
