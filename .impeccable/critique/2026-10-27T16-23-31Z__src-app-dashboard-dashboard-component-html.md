---
target: dashboard
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\dashboard\\dashboard.component.html"
target_fingerprint: "sha256:0d4e095f931fcf1f7cbfd3a19212c5a1deab29093f4da14c00a14651fa99bced"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\dashboard\\dashboard.component.html"
timestamp: 2026-10-27T16-23-31Z
slug: src-app-dashboard-dashboard-component-html
---
# Critique — Dashboard (src/app/dashboard/dashboard.component.html)
Method: dual-agent (A: design review isolada · B: detector CLI + detect.js em Chrome headless via CDP)

## Design Health Score: 23/40 (Acceptable)
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Em erro os cards mostram "0" como dado real; sem horário de carga |
| 2 | Match System / Real World | 2 | "Tickets Abertos por Período" = criados, colide com status "Em Aberto"; mistura tickets/chamados |
| 3 | User Control and Freedom | 3 | Falta recarregar sem F5 |
| 4 | Consistency and Standards | 3 | Card Total não clicável, vizinhos sim |
| 5 | Error Prevention | 3 | Poucas ações, baixo risco |
| 6 | Recognition Rather Than Recall | 2 | Intervalo do gráfico (14 dias) não aparece |
| 7 | Flexibility and Efficiency | 1 | Sem visão "minha"/"do meu setor", sem escolher intervalo |
| 8 | Aesthetic and Minimalist Design | 2 | Gráfico de 380px domina; legendas repetem o título |
| 9 | Error Recovery | 2 | Em erro o gráfico mostra o vazio falso "Nenhum ticket aberto" |
| 10 | Help and Documentation | 3 | Guia da Tela útil e recolhido |

## Design Specificity Verdict
Genérico da categoria (template Sneat: 4 KPIs + gráfico + ações + lista lateral). Próprios do Tickest: Alertas de SLA e a legenda do Total. SLA (diferencial) é o último bloco.
Detector: CLI 3 advisory (falsos positivos, sem CSS). detect.js: low-contrast 3.4:1 (#696cff/#eaeaff), 4.4:1 (#697a8d/#fff) x2, 4.0:1 (#fff/#696cff btn-primary), em-dash-overuse (9).

## Priority Issues
- [P1] Alertas de SLA só AtRisk (exclui Breached) e enterrados no fim — ticket-summary.store.ts:43, dashboard.component.html coluna direita — layout/bolder
- [P1] Estado de erro mente: `?? 0` nos cards e vazio falso no gráfico — ticket-summary.store.ts:70-80, dashboard.component.html:110-118 — harden
- [P1] Solicitante sem conteúdo próprio; no celular KPIs col-12 empilhados + gráfico 380px empurram "Novo Ticket" ~3000px — adapt/onboard
- [P2] Contraste < 4.5:1 (btn-primary branco/índigo 4.0, índigo/lavanda 3.4, #697a8d 4.4, subtítulos opacity-75 ~3:1) — colorize/polish
- [P2] Copy ambígua: título do gráfico, "toque para ver na fila" no desktop, tickets/chamados, excesso de travessões — clarify

## Persona Red Flags
- Alex: sem "atribuídos a mim"; Total sem destino; sem drill-down no gráfico; Ações Rápidas de ~78px pra 3 links.
- Sam: sem h1; ícones decorativos sem aria-hidden; avatar da navbar sem nome acessível; troca Dia/Semana/Mês não anunciada.
- Solicitante (PRODUCT.md): nada na tela é dele; vê volume de outros setores (ruído/LGPD).

## Minor Observations
Navbar vazia de ~85px; `.badge` uppercase global na tela; "Ver como tabela" troca rótulo + aria-pressed; barra de zero (20/10) sem marcador.

## Questions to Consider
Para quem é o Dashboard se todos veem os mesmos números? Um número ("+18% vs semana passada") faria o papel do gráfico? Por que o SLA é o último bloco?
