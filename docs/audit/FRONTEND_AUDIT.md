# Auditoria do front-end — 2026-10-29

Escopo: todo o `src/` do `tickest-pristine-front` (Angular 22, NgRx Signal Store, Karma/Jasmine),
confrontado com as skills do projeto (`.claude/skills/`: `ca-review`, `add-feature`, `add-tests`,
`add-context`), com o `CLAUDE.md` e com o back-end na `origin/main` do `tickest-pristine`
(`0eff7b6` na auditoria; conferida de novo em `a72e07b`, PR #54, spec 038, em 2026-10-30). O back-end foi só lido.

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
| A-05 | Alta | Back-end | Cor de função gravada no `localStorage` (persistência simulada) | Removido (BR-001); o requisito do back-end está na spec 044 do `tickest-pristine` |
| A-06 | Média | Defeito | "Reabrir" visível sem `tickets:reopen-own`/`tickets:manage` | Corrigido |
| A-07 | Média | Defeito | "Editar" visível para dono sem `tickets:update-own` | Corrigido |
| A-08 | Média | Defeito | "Atribuir responsável" visível sem `tickets:assign` | Corrigido |
| A-09 | Média | Defeito | Nome limitado a 50 caracteres; o servidor aceita 100 e o perfil fica impossível de salvar | Corrigido |
| A-10 | Média | Skill | Início (shell) importa componente interno de `tickets/ui` | Corrigido |
| A-11 | Baixa | Defeito | Novo pedido de confirmação deixava o anterior sem resposta | Corrigido |
| A-12 a A-27 | — | Mantido / Melhoria / Pendência | Ver seções abaixo | Documentado |
| A-34 | Alta | Defeito | Foco visível: anéis do Bootstrap entre 1,2:1 e 2,2:1, `.btn-primary` e campos sem indicador no tema escuro, campos com 1,5px | Corrigido no `04ca7e1` (sessão b345b068) e verificado na aplicação real (ver `FINAL_ACCEPTANCE_AUDIT.md`) |
| A-37 | Média | Defeito | Campo inválido sem borda vermelha no tema escuro (área logada) e no login (claro); o erro fica só no texto e no ícone | Corrigido (autorizado em 2026-10-30; sessão 9b) e verificado na aplicação real |
| A-38 | Média | Defeito | Diálogo "Atribuir responsável" oferecia qualquer usuário ativo (GET /users, exige `users:read`); a atribuição só aceita elegíveis (`TicketAssigneeEligibility`) | Corrigido (era A-26) |
| A-39 | Baixa | Defeito | Limites de anexo duplicados no front em vez da política do back-end | Corrigido (era A-25) |
| A-40 | Baixa | Defeito | "Hoje" do limite de pontos do gráfico em UTC: entre 21h e meia-noite contava um dia a mais | Corrigido |
| A-41 | Média | Defeito | Meus Chamados com rolagem horizontal da página inteira (9px no desktop, 347px no tablet de 768px) | Corrigido |
| A-42 | Alta | Defeito | Um 429 (limite global do back-end, 100 requisições/min por usuário) em GET /users/me mandava pro login quem tinha sessão válida; um 429 na renovação também deslogava | Corrigido em duas etapas: novas tentativas e, depois delas, tela recuperável em vez do login (ver abaixo) |
| A-43 | Média | Defeito | Achado na revisão técnica final: com o token de acesso vencido e a renovação falhando de forma passageira (rede, 429, 5xx), o interceptor devolvia o 401 original; o GET /users/me lia isso como sessão recusada, ia pro login e, dentro de `/sessao-indisponivel`, apagava a sessão | Corrigido |
| A-44 | Baixa | Pendência técnica | `admin-master.guard.ts` ignora o resultado `unavailable` de `ensureLoaded()` (trata qualquer resultado como carregado e decide só pela permissão) | Corrigido no saneamento de 2026-10-30 (com o C-06) |
| A-45 | Baixa | Defeito | Achado na revisão final da sessão 9b: escolher um item (ou o logo) da gaveta deixava o foco no link, que some com a gaveta; o Tab recomeçava do topo do documento. O logo navegava sem fechar a gaveta | Corrigido e verificado na aplicação real |
| A-46 | Baixa | Defeito | Achado na revisão final da sessão 9b: com a gaveta aberta, o Tab saía dela para os toasts, montados fora do layout | Corrigido e verificado na aplicação real |
| R-01 a R-04 | Alta (R-01 a R-03), Média (R-04) | Defeito | Menu lateral em gaveta (abaixo de 1200px): controles da gaveta fechada no Tab, foco que não entrava na gaveta aberta, itens fora da tela no celular deitado sem rolagem, Esc que não fechava | Corrigido e verificado na aplicação real (ver abaixo) |
| A-35 | Média | Defeito | Achado na revisão final: login com outra conta em outra aba deixava esta aba com usuário, permissões e dados da conta anterior | Corrigido |
| A-36 | Baixa | Defeito | Achado na revisão final: comentário com nome do template de referência e comentário desatualizado sobre rotas do back-end | Corrigido |

## Método e escopo

- **Contrato real como referência:** cada divergência foi checada no back-end da `origin/main`;
  nenhum endpoint ou campo foi inventado.
- **Visibilidade, não autorização:** as regras de permissão do front só escondem o que a API
  recusaria. A autorização continua no servidor.
- **Remover só o comprovado:** lógica que parece de negócio, mas só apresenta números do servidor
  ou orquestra chamadas que ele valida, ficou e está justificada em "Analisado e mantido".
- **Trabalho paralelo no mesmo working tree:** cada alteração foi um hunk pequeno, aplicado depois
  de reler o arquivo, sem stage nem commit.
- **Fora do escopo:**
  - alterações no back-end;
  - tokens em cookie (A-23);
  - ligar as flags do Início (A-28);
  - URL de produção (A-27);
  - ciclo de SLA na listagem (A-30).

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

Removido em 2026-10-29 (BR-001). O requisito do back-end, para o recurso voltar, está na spec 044 do
back-end (`tickest-pristine/specs/044-cor-do-badge-da-funcao/spec.md`, em descoberta). Ela substitui o documento temporário `BACKEND_RECONSTRUCTION.md`,
removido na consolidação de 2026-10-30.

- **O que existia no front:**
  - `shared/utils/role-colors.util.ts` (excluído, com a spec) guardava no `localStorage`, na chave
    `tickest.roleColors`, um mapa *nome da função → `#rrggbb`* e validava o contraste do badge;
  - a tela Funções tinha o diálogo "Cor do badge…" (`roles/feature-role-list/*`);
  - os badges usavam `.badge-role-custom` (`styles.css`) em Usuários, no painel de informações e no
    diálogo de atribuição.
- **Por que saiu:** a cor é um dado da função que o administrador configura para todos. Gravada no
  navegador:
  - não sincronizava entre usuários nem dispositivos;
  - se perdia ou mudava de função ao renomear;
  - não tinha autorização.
- **Hoje:** todos os badges de função usam `bg-label-primary`, e nenhuma tela lê a chave antiga.
- **Backup** do estado anterior (diff e os arquivos excluídos), local e temporário:
  `C:\Users\rafae\AppData\Local\Temp\claude\c--dev-tickest-pristine-front\65d7fc55-6391-4e98-8ae7-b7f896419fc4\scratchpad\backup-br001\`.
- **No front, depois da entrega da spec 044:**
  - o campo de cor em `roles/entities/role.ts` e `users/entities/user-summary.ts`;
  - a gravação no `RoleDataService` e no `RolesStore`, que recarrega no sucesso;
  - o diálogo de cor na tela Funções;
  - `.badge-role-custom` lendo a cor da API.

  O diálogo de atribuição não volta a ter badge de função: `GET /tickets/assignees` não devolve
  funções (A-38).

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

**Correção (autorizada pelo usuário em 2026-10-30, feita pela sessão 9b):**

- `styles.css`: `[data-bs-theme="dark"] .form-control.is-invalid` e `.form-select.is-invalid` com
  `border-color: var(--bs-form-invalid-border-color)`;
- `auth-form.css`: a borda vermelha e o anel vermelho de 2px no foco, também no campo dentro do
  grupo da senha.

**Verificação independente na aplicação real (sessão 92):**

| Tela e tema | Borda do inválido | Foco do inválido |
|---|---|---|
| Login (claro) | `rgb(220, 53, 69)` (era `rgb(217, 222, 227)`) | 2px; a senha dentro do grupo tem 2px nos quatro lados (4,2–4,3:1) |
| Novo chamado (claro) | `rgb(220, 53, 69)` | 2px nos três campos |
| Novo chamado (escuro) | `rgb(234, 134, 143)` (era `rgb(58, 63, 68)`) | 2px nos três campos |


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

### A-38, A-39, A-40 — Revisão de conciliação (2026-10-30)

- **A-38:** ver A-26.
  - Arquivos: `tickets/application/ticket-{detail,monitor,summary}.store.ts`,
    `shared/ui/ticket-assign-dialog/*` e as specs.
  - Validado na aplicação real: a busca vai para `/tickets/assignees`; o diálogo lista "Admin Master —
    Sem setor"; a API devolve 56 elegíveis.
- **A-39:** ver A-25.
  - Arquivos: `tickets/entities/ticket-attachment.ts`,
    `tickets/infrastructure/ticket-attachment.data.service.ts` (+spec nova),
    `tickets/application/ticket-attachments.store.ts`, `tickets/feature-ticket-detail/*`.
  - Validado na aplicação real: `GET /ticket-attachments/policy` responde 200 e um `.exe` é barrado
    antes de qualquer envio.
- **A-40:** `ticket-dashboard.store.ts` usava `new Date().toISOString()` como "hoje" no limite de 366
  pontos.
  - `todayInSaoPaulo` foi para `shared/utils/iso-date.util.ts`; o `dashboard-filters.ts` a
    reexporta.
  - Teste de borda: às 23:30 de 31/10 em Brasília, 366 dias ainda cabem dia a dia.

### A-41 e A-42 — Verificação final de responsividade (2026-10-30)

**A-41.** Meus Chamados com rolagem horizontal da página inteira.

- **Causa 1:** o `.layout-container` e o `.layout-page` são itens flex sem `min-width: 0` e cresciam
  até a largura da tabela. Correção no `main-layout.component.css`: `min-width: 0` nos dois.
- **Causa 2:** o `.visually-hidden` (`position: absolute`) das células tinha o bloco de contenção
  fora do `.table-responsive` e ainda alargava a página em 196px. Correção no `styles.css`:
  `.table-responsive { position: relative }`.
- **Resultado:** rolagem horizontal 0 em todas as telas e resoluções.
- **Observação, não é defeito:** entre 768 e 991px, a tabela de Meus Chamados rola dentro do card
  para mostrar Status, Atualizado e Ações. É o comportamento do `.table-responsive`, e tabela de
  dados está dispensada da 1.4.10.

**A-42.** Sessão válida mandada pro login por um 429.

- **Como foi achado:** durante a medição, a aplicação foi pro login com o token válido e sem
  nenhum 401. Uma sonda de rede registrou `GET /users/me` → 429.
- **Causa:** o `CurrentUserService` tratava qualquer falha como "não logado". O
  `TokenRefreshService` só tratava 0 e 5xx como falha passageira, e um 429 na renovação também
  deslogava.
- **Primeira etapa (sessão 92):** `isTransientHttpError` (0, 429, 5xx) em
  `shared/utils/http-error.util.ts`, usada pelos dois serviços. O GET /users/me tenta de novo depois
  de 1, 2, 4 e 8s, e a renovação não desloga num 429.
- **O que a primeira etapa não cobria (revisão da sessão 9b):** as novas tentativas somam cerca de
  15s, mas o limite do back-end é uma janela fixa de 60s. Um 429, um 5xx ou uma queda de rede que
  durasse mais que isso ainda levava ao login, com os tokens salvos e sem mensagem. O
  `startSession` do login também navegava para o Início mesmo quando o carregamento falhava.
- **Segunda etapa (sessão 9b, autorizada em 2026-10-30):**
  - `CurrentUserService.load()` devolve um resultado tipado (`CurrentUserLoadResult`, em
    `shared/entities/current-user.ts`): `loaded`, `unauthenticated` (a API recusou a sessão) ou
    `unavailable` com o motivo (`rate-limited`, `offline`, `server-error`, por
    `transientFailureReason`).
  - O `authGuard` manda `unavailable` para a tela nova `/sessao-indisponivel`
    (`shared/feature-session-unavailable/`, com o `SessionRecoveryStore`), com o motivo e a rota
    pedida na URL. A tela explica o motivo, diz que a sessão continua ativa e oferece "Tentar
    novamente" e "Sair da conta". Se der certo, volta à rota pedida; se a API recusar, limpa a
    sessão e vai pro login; se falhar de novo, fica e anuncia a falha. A rota de volta só aceita
    caminho interno (`safeReturnUrl`).
  - `LoginStore.startSession` só navega para o Início com `loaded`. `unavailable` vai para a tela
    nova e `unauthenticated` limpa a sessão e mostra a mensagem no login.
  - O tempo de espera não aumentou: continuam as 4 tentativas, cerca de 15s.
  - Arquivos:
    - `shared/entities/current-user.ts`, `shared/utils/http-error.util.ts`,
      `shared/services/current-user.service.ts`, `shared/guards/auth.guard.ts`,
      `shared/application/login.store.ts`;
    - novos: `shared/application/session-recovery.store.ts`, `shared/feature-session-unavailable/`,
      `shared/utils/session-unavailable.util.ts`;
    - rota `sessao-indisponivel` em `core/routes/app.routes.ts` e `core/config/app.routes.server.ts`;
    - specs ajustadas ao resultado tipado: `admin-master.guard`, `auth.interceptor`,
      `token-refresh.service`, `profile-edit.store`.
- **Comportamento final por tipo de falha:**
  - 401 em requisição comum: o interceptor renova e repete; renovação recusada limpa a sessão e
    vai pro login.
  - 401 no GET /users/me: login, sem novas tentativas.
  - 429, 5xx ou rede na renovação: o interceptor repassa o erro da renovação, e não o 401 original
    (A-43); a sessão fica. No GET /users/me, isso conta como falha passageira e leva à tela de sessão
    indisponível, sem apagar a sessão.
  - 429, 5xx ou rede no GET /users/me: novas tentativas por cerca de 15s; se continuar, a tela de
    sessão indisponível, com os tokens mantidos.
- **Testes:**
  - primeira etapa: 3 novos no `CurrentUserService` e 1 no `TokenRefreshService`;
  - segunda etapa, 20 novos: 2 no `CurrentUserService` (429 e 5xx persistentes; o de rede
    persistente passou a esperar `unavailable`), 1 no `authGuard`, 2 no `LoginStore`, 6 no
    `SessionRecoveryStore`, 6 no `SessionUnavailableComponent` e 3 no `session-unavailable.util`.
- **Validado na aplicação real:** com o GET /users/me respondendo 429, 503 ou sem rede (simulado no
  navegador), `/tickets` abriu a tela de sessão indisponível em 15,2s, com o motivo certo, o foco no
  título e os tokens mantidos. Com a falha mantida, "Tentar novamente" ficou na tela e anunciou
  "Ainda não foi possível (1ª tentativa)". Com o servidor normal, voltou a `/tickets`.
- **Limite que fica:** a primeira carga com falha mostra a tela vazia por até cerca de 15s antes
  da tela de sessão indisponível.

### R-01 a R-04 — Menu lateral em gaveta (2026-10-30)

Achados no diagnóstico de responsividade da sessão 9b (8 resoluções, de 1920×1080 a 360×740, com
teclado). Valem abaixo de 1200px, onde o menu vira gaveta.

| Id | Gravidade | Achado | Correção |
|---|---|---|---|
| R-01 | Alta | Com a gaveta fechada, os 8 primeiros Tabs caíam em controles invisíveis (logo, "Fechar menu" e os itens), a 248–260px fora da tela; a gaveta só tinha `transform` | A gaveta fechada fica `inert` (o `MainLayoutComponent` acompanha o breakpoint por `matchMedia`) |
| R-02 | Alta | Ao abrir, o foco ficava no ☰ e o Tab ia para o conteúdo atrás da sombra | Ao abrir, o foco vai para "Fechar menu"; com a gaveta aberta, o resto da página fica `inert` |
| R-03 | Alta | No celular deitado (844×390), Usuários, Funções e Departamentos ficavam abaixo da tela (último item em 574px), sem rolagem | A gaveta tem a altura da janela (`100dvh`) e rolagem própria |
| R-04 | Média | Esc não fechava a gaveta | Esc fecha e devolve o foco ao ☰; "Fechar menu" e a sombra também devolvem o foco |

- **Arquivos:** `shared/ui/layouts/main-layout/main-layout.component.{ts,html,css,spec.ts}`.
- **Testes:** 5 novos no `main-layout.component.spec.ts`: `inert` com a gaveta fechada, foco ao
  abrir, Esc, botão e sombra devolvendo o foco, e desktop sem `inert`.
- **Validado na aplicação real** em 1024×768, 768×1024, 844×390, 390×844 e 360×740 (Administrador):
  - com a gaveta fechada, o primeiro Tab vai para "Abrir menu";
  - ao abrir, o foco está em "Fechar menu" e o Tab percorre só a gaveta;
  - no 844×390, a gaveta rola (610px de conteúdo em 390px) e "Departamentos e setores" fica visível;
  - Esc fecha e devolve o foco a "Abrir menu".
  - No desktop (1366×768), o menu continua sem `inert`.
- **Observação:** durante o deslize de 0,3s, o foco já está em "Fechar menu", que ainda entra na
  tela. Aos 500ms está visível.
- **Fora do escopo, registrados:** R-05 (diálogo "Novo usuário" apertado no 844×390), R-06 (e-mails
  quebrados no meio na tabela de Usuários no 844) e R-07 (alvos de 16 a 23px, dentro da exceção de
  espaçamento da 2.5.8 segundo a medição da sessão 92), todos de gravidade baixa.

### A-45 e A-46 — Foco da gaveta depois de navegar e Tab preso nela (2026-10-30)

Achados na revisão final da sessão 9b (eram P-2 e P-3), corrigidos com autorização no
`MainLayoutComponent`, sem mudança de arquitetura.

- **A-45 (foco depois de navegar):** um clique num link da gaveta (item ou logo) fecha a gaveta e,
  quando a navegação termina e a tela é desenhada, põe o foco no `h1` da nova tela (o do
  `page-header`), com `tabindex="-1"`. Sem título, o foco vai para o começo do conteúdo.
  - O item da tela atual foca na hora: o router ignora essa navegação de forma síncrona, antes de
    qualquer escuta.
  - O logo passou a fechar a gaveta, como os itens.
  - Clicar num cabeçalho da lista só fecha a gaveta; uma área vazia ou "Fechar menu" seguem como antes.
- **A-46 (Tab fora da gaveta):** com a gaveta aberta, o Tab no último controle volta ao primeiro, e o
  Shift+Tab no primeiro vai ao último. A página atrás já estava `inert`; os toasts e o diálogo global
  ficam no `AppComponent`, fora do layout. Os toasts continuam anunciados (são `role="status"`) e
  alcançáveis com a gaveta fechada. O diálogo global não abre com a gaveta aberta: a página está
  `inert` e a navegação o cancela (A-32).
- **Testes:** 6 novos no `main-layout.component.spec.ts`:
  - foco no título depois de navegar;
  - o item da tela atual;
  - o logo;
  - o cabeçalho sem mover o foco;
  - Tab e Shift+Tab dando a volta;
  - o Tab no meio da gaveta sem interceptação.
- **Validado na aplicação real** em 390×844, 768×1024 e 844×390 (Administrador, teclado):
  - Enter em "Meus Chamados" leva o foco ao `h1` "Meus Chamados", e o Tab seguinte vai a "Novo
    Chamado";
  - o item da tela atual faz o mesmo;
  - com um toast com botão na tela, 12 Tabs e 3 Shift+Tabs ficaram dentro da gaveta;
  - Esc devolve o foco a "Abrir menu";
  - com a gaveta fechada, o botão do toast continua alcançável.

### A-43 — Renovação com falha passageira lida como sessão recusada (Média, revisão técnica final, 2026-10-30)

**Evidência (código):**

- `shared/interceptors/auth.interceptor.ts`: na falha da renovação, o operador
  `catchError(() => throwError(() => error))` devolvia o 401 original.
- `CurrentUserService.load` classifica 401 como `unauthenticated`.
- **Efeito:** com o token vencido e a renovação sem rede (ou com 429 ou 5xx), a pessoa ia pro login em
  vez da tela de sessão indisponível. Dentro dessa tela, o `SessionRecoveryStore.retry` apagava a
  sessão.
- O teste do A-02 ("devolve o 401 quando a renovação falha por erro passageiro") fixava o
  comportamento errado.

**Correção:**

- Na falha passageira da renovação (`isTransientHttpError`), o interceptor repassa o erro da própria
  renovação. Para qualquer outro erro, mantém o 401 original.
- A recusa da renovação (o `TokenRefreshService` devolve `null`) continua limpando a sessão e indo
  pro login.

**Testes:**

- o caso antigo virou três (0, 429 e 503 repassados, sem limpar a sessão);
- 3 testes de integração com o `CurrentUserService` real passando pelo interceptor:
  - token vencido e renovação sem rede → `unavailable`/`offline`, sem apagar a sessão;
  - com 429 → `unavailable`/`rate-limited`;
  - renovação recusada → `unauthenticated`, com a sessão limpa e indo pro login.
- O mapeamento de `unavailable` para `/sessao-indisponivel` já é coberto pela spec do `authGuard`.

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
| A-22 | Limites de mensagem (4000), título (200), descrição (10–500), motivo da reabertura (500), política de senha; nome (100) e descrição (500) de departamento e setor | Iguais aos validadores do servidor. Validação de experiência, não substitui a do servidor. Com a spec 038 (`a72e07b`), nome de departamento acima de 100 falha no banco com 500, então o validador do front é a única barreira com mensagem amigável: fica como está. |

## Pendências e melhorias não executadas

| Id | Gravidade | O quê | Por que não foi feito |
|---|---|---|---|
| A-23 | Média | Tokens de acesso e refresh no `localStorage` (expostos a XSS) | A troca para cookie `HttpOnly` exige mudança no back-end (emissão, CSRF, CORS). É decisão de arquitetura, não remoção de lógica. |
| A-24 | Baixa | O back-end não informa ações permitidas (`canReopen`, `canEdit`, transições), só `canCancel` | Exige contrato novo; hoje o front espelha os handlers (A-06 a A-08, A-12). |
| A-25 | Baixa | Limites de anexo fixos em `tickets/entities/ticket-attachment.ts`, embora exista `GET ticket-attachments/policy` | **Corrigido em 2026-10-30 (A-39):** o `TicketAttachmentsStore` lê a política (`rxResource`) e o detalhe valida tamanho e tipo por ela; sem a política, envia e deixa o back-end validar. Os limites por chamado (20 arquivos, 100 MB) continuam só no back-end, porque a lista é paginada e o front não vê todos os anexos. |
| A-26 | Média | Busca de responsável usava `GET /users` (exige `users:read` e lista qualquer ativo), mas a atribuição só aceita elegíveis (`TicketAssigneeEligibility`, ativo com `tickets:manage`) | **Corrigido em 2026-10-30 (A-38):** os três Stores (detalhe, Monitorar e Alertas do Início) buscam em `GET /tickets/assignees?search=` (spec 030, mesma regra da atribuição); o diálogo mostra nome completo e setor (o endpoint não devolve e-mail por decisão da spec). Tirou também a dependência tickets → users nesses Stores. |
| A-27 | Baixa | `environment.prod.ts` aponta `http://localhost:5195` (TODO no arquivo) | A URL de produção não está no repositório; não foi inventada. |
| A-28 | Baixa | Flags `volumeResolved` e `companyStatsForAll` desligadas, embora as specs 028 e 031 estejam na `origin/main` | Estado deixado pelo usuário em outra sessão ("volumeResolved off até validar"); ligar é decisão dele. O comentário desatualizado em `ticket-dashboard.store.ts` foi corrigido na revisão final (A-36). |
| A-29 | Baixa | O 403 de `GET /roles` na tela Usuários (quem tem `users:read` sem `roles:read`) disparava um `GET /users/me` a cada abertura | **Corrigido na revisão final:** a tela só pede as funções com `roles:read` (`user-list.component.ts`, +1 teste). |
| A-30 | Baixa | O `slaStatus` e o `dueAtUtc` de `GET /tickets` são do primeiro ciclo de SLA, inclusive depois de reabrir | Está no back-end (`GetTicketsQueryHandler`). A spec 024 (aprovada, ainda não mergeada) cobre só Meus Chamados e deixa o Monitor fora do escopo por decisão do responsável (DEC-3 dela). Não há spec no back-end para o `GET /tickets`: abrir uma é decisão do responsável. O Monitorar herda o valor do servidor. |
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
- **Testes:** toda mudança tem spec ao lado; as contagens por rodada estão em `FINAL_ACCEPTANCE_AUDIT.md`.

### Auditoria de conformidade com as skills (2026-10-30)

Revisão só de leitura, feita depois da aceitação, de todo o working tree sobre o `a4cedca`:

- 51 arquivos de `src` (43 rastreados alterados e 8 novos);
- comparados com o `CLAUDE.md`, o `.claude/skills/README.md`, as quatro skills e as referências
  delas, e com os slices vizinhos (`login.store.ts`, `activate-account.component.ts`,
  `ticket-assignees.store.ts`, `ticket.data.service.ts`, `admin-master.guard.ts`).

O revisor foi independente e não implementou nada. Os achados C-03, C-04, C-07, C-10 e C-12 foram
conferidos de novo no código.

**Resultado:**

- Não há achado crítico nem alto, e nenhuma violação da matriz de limites da `ca-review`:
  - `shared/` só importa `shared/`;
  - o shell importa `shared/feature-session-unavailable` como já faz com `feature-login`;
  - nenhum componente injeta Data Service ou `HttpClient`.
- Violação de regra escrita, só uma: C-04, do `CLAUDE.md` (não de skill).
- Os demais achados são inconsistência, manutenção ou dívida anterior. Na data da auditoria, nenhum
  estava corrigido. O que o saneamento autorizado corrigiu, corrigiu em parte ou manteve está em
  "Saneamento de C-01 a C-12 e do A-44", abaixo.

| Id | Gravidade | Tipo | Onde | Regra ou referência | Recomendação | Origem | Confiança |
|---|---|---|---|---|---|---|---|
| C-01 | Baixa | Inconsistência | `shared/entities/current-user.ts:23-26`, `shared/services/current-user.service.ts:28,56` | README/`ca-review`: "no `Result<T>`/success-failure wrapper", regra que vale para Data Services. Aqui é um serviço de sessão, e o Data Service segue cru | Registrar a exceção dos serviços de sessão, ou nada | Missão, sobre o `Observable<boolean>` anterior | Média |
| C-02 | Baixa | Manutenção | `shared/utils/http-error.util.ts:2,44-48` | Nenhuma regra quebrada: o utilitário genérico depende do tipo da tela de sessão | Mover `transientFailureReason` para `session-unavailable.util.ts` | Missão | Alta |
| C-03 | Média | Dívida + manutenção | `tickets/application/ticket-detail.store.ts:140-160`, `ticket-monitor.store.ts:274-294`, `ticket-summary.store.ts:205-225` | Nenhuma regra proíbe; "One Store per use case" justifica os Stores separados. São três cópias da busca de responsáveis. O A-38 editou as três e **apagou o comentário que registrava a duplicação** (no `a4cedca`: `ticket-monitor.store.ts:275`, `ticket-summary.store.ts:205`) | Extrair a busca para o domínio `tickets`; até lá, este registro substitui o comentário | Duplicação anterior; registro removido pela missão | Alta |
| C-04 | Baixa | Violação do `CLAUDE.md` | `shared/feature-session-unavailable/session-unavailable.component.ts:51` | "Every function, property, and class gets a short `/** ... */` doc comment in Portuguese": o `constructor()` novo, com o `afterNextRender` que foca o título, não tem | Acrescentar o comentário | Missão | Alta |
| C-05 | Baixa | Inconsistência | `shared/application/session-recovery.store.ts:14-58` | `ca-review`: estado em `withComputed` sobre `resource()`. Aqui: estado à mão sobre uma chamada imperativa, Store provido no componente e `LoginStore` injetado. Tem precedente (`LoginStore`, `ActivateAccountStore`, `user-menu.component.ts`) | Nenhuma obrigatória | Missão, seguindo padrão anterior | Média |
| C-06 | Baixa | Inconsistência | `shared/guards/auth.guard.ts:25` × `login.store.ts:61` e `session-recovery.store.ts:55` | No `unauthenticated`, os dois Stores limpam a sessão; o guard só redireciona e deixa os tokens salvos (já era assim no `a4cedca`) | Uma política só nos três | Anterior | Média |
| C-07 | Baixa | Manutenção | `shared/ui/layouts/main-layout/main-layout.component.ts:106,138-174` e `.css:183,193` | Nenhuma regra: breakpoint `1199.98px` repetido no TS e no CSS, foco preso por seletores do DOM em 204 linhas, `100dvh` sem `100vh` de reserva | Diretiva de foco preso em `shared/ui/directives` e `height: 100vh` antes do `100dvh` | Missão | Alta |
| C-08 | Baixa | Melhoria opcional | `dashboard/dashboard-filters.ts:49-50` | Reexporta `todayInSaoPaulo` só para o `dashboard.component.ts` | Importar direto de `../shared` | Missão | Alta |
| C-09 | Baixa | Dívida / melhoria | `tickets/feature-ticket-detail/ticket-detail.component.ts:567-588`; `tickets/entities/ticket-attachment.ts:20-24` | A validação do arquivo pela política fica no componente (598 linhas, 4 Stores), sem ferir "State lives in the Store". `maxAttachmentsPerTicket` e `maxTotalBytesPerTicket` não são usados | `validateFile` no `TicketAttachmentsStore`; decidir sobre os dois campos | Tamanho anterior; campos sem uso da missão | Média |
| C-10 | Baixa | Dívida anterior | `shared/interceptors/auth.interceptor.ts`, `ticket-detail.component.ts` | README: "Single quotes, 2-space indent". Os arquivos usam 4 espaços, e as linhas novas seguiram o arquivo | Normalizar numa mudança própria | Anterior | Alta |
| C-11 | Baixa | Dívida anterior do `CLAUDE.md` | `current-user.service.ts:18-21` (a 21 foi tocada), `token-refresh.service.ts:12-16`, `main-layout.component.ts:34-36,87-88`, `http-error.util.ts:7`, `current-user.ts:2-14`, `login.store.ts:31-35` | Membros sem `/** */` já no `a4cedca` | Completar ao tocar os arquivos | Anterior; a missão não corrigiu os que tocou | Alta |
| C-12 | Baixa | Lacuna de teste | `tickets/feature-ticket-monitor/ticket-monitor.component.spec.ts:22,52` (fora do working tree) | `add-tests`: o stub do Store expõe "the same signal-shaped properties". Ainda tipa `responsibleCandidates` como `UserSummary[]` e importa `../../users`; o Store expõe `TicketAssignee[]` desde o A-38 | Trocar para `TicketAssignee` e tirar o import | Anterior, piorado pela missão | Alta |

**Corrigido pela missão:**

- os três Stores de `tickets` deixaram de importar o barrel de `users`;
- `token-refresh` passou a usar o `isTransientHttpError` compartilhado, a única classificação de
  falha passageira;
- saiu o comentário falso do `dashboard.component.ts`.

**Conformidade por arquivo (51 de `src`):**

- 35 conformes, 15 conformes com ressalva e 1 não conforme (o `session-unavailable.component.ts`,
  pelo C-04);
- sem violação de regra escrita: 50 de 51 (98%); contando só as skills, 51 de 51.

Cada arquivo conta igual, e a verificação foi estática (`tsc` app e spec com exit 0), sem nova
verificação visual. Testes passando não entram como prova de conformidade.

**Ordem recomendada, se autorizada:**

1. C-04 e C-12: um comentário e um stub, sem mudança de comportamento.
2. C-03: um helper de busca no domínio `tickets`.
3. C-06 e A-44: política única no `unauthenticated` e no `unavailable` dos guards.
4. C-02 e C-08: mover e reexportar.
5. C-07 e C-09: extrações maiores, com os specs existentes como rede.
6. C-01, C-05, C-10 e C-11: registro ou limpeza oportunista.

### Saneamento de C-01 a C-12 e do A-44 (2026-10-30)

Autorizado pelo usuário depois da aceitação, com a menor alteração possível em cada caso e sem
abstração nova além da necessária. Mudou código só no front; não houve stage nem commit.

| Id | Resultado | O que mudou |
|---|---|---|
| C-03 | Corrigido | `tickets/application/ticket-assignee-search.ts` (novo): `searchEligibleAssignees` (página 1, 8 itens) e `assigneeSearchErrorMessage`. Os três Stores usam essas funções e cada um mantém o próprio estado ("One Store per use case") |
| C-04 | Corrigido | `/** */` no `constructor()` de `session-unavailable.component.ts` |
| C-12 | Corrigido | O stub de `ticket-monitor.component.spec.ts` tipado com `TicketAssignee`, sem o import de `users` |
| C-06 e A-44 | Corrigidos | Política única nos guards: `redirectWhenUserNotLoaded`, em `shared/guards/auth.guard.ts`. Falha passageira vai para `/sessao-indisponivel` com a rota pedida; recusa apaga a sessão e vai pro login, como o `LoginStore` e o `SessionRecoveryStore`. O `admin-master.guard.ts` passou a respeitar o resultado do carregamento. +2 testes no `admin-master.guard.spec.ts`; o `auth.guard.spec.ts` confere a sessão apagada |
| C-02 | Corrigido | `transientFailureReason` foi de `http-error.util.ts` para `session-unavailable.util.ts`, e o utilitário de HTTP não depende mais do tipo da tela (+1 teste). Saiu do barrel `shared/index.ts`; os únicos usos ficam dentro de `shared/` |
| C-08 | Corrigido | O `dashboard.component.ts` importa `todayInSaoPaulo` do `shared`, e `dashboard-filters.ts` deixou de reexportá-la. A asserção repetida saiu de `dashboard-filters.spec.ts`; o mesmo caso já está em `iso-date.util.spec.ts` |
| C-07 | Corrigido em parte | `height: 100vh` antes do `100dvh`. **Sem a diretiva de foco preso:** o código tem um só uso, e uma diretiva seria abstração sem segundo consumidor. O breakpoint repetido no TS e no CSS fica, com o comentário que liga os dois, porque o CSS não lê constantes do TS |
| C-11 | Corrigido nos membros listados | `/** */` em `current-user.service.ts`, `token-refresh.service.ts`, `main-layout.component.ts`, `http-error.util.ts`, `current-user.ts` e `login.store.ts`. O `load()` passou a dizer que `unauthenticated` é qualquer falha não passageira |
| C-01 | Mantido, justificado | A regra do README e da `ca-review` vale para Data Services, e o `AuthDataService` continua com `Observable` cru. O resultado tipado é do serviço que orquestra a sessão. Registrar a exceção nas skills fica com o usuário: esta missão não altera skills |
| C-05 | Mantido, justificado | Mesmo formato do `LoginStore` e do `ActivateAccountStore`; não há resource cujo estado o Store duplique |
| C-09 | Mantido, justificado | Nenhuma regra quebrada: a validação lê só o sinal `policy()` do Store. Levá-la ao Store moveria a formatação de tamanho e reescreveria 5 testes do componente, sem ganho de regra. `maxAttachmentsPerTicket` e `maxTotalBytesPerTicket` ficam na entidade porque são campos do contrato de `GET /ticket-attachments/policy` |
| C-10 | Mantido, justificado | 180 de 248 arquivos `.ts` usam 4 espaços. Normalizar é reformatação em massa, fora do escopo e com risco para o trabalho de outras sessões; as linhas novas seguem o recuo do próprio arquivo |

**Revisão independente do saneamento** (só leitura, comparando o `src` antes e depois):

- 21 arquivos alterados e 1 novo, todos dentro dos itens acima;
- sem laço de redirecionamento: o login não tem guard, e o `pendingPasswordChangeGuard` não depende dos tokens;
- sem importação circular nem violação de limite de módulo;
- veredito "alcançado" em todos os itens.

Ela apontou dois comentários imprecisos (`redirectWhenUserNotLoaded` e o `loading` do `LoginStore`),
corrigidos em seguida. Também registrou que o guard agora apaga a sessão em todo `unauthenticated`
(qualquer falha não passageira), como os dois Stores já faziam.

**Validação:**

- `tsc` app e spec com exit 0;
- `ng build` com exit 0, 381,03 kB e os mesmos 4 avisos de orçamento;
- `ng test` com 1361 de 1361 (eram 1358; +2 do `admin-master.guard` e +1 do `transientFailureReason`);
- depois dos dois comentários finais, `tsc` app de novo com exit 0.

### Conflito entre instruções

A missão pede comentários que expliquem só a intenção, sem repetir o código. O `CLAUDE.md` do
projeto exige um `/** ... */` em português em **toda** função, propriedade e classe, dizendo o que
ela faz. Prevalece o `CLAUDE.md` (instrução do repositório, mais específica): os comentários novos
seguem a convenção dele, curtos e em uma linha quando possível.
