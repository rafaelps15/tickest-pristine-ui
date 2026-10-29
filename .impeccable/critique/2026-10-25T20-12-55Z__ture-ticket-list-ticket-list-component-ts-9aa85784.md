---
target: Meus Tickets (/tickets, ticket-list.component)
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\tickets\\feature-ticket-list\\ticket-list.component.ts"
target_fingerprint: "sha256:243edd3750c99a3c9a8bdc50c5945534ddd4523b9cac56b60a6e6728d5a3e98a"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\tickets\\feature-ticket-list\\ticket-list.component.ts"
timestamp: 2026-10-25T20-12-55Z
slug: ture-ticket-list-ticket-list-component-ts-9aa85784
---
# Impeccable Design Critique — "Meus Tickets" (/tickets)

Method: dual-agent (A: design review · B: detector + browser evidence, extension disconnected)

## Design Health Score
Total: 20/40 (Acceptable, lower bound)
1 Visibility of system status: 2
2 Match real world: 3
3 User control and freedom: 1
4 Consistency and standards: 2
5 Error prevention: 2
6 Recognition rather than recall: 2
7 Flexibility and efficiency: 1
8 Aesthetic and minimalist design: 3
9 Error recovery: 2
10 Help and documentation: 2

## Design Specificity Verdict
Borderline generic — correct tokens (badges, pills, shadow-sm, row-actions menu) but the composition
(header + unfiltered table + pagination) reads as a textbook CRUD screen, unlike its two polished
siblings (Monitor, Users). This is the default screen for every Requester (no requiredPermission).
Detector: 2 advisory findings — font-size 0.8125rem is a false positive (matches DESIGN.md's
documented 0.72-0.85rem Label range for table headers); h4 rgb(0,0,0) is real but systemic across
5+ other screens app-wide, not specific to this component.

## What's Working
1. Row-actions "..." menu + danger-variant Confirm Dialog on delete follow the system convention exactly.
2. canReopen() hides "Reabrir" instead of showing it disabled.
3. Status/priority badges reuse the shared TICKET_STATUS_BADGE_CLASS/TICKET_PRIORITY_BADGE_CLASS maps.

## Priority Issues
[P1] No filter/search/sort — ticket-list.component.html / ticket.data.service.ts:48-54. Backend-blocked:
GET /tickets/mine only accepts page/pageSize. Documented as a backend pendency, not faked client-side.
[P1] Silent loading/mutation states — ticket-list.component.html:30 (spinner no role=status),
ticket-list.component.ts:86-100 (Reabrir/Excluir no in-flight feedback, unlike Monitor's assigningToMeIds()).
[P2] Reabrir/Excluir use <a href="javascript:void(0)"> instead of <button> — ticket-list.component.html:64,71.
Users already fixed this same pattern (user-list.component.html:184-190).
[P2] No retry on load error — ticket-list.component.html:12-14. Monitor's equivalent alert has one.
[P3] Header lacks flex-wrap, description untruncated — ticket-list.component.html:3,44.

## Persona Red Flags
Sam (a11y): mute spinner for screen readers; <a> instead of <button> breaks keyboard activation.
Riley (stress): no double-submit guard; page-size change has no debounce/is-refreshing fade.
Casey (mobile): header lacks flex-wrap, overlap risk on narrow viewports.

## Minor Observations
- ticket-list.component.css has a single rule — reflects how much less this screen does vs siblings.
- Empty-state CTA link is redundant with the header's "Novo Ticket" button.
- Pagination code near-duplicated across ticket-list/ticket-monitor/user-list — future extraction candidate.

## Questions to Consider
1. Is a filterless list intentional long-term, or will it become unusable past 30+ tickets?
2. Is hiding sector/assignee/due-date from the Requester's own queue a product decision or an API leftover?
3. Why is this the only list screen without a Guide rail or subtitle?
