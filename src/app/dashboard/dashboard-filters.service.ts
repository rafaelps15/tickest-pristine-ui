import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { DashboardFilters, dashboardFiltersToQueryParams, hasDashboardFilters, parseDashboardFilters } from './dashboard-filters';
import { queryParamsMatch } from '../shared';

/**
 * Filtros do Início com a URL como fonte da verdade: lê a query string (inclusive voltar/avançar
 * do navegador) e escreve nela ao trocar um filtro. Cada troca vira uma entrada no histórico, pra
 * o "voltar" desfazer o filtro. Fornecido pelo próprio componente da tela (não é root).
 */
@Injectable()
export class DashboardFiltersService {
  /** Rota atual, de onde vêm os filtros (query string). */
  private readonly route = inject(ActivatedRoute);
  /** Router, pra gravar os filtros na URL. */
  private readonly router = inject(Router);

  /** Filtros atuais, sempre derivados da URL. */
  readonly filters = toSignal(this.route.queryParamMap.pipe(map(parseDashboardFilters)), {
    initialValue: parseDashboardFilters(this.route.snapshot.queryParamMap)
  });

  /** Se há algum filtro aplicado. */
  readonly active = computed(() => hasDashboardFilters(this.filters()));

  /** Troca uma parte dos filtros (valor `undefined` remove aquele filtro) e grava na URL. */
  update(partial: Partial<DashboardFilters>): void {
    this.navigate({ ...this.filters(), ...partial });
  }

  /** Remove todos os filtros. */
  clear(): void {
    this.navigate({});
  }

  /** Grava os filtros na URL, mantendo os outros parâmetros da tela; só navega se algo mudou. */
  private navigate(filters: DashboardFilters): void {
    const queryParams = dashboardFiltersToQueryParams(filters);
    if (queryParamsMatch(this.route.snapshot.queryParamMap, queryParams)) return;
    this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }
}
