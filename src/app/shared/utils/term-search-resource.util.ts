import { ResourceRef } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

/**
 * Busca por termo como `rxResource`: termo vazio (ou só espaços) não busca, e um termo novo cancela a busca
 * anterior ainda em voo, então só a resposta do último termo aparece. Carregamento e erro vêm do resource.
 * Precisa de contexto de injeção (ex.: o `withProps` de uma Store).
 */
export function termSearchResource<T>(term: () => string | null, search: (term: string) => Observable<T>): ResourceRef<T | undefined> {
  return rxResource({
    params: () => term()?.trim() || undefined,
    stream: ({ params }) => search(params)
  });
}
