---
target: dashboard
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:c:\\dev\\tickest-pristine-front\\src\\app\\dashboard\\dashboard.component.html"
target_fingerprint: "sha256:df590d7a25f9847215392d91f3aca8801b630d5c87e84f595dd74eddbef31647"
target_path: "c:\\dev\\tickest-pristine-front\\src\\app\\dashboard\\dashboard.component.html"
timestamp: 2026-10-27T20-17-39Z
slug: src-app-dashboard-dashboard-component-html
---
# Critique — Dashboard (3ª rodada, após o esqueleto de tela unificado)
Method: dual-agent (A: design review isolada · B: detector CLI + detect.js em Chrome headless via CDP)

## Design Health Score: 28/40 (Acceptable, limiar de Good) — antes 27/40
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | "Atualizado às" + prazo vivo; KPIs sem carimbo |
| 2 | Match System / Real World | 3 | Vocabulário natural |
| 3 | User Control and Freedom | 3 | Guia aberto por padrão; recolher é o único jeito de recuperar a tela |
| 4 | Consistency and Standards | 3 | Esqueleto unificado; legenda do Total desalinha a fileira |
| 5 | Error Prevention | 3 | — |
| 6 | Recognition Rather Than Recall | 3 | Definição de "em risco" longe do card |
| 7 | Flexibility and Efficiency | 2 | Sem ação inline no alerta (atribuir) |
| 8 | Aesthetic and Minimalist Design | 2 | Página longa; Guia aberto maior que os KPIs |
| 9 | Error Recovery | 3 | "Tentar novamente" por bloco |
| 10 | Help and Documentation | 3 | Guia crava "últimos 30 dias" |

## Design Specificity Verdict
Card de SLA autoral ("nível de produto maduro"); resto é kit admin bem executado; composição trata o SLA como coluna lateral.
Detector: CLI 3 advisory falsos positivos. detect.js: 8 — 3 low-contrast fora do Dashboard (sidebar ativa; btn-primary global, pior caso de gradiente) + 5 line-length (~153 ch) no Guia aberto. Guia abre por padrão (defaultOpen=true da refatoração 1a48068): gestor mobile só vê cabeçalho+Guia na 1ª tela; KPIs y=875, SLA y=1210. Alturas: gestor desktop 1655/1259 (Guia aberto/fechado), mobile 2472/1887.

## Priority Issues
- [P1] Guia aberto por padrão domina a 1ª tela — fechado por padrão no Dashboard + definições junto aos totais — dashboard-guide.component.html:1 — distill
- [P1] O acionável não lidera — faixa de SLA entre cabeçalho e KPIs, compacta em "Fila em dia" — dashboard.component.html — layout
- [P2] Gráfico é o maior bloco e o menos acionável (8/12, 380px, ~300px vazio embaixo) — layout
- [P2] Alertas sem ação inline — "Atribuir" reusando o diálogo de tickets/ui — shape
- [P3] Guia: h2 duplicados com os cards, "últimos 30 dias" fixo, linhas longas — clarify

## Persona Red Flags
- Alex: sem ação no alerta; Ações Rápidas repetem o menu.
- Sam: headings duplicados Guia/cards; link de alerta com frase longa.
- Atendente: 1º dado no celular é "Total de Chamados".

## Minor Observations
Legenda do Total em 2 linhas; Ações Rápidas do Solicitante com 1 item; eixo do gráfico no celular; erro duplicado quando volume falha; dois ícones em "Fila em dia".

## Questions to Consider
Por que a tela do Gestor começa por "Total de Chamados"? O Solicitante precisa de dashboard? O tamanho do card de SLA deveria ser a mensagem?
