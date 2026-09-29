---
name: ca-review
description: Review pending front-end changes against this Angular Modulith's DDD conventions (Manfred Steyer's Strategic Design, folder-based boundaries, NgRx Signal Store) — folder boundaries, Store pattern, layer responsibilities, and test coverage. Use when the user asks to review front-end changes, check architecture conventions, or audit a domain before committing.
argument-hint: [optional: specific domain folder to review; defaults to the working-tree diff]
---

# Angular Modulith Convention Review

Review the given scope (default: `git diff` + untracked files) against this workspace's Modulith
conventions. Report findings with `file:line` references, ordered by severity. Do not fix
anything unless asked.

This project has **no Nx workspace**, so unlike a real Nx Modulith there is no `depConstraints`
lint rule physically blocking a bad import — this skill *is* the boundary enforcement. Treat every
"Module boundaries" finding below as a blocker exactly as if the build had failed on it.

## Checklist

### Module boundaries (violations are blockers)

The folder-based equivalent of an Nx `depConstraints` matrix — same rules Steyer's Nx Modulith
enforces via tags, applied here by convention since there's no lib boundary to enforce them
physically:

| Folder | Allowed to import from |
|---|---|
| shell (`app.routes.ts`, `app.config.ts`, `app.component.ts`, `core/`) | any domain's `index.ts` barrel, any domain's `feature-*/` |
| `{domain}/feature-*/` | its own domain's `application/`/`entities/` (direct relative import, no barrel needed within the same domain), `shared/` |
| `{domain}/application/` (Stores) | its own domain's `entities/`/`infrastructure/`, `shared/` |
| `{domain}/infrastructure/` (Data Services) | its own domain's `entities/`, `shared/` |
| `shared/` | only `shared/` |
| any `{domainA}/*` | `{domainB}/index.ts` only (never `{domainB}/application`, `{domainB}/infrastructure`, `{domainB}/feature-*` directly) — and only when there's an actual cross-domain need |

Read this as: **only the shell may import a `feature-*` folder.** Nothing else does — not another
domain's `feature-*`, not another domain's `application`/`infrastructure`. That means:

- **`feature-*/` folders never import another `feature-*/` folder**, from the same domain or a
  different one.
- **A domain's `index.ts` barrel is not a routes/component barrel** — it should only ever export
  entities, Data Services, and Stores. If you find a domain barrel re-exporting a component or a
  `Route[]`, that's the boundary violation to flag.
- **The shell wires routes by importing `feature-*` components directly** (via `loadComponent`) —
  it does not go through any domain's barrel to do this.
- A dashboard-style screen that aggregates multiple domains' Stores belongs in the shell, not
  inside any one domain's folders — the shell alone is expected to reach into multiple domains at
  once (still one Store/barrel import per domain touched, not a blanket bypass).

### Signal Store pattern
- `feature-*/` components inject the use case's Store — never `{Entity}DataService` and never
  `HttpClient` directly.
- Store state is exposed as plain signals (`withComputed`), backed by `resource()`/`rxResource()`
  for anything server-derived, read directly in templates — no `async` pipe, no component holding
  server-derived data in its own field/signal instead of going through the Store.
- Each use case has **its own** Store (`{UseCase}Store`), even when it shares an entity/Data
  Service with another use case in the same domain. A Store accumulating methods for multiple
  unrelated screens is a smell — split it back out.
- Mutating Store methods reload the read-side `resource()` (or otherwise update it) on success
  rather than assuming the mutation's own response is sufficient to keep the UI in sync.
- Loading/error for the *read* side comes from the `resource()` itself
  (`.isLoading()`/`.error()`) — a hand-rolled parallel `loading`/`error` signal duplicating what
  the resource already exposes is a smell. A *separate* signal for mutation-specific errors
  (`mutationError` in `withState`) is fine and expected — don't conflate the two into one.

### Layer responsibilities
- `entities/*.ts` are plain interfaces — no methods, no Angular decorators.
- `infrastructure/*.data.service.ts` are the **only** place a domain calls `HttpClient` — no
  Repository abstraction/interface layer sitting between the Store and the Data Service (that's a
  deliberate simplicity choice of this architecture, not an oversight to "fix").
- Data Service methods return raw `Observable<T>` — no `Result<T>`/success-failure wrapper type.
  Read errors surface via the consuming `resource()`'s own `.error()`; mutation errors are handled
  in the Store method's `.subscribe({ error: ... })`, not swallowed silently and not re-thrown.
- Presentational (dumb) components (`input()`/`output()` only, no injected Store) live either next
  to the smart component that uses them, or in a shared `{domain}/ui/` folder if reused across
  more than one `feature-*/` folder in the same domain (or the global `shared/ui/` if reused
  across domains).

### Cross-cutting concerns
- Auth guards, the HTTP auth interceptor, session state, and permission checks come from
  `shared/` — no domain redefines its own guard or reimplements token handling.
- Layouts and generic presentational pieces (buttons, cards, empty states) come from `shared/ui/`
  — no domain duplicates a layout component.

### Tests
- New/changed Store methods have a Jasmine spec (Karma, this project's actual test runner — not
  Jest) covering both the success and error paths, with only the Data Service mocked.
- New/changed smart components have a spec asserting the render for the Store's signals and that
  user interactions call the right Store method with the right arguments.
- Spec files sit next to the code they test (`*.spec.ts` alongside the `.ts`).

## Output format

Group findings as **Blockers** (boundary violations, direct `HttpClient`/`DataService` injection
in a component, a domain barrel re-exporting routes/components), **Convention violations**
(naming, a Repository abstraction or `Result<T>` wrapper reintroduced where a plain Data
Service/raw `Observable` was expected, state living in the wrong place, a Store shared across
unrelated use cases, a `BehaviorSubject`/`async`-pipe Facade instead of a Signal Store), and **Test
gaps**. For each: `file:line`, what's wrong, and the one-line fix. Close with a verdict: ready to
commit, or what must change first. If everything passes, say so and run this project's
lint/test/build scripts to confirm.
