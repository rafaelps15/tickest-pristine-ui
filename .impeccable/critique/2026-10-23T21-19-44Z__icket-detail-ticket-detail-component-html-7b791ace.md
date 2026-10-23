---
target: tickets/feature-ticket-detail
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\tickets\\feature-ticket-detail\\ticket-detail.component.html"
target_fingerprint: "sha256:e37e1be143a25dd680d8453af4774990c784fbf74366e3aebca7f2909c9b8a5d"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\tickets\\feature-ticket-detail\\ticket-detail.component.html"
timestamp: 2026-10-23T21-19-44Z
slug: icket-detail-ticket-detail-component-html-7b791ace
closed: true
---
### Design Health Score

| # | Heurística | Nota | Problema-chave |
|---|---|---|---|
| 1 | Visibilidade do status do sistema | 3 | Nada sinaliza a busca "na fila" durante os 300ms de debounce entre a tecla e o spinner. |
| 2 | Compatibilidade com o mundo real | 3 | Nomes de papel crus (ex. "Agente") aparecem sem traduzir "quem pode ser responsável" pro usuário. |
| 3 | Controle e liberdade do usuário | 3 | Alternar seleção, Cancelar e reset ao reabrir funcionam bem; sem desfazer após confirmar uma reatribuição. |
| 4 | Consistência e padrões | 2 | Badges de função sem o limite "2 + N" que `user-list.component.ts` já implementa; "Remover" passa pelo modal de confirmação global, "Atribuir/Alterar" não. |
| 5 | Prevenção de erros | 1 | `Tickets.AssigneeCannotManageTickets` só aparece depois do envio — nada na UI reduz esse risco antes do clique. |
| 6 | Reconhecimento, não memorização | 4 | Responsável atual é marcado de três formas (linha de contexto, tag "Atual", posição). |
| 7 | Flexibilidade e eficiência de uso | 2 | `role="listbox"`/`"option"` sem navegação por seta, sem atalho "atribuir a mim". |
| 8 | Design estético e minimalista | 3 | Limpo, sem ruído visual. |
| 9 | Ajuda a reconhecer/diagnosticar/recuperar de erros | 2 | Erro vira só um `alert-danger` genérico, sem dica de como corrigir. |
| 10 | Ajuda e documentação | 2 | Nenhuma pista no modal sobre quem pode ser responsável. |
| **Total** | | **25/40** | **Aceitável** (todas as 10 heurísticas se aplicam — é uma tela Operate) |

### Veredito de especificidade de design

**Avaliação A**: Não é Bootstrap genérico — a seleção usa tingimento suave (rgba(índigo, 0.1), nunca preenchimento sólido), espelhando a mesma linguagem do item ativo da sidebar, e todo acento passa por --tk-primary. Onde volta a ser "qualquer admin": a linha do candidato (nome + e-mail + badges + tag) não carrega nenhuma personalidade do produto — é o momento mais frio e puramente administrativo do fluxo, justamente numa ação (reatribuir a responsabilidade pelo problema de alguém) que o próprio DESIGN.md descreve como merecedora de "um toque de acolhimento".

**Varredura determinística (Avaliação B)**: 1 achado, advisory, falso-positivo confirmado — rgb(0,0,0) num h4 sem nenhuma cor própria atribuída (herdado do navegador/Bootstrap, não introduzido por este código). Nenhum outro literal de cor/raio/sombra sem rastro a token no HTML; no CSS, 4 valores parcialmente rastreáveis: o canal de cor de todos eles já usa --tk-primary/--tk-primary-rgb, só a opacidade (0.04, 0.1) e a geometria do anel de foco (inset 0 0 0 2px) não são, em si, tokens nomeados — mas isso não é exclusivo deste código: o próprio .form-control:focus global do projeto já faz exatamente a mesma coisa, então é um padrão pré-existente, não uma regressão introduzida aqui.

