---
target: Início com operationOverview ligado
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\dashboard\\dashboard.component.html"
target_fingerprint: "sha256:0dc485267ffa0d0f5828e98467ca16704be3e60ee016b5a2ae6f2cd21be68d27"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\dashboard\\dashboard.component.html"
timestamp: 2026-10-28T22-51-04Z
slug: src-app-dashboard-dashboard-component-html
---
# Critique — Início com operationOverview ligado (2026-10-28)
Method: dual-agent. Visual: só código (sem navegador logado).

Nota 26/40. H1 3, H2 3, H3 2, H4 2, H5 3, H6 3, H7 2, H8 2, H9 3, H10 3.

Especificidade: própria do produto, mas o flag quebrou 3 regras do DESIGN.md (um número um lugar; risco na primeira tela; "—" = falha).
Detector: 4 design-system-color rgb(0,0,0), todos falsos positivos.

## Problemas prioritários
1. [P1] Sexto KPI virou "SLA cumprido %" desde o início; risco sumiu da primeira tela (dashboard.component.ts:331-343). Fix: Atrasados do agregado; taxa só no lead do SLA. layout + clarify.
2. [P1] Atrasados/Em risco com duas fontes (Central = overview, Alertas = store.breachedCount + crossed; html:74, insights.ts:95); "(7 de 8)" repete Cumpridos. distill.
3. [P2] filteredAvailable amarra a barra de filtros a volumeResolved (ts:146); drill-down com filtros da URL não bate com número da empresa. harden.
4. [P2] Estados do agregado: KPI SLA sem loading; 2 role=alert iguais; staleAfterFailure ignora overview; recarga falha apaga valores; opacity 0.6 na recarga. harden.
5. [P3] Guia desatualizado (guide.html:10); 75% 3x; containers mistos; cards SLA ~170px. clarify + polish.

Personas: Alex sem filtro/período; Sam com 2 alertas iguais e parênteses aninhados; Supervisor sem vermelho na 1ª dobra e 4 vs 5 atrasados.
