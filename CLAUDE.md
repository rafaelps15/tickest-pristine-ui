# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## What this is

The Angular front-end for the Tickest ticketing/helpdesk system (the backend lives in the
sibling `tickest-pristine` repo). Structured as an **Angular Modulith with Strategic Design
(DDD)**: Manfred Steyer's domain/bounded-context architecture
([angulararchitects.io](https://www.angulararchitects.io/)), applied inside this single Angular
CLI project (no Nx workspace — folder convention enforces boundaries instead of Nx tags) with his
current recommended state layer, the **NgRx Signal Store** (`@ngrx/signals`), instead of the
older `BehaviorSubject`-Facade flavor his `@angular-architects/ddd` Nx plugin still generates. See
`.claude/skills/README.md` for exactly which of his architecture variants this is and why that
distinction matters, and `.claude/skills/` (`add-context`, `add-feature`, `add-tests`,
`ca-review`) for the conventions and how to extend them.

Each bounded context is a top-level `src/app/{domain}/` folder (`entities/`, `application/`
— the Signal Stores, `infrastructure/` — the Data Services, plus one `feature-{useCase}/` folder
per screen); cross-cutting concerns (auth guards, the HTTP interceptor, session state, shared
layouts) live in `src/app/shared/`; the shell (`app.routes.ts`, `app.config.ts`,
`app.component.ts`) is the only place allowed to import a domain's `feature-*` folder directly.
No Repository abstraction and no `Result<T>` wrapper — Data Services call `HttpClient` directly
and return raw `Observable<T>`.

## Code comments

Every function, property, and class gets a short `/** ... */` doc comment **in Portuguese**
stating what it does — this is an established convention in this codebase (see e.g.
`src/app/application/services/tickets.service.ts`, `src/app/core/guards/admin-master.guard.ts`),
not optional polish. Apply it to every insertion without being asked. Keep it to what the thing
*does*, one line where possible:

```ts
/** Serviço para gerenciamento de tickets do usuário logado. */
@Injectable({ providedIn: 'root' })
export class TicketsService {
  /** Busca os tickets do usuário logado na API e atualiza {@link tickets}. */
  loadForCurrentUser() { ... }
}
```

This is specific to this repo — it does not override the general "don't over-comment" guidance
elsewhere; it's a deliberate, pre-existing convention here, not an invitation to add WHY-only
commentary too.
