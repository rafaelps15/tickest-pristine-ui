# Angular Modulith DDD Agent Skills for Claude Code

A skill pack that teaches Claude Code the conventions of this project's **Angular Modulith**:
Manfred Steyer's Domain-Driven Design / Strategic Design architecture for Angular
([angulararchitects.io](https://www.angulararchitects.io/)), applied **inside a single Angular
CLI project** (no Nx workspace) with the **NgRx Signal Store** as the state layer — his current
recommended flavor, not the older `@angular-architects/ddd`-generator flavor. Every domain/
feature Claude Code builds should look like it came out of that combination: one bounded context
= a top-level `src/app/{domain}/` folder (`entities/`, `application/`, `infrastructure/`) plus
one `feature-{useCase}/` folder per screen, a `signalStore()` per use case, folder-based
boundaries (no domain reaches into another domain's internals except through its barrel), and
matching test coverage.

## Which of Steyer's architectures this is, precisely (checked 2026-07-23)

Steyer doesn't have one single canonical "current" architecture — he has published several
variants that all share the same **Strategic Design (DDD) structuring** (bounded contexts, layered
folders, one Facade/Store per use case, enforced boundaries) but differ in two independent axes:
how the boundaries are *enforced*, and how the *state layer* is *implemented*. This project's
choice on both axes, decided explicitly with the user on 2026-07-23:

| Axis | This project uses | The alternative Steyer also documents |
|---|---|---|
| Boundary enforcement | **Folder convention inside one Angular CLI project** — no Nx workspace, no `nx.json`, no separate lib packages. Domains are `src/app/{domain}/` folders; nothing physically stops a cross-domain import, so `ca-review` (and code review) is what actually enforces it. | A real **Nx Modulith**: each domain is a separate Nx library, tagged `domain:{name}`/`type:*`, with `depConstraints` in ESLint physically blocking disallowed imports at lint time. This is what the `@angular-architects/ddd` Nx plugin generates. |
| State layer | **NgRx Signal Store** (`@ngrx/signals`): `signalStore(withState, withProps, withComputed, withMethods)`, `resource()`/`rxResource()` inside a store for data loading, everything consumed as plain signals in templates (no `async` pipe). This is Steyer's current recommendation — see his blog series ["The NGRX Signal Store and Your Architecture"](https://www.angulararchitects.io/blog/the-ngrx-signal-store-and-your-architecture/) and ["Using Angular's Resource API with the NGRX Signal Store"](https://www.angulararchitects.io/blog/using-the-resource-api-with-the-ngrx-signal-store/). | Plain `BehaviorSubject`-based Facade (`{name}$: Observable<T>`, `async` pipe) — what the `@angular-architects/ddd` generator's templates still produce as of its latest published release (`22.0.0`), predating Signals. This was this skill pack's original flavor before the 2026-07-23 rewrite; still the shape to expect if you ever *do* run the real Nx generator. |

**Why not the real Nx plugin, given it exists and is actively versioned?** Checked directly
against its generator source on GitHub, not guessed: the plugin (`22.0.0`) throws
`ERR_PACKAGE_PATH_NOT_EXPORTED` on this project's `@nx/angular`/Angular 22 combination, there's no
newer release fixing it, and physically converting this already-shipping app (SSR server, existing
build/deploy) into an Nx workspace is a large, separately-risky change to the build pipeline that
the user chose not to take on together with the state-layer modernization. If a fixed plugin
release ships and the team later decides Nx's *physical* boundary enforcement is worth that
migration, that's a distinct decision from the Signal Store change made here — don't bundle them
back together silently.

**Why the folder layout still mirrors Nx's `entities/application/infrastructure` shape** even
without Nx: that shape is Steyer's DDD *layering* (tactical design within a bounded context), which
is independent of whether Nx enforces it or a human does. Keeping the same folder names means
migrating to a real Nx workspace later, if ever decided, is a mechanical `mv` into `libs/`, not a
redesign.

This is the front-end counterpart to a Clean Architecture backend skill pack: same idea (encode
the architecture as executable scaffolding instead of a conventions doc nobody re-reads).

## What's inside

| Skill | Invoke with | What it does |
|---|---|---|
| **add-context** | `/add-context Booking, with a flight-search screen` | Scaffolds a brand-new domain end to end by hand (no Nx generator exists for this flavor): `src/app/booking/{entities,application,infrastructure}`, the first `feature-flight-search/` folder, shell route wiring. |
| **add-feature** | `/add-feature reopen a flight` | Adds a new use case to an **existing** domain: a Data Service method, a Store (new or extended), and a routed component or in-place action. |
| **add-tests** | `/add-tests FlightSearchStore` | Backfills Store unit tests (mocked Data Service) and component tests (mocked Store) for existing code. |
| **ca-review** | `/ca-review` | Reviews pending changes against the Modulith's conventions: folder boundaries, Signal Store pattern, layer responsibilities, test coverage. This is the skill doing the job Nx's `depConstraints` would do physically — treat its findings as blockers, not suggestions. |

You don't have to invoke them explicitly — once installed, Claude Code picks the right skill
automatically when you say things like "add a screen to reopen a flight."

## Installation

The skills live in `.claude/skills/`. If this is already your project's `.claude/skills/`,
they're active — just open the repo in Claude Code. No extra package is required for the DDD
structuring itself (it's hand-scaffolded); `@ngrx/signals` is required for the Signal Store state
layer (`npm i @ngrx/signals`).

To use these skills in **another** Angular project following the same architecture, copy the
folder:

```
your-project/
└── .claude/
    └── skills/
        ├── add-context/
        ├── add-feature/
        ├── add-tests/
        └── ca-review/
```

Then swap the example `booking`/`Flight` domain in the templates for whatever fits your first real
scaffold, and adjust the test-framework details in `add-tests` if your project uses Jest instead of
Karma/Jasmine (see that skill's note).

## Try it

```
/add-context Booking, with a flight-search screen
```

Claude will hand-create `src/app/booking/{entities,application,infrastructure}` (entity, Data
Service, `FlightSearchStore`) and `src/app/booking/feature-flight-search/` (routed component),
wire the route straight into `app.routes.ts`, and run lint/test/build to confirm nothing broke.

## Customizing

Each skill is a plain Markdown file (`SKILL.md`, plus templates under `references/` for the ones
that need longer code samples). Edit the templates once and every future domain/feature follows
suit — the skills are the executable version of your team's architecture doc.

## Code style

- Single quotes, 2-space indent, final newline — standard Prettier defaults.
- Component selectors: `app-{kebab-case-name}` (e.g. `app-flight-search`) — this project's
  existing convention (see any current `*.component.ts`), kept as-is rather than switched to a
  domain-prefixed selector, since there's no Nx-per-domain package boundary here that a
  domain-specific prefix would be documenting.
- `console.error`/`console.warn` are fine for reporting a failed Store method — no silent
  `catch`/swallow.
- `prefer-const`, strict `===`/`!==`, no `var`.

## Assumptions baked into these templates

- **No Repository abstraction, no `Result<T>` wrapper.** A Store's `withProps` injects a concrete
  `{Entity}DataService` (`providedIn: 'root'`, calls `HttpClient` directly, returns raw
  `Observable<T>`) — no interface/DI-token layer, no success/failure envelope. Errors surface via
  the `resource()`'s own `.error()` signal for reads, and via `console.error` + a dedicated error
  signal in the Store for mutations. This mirrors the original plugin's simplicity philosophy
  (no Repository, no `Result`) — the Signal Store swap didn't reintroduce either.
- **`signalStore()`, not `BehaviorSubject`**, for state. `resource()`/`rxResource()` for anything
  loaded from the backend (loading/error state comes for free from the resource, don't hand-roll
  parallel `loading$`/`error$` subjects). Consumed as plain signals in templates — no `async` pipe.
- **One `feature-{useCase}/` folder per screen/use case**, not one shared `feature/` folder per
  domain with subfolders — same rule as before, just without an Nx library boundary backing it.
- **One `{UseCase}Store` per use case**, not one Store per entity. Two screens over the same
  entity get two Stores, both injecting the same `{Entity}DataService`.
- Folder tags, for when `ca-review` or a human needs to reason about boundaries even without Nx
  enforcing them: think of every domain folder as tagged `domain:{name}`, `shared/` as
  `domain:shared`, and `entities|application|infrastructure` as `type:domain-logic`,
  `feature-*/` as `type:feature`, the app shell (`app.routes.ts`, `app.config.ts`,
  `app.component.ts`) as `type:app` — the *rules* from the Nx-tag world still apply (see
  `ca-review`), only the *enforcement mechanism* changed from lint-time hard error to reviewed
  convention.

---

Modeled after Manfred Steyer's Domain-Driven Design / Strategic Design architecture for Angular
([angulararchitects.io](https://www.angulararchitects.io/)) — specifically his current
NgRx-Signal-Store-based state layer, applied to this project's existing single-app (non-Nx)
structure rather than to a physical Nx Modulith.
