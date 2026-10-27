---
target: dashboard
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:c:\\dev\\tickest-pristine-front\\src\\app\\dashboard\\dashboard.component.html"
target_fingerprint: "sha256:b8c31bad800011530e8fa247da881dab85b36f5425769118bfb26e610d87b79e"
target_path: "c:\\dev\\tickest-pristine-front\\src\\app\\dashboard\\dashboard.component.html"
timestamp: 2026-10-27T18-08-45Z
slug: src-app-dashboard-dashboard-component-html
---
# Critique — Dashboard (re-run após o pacote completo do Impeccable)
Method: dual-agent (A: design review isolada · B: detector CLI + detect.js em Chrome headless via CDP)

## Design Health Score: 27/40 (Acceptable, perto de Good) — antes 23/40
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Sem "atualizado às"; relógio vivo anda mas lista/totais de SLA ficam congelados desde a carga |
| 2 | Match System / Real World | 3 | "Em risco" não é definido em lugar nenhum |
| 3 | User Control and Freedom | 3 | Sem atualizar só os alertas sem F5 |
| 4 | Consistency and Standards | 3 | Totais de SLA são links mas não parecem (KPIs têm "Ver na fila ›") |
| 5 | Error Prevention | 3 | — |
| 6 | Recognition Rather Than Recall | 3 | Alerta não diz se alguém já atende |
| 7 | Flexibility and Efficiency | 2 | As 5 vagas da lista vão para os já vencidos |
| 8 | Aesthetic and Minimalist Design | 3 | Gráfico histórico ainda é o maior elemento |
| 9 | Error Recovery | 2 | Erro do card de SLA só texto, sem "Tentar novamente" |
| 10 | Help and Documentation | 3 | Guia não cobre o card de SLA nem "em risco" |

## Design Specificity Verdict
Moldura template (KPIs + gráfico + ações), mas o card de Alertas de SLA agora é autoral (relógio ancorado no servidor, virada anunciada, totais linkados, "Fila em dia").
Detector: CLI 3 advisory falsos positivos. detect.js: 3 low-contrast, todos fora do Dashboard ou no token global (item ativo da sidebar #696cff/lavanda; btn-primary branco/#696cff em "Novo Ticket" e "Dia"). Varredura própria: 0/41 abaixo de 4,5:1 na tela; sem overflow; h1→h2 sem salto; DOM = visual no celular; sem erros.

## Priority Issues
- [P1] Alertas envelhecem sem avisar — "Atualizado às", botão Atualizar só dos alertas, recarga ao voltar pra aba após >5min — dashboard-insights.component.html:3-6, ticket-summary.store.ts — harden
- [P2] 5 vagas vão para os já vencidos (concat+sort+slice) — reservar vagas p/ em risco — ticket-summary.store.ts:99-105 — harden
- [P2] Item não mostra responsável (assignedToName já vem) — dashboard-insights.component.html — clarify
- [P2] Erro do card de SLA sem "Tentar novamente" — dashboard-insights.component.html:12-13 — harden
- [P3] Totais de SLA sem pista de link; ⚠ âmbar no estado "Fila em dia"; Guia sem seção de SLA — layout/clarify

## Persona Red Flags
- Alex: "Tickets sem responsável" sem contagem; sem Atualizar; totais de SLA parecem estáticos.
- Sam: aria-controls do Guia aponta para id inexistente com o Guia fechado; "Ver como tabela" troca conteúdo sem anunciar.
- Atendente: sem responsável na linha; perde os "em risco" quando há muitos vencidos.

## Minor Observations
Comentário CSS cita título antigo; .stat-value duplicado; vazio na coluna direita do Solicitante no desktop; Guia ocupa bloco antes dos KPIs no celular.

## Questions to Consider
Gestor abre o Dashboard pra tendência ou pro que vence antes do almoço? Qual a validade de "Fila em dia" sem horário? "Total de Tickets" ajuda a decidir algo hoje?
