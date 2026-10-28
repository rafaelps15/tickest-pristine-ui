---
target: tela Meus Chamados (pós specs 015/016)
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\tickets\\feature-ticket-list\\ticket-list.component.html"
target_fingerprint: "sha256:80f9152b013465237fc6e6e55fc86b51a33624ff0a9b589c911d9458b1a43ae5"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\tickets\\feature-ticket-list\\ticket-list.component.html"
timestamp: 2026-10-28T00-47-44Z
slug: re-ticket-list-ticket-list-component-html-a194a4c9
---
Method: dual-agent (A: design review · B: detector). Sem navegador (extensão do Chrome desconectada; app exige login).

## Design Health Score — 26/40 (Aceitável; antes 25/40)
| # | Heurística | Nota | Problema principal |
|---|---|---|---|
| 1 | Visibilidade do status | 2 | Erro de carga aparece junto de "Nada pendente"; prazo/SLA congelados depois de reabrir; a linha some sem aviso ao cancelar/reabrir |
| 2 | Linguagem do mundo real | 3 | pt-BR natural; "Em risco", "Sem SLA" e "Resolvido com atraso" são do vocabulário de quem atende |
| 3 | Controle e liberdade | 3 | Filtros na URL e "Voltar"; sem "Desfazer"; "Limpar busca" também volta o grupo pra Em aberto |
| 4 | Consistência | 2 | "⋮" com 1 ação contraria a regra do DESIGN.md (menu só com mais de 2); Guia diz "Fechado: encerrado de vez" mas há Reabrir |
| 5 | Prevenção de erros | 3 | Relógio da janela, trava de pendente e aviso de descarte |
| 6 | Reconhecer em vez de lembrar | 3 | Janela de cancelamento só visível abrindo o "⋮"; escopo da busca implícito |
| 7 | Flexibilidade e eficiência | 2 | Busca só no título (sensível a acento); sem contagem por grupo; sem número do chamado |
| 8 | Estética minimalista | 3 | Duas pílulas lado a lado (Prazo e Status) com o mesmo peso |
| 9 | Recuperação de erros | 2 | Erro de leitura vira dado ("Nada pendente") |
| 10 | Ajuda e documentação | 3 | Guia bom, com a contradição sobre Fechado e "peça a quem administra" sem dizer quem |

## Especificidade
Conteúdo próprio do produto (primeiro uso contra e-mail/WhatsApp com os departamentos reais, janela de 15 min, "Aguardando atendimento"); forma visual ainda de categoria (tabela Bootstrap, pílulas, "⋮"). Detector: 0 anti-padrões; 5 avisos design-system-color, todos falsos positivos (cor calculada sem o CSS global).

## Problemas prioritários
- [P1] Erro de carga vira "Nada pendente" (ticket-list.component.html, ramos de vazio): com loadError, hasAnyTicket fica null e o template cai no vazio do grupo. Ramo próprio de erro antes dos vazios + teste. harden.
- [P1] Prazo/SLA de chamado reaberto ficam congelados (regra do back: Met/Missed congelam na 1ª resolução; Reopen não mexe em DueAtUtc/ResolvedAtUtc), mas o diálogo de reabrir promete "o prazo recomeça". Ajustar o texto agora; expor o ciclo vigente no /tickets/mine é spec de back. clarify (+ back-end).
- [P2] Busca presa ao grupo sem avisar: na aba Em aberto, "Nenhum chamado com X" pode ser falso; "Limpar busca" também reseta o grupo. Oferecer "Buscar em todos" e limpar só a busca. clarify.
- [P2] "⋮" com uma ação só e linha que some sem rastro ao cancelar/reabrir dentro do filtro: ação única inline (regra do DESIGN.md), foco no título depois do reload, toast dizendo pra onde foi. layout + polish.
- [P3] Pílulas de Status e SLA com as mesmas cores (Aberto âmbar = Em risco; Resolvido verde = Cumprido); "Sem SLA" fora da legenda do Guia. quieter/colorize.

## Falso positivo descartado
"403 da janela vencida diz 'sem permissão'": o extractErrorMessage prioriza o texto da API ("O prazo de 15 minutos… terminou"); o genérico só entra sem corpo.

## Personas
- Jordan: primeira visita empilha Guia aberto + barra de filtros sem nada pra filtrar + bloco de primeiro uso; "peça a quem administra" não diz quem; não há pista de que Cancelar mora no "⋮".
- Sam: foco perdido quando a linha sai do filtro; recarga/busca sem anúncio (só opacidade, sem aria-busy/aria-live).
- Casey: card alto (título, 2 linhas de descrição, 4 pares); Guia aberto empurra a lista.

## Observações menores
Modal de edição usa "Cancelar" (ambíguo); prazo absoluto ao lado de "atualizado" relativo; sem número do chamado; busca sensível a acento; pointer-events: none da recarga não trava o teclado.

## Perguntas
1. Se cancelar se desfaz reabrindo, por que confirmar em vez de executar com "Desfazer", como o DESIGN.md recomenda?
2. O solicitante quer um semáforo de SLA ("Em risco") ou a frase "deve ser atendido até quinta, 14h"?
3. Se o que a pessoa quer é saber se o atendente respondeu, a linha não deveria dizer "nova mensagem de Fulano" em vez de "há 2 h"?
