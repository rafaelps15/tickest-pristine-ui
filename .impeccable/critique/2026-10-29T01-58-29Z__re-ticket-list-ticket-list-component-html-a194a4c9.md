---
target: tela de tickets (Meus Chamados)
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\tickets\\feature-ticket-list\\ticket-list.component.html"
target_fingerprint: "sha256:1732189509ff1a0032ccb843a45e856737b60c479499767d5d0661e3888ed2a7"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\tickets\\feature-ticket-list\\ticket-list.component.html"
timestamp: 2026-10-29T01-58-29Z
slug: re-ticket-list-ticket-list-component-html-a194a4c9
---
Method: dual-agent (A: design review · B: detector + browser). Browser evidence collected by the parent via Playwright over CDP (Chrome extension disconnected).

## Design Health Score — 28/40 (Bom)
| # | Heurística | Nota | Problema |
|---|---|---|---|
| 1 | Visibilidade do status | 3 | Recarga só esmaecia, sem aria-busy |
| 2 | Mundo real | 3 | Data do prazo de um resolvido lia como data da resolução |
| 3 | Controle e liberdade | 3 | Cancelar confirma em vez de Desfazer |
| 4 | Consistência | 2 | Hover do título em --tk-primary; texto com opacity |
| 5 | Prevenção de erros | 3 | ok |
| 6 | Reconhecer | 3 | Escopo da busca só aparece quando falha |
| 7 | Eficiência | 2 | Busca só no título; sem nº do chamado |
| 8 | Minimalismo | 3 | Editar repetido em toda linha |
| 9 | Recuperação | 3 | Erro de leitura dito duas vezes |
| 10 | Ajuda | 3 | "quem administra os chamados" não diz quem |

## Priority Issues
- [P1] Chamado reaberto (status Aberto) mostrava "Resolvido depois do prazo": back sem spec 024 → fallback no SLA do ciclo encerrado. (visto ao vivo)
- [P2] Erro de leitura em dobro (alerta + estado vazio).
- [P2] Data do prazo sem dizer o que é ("prazo era", "venceu em", "até").
- [P2] Botões da linha e seletor < 44px no celular.
- [P2] Texto com opacity (.cancel-hint, .status-group-count) e hover do título em --tk-primary.
- [P3] "Atrasado" sem próxima ação ("Cobrar no chamado").

## Detector
0 regras no feature folder; 2 avisos design-system-color = falsos positivos (render estático sem tokens).

## Questions
- Cancelar com Desfazer em vez de diálogo?
- "Atualizado" dizer quem falou por último (exige campo no back)?
- Editar só no detalhe?
