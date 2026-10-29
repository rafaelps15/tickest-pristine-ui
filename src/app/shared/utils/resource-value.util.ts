/**
 * Valor atual de um `resource()`/`rxResource()`, ou `undefined` quando ele não tem valor — inclusive
 * em erro. Ler `.value()` direto num resource em estado de erro lança exceção (Angular 20+), e os
 * `computed` dos Stores são lidos pelo template sempre, mesmo quando a tela está mostrando o erro:
 * sem isso, uma falha da API quebrava a tela inteira em vez de mostrar "—" / "Tentar novamente".
 */
export function valueOf<T>(resource: { hasValue(): boolean; value(): T }): T | undefined {
  return resource.hasValue() ? resource.value() : undefined;
}
