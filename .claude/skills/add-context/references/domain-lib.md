# Domain Folder Templates

Files go in `src/app/{domain}/`. Replace `booking`/`Flight`/`Flights` throughout — this example (a
`booking` domain with a `Flight` entity) is the one to imitate literally when in doubt.

These templates follow Manfred Steyer's current recommended state layer — `NgRx Signal Store`
(`@ngrx/signals`) with `resource()`/`rxResource()` for backend-loaded data — layered inside the
same `entities/application/infrastructure` folders his DDD/Strategic-Design architecture always
uses. No Repository abstraction, no `Result`-wrapper: same simplicity philosophy as the classic
`@angular-architects/ddd` plugin flavor, just with a Store instead of a `BehaviorSubject` Facade.

This project's `CLAUDE.md` requires a short `/** ... */` doc comment (in Portuguese) on every
class, exported Store, and public method — the templates below include it so code scaffolded from
them matches that convention out of the box. If you copy this skill pack into a different project,
follow **that** project's own comment convention instead (its `CLAUDE.md` or equivalent) rather
than reusing these Portuguese comments verbatim — omit them entirely if the target project has no
such convention.

## Entity — plain interface, no behavior

```ts
// entities/flight.ts

/** Voo disponível para reserva, conforme retornado por GET /api/flights. */
export interface Flight {
  id: number;
  name: string;
  description: string;
}
```

## Data Service — concrete, injectable, calls `HttpClient` directly

```ts
// infrastructure/flight.data.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Flight } from '../entities/flight';

/** Acesso HTTP aos voos disponíveis para reserva. */
@Injectable({ providedIn: 'root' })
export class FlightDataService {
  private http = inject(HttpClient);

  /** Busca os voos disponíveis (GET /api/flights). */
  load(): Observable<Flight[]> {
    return this.http.get<Flight[]>('/api/flights');
  }

  /** Cria um novo voo (POST /api/flights). */
  create(flight: Omit<Flight, 'id'>): Observable<Flight> {
    return this.http.post<Flight>('/api/flights', flight);
  }
}
```

No repository interface, no DI token abstraction over this — `FlightDataService` **is** the
data-access layer, same as before. It's `providedIn: 'root'`, so nothing needs manual
`provide`-wiring in `app.config.ts` to use it.

## Store — `signalStore()`, `resource()` for the read side, one per feature/use-case

```ts
// application/flight-search.store.ts
import { signalStore, withState, withProps, withComputed, withMethods } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Flight } from '../entities/flight';
import { FlightDataService } from '../infrastructure/flight.data.service';

/** Store da busca de voos: lista os voos disponíveis para reserva. */
export const FlightSearchStore = signalStore(
  { providedIn: 'root' },
  withProps(() => ({
    _flightDataService: inject(FlightDataService)
  })),
  withProps((store) => ({
    _flightListResource: rxResource({
      stream: () => store._flightDataService.load()
    })
  })),
  withComputed((store) => ({
    /** Voos disponíveis carregados pelo resource de leitura. */
    flightList: computed(() => store._flightListResource.value() ?? []),
    /** Indica se a listagem de voos está carregando. */
    loading: computed(() => store._flightListResource.isLoading()),
    /** Mensagem de erro da última tentativa de carregar os voos, se houver. */
    error: computed(() => store._flightListResource.error()?.message ?? null)
  })),
  withMethods((store) => ({
    /** Recarrega a listagem de voos disponíveis. */
    load(): void {
      store._flightListResource.reload();
    }
  }))
);
```

- The Store name matches the **feature/use-case**, not the entity (`FlightSearchStore`, not
  `FlightStore`) — a new feature folder gets a new Store, even when several features in the same
  domain share the same entity. Two features that both need flight data get two Stores, each
  wrapping the same `FlightDataService`.
- `withProps` (first block) injects dependencies; `withProps` (second block, receives `store`) is
  where the `resource()`/`rxResource()` lives — it needs `store` in scope to read reactive params
  or call the just-injected Data Service. Split into two `withProps` calls when the resource
  doesn't depend on anything computed by an earlier `withComputed`; combine/reorder if it does
  (a resource can depend on a computed signal defined earlier in the chain via `params: () =>
  ...` — check whether an existing Store in this codebase already does this with `rxResource` and
  mirror its shape).
- `withComputed` exposes `flightList`/`loading`/`error` as plain signals — no `{name}$`/
  `Observable` naming, no `async` pipe. Components read `store.flightList()` directly.
- Loading/error state come from the `resource()` itself (`.isLoading()`, `.error()`) — don't
  hand-roll parallel `loading`/`error` signals for the read side; only add a *separate* error
  signal in `withMethods`/`withState` for **mutation** errors (the read resource's error is about
  the read, not about a `create`/`update` call — see `store-method.md` in `add-feature` for that
  shape).
- No `Result<T>`/success-failure wrapper anywhere. The resource's `.error()` signal is exactly
  Angular's own error-channel — there's nothing to wrap.

## Barrel (`src/app/{domain}/index.ts`)

```ts
export * from './entities/flight';
export * from './infrastructure/flight.data.service';
export * from './application/flight-search.store';
```

Nothing else needs exporting — other domains only ever import entities/data-services/stores
through this barrel, never reach into `./application/...`/`./infrastructure/...` paths directly.
`feature-*/` folders in the **same** domain don't need the barrel — they can import straight from
`../application/flight-search.store` since they're inside the domain already; the barrel exists
for **other domains** and the shell.
