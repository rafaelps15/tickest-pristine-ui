---
target: tela tickets/monitorar
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\tickets\\feature-ticket-monitor\\ticket-monitor.component.html"
target_fingerprint: "sha256:d06ab29fd949c56621d63a8a1218c71a43bf1be22687c00c1e348ed42a8f3e79"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\tickets\\feature-ticket-monitor\\ticket-monitor.component.html"
timestamp: 2026-10-29T01-58-05Z
slug: ket-monitor-ticket-monitor-component-html-46a93591
closed: true
---
## Critique — Monitorar Chamados (2026-10-28)
Method: dual-agent; inspeção visual pelo parent via Playwright/CDP (1366x768, 390x844).

| # | Heurística | Nota |
|---|---|---|
| 1 | Visibilidade do estado | 2 |
| 2 | Mundo real | 3 |
| 3 | Controle | 2 |
| 4 | Consistência | 2 |
| 5 | Prevenção de erros | 3 |
| 6 | Reconhecimento | 2 |
| 7 | Flexibilidade | 2 |
| 8 | Minimalismo | 2 |
| 9 | Recuperação | 3 |
| 10 | Ajuda | 3 |
| Total | | 24/40 |

Detector: exit 0; 3 design-system-color falsos positivos (render isolado sem styles.css).

### Priority Issues
1. [P0] Título esmagado com painel aberto (text-break + sem largura mínima; coluna SLA sai pela direita) — adapt/layout
2. [P1] Fila abaixo da dobra (tabela em 810px a 1366x768) — distill/layout
3. [P1] Selo/cards envelhecem sem aviso; sem "Atualizado às" — harden
4. [P1] "Limpar filtros" apaga setor e por página — harden/clarify
5. [P2] Falha técnica em vermelho e "No prazo" em verde — quieter

### Minor
Erro de atribuição duplicado; painel com Prazo de chamado Sem SLA; erro de descrição vermelho sem retry; "Aberto até" sozinho na linha; comentário CSS errado; botão do card sem o número; "não atribuído" minúsculo; toast com masculino genérico.
