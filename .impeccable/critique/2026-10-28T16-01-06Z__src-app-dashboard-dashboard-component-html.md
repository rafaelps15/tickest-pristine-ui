---
target: tela dashboard (Início operacional)
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\dashboard\\dashboard.component.html"
target_fingerprint: "sha256:247060ceca4c49ecd8165eebdf7f9ab8117ad63d714ead8e593979ff339d77fa"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\dashboard\\dashboard.component.html"
timestamp: 2026-10-28T16-01-06Z
slug: src-app-dashboard-dashboard-component-html
---
# Critique — Início operacional (2026-10-28)

Method: dual-agent (A: revisão de design · B: detector). Sem navegador (avaliação pelo código).

| # | Heurística | Nota | Problema |
|---|---|---|---|
| 1 | Visibilidade do status | 3 | faixa de alertas não diz que ignora os filtros |
| 2 | Linguagem do usuário | 2 | "Backlog", "recorte", "Vencem em breve" vs "Em risco" |
| 3 | Controle e liberdade | 3 | — |
| 4 | Consistência | 2 | "Atrasados" em 3 lugares; vocabulário de SLA divergente |
| 5 | Prevenção de erros | 3 | data invertida volta calada |
| 6 | Reconhecer em vez de lembrar | 3 | — |
| 7 | Eficiência | 3 | sem visão "meu dia" |
| 8 | Estética e minimalismo | 2 | 15 cards iguais; ação e contexto com o mesmo peso |
| 9 | Recuperação de erros | 3 | — |
| 10 | Ajuda | 3 | — |
| Total | | 27/40 | Bom |

Detector: 0 anti-padrões; 4 avisos design-system-color rgb(0,0,0), todos falsos positivos (cor herdada).

## Prioridades
1. [P1] Faixa de alertas ignora os filtros, mas o Guia diz que valem pra todos os números (clarify).
2. [P1] Mesmo número em vários lugares: Atrasados (faixa, Central, SLA); Críticos e Sem responsável também nas Ações Rápidas (distill/layout).
3. [P1] Vocabulário de SLA fora do DESIGN.md: "Vencem em breve", "Prazo vencido", duas definições de em risco; "Backlog", "recorte" (clarify).
4. [P2] 5 filtros visíveis (DESIGN.md: 3–4 + "Mais filtros (n)"); barra em 2 linhas empurra a Central (layout).
5. [P2] Bordas: data invertida sem mensagem; "Tempos médios" destaca a mediana; "minutos úteis" com valor em horas; erro do resumo da empresa pra quem não vê esses cards (harden).

## Personas
- Atendente do dia a dia: "Atribuídos a mim" no fim da página; refaz o filtro toda manhã.
- Supervisor: números de mesmo nome divergentes; SLA só em número absoluto.
- Atendente novo: jargão, Guia fechado, sem ponto de partida com a fila em dia.

## Menores
"Fechados" em índigo sem significado; Volume/SLA 3+2 em telas médias; vazio do gráfico ignora filtros; subtítulo "toda a empresa" errado com filtro.

## Perguntas
1. Faixa e Central respondem à mesma pergunta — por que dois blocos com recortes diferentes?
2. O supervisor precisa de 5 cards de volume, ou de "estamos em dia?" com percentual?
3. E se o Início abrisse na visão de quem está logado?
