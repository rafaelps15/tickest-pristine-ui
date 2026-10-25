---
target: "Detalhe do Ticket (/tickets/:id, ticket-detail.component)"
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\tickets\\feature-ticket-detail\\ticket-detail.component.ts"
target_fingerprint: "sha256:f57466dda91025d6c4f8cca8e6149a9198d94662c28945d396a9d8e42ef538af"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\tickets\\feature-ticket-detail\\ticket-detail.component.ts"
timestamp: 2026-10-25T21-15-51Z
slug: ticket-detail-ticket-detail-component-ts-e11f2f25
---
# Impeccable Design Critique — "Detalhe do Ticket" (/tickets/:id)

Method: dual-agent. Total: 29/40 (Good).
1 Visibility of system status: 3
2 Match real world: 2
3 User control and freedom: 2
4 Consistency and standards: 3
5 Error prevention: 4
6 Recognition rather than recall: 4
7 Flexibility and efficiency: 2
8 Aesthetic and minimalist design: 4
9 Error recovery: 4
10 Help and documentation: 1

Specificity: high DESIGN.md conformance (One Accent Rule, Badge Pair Rule, Confirm Dialog) but
violates DESIGN.md's own named grid-base rule, and regresses vs. this session's Monitor "gold
standard" on success feedback and information completeness. Detector: 1 finding, known false
positive (h4 color), no new issue.

What's Working:
1. Assignee picker has full ARIA Listbox pattern (role/aria-activedescendant/arrow nav/aria-live) -
   exceeds the equivalent picker in Monitor itself (no keyboard nav there).
2. Per-section error messages by HTTP code, independent retry per card.
3. Relative due-date in pt-BR with triple encoding (text+color+badge) - more informative than Monitor.

Priority Issues:
[P1] No status-transition action anywhere in the app - TicketDataService.update() exists but is
never called (grep-confirmed across src/app). The Open->InProgress->Resolved->Closed flow (+
Cancel/Reopen) from PRODUCT.md has zero UI control.
[P2] dt/dd info grid lacks col-12 base layer before col-sm-3/col-sm-9 - violates DESIGN.md's own
named rule, breaks below 576px.
[P2] No success toast on assign/remove/upload/delete - Monitor already uses ToastService; this
screen's mutations end silently.
[P3] "Resolvido em" shown in Monitor's condensed info panel but missing from the full detail view.
[P3] Breadcrumb drops "Administração /" when arriving from Monitor.

Persona Red Flags:
Alex: no status control (P1); no "assign to me" shortcut like Monitor's row button.
Sam: modal closes via document.getElementById(...).click() instead of Angular API - potential
focus-loss risk for keyboard-only users, needs live verification.
Casey: the grid bug (P2) hits exactly her <576px viewport.

Minor Observations:
- file input lacks `accept` attribute matching allowed types.
- formatSize uses "." decimal separator instead of pt-BR ",".

Questions to Consider:
1. If this is the canonical place to see everything about a ticket, why is it the one place in
   the whole app where you can't change the thing that matters most - its status?
2. This screen's assignee picker is more accessible than the "gold standard" Monitor's own picker
   for the same task - worth extracting into a shared component now?
3. Is hiding resolution timing from the full detail view (only reconstructible via History) deliberate?
