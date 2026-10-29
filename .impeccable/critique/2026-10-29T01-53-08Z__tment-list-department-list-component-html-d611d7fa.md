---
target: tela departamentos
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\departments\\feature-department-list\\department-list.component.html"
target_fingerprint: "sha256:9868a2fcd11444411c9603f4b8f9aad87a83860c757fd8d7e2074e9376ec3769"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\departments\\feature-department-list\\department-list.component.html"
timestamp: 2026-10-29T01-53-08Z
slug: tment-list-department-list-component-html-d611d7fa
---
Method: dual-agent (A: design review · B: detector + browser [browser indisponível — extensão Chrome desconectada]) + audit técnico 14/20

## Design Health Score — 26/40 (Aceitável, -1 vs 27)
| # | Heurística | Nota | Problema |
|---|---|---|---|
| 1 | Visibilidade do status | 3 | busca por setor não marca o setor encontrado |
| 2 | Mundo real | 3 | "Responsável" sem papel explicado |
| 3 | Controle e liberdade | 2 | alerta de erro de salvar preso na página; trava do responsável |
| 4 | Consistência | 2 | falha de leitura em vermelho; "Salvar" genérico |
| 5 | Prevenção de erros | 3 | confirmação diz a cascata |
| 6 | Reconhecimento | 3 | setor encontrado sem destaque |
| 7 | Flexibilidade | 2 | sem "Salvar e adicionar outro" |
| 8 | Estética | 3 | Resumo = card pra uma linha |
| 9 | Recuperação de erros | 2 | mutationError vaza pro listState |
| 10 | Ajuda | 3 | Guia curto, fechado |

## Especificidade
Autoral (regra do setor em todas as camadas). Detector: 4 advisory — 3 rgb(0,0,0) linha 0 (falsos positivos), #fff2e2 literal (insights.css:49).

## Priority Issues
- [P1] mutationError entra no listState.error (departments.store.ts:51): alerta duplicado/preso, primeiro uso perde o vazio e o Resumo diz "indisponível". /impeccable harden
- [P1] Trava do responsável: GET mesmo com responsável nulo; falha sem "Remover", Salvar desabilitado sem motivo. /impeccable clarify
- [P2] Estados assíncronos: toast falso quando recarga falha com filtro; "Nenhum usuário encontrado" no debounce; busca sem switchMap. /impeccable harden + optimize
- [P2] A11y: foco perdido quando botão some; role=status dentro de @if; scroll suave ignora reduced-motion; btn-sm/btn-link <44px; sem aria-invalid/required. /impeccable harden + adapt
- [P2] Sistema/eficiência: falha de leitura vermelha; realce apaga o fundo do card; literais de cor; ⋮ do setor longe; sem "Salvar e adicionar outro". /impeccable colorize + layout + animate

## Persona Red Flags
Alex: um modal por setor, filtro fora da URL, sem atalho. Sam: erro anunciado 2x, foco perdido, status não anunciados, Salvar desabilitado sem motivo. Admin primeiro uso: falha ao criar + cancelar some o CTA; responsável sem propósito explicado.

## Minor Observations
div em button; sem overflow-wrap; doc comment da classe sobre a constante; .min-w-0 duplicado; listState().data morto.

## Questions to Consider
1. Departamentos sem setor primeiro na lista?
2. O Resumo ainda merece card?
