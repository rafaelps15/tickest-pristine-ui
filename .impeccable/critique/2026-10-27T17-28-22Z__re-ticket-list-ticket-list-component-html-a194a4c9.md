---
target: tela Meus Tickets
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\tickets\\feature-ticket-list\\ticket-list.component.html"
target_fingerprint: "sha256:671841f072beb4c02e71ed0151fcb8fd680327516d26b5baa150d3b9764a0272"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\tickets\\feature-ticket-list\\ticket-list.component.html"
timestamp: 2026-10-27T17-28-22Z
slug: re-ticket-list-ticket-list-component-html-a194a4c9
closed: true
---
Method: dual-agent (A: design review · B: detector). Sem inspeção no navegador (extensão do Chrome desconectada; app exige login).

## Design Health Score — 25/40 (Aceitável)
| # | Heurística | Nota | Problema principal |
|---|---|---|---|
| 1 | Visibilidade do status | 2 | Só o badge de status; não mostra responsável, setor, prazo/SLA nem última movimentação |
| 2 | Linguagem do mundo real | 3 | Mistura "ticket" e "chamado"; "fila de atendimento" é jargão do agente |
| 3 | Controle e liberdade | 3 | Cancelar é reversível e explicado; Excluir não tem desfazer |
| 4 | Consistência | 3 | Aberto/Alta em âmbar e Cancelado/Urgente em vermelho, em colunas vizinhas |
| 5 | Prevenção de erros | 3 | Excluir disponível com o ticket Em Andamento |
| 6 | Reconhecer em vez de lembrar | 2 | "Quem está com meu chamado" exige abrir um por um |
| 7 | Flexibilidade e eficiência | 1 | Sem busca, filtro de status ou ordenação |
| 8 | Estética minimalista | 3 | Limpo; a coluna Prioridade ocupa o lugar de informação mais útil |
| 9 | Recuperação de erros | 3 | Erros separados e específicos (403/404/409) |
| 10 | Ajuda e documentação | 2 | Status não explicados; o Monitor tem guia, esta tela não |

## Especificidade
Intercambiável na estrutura: Título/Abertura/Prioridade/Status/⋮ serviria a qualquer "Meus pedidos". Os conceitos que definem o produto (rastreável, SLA, setores) não aparecem; o Monitor mostra Atendente/Setor/SLA/Prazo. Detector: 0 anti-padrões; 2 avisos design-system-color (h4 e h5 com rgb(0,0,0)), ambos falsos positivos (a cor vem do body: var(--tk-text-primary)).

## Problemas prioritários
- [P1] A linha não responde "quem, onde, até quando": mostrar Setor · Responsável ("Aguardando atendimento") e Prazo/SLA no lugar de Prioridade/Abertura. Precisa do back-end: /tickets/mine não traz assignedToName, sectorName, dueAtUtc, slaStatus nem a última atividade (já existem em TicketMonitorItem). shape → layout.
- [P1] Não separa ativos de encerrados: controle "Em aberto / Encerrados / Todos" (padrão: Em aberto) + busca por título. Precisa do back-end: filtro de status/busca no /mine. shape/layout.
- [P2] Excluir convive com Cancelar e contradiz o "rastreável": Excluir aparece com o ticket Em Andamento e a confirmação não diz o que se perde. Restringir (ex.: só Aberto sem responsável) e dizer o que se perde; reabrir sem motivo reinicia o SLA às cegas. clarify + harden (a regra é decisão de produto).
- [P2] Colisão de cor Prioridade × Status: Cancelado (escolha do usuário, estado final) em vermelho de alarme. Cancelado em neutro e prioridade sem pílula colorida. colorize.
- [P3] No celular só o texto do título é link; a descrição truncada depende de [title] (não funciona em toque/teclado). Link cobrindo o card + line-clamp de 2 linhas. adapt.

## Personas
- Jordan: não vê a diferença entre Cancelar e Excluir antes da confirmação; "Aberto" não diz se alguém pegou; o estado vazio não explica para que serve um chamado; "Início /" parece um link.
- Sam: a tabela vira display:block no celular e perde a semântica (caption/cabeçalhos); a ação pendente não é anunciada; a descrição completa só existe no title.
- Casey: o Status fica por último no card; o rodapé empilha 3 linhas; o alvo do card é só o texto do título.

## Observações menores
"Por página" aparece mesmo com poucos tickets; data absoluta em vez de tempo relativo; state.error virou resto no store; "Editar descrição" reescreve o pedido sem deixar rastro.

## Perguntas
1. Se a promessa é acabar com o "viu meu pedido?", por que a tela não diz quem está com o chamado nem quando ele vence?
2. Um solicitante deveria poder excluir num sistema que existe para ser rastreável?
3. Mudanças do solicitante não deveriam virar mensagem no histórico em vez de reescrever a descrição?
