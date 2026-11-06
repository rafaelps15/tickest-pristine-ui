import { effect, inject } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

/** Valor de um parâmetro da query string montado pela tela: texto, número, lista (parâmetro repetido) ou `null` (fora da URL). */
export type QueryParamValue = string | number | string[] | null;

/** Parâmetros que a tela quer na query string, por nome. */
export type QueryParamsTarget = Record<string, QueryParamValue>;

/** Se a query string atual já tem esses valores: `null` é ausente, e uma lista compara o parâmetro repetido na ordem. */
export function queryParamsMatch(current: ParamMap, target: QueryParamsTarget): boolean {
  return Object.entries(target).every(([key, value]) => Array.isArray(value)
    ? current.getAll(key).join() === value.join()
    : current.get(key) === (value === null ? null : String(value)));
}

/**
 * Mantém a query string igual ao estado da tela: a cada mudança dos parâmetros, navega para eles sem empilhar
 * histórico (`replaceUrl`, para o "Voltar" sair da tela em vez de desfazer filtro por filtro), e só quando eles
 * diferem da URL atual — não regrava o estado que acabou de ser lido dela. Precisa de contexto de injeção
 * (o construtor da tela).
 */
export function syncQueryParamsToUrl(queryParams: () => QueryParamsTarget): void {
  const router = inject(Router);
  const route = inject(ActivatedRoute);

  effect(() => {
    const target = queryParams();
    if (queryParamsMatch(route.snapshot.queryParamMap, target)) return;

    router.navigate([], { relativeTo: route, queryParams: target, replaceUrl: true });
  });
}

/**
 * Volta para a última página válida quando a página pedida passa do total (ex.: link salvo de quando havia mais
 * resultados), em vez de mostrar uma tabela vazia. Precisa de contexto de injeção (o construtor da tela).
 */
export function clampPageToTotal(totalPages: () => number, page: () => number, goToPage: (page: number) => void): void {
  effect(() => {
    const total = totalPages();
    const current = page();
    if (total > 0 && current > total) {
      goToPage(total);
    }
  });
}
