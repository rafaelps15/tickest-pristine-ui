---
target: tela departamentos
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\departments\\feature-department-list\\department-list.component.html"
target_fingerprint: "sha256:e779044e0e5b57050c2b8d3384bb85ab7c6411d2e6bf2a420ea0ea2409a205e8"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\departments\\feature-department-list\\department-list.component.html"
timestamp: 2026-10-28T00-48-38Z
slug: tment-list-department-list-component-html-d611d7fa
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score — 27/40 (Acceptable, +5 vs 22)
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | departamento novo não é rolado até a vista |
| 2 | Match System / Real World | 3 | ícone bx-git-branch; "Responsável" sem efeito explicado |
| 3 | User Control and Freedom | 3 | excluir sem desfazer (atrás de confirmação) |
| 4 | Consistency and Standards | 3 | seletor de responsável sem listbox; cores literais |
| 5 | Error Prevention | 3 | chamados ativos só no 409 (spec 022) |
| 6 | Recognition Rather Than Recall | 3 | ok |
| 7 | Flexibility and Efficiency | 2 | um modal por setor; sem atalhos |
| 8 | Aesthetic and Minimalist Design | 2 | ~640px de moldura antes do conteúdo; card só pra busca |
| 9 | Error Recovery | 2 | erro de carga vira "Nenhum departamento cadastrado"; detalhe falho trava renomear |
| 10 | Help and Documentation | 3 | Guia ocupa a tela no celular na 1ª visita |

## Design Specificity
Autoral do produto (regra "sem setor = invisível" em badge, card, chip, modal, toast, exclusão); moldura ainda genérica.
Detector CLI: 3 design-system-color rgb(0,0,0) linha 0 (falsos positivos), #fff2e2 literal (insights.css:49), font-size 0.875rem (insights.css:21). Browser: btn-primary 4.0:1 e item ativo do menu 3.4/3.2:1 (sistema), dark-glow no btn-primary; sem erros de console nem overflow.

## Priority Issues
- [P1] Erro de carga renderizado como estado vazio (department-list.component.html:41). Fix: ramo de erro antes do vazio. /impeccable harden
- [P2] highlight() rola antes do reload (department-list.component.ts:331). Fix: rolar quando o id existir e a carga terminar. /impeccable harden
- [P2] Moldura empilhada antes do conteúdo (Guia, Resumo, card de Busca). Fix: busca na linha do Resumo, chips protagonistas, avaliar Guia fechado. /impeccable distill + layout
- [P2] Falha do detalhe trava renomear. Fix: mostrar responsável atual da listagem com "manter"; spec back: responsibleUserId ausente = não mudar. /impeccable clarify
- [P3] ⋮ do setor longe do nome; sem "Salvar e adicionar outro". /impeccable layout

## Persona Red Flags
Alex: sem atalhos; busca sem descrição/responsável; sem recolher. Sam: 57 tab stops; seletor sem listbox; toast role=status criado junto do texto, ação expira em 8s. Admin: um modal por setor; "Responsável" vago; falta "quem atende cada setor".

## Minor Observations
Cores literais (#fff2e2, rgba(255,171,0,.16), #b3b5ff); "Definir responsável" sublinhado chama atenção; toast cobre "Adicionar setor" em 1366px; tema escuro ok.

## Questions to Consider
1. Criar departamento já pedindo o 1º setor?
2. Excluir ou arquivar (histórico dos chamados fechados)?
3. Estrutura ou roteamento (quem atende cada setor)?
