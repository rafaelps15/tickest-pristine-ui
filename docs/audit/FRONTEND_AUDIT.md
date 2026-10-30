# Auditoria do front-end — 2026-10-29

Escopo: todo o `src/` do `tickest-pristine-front` (Angular 22, NgRx Signal Store, Karma/Jasmine),
confrontado com as skills do projeto (`.claude/skills/`: `ca-review`, `add-feature`, `add-tests`,
`add-context`), com o `CLAUDE.md` e com o back-end na `origin/main` do `tickest-pristine`
(`0eff7b6`). O back-end foi só lido.

**Gravidade:** Crítica (segurança, perda de sessão ou dado), Alta (contrato quebrado ou recurso que
não funciona), Média (divergência de regra visível ao usuário, violação de limite de módulo), Baixa
(duplicação ou risco futuro sem efeito hoje).

**Classe:** Defeito (comprovado), Skill (violação explícita de uma skill), Back-end (responsabilidade
do servidor no cliente), Melhoria (justificada, não obrigatória), Mantido (analisado e considerado
correto).

## Resumo

A base está bem estruturada. Não há `any`, `console.log` nem `HttpClient` fora de
`infrastructure/`. Nenhum componente injeta Data Service, e nenhum barrel exporta componentes ou
rotas. Toda mutação passa pela API e recarrega do servidor, e paginação, filtro e ordenação das
listas são do servidor. Os problemas reais encontrados:

| Id | Gravidade | Classe | Achado | Estado |
|---|---|---|---|---|
| A-01 | Crítica | Defeito | Corrida de renovação entre abas pode revogar todas as sessões do usuário | Corrigido |
| A-02 | Alta | Defeito | Falha de rede ou 5xx na renovação desloga o usuário | Corrigido |
| A-03 | Média | Defeito | 401 de requisição enviada com token já renovado dispara segunda renovação | Corrigido |
| A-04 | Alta | Defeito | Contrato da spec 029 com nomes errados: "Aguardando" nunca aparece e o filtro é ignorado | Corrigido |
| A-05 | Alta | Back-end | Cor de função gravada no `localStorage` (persistência simulada) | Removido (BR-001) |
| A-06 | Média | Defeito | "Reabrir" visível sem `tickets:reopen-own`/`tickets:manage` | Corrigido |
| A-07 | Média | Defeito | "Editar" visível para dono sem `tickets:update-own` | Corrigido |
| A-08 | Média | Defeito | "Atribuir responsável" visível sem `tickets:assign` | Corrigido |
| A-09 | Média | Defeito | Nome limitado a 50 caracteres; o servidor aceita 100 e o perfil fica impossível de salvar | Corrigido |
| A-10 | Média | Skill | Início (shell) importa componente interno de `tickets/ui` | Corrigido |
| A-11 | Baixa | Defeito | Novo pedido de confirmação deixava o anterior sem resposta | Corrigido |
| A-12 a A-27 | — | Mantido / Melhoria / Pendência | Ver seções abaixo | Documentado |
| A-34 | Alta | Defeito | Foco visível: anéis do Bootstrap entre 1,2:1 e 2,2:1, `.btn-primary` e campos sem indicador no tema escuro, campos com 1,5px | Corrigido no `04ca7e1` (sessão b345b068) e verificado na aplicação real (ver `FINAL_ACCEPTANCE_AUDIT.md`) |
| A-37 | Média | Defeito | Campo inválido sem borda vermelha no tema escuro (área logada) e no login (claro); o erro fica só no texto e no ícone | Pendente de autorização (ver abaixo) |
| A-35 | Média | Defeito | Achado na revisão final: login com outra conta em outra aba deixava esta aba com usuário, permissões e dados da conta anterior | Corrigido |
| A-36 | Baixa | Defeito | Achado na revisão final: comentário com nome do template de referência e comentário desatualizado sobre rotas do back-end | Corrigido |

## Achados corrigidos

### A-01 — Corrida de renovação de token entre abas (Crítica)

**Evidência:** `shared/services/session.service.ts` lia os tokens do `localStorage` só ao iniciar e
não ouvia o evento `storage`. Quando a aba A renovava, a aba B continuava com o refresh token antigo
na memória e o reenviava na sua próxima renovação. O back-end
(`Users/Refresh/RefreshTokenCommandHandler.cs`, `RevokeSessionsIfTokenWasReusedAsync`) trata o reuso
de um token já trocado, fora da janela de tolerância, como vazamento e **revoga todas as sessões do
usuário**. Em seguida, a aba B chamava `clearSession()` e apagava também os tokens novos da aba A.

