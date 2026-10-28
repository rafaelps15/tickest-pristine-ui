---
target: tela Monitorar Chamados
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\tickets\\feature-ticket-monitor\\ticket-monitor.component.html"
target_fingerprint: "sha256:9d90210b56c3663940579e34ef02ca2894fdc34b442db4cad0ef9da1d21d1ce9"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\tickets\\feature-ticket-monitor\\ticket-monitor.component.html"
timestamp: 2026-10-28T18-14-01Z
slug: ket-monitor-ticket-monitor-component-html-46a93591
---
# Critique — Monitorar Chamados (2026-10-28)

Method: dual-agent (A: revisão de design · B: detector). Sem navegador.

| # | Heurística | Nota |
|---|---|---|
| 1 | Visibilidade do status | 3 |
| 2 | Linguagem do usuário | 3 |
| 3 | Controle e liberdade | 3 |
| 4 | Consistência | 2 |
| 5 | Prevenção de erros | 3 |
| 6 | Reconhecer em vez de lembrar | 2 |
| 7 | Eficiência | 2 |
| 8 | Estética e minimalismo | 2 |
| 9 | Recuperação de erros | 3 |
| 10 | Ajuda | 3 |
| Total | | 26/40 |

Detector: 0 anti-padrões; 3 avisos de cor rgb(0,0,0), falsos positivos.

## Prioridades
1. [P1] Card "Ativos" pressionado sem aplicar Ativos; cards seguem só o setor, sem dizer (clarify/harden).
2. [P1] Padrão não é a fila de trabalho (Todos + Mais recentes); ordenação escondida em "Mais filtros" (distill/layout).
3. [P1] Drill-down de vários setores opaco e sem volta (clarify/harden).
4. [P2] Prazo absoluto e relógio do navegador; SLA e Prazo repetem (distill/bolder).
5. [P2] Vazio sempre "com esses filtros"; data invertida calada (harden).

## Menores
createdRangeLabel nunca exibido; label-in-name nas ações da linha; [value] de select antes das opções carregarem; até 3 alertas empilhados; e-mail em toda linha.
