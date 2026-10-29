---
target: Monitorar Tickets (debug monitorar)
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\tickets\\feature-ticket-monitor\\ticket-monitor.component.html"
target_fingerprint: "sha256:54a611101699a7bf382a02fafa42c54fe8d11cbc0605fb60ca9dbc1b10734c9b"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\tickets\\feature-ticket-monitor\\ticket-monitor.component.html"
timestamp: 2026-10-24T21-57-54Z
slug: ket-monitor-ticket-monitor-component-html-46a93591
---
### Nota de Saúde do Design

| # | Heurística | Nota | Problema-chave |
|---|---|---|---|
| 1 | Visibilidade do status do sistema | 3 | Loading/erro sólidos, mas sem "atualizado às HH:mm" |
| 2 | Compatibilidade com o mundo real | 3 | "Atendente"/"Responsável" são quase-sinônimos entre telas |
| 3 | Controle e liberdade do usuário | 3 | Reset por campo funciona, mas filtro não reflete na URL |
| 4 | Consistência e padrões | 2 | .card-stats igual visualmente ao Dashboard, comportamento diferente |
| 5 | Prevenção de erros | 4 | Tela só leitura |
| 6 | Reconhecimento, não memorização | 2 | Sem resumo de filtros ativos |
| 7 | Flexibilidade e eficiência de uso | 1 | Sem ordenar por SLA, sem ação em lote, sem atribuição rápida |
| 8 | Design estético e minimalista | 3 | Limpo mesmo com densidade de controles |
| 9 | Ajuda a reconhecer/diagnosticar/recuperar erros | 3 | Erro 403 específico + retry; vazio sem "limpar filtros" |
| 10 | Ajuda e documentação | 1 | Nenhuma explicação do que define cada balde de SLA |
| Total | | 25/40 | Aceitável |

### Veredito de Especificidade de Design

Misto. Cards de SLA (clique-pra-filtrar, aria-pressed, tingimento índigo) e a ponte de query params com Dashboard são autorais; a barra de filtros é mobília de tabela administrativa genérica, sem ordenar por urgência de SLA nem remediação em lote.

Varredura determinística: 1 achado, mesmo falso-positivo recorrente (h4) — confirmado falso-positivo.

Cross-check DESIGN.md: sem hex/sombra hardcoded; .filters-card usa borda+sem-sombra (contradiz a regra "sombra é o único separador", deliberado mas não documentado); ícone dos cards de SLA em raio não-tokenizado (mesmo padrão do Dashboard).

### Impressão Geral

Estruturalmente competente com um momento real de craft (cards de SLA), mas a pior nota é a heurística de eficiência numa tela de uso o turno inteiro — e o achado mais sério é um bug de confiança: os números do topo não refletem os filtros da tabela.

### O Que Está Funcionando

1. Identidade dupla dos cards de SLA (KPI + filtro de um clique).
2. TicketMonitorStore singleton root preserva filtro/página ao ir e voltar do detalhe.
3. Degradação responsiva da coluna Atendente dobra a informação em vez de escondê-la.

### Priority Issues

[P0] Cards de resumo de SLA não refletem os filtros da tabela. _slaSummaryResource usa só sectorId como parâmetro (confirmado no store), ignora status/prioridade/busca/unassignedOnly. Fix: ampliar a query ou deixar explícito na copy que são âmbitos diferentes. Comando: /impeccable clarify

[P1] Dropdown de SLA (6 estados) e cards de resumo (4 estados) discordam — escolher "Cumprido" deixa todos os cards sem destaque. Fix: remover os 3 estados pós-resolução do filtro de triagem. Comando: /impeccable distill

[P1] Nenhuma forma de ordenar por urgência de SLA — só "Mais recentes"/"Prazo mais próximo". Comando: /impeccable shape

[P2] Nenhuma atribuição rápida/em lote pro backlog que o switch "Só sem responsável" identifica — ainda exige ida completa ao detalhe. Comando: /impeccable optimize

[P3] Chamado atrasado sinalizado só por cor (text-danger na célula de prazo, sem ícone). Comando: /impeccable harden

### Persona Red Flags

Alex (power user): ida-e-volta completa pra cada atribuição; sem ordenar por SLA; filtros não refletem na URL.

Sam (acessibilidade): card "Filtros" sem fieldset/legend; atraso sinalizado só por cor.

Riley (stress-tester): zero resultado não indica qual filtro é o culpado; título/nome sem text-truncate; select de SLA mais estreito que os outros (col-md-1 vs col-md-2).

### Minor Observations

- Estado vazio da tabela sem role=status/aria-live, inconsistente com o spinner de loading — confirmado por ambas as avaliações.
- Nenhuma região aria-live anuncia a nova contagem de resultados após filtrar.
- Busca só dispara no (change), sem affordance visível de "pressione Enter".
- serverNowUtc vem da API mas nunca é renderizado.
- Terminologia "Atendente"/"responsável"/"Responsável" — três quase-sinônimos entre telas usadas juntas.
- btn-page/btn-icon reaproveitando o alvo de toque de 44px do sistema — boa disciplina, confirmada em 3 telas.

### Questions to Consider

1. E se os 3 estados redundantes do dropdown de SLA fossem removidos e os cards passassem a ser o único filtro de SLA?
2. E se a coluna de Ações ganhasse um "Atribuir a mim" de um clique pra chamados sem responsável?
3. E se a tela mostrasse "Atualizado às HH:mm" usando o serverNowUtc que a API já envia?
