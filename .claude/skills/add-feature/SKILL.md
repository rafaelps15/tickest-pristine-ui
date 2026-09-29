---
name: add-feature
description: Add a new use case/screen (its own feature folder) to an existing domain in this Angular Modulith, using an NgRx Signal Store. Use when the user asks to add a feature, screen, action, or use case to an existing front-end domain.
argument-hint: <use case description, e.g. "reopen a flight booking" or "flight detail screen">
---

# Add a Feature (inside an existing domain)

Add a new use case to a domain that already has its folder structure scaffolded (via
`add-context`). Every use case/screen becomes its **own** `feature-{useCase}/` folder — never a
subfolder bolted onto an existing feature folder.

## Workflow

1. **Classify the use case.** A read (a new screen, a new filter) needs a Data Service method + a
   Store exposing a computed signal of the result (typically backed by a `resource()`). A mutation
   (create/update/delete/transition) needs a Data Service method + a Store method that calls it
   and reloads/updates the relevant resource.
2. **Does this need a whole new screen, or does it reuse an entity already in the domain?**
   - New screen, existing entity (e.g. `booking` domain already has `flight`, now add a
     `flight-edit` screen): create a new `FlightEditStore` next to the existing
     `FlightSearchStore`, both wrapping the same `FlightDataService`. That's expected, not
     duplication: one Store per use case, sharing the Data Service. Add the new
     `feature-flight-edit/` folder too.
   - New screen, new entity in the same domain: add `entities/{entity}.ts` +
     `infrastructure/{entity}.data.service.ts` alongside the existing ones in
     `src/app/{domain}/`, plus the new Store/feature folder for it.
   - Action on an already-rendered item (e.g. a "reopen" button in an existing list) — no new
     folder needed; add the method to the existing Store/Data Service and a handler in the
     existing component's template. See [references/store-method.md](references/store-method.md).
3. **Data Service method** — add to the existing `{Entity}DataService`; see
   [references/store-method.md](references/store-method.md).
4. **Store method/state** — add to the relevant Store (existing or newly created); same reference
   file.
5. **Component** — new component in the new `feature-{useCase}/` folder, or a template/method
   addition to an existing one. See
   [references/routed-component.md](references/routed-component.md).
6. **Route** — add directly to the shell app's route config (`loadComponent` importing from the
   new/existing `feature-{useCase}/` folder).
7. **Tests** — see the `add-tests` skill.
8. **Verify**: run this project's lint/test/build scripts and click through the new/changed
   screen manually.

## Non-negotiable conventions

- **The Store is the only thing the component injects.** Never inject `{Entity}DataService` or
  `HttpClient` from a feature component — if a component needs a new capability, add it to the
  Store first.
- **State lives in the Store**, exposed as plain signals (`withComputed`) backed by a
  `resource()`/`rxResource()` for anything server-derived, read directly in templates (no
  `async` pipe) — never as component-local fields holding server data. Component-local state is
  fine only for pure UI concerns (a form's draft value, a modal's open/closed flag) that never
  needs to survive navigation.
- **Data Service methods return raw `Observable<T>`** — no success/error wrapper. A read's error
  surfaces via its `resource()`'s `.error()` signal automatically. A mutation's error is handled in
  the Store method's `.subscribe({ error: ... })` — `console.error` plus, if the screen needs to
  show it, a dedicated `mutationError` signal set via `patchState`/a local `signal()` in
  `withState`.
- **Mutations reload the read resource on success** — call `store._xResource.reload()` (or
  `.set(...)` the updated value if a full reload is wasteful) after a successful
  create/update/delete, don't assume the mutation response alone is enough to keep the UI in sync.
- **One Store per use case, not per entity.** Two screens over the same entity get two Stores.
  Don't "consolidate" them into one shared Store with every method every screen might need — that
  recreates the God-service problem this architecture exists to avoid.
- **No cross-domain imports.** If the new use case needs data from another domain, import that
  domain's `index.ts` barrel, never its `application/`/`infrastructure/`/`feature-*/` folders
  directly.

## Naming reference

| Artifact | Pattern | Example |
|---|---|---|
| Data Service method | verb matching the HTTP action | `reopen(id: number)` |
| Store | `{UseCase}Store` | `FlightEditStore` |
| Store read state | `{entity}`/`{entity}List` (computed signal, no `$`) | `flight`, `flightList` |
| Feature folder | `{domain}/feature-{useCase}` | `booking/feature-flight-edit` |
| Component | `{UseCase}Component` | `FlightEditComponent` |
| Route path | kebab-case, matches backend route where applicable | `flights/:id/edit` |
