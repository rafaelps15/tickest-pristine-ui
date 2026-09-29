# Routed Feature Component Template

Each use-case screen is its **own folder**, named `feature-{useCase}` inside the domain's folder
(e.g. `src/app/booking/feature-flight-search/`) — not a subfolder of one shared `feature/`
folder.

## Smart component (injects the Store, reads its signals directly — no `async` pipe)

```ts
// src/app/booking/feature-flight-search/flight-search.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlightSearchStore } from '../application/flight-search.store';

/** Tela de busca de voos disponíveis para reserva. */
@Component({
  selector: 'app-flight-search',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flight-search.component.html'
})
export class FlightSearchComponent {
  protected readonly store = inject(FlightSearchStore);
}
```

(This project's `CLAUDE.md` requires a short `/** ... */` doc comment in Portuguese on every class
and public method, as shown above — see the note in
[domain-lib.md](domain-lib.md) for how to adapt this if the convention differs elsewhere.)

```html
<!-- flight-search.component.html -->
@if (store.loading()) {
  <p>Loading…</p>
}
@if (store.error(); as error) {
  <p class="error">{{ error }}</p>
}
<ul>
  @for (flight of store.flightList(); track flight.id) {
    <li>{{ flight.name }} — {{ flight.description }}</li>
  }
</ul>
```

- The component injects **only** the Store — never `FlightDataService`, never `HttpClient`.
- The template reads `store.flightList()`/`store.loading()`/`store.error()` as plain signal calls
  — no `async` pipe, no manual subscribe/unsubscribe. `CommonModule` is only needed here for
  `@if`/`@for` control-flow syntax support in older setups; drop the import if the project's
  Angular version treats built-in control flow as always available.
- No `ngOnInit` + manual `store.load()` call needed for the *initial* load when the Store's
  resource has no reactive `params` (a plain `rxResource({ stream: () => ... })` loads
  automatically on Store creation, same as `resource()` always does) — only call a Store method
  from the component when the use case needs an explicit trigger (a filter changing, a manual
  refresh button, a mutation). If the resource takes reactive `params` (see any existing Store in
  this codebase that already does this), it already re-fetches on its own when the param signal
  changes — still no manual wiring needed.
- If a use case needs loading/error state, it's already there via `store.loading()`/`store.error()`
  — don't invent local component state for server-derived data.

## Feature index (only if something needs re-exporting — usually nothing does)

A `feature-*/` folder is a leaf: the shell imports the component file directly
(`import('../../booking/feature-flight-search/flight-search.component')`), so it typically doesn't
need an `index.ts` of its own. Add one only if the folder grows more than one file another part of
the app needs to reach (rare — prefer keeping feature folders single-component).

## Wiring the route (directly in the shell)

```ts
{
  path: 'flights',
  loadComponent: () => import('../../booking/feature-flight-search/flight-search.component')
    .then(m => m.FlightSearchComponent)
}
```

## Presentational (dumb) sub-components

If a row/card grows non-trivial, extract it as a presentational component with `input()`/
`output()` only — no injected Store:

```ts
/** Linha de exibição de um voo dentro da listagem de busca. */
@Component({
  selector: 'app-flight-row',
  standalone: true,
  template: `<li>{{ flight().name }} — {{ flight().description }}</li>`
})
export class FlightRowComponent {
  flight = input.required<Flight>();
}
```

```html
<!-- parent template -->
@for (flight of store.flightList(); track flight.id) {
  <app-flight-row [flight]="flight" />
}
```

A dumb component reused across more than one feature folder in the same domain belongs in a
shared `{domain}/ui/` folder (or the project's global `shared/ui/` if reused across domains), not
duplicated per feature.
