---
name: add-context
description: Scaffold a brand-new bounded context (domain folder) in this Angular Modulith, following Manfred Steyer's Strategic Design conventions with an NgRx Signal Store state layer — domain folder, first feature folder, shell wiring. Use when the user asks to add a new bounded context, domain, business area, or aggregate to the front-end.
argument-hint: <domain description, e.g. "Booking, with a flight-search screen">
---

# Add a Bounded Context (Domain)

Scaffold a new bounded context following this project's Modulith conventions (see the skills
`README.md` for exactly which of Steyer's architecture variants this is: folder-based boundaries,
`NgRx Signal Store` state layer, no Nx workspace). Use the fictitious `booking` domain with a
`flight-search` feature and `Flight` entity as the template — replace those names throughout with
the real context.

There is no generator for this flavor (the official `@angular-architects/ddd` Nx plugin generates
the older `BehaviorSubject`-Facade shape, and this project isn't an Nx workspace anyway) — every
file below is hand-created, following
[references/domain-lib.md](references/domain-lib.md) and
[references/routed-component.md](references/routed-component.md).

## Workflow

1. **Name the domain.** Kebab-case, matching the backend aggregate it mirrors if one exists (e.g.
   `booking`, `invoicing`). This becomes the `src/app/{name}/` folder.
2. **Create the domain folder structure**:

```
src/app/booking/
  entities/
  application/
  infrastructure/
  index.ts
```

   `index.ts` re-exports only entities, Data Services, and Stores — nothing from
   `feature-*/` folders (those aren't re-exported anywhere; the shell imports them directly).
3. **Create the first feature** (a routed screen) **with its entity** — add
   `entities/flight.ts`, `infrastructure/flight.data.service.ts`,
   `application/flight-search.store.ts` under `src/app/booking/` (see
   [references/domain-lib.md](references/domain-lib.md) for the exact shape), and re-export them
   from `src/app/booking/index.ts`. Then create the screen's own folder:

```
src/app/booking/feature-flight-search/
  flight-search.component.ts
  flight-search.component.html
```

   containing the routed component (see
   [references/routed-component.md](references/routed-component.md)). Every subsequent use case
   in this domain (even ones reusing `Flight`) gets its own `feature-{useCase}/` folder and its
   own Store — repeat this step per use case (see the `add-feature` skill for that).
4. **Wire the route straight into the shell** (`src/app/core/routes/app.routes.ts` or wherever
   this project's route config lives) — no intermediate barrel needed for this, the shell is
   allowed to import any domain's `feature-*` directly:

```ts
{
  path: 'flights',
  loadComponent: () => import('../../booking/feature-flight-search/flight-search.component')
    .then(m => m.FlightSearchComponent)
}
```

   No provider wiring needed in `app.config.ts` either — `FlightDataService` and
   `FlightSearchStore` are `providedIn: 'root'`, they self-register.
5. **Cross-domain reuse**: if another domain needs this one's logic, it imports **only** from
   `src/app/booking/index.ts` (entities/Data Services/Stores), never reaches into
   `src/app/booking/feature-*/` or past the barrel into `src/app/booking/application/...` directly.
   There's no separate `api` folder in this flavor — the domain's own `index.ts` barrel *is* the
   api surface, since there's no Nx package boundary forcing a physically separate artifact for
   it. Keep the barrel narrow on purpose: if you're tempted to export something route- or
   component-shaped from it, that's the signal it doesn't belong in the barrel (see `ddd-review`).
6. **Verify**: run this project's lint/test/build scripts (`npm run lint` / `ng test` / `ng build`
   or whatever `package.json` defines) and manually click through the new route — there's no Nx
   task graph to scope this to just the new folder, so a full run is the only option.

## Rules

- `entities/`, `application/`, `infrastructure/` never import Angular UI beyond `@angular/core`/
  `@angular/common/http` — no components, no templates live there.
- `feature-*/` components inject the Store only — never `{Entity}DataService`, never `HttpClient`
  directly.
- A domain's folders never import another domain's `application/`/`infrastructure/`/`feature-*/`
  directly — only its `index.ts` barrel, and only when there's an actual cross-domain need. There
  is no lint rule enforcing this automatically (see the README for why) — `ddd-review` is what
  catches a violation, so run it before considering a cross-domain change done.
- A screen that aggregates several domains (a dashboard) belongs in the shell app
  (`src/app/core/` or wherever the app-shell code lives), not inside any one domain's folders —
  the shell alone is expected to reach into multiple domains' barrels/Stores at once.
- If the user wants a new use case inside a domain that **already** has its folder structure, use
  the `add-feature` skill instead — this skill is only for the first scaffold of a domain.
