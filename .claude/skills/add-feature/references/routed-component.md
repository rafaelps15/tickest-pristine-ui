# Adding a Screen or Action for an Existing Domain

## Brand-new screen (e.g. flight edit), its own feature folder

After creating `FlightEditStore` (see `store-method.md`), create the component:

```ts
// src/app/booking/feature-flight-edit/flight-edit.component.ts
import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlightEditStore } from '../application/flight-edit.store';

@Component({
  selector: 'app-flight-edit',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flight-edit.component.html'
})
export class FlightEditComponent {
  protected readonly store = inject(FlightEditStore);

  id = input.required<string>(); // route params are always strings — convert before use

  constructor() {
    this.store.loadById(Number(this.id()));
  }
}
```

```html
<!-- flight-edit.component.html -->
@if (store.flight(); as flight) {
  <input [value]="flight.name" (change)="store.save({ ...flight, name: $any($event.target).value })" />
}
```

Route with the param, added directly to the shell app's route config:

```ts
{
  path: 'flights/:id/edit',
  loadComponent: () => import('../../booking/feature-flight-edit/flight-edit.component')
    .then(m => m.FlightEditComponent)
}
```

`id = input.required<string>()` only gets populated automatically from the route's `:id` segment
if the shell's `provideRouter(routes, withComponentInputBinding())` includes that feature —
without it, bind the param manually via `inject(ActivatedRoute).paramMap` instead.

## Action on an already-listed item (e.g. a "reopen" button) — no new folder

Extend the existing screen's template and call the Store method directly from the event binding —
no new component needed:

```html
<!-- flight-search.component.html -->
@for (flight of store.flightList(); track flight.id) {
  <li>
    {{ flight.name }}
    <button (click)="store.reopen(flight.id)">Reopen</button>
  </li>
}
```

The Store method (added via `add-feature`'s `store-method.md`) handles the mutation + resource
reload; no TypeScript changes needed in the component itself.

## Presentational (dumb) sub-components

If a row/card grows non-trivial, extract it — `input()`/`output()` only, no injected Store:

```ts
@Component({
  selector: 'app-flight-row',
  standalone: true,
  template: `
    <li>
      {{ flight().name }}
      <button (click)="reopen.emit(flight().id)">Reopen</button>
    </li>
  `
})
export class FlightRowComponent {
  flight = input.required<Flight>();
  reopen = output<number>();
}
```

Parent wires the output back to the Store: `(reopen)="store.reopen($event)"`. If this component is
reused by more than one feature folder in the domain, promote it to a shared `{domain}/ui/` folder
rather than duplicating it inside each `feature-*/` folder.