**Correção:** o `SessionService` ouve `storage` e aplica nesta aba os tokens gravados ou removidos
por outra (o listener sai no `DestroyRef`). Testes: três casos em `session.service.spec.ts`.

### A-02 — Falha passageira na renovação desloga (Alta)

**Evidência:** `shared/services/token-refresh.service.ts` fazia `catchError(() => of(null))`, e o
interceptor trata `null` como refresh token recusado: sem rede ou com o servidor em 5xx, o usuário
era deslogado.

**Correção:** só a recusa do back-end vira `null`; status 0 e 5xx saem como erro, e o interceptor
devolve o 401 original sem limpar a sessão. Testes: `token-refresh.service.spec.ts` (novo, 5 casos)
e `auth.interceptor.spec.ts`.

### A-03 — Segunda renovação para requisição com token antigo (Média)

**Evidência:** `shared/interceptors/auth.interceptor.ts` sempre renovava no 401. Uma requisição
enviada antes de outra renovação terminar recebia 401 e trocava o refresh token de novo, sem
necessidade.

**Correção:** se o token atual da sessão é diferente do enviado, repete com o atual, sem renovar.

### A-04 — Contrato da spec 029 com nomes errados (Alta)

**Evidência:** o back-end (spec 029, PR #49, na `origin/main`) devolve
`attention.waitingOnRequesterCount`/`waitingOnAgentCount` em `GET /tickets/stats/overview`
(`TicketOverviewResponse.cs`), `waitingOn` em cada item de `GET /tickets`
(`TicketSummaryResponse.cs`) e aceita o filtro `?waitingOn=` (`Endpoints/Tickets/GetAll.cs`). O front
lia `awaitingRequesterCount`/`awaitingAgentCount`/`awaiting` e enviava `?awaiting=`. Resultado: os
cartões "Aguardando a equipe/o solicitante" do Início nunca apareciam, a linha e o painel do
Monitorar nunca mostravam a espera, e o filtro "Aguardando" do Monitorar era ignorado pelo servidor
(a lista vinha sem filtro).

**Correção:** as entidades (`tickets/entities/ticket-dashboard.ts`, `ticket-monitor-item.ts`) usam
os nomes da API; o Data Service manda `waitingOn`. `awaiting` continua só como nome do filtro na tela
e na URL do Monitorar. O enum é numérico nos dois lados (o back não usa `JsonStringEnumConverter`).

### A-05 — Cor de função no navegador (Alta, Back-end)

Removido. Registro completo em `BACKEND_RECONSTRUCTION.md`, BR-001.

### A-06, A-07, A-08 — Ações visíveis para quem a API recusa (Média)

**Evidência no back-end (`origin/main`):**

- Reabrir (`ReopenTicketCommandHandler` + `TicketAccessGuard.EnsureOwnerOrManagerAsync`): dono com
  `tickets:reopen-own`, ou `tickets:manage`.
- Editar descrição (`UpdateTicketCommandHandler`): dono com `tickets:update-own`, ou `tickets:manage`.
- Atribuir (`Endpoints/Tickets/Assign.cs` exige `tickets:manage`; `AssignTicketCommandHandler`
  exige também `tickets:assign` quando o responsável não é quem chama).

**No front:** o detalhe e a lista mostravam "Reabrir" para qualquer chamado inativo e "Editar" para
o dono sem checar `update-own`. Detalhe, Monitorar e Alertas do Início mostravam "Atribuir
responsável" (escolha de qualquer pessoa) só com `tickets:manage`. Resultado: o clique terminava em
403.

**Correção:** `tickets/ui/ticket-action-permissions.ts` (novo) concentra as três regras de
visibilidade, espelhando os handlers, e é usado pelo detalhe, pela lista e pelo Monitorar. Os
Alertas do Início recebem `canAssign` (`tickets:assign`). "Atribuir a mim" no Monitorar continua
só com `tickets:manage`, como no back-end. Isso é só visibilidade: a autorização continua no
servidor.

### A-09 — Limite de nome divergente (Média)

**Evidência:** `UserValidationRules.NameMaxLength = 100` no back; o front usava `maxLength(50)` no
cadastro, na edição de usuário e no perfil. Quem tinha nome entre 51 e 100 caracteres (aceito pela
API) abria o próprio perfil com o formulário inválido e não conseguia salvar.

**Correção:** `USER_NAME_MAX_LENGTH = 100` em `users/entities/user-profile.ts`, usado nos validadores,
no `maxlength` dos campos e nas mensagens. O mínimo de 2 caracteres continua (o servidor só exige não
vazio): é regra de experiência, mais restrita, mantida por decisão de não mudar o comportamento
visível sem pedido.

### A-10 — Limite de módulo do diálogo de atribuição (Média, Skill)

**Evidência:** `dashboard/dashboard.component.ts` importava
`../tickets/ui/ticket-assign-dialog/...`. Pela `ca-review`, o shell só importa barrels e `feature-*`,
e um componente de apresentação reutilizado fora do domínio vai para `shared/ui/`.

**Correção:** o diálogo foi para `shared/ui/ticket-assign-dialog/`. A dependência de domínio
(`UserSummary` de `users`) virou a interface estrutural `AssigneeCandidate`, que o `UserSummary` já
satisfaz. Detalhe, Monitorar e Início importam do novo caminho. `DESIGN.md` atualizado.

### A-11 — Confirmação substituída sem resposta (Baixa)

**Evidência:** `ConfirmDialogService.confirm()` trocava o `Subject` sem completar o anterior; quem
esperava a primeira confirmação nunca recebia resposta.

**Correção:** o pedido anterior responde `false` e completa. Teste novo em
`confirm-dialog.service.spec.ts`.

### A-34 — Foco visível abaixo de WCAG 2.4.7/1.4.11 (Alta)

**Evidência:** a auditoria original não mediu o foco no navegador. Medições posteriores (2026-10-29,
estilos calculados) mostraram:

- o anel translúcido do Bootstrap entre 1,2:1 e 2,2:1 em todos os botões;
- no tema escuro, o `.btn-primary` sem indicador nenhum (`[data-bs-theme="dark"] .btn-primary {
  box-shadow }` apaga o anel);
- no tema escuro, os campos sem troca de borda (`[data-bs-theme="dark"] .form-control { border-color }`
  vence o `:focus`);
- os campos com indicador de 1,5px.

As medições estão no scratchpad desta sessão (`focus/PROPOSTA-TECNICA-FOCO.md`) e no da sessão
b345b068 (`fv-antes.json`: 298 focos, 171 abaixo de 3:1, na aplicação real).

**Verificação independente por pixels** (captura sem foco × com foco, mudança ≥ 3:1; roteiro
`scratchpad/focus/pixeldiff.mjs`, calibrado contra os casos conhecidos):

- **Correção de diagnóstico:** `.btn-outline-secondary` ("Guia da tela", "Com filtros") ganha no
  foco o fundo de hover preenchido (4,7:1 no claro, 8,2:1 no escuro). Já passava na 1.4.11 pela troca
  de fundo; a medição por estilo calculado só olhava o anel e o marcou como reprovado. Reprovam de fato:
  `.btn-primary`, o botão fantasma (`.btn-row-actions`), `.btn-danger`, `.btn-link`, o checkbox, o
  fechar e os campos.
- **Campo com erro no claro:** a borda vermelha já existe sem foco, então a mudança no foco é só o
  anel de 1px (abaixo dos 2px exigidos). Repassado à sessão responsável.
- **Defeito anterior, no tema escuro:** campos inválidos perdem a borda vermelha.
  `[data-bs-theme="dark"] .form-control { border-color }` vem depois do `.is-invalid` do Bootstrap,
  com a mesma especificidade, e o erro fica só na mensagem. Repassado à sessão responsável
  (`styles.css` está no escopo dela).

**Estado:** corrigido no commit `04ca7e1` pela sessão b345b068 (publicado em `origin/main`).

Verificação independente desta sessão, por pixels, na aplicação real com sessão de Administrador,
nos dois temas:

- 734 controles: 305 reprovados antes, 19 depois, 0 regressões;
- os 19 foram conferidos em captura: são artefatos de medição, divisórias internas de grupo ou
  fatias da barra que passam na 1.4.11.

### A-37 — Borda de erro dos campos inválidos (Média)

**Evidência (aplicação real, estilos calculados):**

- Novo chamado no escuro: borda `rgb(58, 63, 68)` em vez de vermelha, porque
  `[data-bs-theme="dark"] .form-control, [data-bs-theme="dark"] .form-select { border-color }` vem
  depois do `.form-control.is-invalid` do Bootstrap, com a mesma especificidade.
- Login (claro): borda `rgb(217, 222, 227)`, porque o `.form-control` do `auth-form.css` é
  encapsulado e vence o `.is-invalid`.

O erro continua no texto e no ícone, então não há quebra de WCAG; o defeito é de consistência visual.

**Correção pronta, não aplicada:**

- (a) excluir `.is-invalid` da regra escura do `styles.css` (`:not(.is-invalid)`);
- (b) no `auth-form.css`, `.form-control.is-invalid { border-color: var(--bs-form-invalid-border-color) }`,
  com o foco do inválido em anel vermelho de 2px, como no global.

A sessão b345b068 informou que o usuário deixou o item "sem autorização para correção neste
momento". Os dois arquivos estão sob responsabilidade dela.


### A-35 — Troca de conta em outra aba (Média)

**Evidência:** a correção A-01 aplicava nesta aba o token gravado por outra, mas mantinha o
`currentUser` carregado. Se outra aba entrava com **outra** conta, esta aba seguia com:

- o menu, as permissões (`hasPermission`) e os botões da conta anterior;
- os dados já carregados nos Stores.

**Correção:** `SessionService.syncFromStorage` compara o `sub` do token anterior com o do novo e,
se a conta mudou, limpa o usuário e recarrega a aplicação (`reloadForAccountSwitch`). A simples
renovação da mesma conta não recarrega. Testes: dois casos novos em `session.service.spec.ts`.

### A-36 — Comentários fora da regra (Baixa)

- `shared/ui/layouts/main-layout/main-layout.component.css` citava o nome do template de
  referência, o que a regra de comentários proíbe.
- `tickets/application/ticket-dashboard.store.ts` dizia que o back-end ainda não entregava
  `/tickets/stats/{overview,times,volume}`, que já estão na `origin/main`.

Os dois foram reescritos.

## Analisado e mantido (responsabilidade legítima do front)

| Id | Onde | Por que fica |
|---|---|---|
| A-12 | `tickets/entities/ticket-status.ts` (`TICKET_STATUS_TRANSITIONS`, `TICKET_ACTIVE_STATUSES`) | Só escolhe quais botões mostrar; o servidor valida a transição (`TicketStatusTransitions.CanTransition`). O ideal seria a API devolver as ações permitidas, mas isso não existe; ver A-24. |
| A-13 | `tickets/ui/ticket-cancel-window.ts` | Usa `canCancel` e `ownerCancelDeadlineUtc` do servidor; o relógio só esconde o botão quando a janela vence com a tela aberta. |
| A-14 | `ticket-monitor.component.ts` (`displaySlaStatus`) e `dashboard-insights.component.ts` | Reclassificam "No prazo/Em risco" para "Atrasado" entre recargas, com a mesma fórmula do servidor (`TicketSla.GetStatus` sobre `DueAtUtc`) e o relógio ancorado em `serverNowUtc`, que o back expõe para isso. Não contradiz o servidor. |
| A-15 | `dashboard.component.ts` (taxa de SLA cumprido, variações contra o período anterior, "Na fila") | Aritmética de apresentação sobre contadores do servidor (`metCount`/`missedCount`, duas leituras do `overview`). "Na fila" usa a mesma definição de `BacklogCount` (Aberto + Em andamento), com números idênticos. Não há valor oficial no servidor que estes números possam contradizer. |
| A-16 | `dashboard-overview.ts`, `dashboard-insight-rules.ts` (frases de tendência, limites 10%/10/5%) | Textos de leitura do gráfico, não indicadores oficiais. Os limites são regra de redação da tela. |
| A-17 | `ticket-summary.store.ts` (3 atrasados + 2 em risco nos Alertas) | Seleção de exibição sobre duas páginas do servidor; os totais vêm do servidor. |
| A-18 | `my-tickets-summary.store.ts` (ativos/finalizados) | Somas de contadores do servidor com o mesmo agrupamento do back (`OwnTicketStatusGroup`). |
| A-19 | `departments/feature-department-list/*` (busca, "sem setores", resumo) e `role-insights` | `GET /departments` e `GET /roles` devolvem a lista completa, sem paginação; filtrar e contar a lista inteira já carregada é apresentação. Se o back passar a paginar, isso precisa mudar. |
| A-20 | `users.store.ts` (impacto da desativação em lote e desativar/reativar em lote) | Aviso informativo (soma de `totalCount` por pessoa) e orquestração de chamadas individuais que o servidor valida uma a uma; o resultado parcial é reportado por pessoa. Não é regra autoritativa. |
| A-21 | Guards e menus (`admin-master.guard.ts`, `main-layout`) | Só UX; as permissões vêm de `GET /users/me` e a API aplica `[HasPermission]`. A rota de Funções exige `roles:manage` (o back lê com `roles:read`): a tela só tem modo só leitura para a função Administrador, então abrir para quem só lê levaria a 403 na edição. |
| A-22 | Limites de mensagem (4000), título (200), descrição (10–500), motivo da reabertura (500), política de senha | Iguais aos validadores do servidor. Validação de experiência, não substitui a do servidor. |

## Pendências e melhorias não executadas

| Id | Gravidade | O quê | Por que não foi feito |
|---|---|---|---|
| A-23 | Média | Tokens de acesso e refresh no `localStorage` (expostos a XSS) | A troca para cookie `HttpOnly` exige mudança no back-end (emissão, CSRF, CORS). É decisão de arquitetura, não remoção de lógica. |
| A-24 | Baixa | O back-end não informa ações permitidas (`canReopen`, `canEdit`, transições), só `canCancel` | Exige contrato novo; hoje o front espelha os handlers (A-06 a A-08, A-12). |
| A-25 | Baixa | Limites de anexo fixos em `tickets/entities/ticket-attachment.ts`, embora exista `GET ticket-attachments/policy` | Os valores coincidem hoje (10 MB, 11 tipos). Passar a ler a política e checar também os limites por chamado (20 arquivos, 100 MB) é melhoria de integração. |
| A-26 | Baixa | Busca de responsável usa `GET /users` (exige `users:read`), não `GET /tickets/assignees` (elegíveis, spec 030) | Muda o comportamento da busca nos três diálogos; precisa de decisão de produto sobre quem aparece. |
| A-27 | Baixa | `environment.prod.ts` aponta `http://localhost:5195` (TODO no arquivo) | A URL de produção não está no repositório; não foi inventada. |
| A-28 | Baixa | Flags `volumeResolved` e `companyStatsForAll` desligadas, embora as specs 028 e 031 estejam na `origin/main` | Estado deixado pelo usuário em outra sessão ("volumeResolved off até validar"); ligar é decisão dele. O comentário desatualizado em `ticket-dashboard.store.ts` foi corrigido na revisão final (A-36). |
| A-29 | Baixa | O 403 de `GET /roles` na tela Usuários (quem tem `users:read` sem `roles:read`) disparava um `GET /users/me` a cada abertura | **Corrigido na revisão final:** a tela só pede as funções com `roles:read` (`user-list.component.ts`, +1 teste). |
| A-30 | Baixa | O `slaStatus` e o `dueAtUtc` de `GET /tickets` são do primeiro ciclo de SLA, inclusive depois de reabrir | Está no back-end (`GetTicketsQueryHandler`); a spec 024 cobre só Meus Chamados, e o branch dela ainda não foi mergeado. O Monitorar herda o valor do servidor. |
| A-31 | Baixa | Linha "Prazo" do detalhe, quando o painel de SLA não carrega, usa o relógio do navegador e o prazo do primeiro ciclo | Fallback já documentado no template; o painel de SLA, que é o caminho normal, usa o relógio do servidor. |
| A-32 | Média | O diálogo de confirmação global sobrevivia à troca de tela ("voltar" do navegador com ele aberto); confirmar executava a ação destrutiva da tela anterior | **Corrigido na revisão final:** o `ConfirmDialogComponent` cancela o pedido aberto em `NavigationStart` (+1 teste). Não há guard `canDeactivate` que dependa dele. |
| A-33 | Baixa | 4 avisos de orçamento de CSS por componente (anteriores à missão) | Reduzir exige mexer em estilos que outras sessões estão editando. |

## Conformidade com as skills

- **Limites de módulo (`ca-review`):** nenhuma importação de `application/` ou `infrastructure/` de
  outro domínio. O único desvio do shell (A-10) foi corrigido. `users/infrastructure/user.data.service.ts`
  chama `GET /tickets` para contar chamados por responsável: é um endpoint de outro domínio dentro do
  Data Service de Usuários, solução documentada no próprio arquivo para evitar um ciclo de barrels.
  Fica registrado; não viola a tabela de importações.
- **Signal Store:** componentes injetam só Stores; leituras via `rxResource`; mutações recarregam o
  resource; `mutationError` separado do erro de leitura.
- **Camadas:** entidades com interfaces e constantes de exibição (padrão já adotado no projeto, ex.:
  `TICKET_STATUS_LABELS`); Data Services com `HttpClient` direto e `Observable` cru.
- **Comentários:** todo símbolo novo tem `/** ... */` curto em português, como exige o `CLAUDE.md`.
  Identificadores novos estão em inglês.
- **Testes:** toda mudança tem spec ao lado; ver `FRONTEND_REFACTOR_PROGRESS.md`.

### Conflito entre instruções

A missão pede comentários que expliquem só a intenção, sem repetir o código. O `CLAUDE.md` do
projeto exige um `/** ... */` em português em **toda** função, propriedade e classe, dizendo o que
ela faz. Prevalece o `CLAUDE.md` (instrução do repositório, mais específica): os comentários novos
seguem a convenção dele, curtos e em uma linha quando possível.
