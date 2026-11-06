import { signalStore, withState, withProps, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { finalize, map } from 'rxjs';
import { Department, DepartmentData } from '../entities/department';
import { CreateSectorData, UpdateSectorData } from '../entities/sector';
import { DepartmentDataService } from '../infrastructure/department.data.service';
import { SectorDataService } from '../infrastructure/sector.data.service';
import { extractErrorMessage, termSearchResource, valueOf } from '../../shared';
import { UserDataService } from '../../users';

/**
 * Store de departamentos e dos setores dentro deles: listagem (GET /departments, com os setores aninhados)
 * e mutações de ambos, mais a busca de usuário candidato a responsável do departamento (GET /users).
 * Toda mutação de setor recarrega a listagem de departamentos.
 */
export const DepartmentsStore = signalStore(
  { providedIn: 'root' },
  withState({
    /** Falha da última criação/atualização de departamento ou setor — mostrada só dentro do diálogo. */
    mutationError: null as string | null,
    /** Em voo uma criação/atualização/exclusão de departamento ou setor — evita duplo submit. */
    mutating: false,
    /** Id do departamento ou setor sendo desativado agora (um por vez — evita o clique duplo), ou `null`. */
    deactivatingId: null as string | null,
    /**
     * Falha da última exclusão, com o id do departamento ou setor: a tela mostra no card dele, perto de
     * onde a ação partiu, em vez do alerta da página.
     */
    deactivateError: null as { targetId: string; message: string } | null,
    /**
     * Termo da última busca de responsável pedida (`null` = sem busca): enquanto ele difere do que está
     * digitado, a tela trata como "buscando" — senão o "Nenhum usuário encontrado" piscava durante o debounce.
     */
    responsibleSearchTerm: null as string | null
  }),
  withProps(() => ({
    /** Acesso HTTP aos departamentos (listagem, criação, atualização e desativação). */
    _departmentDataService: inject(DepartmentDataService),
    /** Acesso HTTP aos setores (criação, atualização e desativação). */
    _sectorDataService: inject(SectorDataService),
    /** Acesso HTTP aos usuários, pra busca de candidato a responsável (GET /users). */
    _userDataService: inject(UserDataService)
  })),
  withProps((store) => ({
    /** Departamentos com os setores aninhados (GET /departments), recarregados depois de cada mutação. */
    _listResource: rxResource({ stream: () => store._departmentDataService.getAll() }),
    /** Usuários ativos candidatos a responsável pelo termo (GET /users): um termo novo cancela a busca anterior. */
    _responsibleSearchResource: termSearchResource(store.responsibleSearchTerm, term =>
      store._userDataService.getAll({ status: 'Active', search: term, page: 1, pageSize: 8 }).pipe(map(page => page.items)))
  })),
  withComputed((store) => ({
    /** Departamentos carregados, já com os setores (vazio enquanto carrega ou se a carga falhou). */
    departments: computed(() => valueOf(store._listResource) ?? ([] as Department[])),
    /**
     * Estado da carga da listagem. O erro é só o da leitura: falha de salvar fica no diálogo
     * ({@link mutationError}) e de desativar no card ({@link deactivateError}) — antes o erro de salvar
     * entrava aqui e a tela dizia que a lista não tinha carregado.
     */
    listState: computed(() => {
      const resourceError = store._listResource.error() as HttpErrorResponse | undefined;
      return {
        loading: store._listResource.isLoading(),
        error: resourceError ? extractErrorMessage(resourceError, {}, 'Erro ao carregar departamentos') : null
      };
    }),
    /** Candidatos a responsável da última busca (vazio sem busca, durante a busca ou na falha). */
    responsibleCandidates: computed(() => valueOf(store._responsibleSearchResource) ?? []),
    /** Em voo uma busca de candidatos a responsável. */
    searchingResponsible: computed(() => store._responsibleSearchResource.isLoading()),
    /** Falha da última busca de candidatos a responsável, ou `null`. */
    responsibleSearchError: computed(() => {
      const error = store._responsibleSearchResource.error() as HttpErrorResponse | undefined;
      return error ? extractErrorMessage(error, {}, 'Erro ao buscar usuários') : null;
    })
  })),
  withMethods((store) => ({
    /** Recarrega a listagem de departamentos (GET /departments). */
    load(): void {
      patchState(store, { mutationError: null });
      store._listResource.reload();
    },

    /**
     * Cria um novo departamento e recarrega a listagem em caso de sucesso (POST /departments). O
     * `onSuccess` recebe o id criado — a tela oferece cadastrar o primeiro setor nele.
     */
    create(data: DepartmentData, onSuccess?: (departmentId: string) => void): void {
      patchState(store, { mutating: true });
      store._departmentDataService.create(data).pipe(
        finalize(() => patchState(store, { mutating: false }))
      ).subscribe({
        next: (departmentId) => {
          patchState(store, { mutationError: null });
          store._listResource.reload();
          onSuccess?.(departmentId);
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
     * Busca usuários ativos candidatos a responsável do departamento, pelo nome/sobrenome/e-mail (GET
     * /users). Um termo novo cancela a busca anterior em voo — uma resposta antiga e lenta não
     * sobrescreve mais a da busca atual.
     */
    searchResponsibleCandidates(search: string): void {
      patchState(store, { responsibleSearchTerm: search.trim() || null });
    },

    /** Limpa a busca e os candidatos a responsável (ex.: ao fechar/reabrir o modal de departamento). */
    clearResponsibleSearch(): void {
      patchState(store, { responsibleSearchTerm: null });
    },

    /**
     * Desativa um departamento e os setores dele e recarrega a listagem em caso de sucesso (DELETE
     * /departments/{id}: o back-end mantém o registro, desativado). Ignora o pedido se já há uma desativação em voo; a falha vai pra {@link deactivateError}, com o id do departamento,
     * e avisa o `onError` (a tela devolve o foco pro card).
     */
    deactivate(departmentId: string, onSuccess?: () => void, onError?: () => void): void {
      if (store.deactivatingId()) return;
      patchState(store, { deactivatingId: departmentId, deactivateError: null });

      store._departmentDataService.deactivate(departmentId).pipe(
        finalize(() => patchState(store, { deactivatingId: null }))
      ).subscribe({
        next: () => {
          store._listResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, {
            deactivateError: { targetId: departmentId, message: extractErrorMessage(err, {}, 'Não foi possível desativar o departamento.') }
          });
          onError?.();
        }
      });
    },

    /** Cria um setor dentro de um departamento e recarrega a listagem em caso de sucesso (POST /sectors). */
    createSector(data: CreateSectorData, onSuccess?: (sectorId: string) => void): void {
      patchState(store, { mutating: true });
      store._sectorDataService.create(data).pipe(
        finalize(() => patchState(store, { mutating: false }))
      ).subscribe({
        next: (sectorId) => {
          patchState(store, { mutationError: null });
          store._listResource.reload();
          onSuccess?.(sectorId);
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

    /**
     * Desativa um setor e recarrega a listagem em caso de sucesso (DELETE /sectors/{sectorId}: o back-end
     * mantém o registro, desativado). Mesma guarda e mesmo destino de erro de {@link deactivate}, com o id do setor.
     */
    deactivateSector(sectorId: string, onSuccess?: () => void, onError?: () => void): void {
      if (store.deactivatingId()) return;
      patchState(store, { deactivatingId: sectorId, deactivateError: null });

      store._sectorDataService.deactivate(sectorId).pipe(
        finalize(() => patchState(store, { deactivatingId: null }))
      ).subscribe({
        next: () => {
          store._listResource.reload();
          onSuccess?.();
        },
        error: (err: HttpErrorResponse) => {
          patchState(store, {
            deactivateError: { targetId: sectorId, message: extractErrorMessage(err, {}, 'Não foi possível desativar o setor.') }
          });
          onError?.();
        }
      });
    },

    /** Limpa o erro da última mutação (ex.: ao abrir um formulário novo). */
    clearMutationError(): void {
      patchState(store, { mutationError: null });
    },

    /** Fecha o aviso de falha da última desativação. */
    clearDeactivateError(): void {
      patchState(store, { deactivateError: null });
    }
  }))
);
