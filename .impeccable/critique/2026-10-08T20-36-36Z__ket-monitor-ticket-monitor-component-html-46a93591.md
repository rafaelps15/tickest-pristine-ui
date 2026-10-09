---
target: monitorar
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\tickets\\feature-ticket-monitor\\ticket-monitor.component.html"
target_fingerprint: "sha256:a0a3a5a8b15da9149949a17b46a76f3bf0cc8484f77fa8ae2bc5fd95dd5c929d"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\tickets\\feature-ticket-monitor\\ticket-monitor.component.html"
timestamp: 2026-10-08T20-36-36Z
slug: ket-monitor-ticket-monitor-component-html-46a93591
---
Method: dual-agent (A: aa841f4fa3bfcec21 · B: a3419cca6e91ea2ff)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | `slaSummaryLoading` existe no store mas nunca é lido — cards/gráfico de SLA podem mostrar números defasados sem indicador |
| 2 | Match System / Real World | 4 | Terminologia e cores de badge mapeiam 1:1 com DESIGN.md |
| 3 | User Control and Freedom | 3 | Filtros só no store, não na URL — não dá pra compartilhar/favoritar uma visão filtrada |
| 4 | Consistency and Standards | 4 | Tabela/paginação/ação de linha quase idênticas a "Meus Tickets" |
| 5 | Error Prevention | 3 | Tela só-leitura, baixo risco; estado vazio tratado |
| 6 | Recognition Rather Than Recall | 3 | Select de ordenação espremido pode ocultar o valor selecionado |
| 7 | Flexibility and Efficiency | 1 | Sem exportação, sem filtro por atendente, sem ação em lote, sem ordenar por severidade de SLA |
| 8 | Aesthetic and Minimalist Design | 3 | Gráfico de rosca duplica os 4 cards, chrome não-acionável acima da tarefa |
| 9 | Error Recovery | 4 | Erro 403 com mensagem específica em português |
| 10 | Help and Documentation | 2 | Nada explica a diferença entre "Em Risco" e "Atrasado" |
| **Total** | | **29/40** | **Bom** |

## Design Specificity Verdict

**LLM assessment**: Majoritariamente genérico, vestindo a roupa de um sistema bem feito. No nível de token, DNA autoral real (cores de badge batem com DESIGN.md, erro 403 específico). No nível de design de informação, intercambiável com qualquer tela admin genérica — nada expressa o conceito de SLA além de recolorir um enum; o gráfico de rosca não adiciona informação além dos cards.

**Deterministic scan**: 11 achados via `impeccable detect`, todos advisory. 1 falso positivo conhecido (rgb(0,0,0) no h4). 10 reais: 1 font-size fora do ramp, 1 cor de borda de input, 8 cores de badge (documentação do DESIGN.md ainda não atualizada para o ajuste de contraste WCAG feito em 2026-10-08).

**Visual overlays**: indisponíveis — rota autenticada, sem credenciais nesta sessão. Confirmado redirect para /login.

## Overall Impression

Funciona e respeita o sistema, nenhum P0. Montada com peças do kit errado: peças de "admin genérico" (KPI cards + gráfico de pizza) em vez de peças desenhadas pro trabalho real de triagem sob pressão de prazo. O gráfico de SLA não paga aluguel e quebra o próprio padrão de acessibilidade que o Dashboard já resolveu neste projeto.

## What's Working

1. Fidelidade de token ponta a ponta (badges, gráfico, tudo nos mesmos 3 tons semânticos do DESIGN.md).
2. Mensagem de erro 403 específica e humana.
3. Reaproveitamento fiel do padrão de paginação/ação de linha de "Meus Tickets".

## Priority Issues

- **[P1] Select de "Ordenar" espremido (col-md-1)** — ticket-monitor.component.html:161-169. Fix: col-md-2+. `/impeccable layout`
- **[P1] Gráfico de SLA duplica os cards, sem fallback acessível (regressão vs. Dashboard)** — ticket-monitor.component.html:79-99. Fix: cortar ou dar toggle de tabela. `/impeccable distill`
- **[P1] Sem coluna/filtro de atendente responsável** — ticket-monitor-item.ts:15-16 tem o dado, tabela não usa. `/impeccable clarify`
- **[P2] slaSummaryLoading nunca lido, sem sinal de atualização** — ticket-monitor.store.ts:57. `/impeccable polish`
- **[P2] Sem exportação/ação em lote numa tela de compliance** — `/impeccable optimize`

## Persona Red Flags

**Alex (power user)**: select de ordenação quebrado mina confiança; sem coluna de atendente custa um clique por ticket; sem ordenar por severidade; gráfico redundante é imposto de scroll antes da tarefa.

**Sam (acessibilidade)**: card de SLA é região vazia/invisível (aria-hidden, sem tabela alternativa) — perda total de informação, regressão vs. padrão já resolvido no Dashboard.

**Casey (mobile)**: 8 colunas vs. 5 em "Meus Tickets" força scroll horizontal; 4 cards + gráfico redundante + filtros antes da tabela = 2-3 telas de scroll não-acionável no mobile.

## Minor Observations

- "Buscar" parece só por título, apesar de nome/e-mail do solicitante estarem na tabela.
- pageSize máximo 50 numa tela que lista todos os tickets do sistema.
- `.filters-card` é o único card com borda (1px) num sistema "sem borda, só sombra".
- Fatias do gráfico deveriam somar "Ativos" mas nada confirma isso visualmente.
- `rangeStart()`/`rangeEnd()` duplicados entre ticket-monitor e ticket-list (DRY menor).

## Questions to Consider

- Qual é a ação real após encontrar um atraso, se a tela é só-leitura — não deveria estar a um clique?
- O gráfico repete números mais precisos dos cards — que decisão ele habilita que os cards não habilitam?
- O Supervisor (PRODUCT.md) vai compartilhar esta tela com um objetivo diferente do Admin — ela já é dois trabalhos numa UI só?