**Correção feita na síntese**: a Avaliação A recomenda (P1) desabilitar candidatos "cujo papel não inclui uma função que atende chamados", assumindo isso computável no front a partir de candidate.roles. Não é — confirmado nesta sessão investigando o back-end: papel→permissão é RBAC dinâmico e configurável por administrador (dado, não código), sem endpoint que devolva "candidatos elegíveis". A correção certa é no texto do erro e no feedback, não numa lista de papéis hard-coded no front.

### Impressão geral

O fluxo é tecnicamente sólido e visualmente fiel ao sistema, mas trata um ato de confiança institucional — "você agora é responsável pelo problema desta pessoa" — como uma tarefa burocrática sem peso: zero reforço emocional, uma lista de candidatos que não distingue quem pode falhar, e uma reatribuição tratada com menos cerimônia do que uma remoção.

### O que funciona bem

1. onOpenAssignModal() reseta busca, seleção, erro de mutação e candidatos a cada abertura — sem estado velho vazando de uma tentativa anterior.
2. Disciplina de tingimento suave na seleção (rgba(índigo, 0.1) + ícone de check em --tk-primary, com comentário explícito "nunca preenchimento sólido" no CSS) — reaproveita a linguagem do item ativo da sidebar em vez de aceitar o azul sólido padrão do Bootstrap.
3. Gate de permissão correto nos dois botões (tickets:manage + status ativo) — impede que o erro Tickets.NotActive seja alcançável pela UI.

### Priority Issues

[P1] Elegibilidade do candidato só é descoberta no envio, não na busca. Qualquer usuário ativo aparece na lista; só ao clicar "Atribuir" o back-end pode recusar com Tickets.AssigneeCannotManageTickets. Fix: mensagem de erro deveria nomear a ação de recuperação, e o alerta deveria ficar mais perto do candidato escolhido. Comando: harden.

[P2] Reatribuir carrega menos peso visual do que remover. "Remover responsável" passa pelo ConfirmDialogService; "Atribuir/Alterar" confirma no primeiro clique, cujo texto continua "Atribuir" mesmo quando o título já mudou para "Alterar responsável". Fix: trocar o texto do botão pra "Reatribuir" e mostrar "Isso substitui {atual} por {novo}". Comando: clarify.

[P2] Badges de função ignoram a própria regra de overflow do DESIGN.md (máx. 2 + "+N", já implementada em user-list.component.ts, não reaproveitada aqui). Fix: extrair visibleRoles/hiddenRolesCount pra um util compartilhado. Comando: polish.

[P2] Semântica ARIA promete um comportamento que não existe — role="listbox"/"option" sem navegação por seta, aria-activedescendant ou aria-live. Fix: implementar navegação real ou remover os papéis listbox/option. Comando: harden.

[P3] Erro de mutação não limpa ao escolher outro candidato após uma falha. Fix: chamar detailStore.clearMutationError() dentro de onSelectAssignee. Comando: polish.

### Persona Red Flags

- Jordan (iniciante): sem dica sobre quem pode ser escolhido; descobre a regra por tentativa e erro.
- Sam (acessibilidade): listbox sem seta e sem anúncio ao vivo quando a busca muda os resultados.
- Riley (testador): erro de uma tentativa anterior continua na tela ao selecionar um candidato diferente.

### Observações menores

- Lista de candidatos ganhou --bs-list-group-border-color: var(--tk-border); os list-group-flush de Anexos/Histórico na mesma tela não — divisores sutilmente diferentes.
- Botão de confirmar continua "Atribuir" mesmo no estado "Alterar responsável" (mesma causa do P2 acima).
- .max-w-700 (700px) sem token no DESIGN.md, mas compartilhado com outras telas, não introduzido aqui.
- Sem avatar/inicial nas linhas de candidato — checar paridade com a Gestão de Usuários.

### Perguntas provocativas

1. Vale abrir uma frente pra pedir um endpoint de elegibilidade no back-end, ou a mensagem de erro mais clara já resolve por agora?
2. "Remover" merece o modal de confirmação do sistema, mas "Atribuir/Alterar" não — decisão deliberada ou lacuna?
