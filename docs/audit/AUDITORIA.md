# Auditoria do front-end Tickest

## Parte I — Consolidação vigente

### 0. Cabeçalho

| Item | Valor |
|---|---|
| Período | 2026-10-29 a 2026-11-04 |
| Responsável | Rafael Santos |
| Front (`tickest-pristine-front`) | `main` local em `7fe3bec`, 11 commits à frente da `origin/main` (`e977f64`, merge do PR #4), sem push (`git rev-list --count origin/main..HEAD` = 11) |
| Working tree do front nesta redação | `DESIGN.md`, `tsconfig.app.json` e `tsconfig.spec.json` alterados pelas limpezas L-5 e L-6, e este documento, novo; tudo sem stage nem commit (`git status`, 04/11). O `tsconfig.json` voltou ao conteúdo do HEAD quando as supressões NG8102 e NG8107 saíram de todas as configurações, na revisão de 04/11 (§9) |
| Back (`tickest-pristine`) | Conferido na `origin/main` `ef1c981` (merge do PR #57, 2026-10-31 00:36) durante a auditoria de 31/10. Em 04/11, a `origin/main` do back está em `e5d8a38`, 45 commits depois (§12) |
| Documentos de origem | `docs/audit/FRONTEND_AUDIT.md` ("FA", Anexo A) e `docs/audit/FINAL_ACCEPTANCE_AUDIT.md` ("FI", Anexo B), no commit `7fe3bec` |

**Como ler**

- A Parte I prevalece sobre os anexos. Os anexos guardam o texto original, sem nenhuma alteração. Onde
  divergem, valem a Parte I e as erratas (§15.1).
- `FA:n` e `FI:n` apontam a linha `n` do arquivo original. É a mesma linha `n` contada a partir do
  marcador de início de cada anexo.
- Caminhos do front partem de `src/app/`, salvo os da raiz (`src/styles.css`, `src/environments/`,
  `server.ts`). Linhas do front são do HEAD `7fe3bec`, salvo indicação.
- Arquivos de código do back aparecem pelo nome, com linhas do commit `ef1c981`, salvo indicação.
  As specs 044 a 049 do back não são versionadas: foram lidas no working tree do back em 04/11.
- **Gravidade** (FA:8-10): Crítica (segurança, perda de sessão ou dado); Alta (contrato quebrado ou
  recurso que não funciona); Média (divergência de regra visível ao usuário ou violação de limite de
  módulo); Baixa (duplicação ou risco futuro sem efeito hoje). "—" quer dizer que o original não dá
  gravidade. No §8, os rótulos são os do relatório de 31/10 (Alto, Baixo; prioridade Alta, Média, Baixa).
- **Classe** (FA:12-14): Defeito, Skill, Back-end, Melhoria, Mantido.
- **Estado atual:**
  - **Corrigido (origin/main):** publicado até o PR #4 (`e977f64`);
  - **Corrigido (main local):** nos commits de 04/11 (E-00), integrados à `main` local, sem push;
  - **Removido:** só o A-05 (BR-001);
  - **Mantido:** analisado e mantido, com justificativa;
  - **Pendente:** aberto, com a dependência indicada;
  - **A reavaliar:** o texto original deixou de valer e falta decisão ou nova conferência;
  - **a confirmar:** fato não comprovado nesta redação.
- **IDs estáveis:**
  - A-, R-, C-, 6.3 e BR-001 não foram renumerados. O back cita A-06, A-08, A-12, A-22, A-23, A-24,
    A-27 e A-30 (specs 046 a 049).
  - Apelidos: BR-001 = A-05; P-2 = A-45; P-3 = A-46 (FA:403).
  - Achados novos do front começam em A-47, R-08 e C-13. Este documento não criou nenhum.
  - Outras séries: N- (conferência de 31/10, §7); DIV-, LAC-, DOC- e BK- (auditoria geral de 31/10,
    §8); E- (etapas do plano de 31/10); L- (etapas da limpeza de 04/11); D-SF (decisões sobre o
    SPEC-TICKEST-FRONT); FE- (achados do front na spec 049 do back).
  - O `SPEC-TICKEST.md` do back tem uma série própria A-n (ex.: A-6, A-11 e A-12 em
    `SPEC-TICKEST.md:62,67,68`), sem relação com este catálogo.

### 1. Resumo executivo

- **Publicado na `origin/main` (`e977f64`, PR #4):**
  - A-01 a A-11 (o A-05 como remoção), A-25, A-26, A-29, A-32, A-34 a A-41 e A-43 a A-46;
  - as duas etapas do A-42 (`591bc90`);
  - R-01 a R-04;
  - C-02, C-03, C-04, C-06, C-08, C-11 (membros listados) e C-12.
  - Validação desse estado: 1361 testes; build inicial de 381,03 kB com 4 avisos de orçamento
    (FA:606-607; repetida em 04/11 em `e00v2/logs/test-0.log` e `build-0.log`).
- **Só na `main` local (11 commits, sem push):**
  - os 10 commits da E-00: A-28, aviso de nova tentativa do A-42, C-07, C-09, A-33, R-05, R-06, R-07,
    C-10 e 6.3;
  - a L-3 (`7fe3bec`), que remove o `@angular/animations`.
- **Números atuais (`7fe3bec`, cópia isolada, 04/11):** 1381 de 1381 testes; build inicial de
  382,02 kB, 0 avisos (`l3/x5a/.x5a/test.log` e `build.log`, ver §14).
- **Mantidos com justificativa:** A-12 a A-21, A-31, C-05 e o breakpoint repetido do C-07 (§5).
- **Pendentes (§6):**
  - com o back: A-23 (spec 046), A-24 (047), A-30 (048) e a volta da cor da função (A-05/BR-001,
    spec 044), todas em descoberta;
  - com Rafael Santos: A-27 (pendente de propósito), C-01, o push da `main`, a sincronização do
    `node_modules`, o `.impeccable/design.json` (sem regenerar por enquanto), o `cli.analytics` do
    `angular.json`, o commit das limpezas L-4 a L-6 (plano de dois commits numa branch temporária) e,
    depois de o back atualizar as referências, a exclusão dos originais de `docs/audit`;
  - na etapa E-01: os defeitos conhecidos das etapas integradas;
  - a reavaliar: A-22 e as evidências do back que não existem mais em `ef1c981` (N-7).
- **Abertos da auditoria geral de 31/10 (§8):**
  - dez divergências front/back; duas de gravidade Alto: DIV-1 ("Fechar chamado" sempre falha) e
    DIV-3 (o PUT reenvia descrição e status lidos);
  - quinze lacunas para specs novas no back;
  - problemas de documentação no front e no modelo de specs do back.
- **Falha de processo (§13):** a E-00 foi executada sem autorização válida. Os commits ficaram por
  decisão posterior (L-1).

### 2. Escopo e método

Os detalhes ficam nos anexos.

| Rodada | Escopo | Método | Onde |
|---|---|---|---|
| Auditoria do front, 29–30/10 | Todo o `src/` (Angular 22, NgRx Signal Store, Karma/Jasmine), contra as skills, o `CLAUDE.md` e o back (`0eff7b6`, depois `a72e07b`) | Escalas de gravidade e classe (FA:8-14). Princípios: contrato real, visibilidade × autorização, remover só o comprovado, hunks pequenos (FA:52-61). Fora do escopo: FA:62-67 | FA:1-14; FA:52-67 |
| Foco visível (A-34) | Aplicação real, sessão de Administrador, claro e escuro | Captura sem foco × com foco; conta a faixa que muda com contraste ≥ 3:1; calibrado em página de teste (FA:210-232; FI:260-276) | FA:195-232; FI:258-280 |
| Aceitação | As 13 seções da missão original | Matriz PASS, PARTIAL, FAIL, BLOCKED, NOT APPLICABLE (FI:87-245); validações em cópia isolada (FI:60-85) | FI:60-256 |
| Conformidade com as skills e saneamento, 30/10 | 51 arquivos de `src` sobre `a4cedca` | Revisor independente, só leitura; depois, saneamento autorizado (FA:509-608) | FA:509-608 |
| Auditoria geral, 31/10 | Front e back (`ef1c981`), só leitura | Relatório entregue na conversa, sem arquivo no repositório; plano E-00 a E-15 | §7; §8 |
| Execuções de 04/11 | E-00, L-9 e L-3, na `main` local; L-4 (este documento), L-5 e L-6, no working tree, sem commit. Na revisão de 04/11, as supressões NG8102 e NG8107 saíram de todas as configurações, e a pasta `.impeccable/live/`, sem arquivos e ignorada pelo Git, foi apagada | Cada mudança validada em cópia isolada antes de entrar na `main` | §3; §11; §14 |
| Esta consolidação, 04/11 | FA, FI, Git e código do front e do back | Só leitura. As linhas citadas dos originais foram conferidas. A redação não rodou build, teste nem `npm`: os números do §3 vêm dos logs. Na revisão de 04/11, o build e os testes do estado final rodaram numa cópia isolada, sem `npm install` nem `npm ci` (§3) | — |

### 3. Linha de base e validações

| Marco | Data | Testes | Build inicial | Avisos de orçamento | Fonte |
|---|---|---|---|---|---|
| Baseline (`9deae1c`, antes da missão) | 29/10 | 1296 | 374,66 kB | 4 | FI:20-28 |
| HEAD `b7f0c37` | 29/10 | 1307 | 375,05 kB | 4 | FI:70-71 |
| HEAD + correções da revisão de aceitação | 29/10 | 1311 | 377,19 kB | 4 | FI:70-71 |
| `7c5b362` publicado | 29/10 | 1311 | 379,15 kB | 4 | FI:72; FI:277-280 |
| Working tree com A-37 a A-40 | 30/10 | 1318 | 379,29 kB | 4 | FI:73 |
| + A-41 e 1ª etapa do A-42 | 30/10 | 1322 | 379,93 kB | 4 | FI:74 |
| + 2ª etapa do A-42 e R-01 a R-04 | 30/10 | 1347 | 380,91 kB | 4 | FI:75 |
| + A-43, A-45 e A-46 | 30/10 | 1358 | 380,94 kB | 4 | FI:78 |
| + saneamento (C-01 a C-12 e A-44): conteúdo do PR #3, igual em `e977f64` | 30/10 | 1361 | 381,03 kB | 4 | FI:80; FA:606-607; `e00v2/logs/test-0.log`, `build-0.log` |
| E-00 (`9d7e238`) | 04/11 | 1381 | 386,51 kB | 0 | `e00v2/logs/test-final.log`, `build-final.log` |
| L-3 (`7fe3bec`) | 04/11 | 1381 | 382,02 kB | 0 | `l3/modificada/.x2/` e `l3/x5a/.x5a/` (`test.log`, `build.log`) |
| Limpeza L-4 a L-6, estado final: `7fe3bec` com este documento, o `DESIGN.md` e os tsconfig sem as supressões NG8102 e NG8107 | 04/11 | 1381 | 382,02 kB | 0 | `l48/v6b/.v6b/` (`test.log`, `build.log`) |

- Os 4 avisos eram de orçamento de CSS por componente, anteriores à missão (FI:25-27). Saíram com o
  A-33 (`0df5718`).
- A E-00 foi validada commit a commit: build e testes de cada um dos 10 estados
  (`e00v2/logs/build-1.log` a `build-10.log`, `test-1.log` a `test-10.log`, `progresso.log`).
- A L-3 tirou 4,49 kB do build inicial (386,51 → 382,02 kB), sem mudar o número de testes. A
  validação foi feita duas vezes, com o mesmo resultado (X2 em `l3/modificada/`, X5-A em `l3/x5a/`).
- A remoção das supressões NG8102 e NG8107 não mudou a saída. O build do estado final (`l48/v6b/`)
  é idêntico, byte a byte, nos 122 arquivos, ao de uma cópia igual com os tsconfig do `7fe3bec`
  (`l48/v6h/`), feita nas mesmas condições (`l48/v6b/.v6b/dist-v6b-x-v6h.txt`). As duas cópias usam,
  por junção, o `node_modules` de `l48/l6/`, sem `npm ci`. Por isso os nomes dos chunks diferem dos
  de `l3/x5a/`, que tem `node_modules` próprio (`dist-v6h-x-x5a.txt`); sem junção, `l48/l6/` saiu
  idêntica a `l3/x5a/`.
- Com um `??` e um `?.` desnecessários de propósito no `LoadingStateComponent`, só nas cópias, o
  build sem as supressões avisa NG8102 e NG8107 e termina com sucesso (`l48/v6c/.v6c/build.log`).
  Com as supressões do `7fe3bec`, o mesmo código não gera aviso (`l48/v6d/.v6d/build.log`).
- O build de produção pré-renderiza só `/login` ("Prerendered 1 static route", `l3/x5a/.x5a/build.log`).
  As outras rotas respondem 500 no servidor SSR (§6, item 10).
- Lint: o projeto não tem ESLint. A análise estática é o `strict` + `strictTemplates` (FI:81).
- Os 1358 de FI:121, FI:207 e FI:236 são anteriores ao saneamento (errata 3).

### 4. Catálogo-mestre de achados

Todos os 66 IDs dos documentos. "Detalhe" aponta as linhas do original no anexo.

| ID | Título curto | Gravidade | Estado atual | Onde (commit/PR) | Evidência principal | Detalhe |
|---|---|---|---|---|---|---|
| A-01 | Corrida de renovação entre abas revogava todas as sessões | Crítica | Corrigido (origin/main) | `664b73b`, PR #2 (`fabeeb1`) | `SessionService` ouve o evento `storage` (FA:73-81) | Anexo A, FA:71-81 |
| A-02 | Falha passageira na renovação deslogava | Alta | Corrigido (origin/main) | `664b73b`, PR #2 | `token-refresh.service.ts` (FA:85-91) | FA:83-91 |
| A-03 | Segunda renovação para requisição com token antigo | Média | Corrigido (origin/main) | `664b73b`, PR #2 | `auth.interceptor.ts` (FA:95-99) | FA:93-99 |
| A-04 | Contrato da spec 029 com nomes errados | Alta | Corrigido (origin/main) | `357f183`, PR #2 | `ticket-dashboard.ts`, `ticket-monitor-item.ts`, `ticket.data.service.ts` (FA:103-114) | FA:101-114 |
| A-05 (= BR-001) | Cor de função gravada no `localStorage` | Alta (classe Back-end) | Removido; a volta depende da spec 044 do back (Em descoberta) | `664b73b`, `fe8a559`, `46cfbb8`, `311618d`, PR #2 | `role-colors.util.ts` excluído; testes de ausência em `roles/feature-role-list/role-list.component.spec.ts:366` | FA:116-143; FI:337-356 |
| A-06 | "Reabrir" visível sem permissão | Média | Corrigido (origin/main); evidência do back a reavaliar (N-7) | `357f183`, `a77394d`, PR #2 | `tickets/ui/ticket-action-permissions.ts:27-31`. O `TicketAccessGuard.EnsureOwnerOrManagerAsync` (FA:149) não existe em `ef1c981`; a regra está em `ReopenTicketCommandHandler.cs:33-36` e é mais estrita para o dono (DIV-2) | FA:145-164 |
| A-07 | "Editar" visível para dono sem `tickets:update-own` | Média | Corrigido (origin/main) | `357f183`, PR #2 | `ticket-action-permissions.ts:22-25`. Back conferido em `ef1c981`: a regra de FA:151 segue em `UpdateTicketCommandHandler.cs:35-44` | FA:145-164 |
| A-08 | "Atribuir responsável" visível sem `tickets:assign` | Média | Corrigido (origin/main) | `357f183`, `a77394d`, PR #2 | Back conferido em `ef1c981`: `Assign.cs:28` (`tickets:manage`) e `AssignTicketCommandHandler.cs:30-32` (`tickets:assign`), como em FA:152-153 | FA:145-164 |
| A-09 | Nome limitado a 50; o servidor aceita 100 | Média | Corrigido (origin/main); evidência do back a reavaliar (N-7) | `46cfbb8`, PR #2 | `users/entities/user-profile.ts:2` (`USER_NAME_MAX_LENGTH = 100`). `UserValidationRules.NameMaxLength` (FA:168) não existe em `ef1c981`; o limite está nas colunas (`UserConfiguration.cs:16-17`) | FA:166-175 |
| A-10 | Início importava componente interno de `tickets/ui` | Média (classe Skill) | Corrigido (origin/main) | `664b73b`, `357f183`, `a77394d`, PR #2 | Diálogo em `shared/ui/ticket-assign-dialog/` (FA:183-185) | FA:177-185 |
| A-11 | Novo pedido de confirmação deixava o anterior sem resposta | Baixa | Corrigido (origin/main) | `664b73b`, PR #2 | `confirm-dialog.service.ts` (FA:189-193) | FA:187-193 |
| A-12 | Transições de status no front | — | Mantido; evidência do back a reavaliar (N-7) | — | `tickets/entities/ticket-status.ts:38-44`. `TicketStatusTransitions.CanTransition` (FA:466) não existe em `ef1c981`; hoje é `Ticket.CanTransitionTo` (`Ticket.cs:120`) | FA:466 |
| A-13 | Janela de cancelamento do dono | — | Mantido | — | `tickets/ui/ticket-cancel-window.ts` (FA:467) | FA:467 |
| A-14 | Reclassificação para "Atrasado" entre recargas | — | Mantido; evidência do back a reavaliar (N-7) | — | `TicketSla.GetStatus` (FA:468) não existe em `ef1c981` | FA:468 |
| A-15 | Aritmética do Início sobre contadores | — | Mantido | — | `dashboard.component.ts` (FA:469) | FA:469 |
| A-16 | Frases e limites de tendência | — | Mantido | — | `dashboard-overview.ts`, `dashboard-insight-rules.ts` (FA:470) | FA:470 |
| A-17 | Seleção dos Alertas (3 + 2) | — | Mantido | — | `ticket-summary.store.ts` (FA:471) | FA:471 |
| A-18 | Somas de ativos e finalizados | — | Mantido | — | `my-tickets-summary.store.ts` (FA:472) | FA:472 |
| A-19 | Busca e contagem em Departamentos e Funções | — | Mantido | — | `departments/feature-department-list/*`, `role-insights` (FA:473) | FA:473 |
| A-20 | Impacto e ações em lote de Usuários | — | Mantido | — | `users.store.ts` (FA:474) | FA:474 |
| A-21 | Guards e menus só como UX | — | Mantido | — | `admin-master.guard.ts`, `main-layout` (FA:475) | FA:475 |
| A-22 | Limites de texto iguais aos do servidor | — | A reavaliar | — | Front: motivo da reabertura 500 (`tickets/ui/ticket-reopen-dialog/ticket-reopen-dialog.component.ts:6,41`). Back: `ReopenTicketCommandValidator.cs:9` só confere o id; limite efetivo 4000 (spec 042); texto acima do limite responde 400 (`GlobalExceptionHandler.cs:46-60`). Ver §5 | FA:476; FI:365 |
| A-23 | Tokens de acesso e de renovação no `localStorage` | Média | Pendente → spec 046 do back | — | FA:482; back `specs/046-sessao-em-cookie-httponly/spec.md:101` | FA:482; FI:362 |
| A-24 | A API só informa `canCancel` | Baixa | Pendente → spec 047 | — | FA:483; back `specs/047-acoes-permitidas-do-chamado/spec.md:98` | FA:483; FI:363 |
| A-25 | Limites de anexo fixos no front | Baixa | Corrigido (origin/main), como A-39; texto a reavaliar | `8473d24`, PR #3 | FA:484 diz que os limites por chamado "continuam só no back-end". Desde `6df64e1` o Store os aplica quando a lista está completa (`tickets/application/ticket-attachments.store.ts:18-34`) | FA:484 |
| A-26 | Busca de responsável em `GET /users` | Média | Corrigido (origin/main), como A-38 | `8473d24`, PR #3 | FA:485 | FA:485 |
| A-27 | URL de produção ausente | Baixa | Pendente (de propósito, decisão de 31/10) | — | `src/environments/environment.prod.ts:3-4` (TODO e `http://localhost:5195`) | FA:486 |
| A-28 | Flags `volumeResolved` e `companyStatsForAll` desligadas | Baixa | Corrigido (main local) | `f7cdd73` | `src/environments/environment.ts:11-12` e `environment.prod.ts:12-13` com `true` | FA:487 |
| A-29 | 403 de `GET /roles` disparava `GET /users/me` | Baixa | Corrigido (origin/main) | `4bb5792` | `users/feature-user-list/user-list.component.ts:323` | FA:488 |
| A-30 | SLA do primeiro ciclo em `GET /tickets` | Baixa | Pendente → spec 048 | — | FA:489; back `specs/048-monitor-ciclo-sla-vigente/spec.md:90` | FA:489; FI:364 |
| A-31 | Linha "Prazo" do detalhe com o relógio do navegador | Baixa | Mantido; classificação a reavaliar | — | FA:490 o lista como pendência; FI:186 como mantido (errata 2) | FA:490 |
| A-32 | Diálogo global sobrevivia à troca de tela | Média | Corrigido (origin/main) | `b5aaf70` | `ConfirmDialogComponent` cancela em `NavigationStart` (FA:491) | FA:491 |
| A-33 | 4 avisos de orçamento de CSS | Baixa | Corrigido (main local) | `0df5718` | Builds da E-00 e da L-3 com 0 avisos (`e00v2/logs/build-final.log`; `l3/x5a/.x5a/build.log`) | FA:492; FI:252 |
| A-34 | Foco visível abaixo de WCAG 2.4.7 e 1.4.11 | Alta | Corrigido (origin/main); revalidar no navegador depois da E-00 (E-04) | `04ca7e1` (sessão b345b068) | 734 controles: 305 reprovados antes, 19 depois, 0 regressões (FA:230) | FA:195-232; FI:258-280 |
| A-35 | Troca de conta em outra aba | Média | Corrigido (origin/main) | `b885c05` | `SessionService.syncFromStorage` (FA:270-272) | FA:262-272 |
| A-36 | Comentários fora da regra | Baixa | Corrigido (origin/main) | `c44ecc4` | FA:276-281 | FA:274-281 |
| A-37 | Campo inválido sem borda vermelha (escuro e login) | Média | Corrigido (origin/main) | `7947148`, PR #3 | Medição em FA:255-259 | FA:234-260 |
| A-38 | Diálogo de atribuição oferecia qualquer usuário ativo | Média | Corrigido (origin/main) | `8473d24`, PR #3 | `GET /tickets/assignees` (FA:288-289) | FA:283-289; FA:485 |
| A-39 | Limites de anexo duplicados no front | Baixa | Corrigido (origin/main) | `8473d24`, PR #3 | `GET /ticket-attachments/policy` (FA:294-295) | FA:290-295; FA:484 |
| A-40 | "Hoje" do gráfico em UTC | Baixa | Corrigido (origin/main) | `000b4cc`, PR #3 | `todayInSaoPaulo` (FA:298-300) | FA:296-300 |
| A-41 | Rolagem horizontal de Meus Chamados | Média | Corrigido (origin/main) | `7947148`, `838e94f`, PR #3 | FA:306-311 | FA:302-314 |
| A-42 | 429 mandava pro login quem tinha sessão válida | Alta | Corrigido: as duas etapas na origin/main (`591bc90`, PR #3); o aviso da espera na main local (`00b7252`); defeitos para a E-01 (§6) | `591bc90`; `00b7252` | `app.component.ts:7-8`; `shared/ui/session-retry-notice/session-retry-notice.component.ts` | FA:316-372; FI:256 |
| A-43 | Falha passageira da renovação lida como sessão recusada | Média | Corrigido (origin/main) | `591bc90`, PR #3 | FA:446-451 | FA:433-460 |
| A-44 | `admin-master.guard` ignorava `unavailable` | Baixa | Corrigido (origin/main) | `591bc90`, PR #3 | `redirectWhenUserNotLoaded` (FA:582) | FA:45; FA:582; FI:314-315 |
| A-45 (= P-2) | Foco perdido ao navegar pela gaveta | Baixa | Corrigido (origin/main) | `838e94f`, PR #3 | FA:406-412 | FA:401-431 |
| A-46 (= P-3) | Tab saía da gaveta para os toasts | Baixa | Corrigido (origin/main) | `838e94f`, PR #3 | FA:413-417 | FA:401-431 |
| R-01 | Controles da gaveta fechada no Tab | Alta | Corrigido (origin/main) | `838e94f`, PR #3 | FA:381 | FA:374-396 |
| R-02 | Foco não entrava na gaveta aberta | Alta | Corrigido (origin/main) | `838e94f`, PR #3 | FA:382 | FA:374-396 |
| R-03 | Itens fora da tela no celular deitado | Alta | Corrigido (origin/main) | `838e94f`, PR #3 | FA:383 | FA:374-396 |
| R-04 | Esc não fechava a gaveta | Média | Corrigido (origin/main) | `838e94f`, PR #3 | FA:384 | FA:374-396 |
| R-05 | Diálogo "Novo usuário" apertado em 844×390 | Baixa | Corrigido (main local); revalidar no navegador (E-04) | `f95f587` | `src/styles.css:1359-1374` | FA:397-399; FI:255 |
| R-06 | E-mails quebrados no meio na tabela de Usuários | Baixa | Corrigido (main local); revalidar no navegador (E-04) | `008dfcf` | `<wbr>` antes do "@" em `users/feature-user-list/user-list.component.html:217,219` | FA:397-399; FI:255 |
| R-07 | Alvos de 16 a 23px | Baixa | Corrigido (main local); defeitos para a E-01 (§6) | `be5cd6e` | `.tap-target` em `src/styles.css:312-326`; defeitos no bloco de toque `src/styles.css:1347-1357` | FA:397-399; FI:255 |
| C-01 | Resultado tipado no serviço de sessão | Baixa | Pendente: registrar a exceção nas skills é decisão de Rafael Santos | `591bc90` (resultado tipado) | `shared/entities/current-user.ts`, `shared/services/current-user.service.ts` (FA:534) | FA:534; FA:587 |
| C-02 | `transientFailureReason` no utilitário genérico de HTTP | Baixa | Corrigido (origin/main) | `591bc90` | Movido para `session-unavailable.util.ts` (FA:583) | FA:535; FA:583 |
| C-03 | Três cópias da busca de responsáveis | Média | Corrigido (origin/main) | `8473d24` | `tickets/application/ticket-assignee-search.ts` (FA:579) | FA:536; FA:579 |
| C-04 | `constructor()` sem `/** */` | Baixa | Corrigido (origin/main) | `591bc90` | FA:580 | FA:537; FA:580 |
| C-05 | `SessionRecoveryStore` fora do padrão `resource()` | Baixa | Mantido | — | FA:588 | FA:538; FA:588 |
| C-06 | Política diferente no `unauthenticated` (guard × Stores) | Baixa | Corrigido (origin/main) | `591bc90` | `redirectWhenUserNotLoaded` (FA:582) | FA:539; FA:582 |
| C-07 | Foco preso duplicado; breakpoint repetido; `100dvh` sem reserva | Baixa | Corrigido: `100vh` de reserva na origin/main (`838e94f`); utilitário e diretiva de foco na main local (`0573c20`); o breakpoint repetido fica (Mantido, §5) | `838e94f`; `0573c20` | `shared/utils/focus-trap.util.ts`, `shared/ui/directives/focus-trap.directive.ts`; breakpoint em `main-layout.component.ts:110` e `.css:110` | FA:540; FA:585 |
| C-08 | Reexportação de `todayInSaoPaulo` | Baixa | Corrigido (origin/main) | `000b4cc` | FA:584 | FA:541; FA:584 |
| C-09 | Validação de anexo no componente; campos sem uso | Baixa | Corrigido (main local); defeito para a E-01 (§6) | `6df64e1` | `attachmentPolicyViolation` e `uploadIfValid` em `tickets/application/ticket-attachments.store.ts:18-34,209-214` | FA:542; FA:589 |
| C-10 | Indentação de 4 espaços | Baixa | Corrigido (main local) | `0451269` (21 arquivos: 20 `.ts` e o `dashboard.component.css`) | Em `7fe3bec`, nenhum `.ts` usa só 4 espaços. A contagem de FA:590 está errada (errata 13) | FA:543; FA:590 |
| C-11 | Membros sem `/** */` | Baixa | Corrigido (origin/main) nos membros listados | `591bc90`, `838e94f` | FA:586 | FA:544; FA:586 |
| C-12 | Stub do teste do Monitor com o tipo antigo | Baixa | Corrigido (origin/main) | `8473d24` | FA:581 | FA:545; FA:581 |
| 6.3 | Nomes de teste em inglês | — | Corrigido (main local); resta um título em português (N-3) | `9d7e238` (95 arquivos) | `shared/interceptors/auth.interceptor.spec.ts:117` | FI:170; FI:254 |

Contagem: 38 corrigidos na `origin/main` (o A-05 como remoção); 10 corrigidos só na `main` local
(A-28, A-33, A-42 na parte do aviso, R-05, R-06, R-07, C-07 na parte do foco preso, C-09, C-10 e
6.3); 12 mantidos (A-12 a A-21, A-31 e C-05); 5 pendentes (A-23, A-24, A-27, A-30 e C-01); 1 a
reavaliar (A-22).

### 5. Analisados e mantidos

Justificativas completas em FA:462-476 e FA:585-590.

| ID | Onde (front) | Por que fica | Nota de 04/11 |
|---|---|---|---|
| A-12 | `tickets/entities/ticket-status.ts:38-44` (`TICKET_STATUS_TRANSITIONS`) e `TICKET_ACTIVE_STATUSES` | Só escolhe quais botões mostrar; o servidor valida a transição | A citação do back mudou (`Ticket.CanTransitionTo`, `Ticket.cs:120`). A transição Resolvido → Fechado vai por PUT e falha (DIV-1). A spec 047 (DEC-3) pode aposentar o mapa |
| A-13 | `tickets/ui/ticket-cancel-window.ts` | Usa `canCancel` e `ownerCancelDeadlineUtc` do servidor; o relógio só esconde o botão quando a janela vence com a tela aberta | — |
| A-14 | `ticket-monitor.component.ts` (`displaySlaStatus`) e `dashboard-insights.component.ts` | Reclassifica para "Atrasado" entre recargas, com a fórmula do servidor e o relógio de `serverNowUtc` | `TicketSla.GetStatus` não existe em `ef1c981`. A spec 045 ("fórmula única de prazo", `bb15575`) entrou na `origin/main` do back em 01/11. Reconferir a fórmula contra a 045 (§6, item 14) |
| A-15 | `dashboard.component.ts` | Aritmética de apresentação sobre contadores do servidor | A LAC-13 pede indicadores derivados no agregado |
| A-16 | `dashboard-overview.ts`, `dashboard-insight-rules.ts` | Textos de leitura do gráfico; os limites são regra de redação | — |
| A-17 | `ticket-summary.store.ts` | Seleção de exibição sobre páginas do servidor; os totais vêm do servidor | — |
| A-18 | `my-tickets-summary.store.ts` | Somas de contadores com o agrupamento do back (`OwnTicketStatusGroup`) | — |
| A-19 | `departments/feature-department-list/*` e `role-insights` | `GET /departments` e `GET /roles` vêm sem paginação; filtrar a lista carregada é apresentação | Muda se o back paginar |
| A-20 | `users.store.ts` | Aviso informativo e orquestração de chamadas que o servidor valida uma a uma | A LAC-6 pede o impacto da desativação no back |
| A-21 | `admin-master.guard.ts`, `main-layout` | Só UX; a API aplica `[HasPermission]` | DIV-9 e DIV-10: telas que não conferem a permissão de cada ação |
| A-31 | Linha "Prazo" do detalhe, quando o painel de SLA não carrega | Fallback documentado no template; o painel de SLA usa o relógio do servidor | Classificação a reavaliar (errata 2) |
| C-05 | `shared/application/session-recovery.store.ts` | Mesmo formato do `LoginStore` e do `ActivateAccountStore`; não há resource a duplicar | — |
| C-07 (breakpoint) | `shared/ui/layouts/main-layout/main-layout.component.ts:110` e `.css:110` | O CSS não lê constantes do TS; um comentário liga os dois (FA:585) | O resto do C-07 foi corrigido (`0573c20`) |

**A-22 revisto** (limites de texto; back em `ef1c981`):

| Campo | Front | Back | Situação |
|---|---|---|---|
| Mensagem | 4000 (`tickets/entities/ticket-message.ts:12`) | Coluna 4000 (`TicketMessageConfiguration.cs:16`) | Igual |
| Título do chamado | 200 (`tickets/feature-ticket-create/ticket-create.component.ts:35`) | Coluna 200 (`TicketConfiguration.cs:20`) | Igual |
| Descrição do chamado | 10 a 500 (`ticket-create.component.ts:36`; `tickets/ui/ticket-edit-dialog/ticket-edit-dialog.component.ts:47`) | Coluna 500 (`TicketConfiguration.cs:23`) e check de 10 a 500 (spec 042, REQ-3) | Igual |
| Motivo da reabertura | 500 (`ticket-reopen-dialog.component.ts:6,41`) | Sem limite próprio: `ReopenTicketCommandValidator.cs:9` só confere o id; vale a coluna da mensagem, 4000 (spec 042, REQ-4 e DEC-17) | **Diverge** (DIV-5): o front recusa texto que o back aceita |
| Nome e descrição de departamento e de setor | 100 e 500 (`departments/feature-department-list/department-list.component.ts:195-196,201-202`) | Colunas 100 e 500 (`DepartmentConfiguration.cs:15,23`; `SectorConfiguration.cs:15,23`) | Igual. Acima do limite, o back responde 400, não 500 (`GlobalExceptionHandler.cs:46-60`; spec 042, REQ-7 e AC-6) |
| Nome e sobrenome do usuário | 100 (`users/entities/user-profile.ts:2`) e mínimo de 2 | Colunas 100 (`UserConfiguration.cs:16-17`), sem mínimo | Máximo igual; mínimo só no front (DIV-8) |
| Senha | Mínimo 6 e `strongPasswordValidator` (ex.: `shared/feature-activate-account/activate-account.component.ts:45`) | Senha forte no validator (spec 042, REQ-1) | Regra exata não reconferida (a confirmar) |

Conclusão: o A-22 segue válido como validação de experiência, menos no motivo da reabertura. O 500
de FA:476 e FI:365 vale para a spec 038; a spec 042 (PR #56, anterior a `ef1c981`) o trocou por
400. Próximo passo: a LAC-10 (limites de texto próprios) e a FE-19 da spec 049, que propõe 4000.

### 6. Pendências abertas

Lista única. Substitui as cinco listas dos originais (errata 6).

| # | Pendência | Depende de | Referência | Próximo passo |
|---|---|---|---|---|
| 1 | A-23: tokens no `localStorage` | Back: spec 046, Em descoberta, não versionada | FA:482; `specs/046-sessao-em-cookie-httponly/spec.md` | Rafael Santos decide as DECs da 046. Depois da entrega, o front tira os tokens do `localStorage` (sessão e interceptor) |
| 2 | A-24: a API só informa `canCancel` | Back: spec 047 | FA:483; `specs/047-acoes-permitidas-do-chamado/spec.md` | Decidir as DECs da 047 (DEC-1 formato; DEC-3 `nextStatuses`). Depois, trocar o espelho de `tickets/ui/ticket-action-permissions.ts` e o `TICKET_STATUS_TRANSITIONS` pelos campos da API |
| 3 | A-30: SLA do primeiro ciclo em `GET /tickets` (Monitorar) | Back: spec 048; a LAC-2 estende ao agregado e ao detalhe | FA:489; `specs/048-monitor-ciclo-sla-vigente/spec.md` | Decidir as DECs da 048. Depois, `TicketMonitorItem` e as telas do Monitor pelo ciclo vigente (048, `spec.md:64`) |
| 4 | Volta da cor da função (A-05/BR-001) | Back: spec 044, Em descoberta, DEC-1 a DEC-7 abertas | FA:116-143; FI:337-356 | Responder as DECs. Depois da entrega, os passos de FA:136-143 |
| 5 | A-27: URL de produção | Implantação; pendente de propósito (Rafael Santos, 31/10) | `src/environments/environment.prod.ts:3-4` | Informar a URL na implantação; ver N-8 (portas) |
| 6 | C-01: exceção do resultado tipado nos serviços de sessão | Rafael Santos | FA:534; FA:587 | Decidir se a exceção entra nas skills |
| 7 | A-22: motivo da reabertura (500 × 4000) | Rafael Santos (LAC-10) | §5 | Decidir o limite e ajustar o diálogo |
| 8 | Defeitos conhecidos das etapas integradas | Front: etapa E-01, ainda não aprovada | Tabela abaixo | Corrigir na E-01 |
| 9 | Validação visual com login | API: o container `webapi:dev` não respondia | Etapa E-04 | Revalidar na aplicação real o A-34, R-05 a R-07 e o aviso do A-42 |
| 10 | SSR responde 500 nas rotas não pré-renderizadas: `new CommonEngine()` sem `allowedHosts` | Front; problema preexistente | `server.ts:15`; `l3/modificada/.x2/ssr-requests-localhost.txt` e `ssr-server.log` | Etapa E-12 |
| 11 | `node_modules` local sem sincronizar | Rafael Santos (autorizar o `npm ci`) | `node_modules/@angular/animations/` ainda existe; o `package.json` de `7fe3bec` não tem o pacote | Sincronizar com o lockfile quando autorizado |
| 12 | Push da `main` (11 commits) | Rafael Santos (não autorizado) | §11 | Autorizar ou não |
| 13 | `.impeccable/design.json` defasado | Rafael Santos (decisão pendente) | `.impeccable/design.json:3` (`generatedAt` 2026-10-27); DOC-10 | Não regenerar por enquanto (04/11). Decidir depois se regenera pelo fluxo `/impeccable document` |
| 14 | Evidências do back que não existem mais (N-7); texto do A-25; classificação do A-31 | Front (documentação) | §4; §5; §7 | Reconferir contra a `origin/main` atual do back (`e5d8a38`) e registrar aqui |
| 15 | N-4 e N-5 | Front; Rafael Santos (incluir no plano) | §7 | A E-01 cobre só a spec do `SideMenuNavComponent` (N-5). O N-4 e os outros quatro arquivos do N-5 não têm etapa no plano de 31/10 |
| 16 | D-SF5: nomenclatura de specs, branches e commits do front | Rafael Santos | §9; §13 | Em aberto: aguarda a tabela de controle das specs do back, que Rafael Santos está enviando em partes. Nada da nomenclatura foi decidido |
| 17 | Achados da auditoria geral de 31/10 (DIV-, LAC-, DOC-, BK-) | Front, back e responsável | §8 | Seguem no plano de 31/10 (E-01 a E-15, sem aprovação; a E-00 já foi executada). DIV-1 e DIV-3 (Alto) afetam o uso hoje; a E-02 prevê corrigir DIV-1, DIV-2, DIV-4, DIV-9 e DIV-10 |
| 18 | Commit das limpezas L-4, L-5 e L-6 (este documento, `DESIGN.md`, `tsconfig.app.json` e `tsconfig.spec.json`) | Rafael Santos (autorizar o plano final) | §9; §11 | Plano de 04/11: branch temporária a partir da `main`, com dois commits independentes, um com este documento e outro com o `DESIGN.md` e o tsconfig. Nenhuma operação de Git antes da autorização expressa; merge na `main`, exclusão da branch e push dependem de autorização própria |
| 19 | Supressões NG8102 e NG8107 (`extendedDiagnostics`, no `tsconfig.app.json` e no `tsconfig.spec.json` do `7fe3bec`) | Rafael Santos (commit, item 18) | §3; §9 | Remoção de todas as configurações decidida em 04/11, aplicada no working tree e validada em cópia isolada. Entra no commit do `DESIGN.md` e do tsconfig |
| 20 | Excluir `docs/audit/FRONTEND_AUDIT.md` e `FINAL_ACCEPTANCE_AUDIT.md` | Rafael Santos; back (referências do §12) | §12; §15 | Preservar os dois até o back atualizar as referências (decisão de 04/11). O front não altera o back |
| 21 | Itens da revisão da raiz de 04/11 | Rafael Santos | §9; relatório das limpezas L-4 a L-8 | `server.ts` fica na raiz até a E-12 (o Angular 22 gera `src/server.ts`); `README.md` (DOC-6) e `PRODUCT.md` (DOC-1 a DOC-5) ficam para a E-06; o `cli.analytics` do `angular.json` segue sem alteração até a decisão (análise entregue em 04/11). A pasta `.impeccable/live/` foi apagada em 04/11; a regra `.impeccable/live/` do `.gitignore` continua |
| 22 | Impacto no front das specs do back mergeadas depois de 31/10 (022, 023, 045, 024, 035, 051 e 050) | Front | §12 | Avaliar; não foi feito nesta consolidação |

**Defeitos conhecidos para a E-01**

| Origem | Defeito | Onde |
|---|---|---|
| C-09 (`6df64e1`) | A mensagem de validação de anexo não some depois de excluir um anexo: o `delete()` limpa só o `mutationError` | `tickets/application/ticket-attachments.store.ts:182-202` |
| A-42 (`00b7252`) | O `CurrentUserService` é importado pelo barrel `./shared`; o aviso aparece também em nova tentativa de fundo | `app.component.ts:8` |
| R-07 (`be5cd6e`; o bloco veio para o `styles.css` no `0df5718`) | No toque: o `box-sizing` do `.btn-close` e o alinhamento do `.dropdown-item` | `src/styles.css:1347-1357` |
| A-33 (`0df5718`) | Falta valor de reserva para `--bs-card-bg`, e há regras repetidas nos CSS de componente, como o `.table.is-refreshing` do Monitor, com opacidade 0,6, sobre o global, com 0,5 | `src/styles.css:1335-1343`; `tickets/feature-ticket-monitor/ticket-monitor.component.css:81-84`; `src/styles.css:1319-1322` |
| 6.3 (N-3) | Um título de teste em português | `shared/interceptors/auth.interceptor.spec.ts:117` |
| N-6 | Referência `#menu` sem uso | `shared/ui/layouts/main-layout/main-layout.component.html:4` |
| N-1, N-2 | Comentários desatualizados | `roles/feature-role-list/role-list.component.css:1`; `shared/entities/dashboard-features.ts:4-8` |
| N-5 (parte) | Falta a spec do `SideMenuNavComponent` | `shared/ui/layouts/main-layout/side-menu-nav.component.ts` |

### 7. Itens novos da conferência de 31/10

| ID | Achado | Evidência | Estado | Próximo passo |
|---|---|---|---|---|
| N-1 | Comentário fala em "amostra de cor", que saiu com o BR-001 | `roles/feature-role-list/role-list.component.css:1` | Pendente | E-01 |
| N-2 | Comentário diz que as flags do Início esperam endpoint que o back "ainda não entrega"; hoje as cinco flags estão ligadas | `shared/entities/dashboard-features.ts:4-8`; `src/environments/environment.ts:9-13` | Pendente | E-01 |
| N-3 | Título de teste em português ("deve manter a sessão…") | `shared/interceptors/auth.interceptor.spec.ts:117` | Pendente | E-01 |
| N-4 | Variáveis com nome em português em teste (`prazoDd`, `prazoText`, `prazoLines`) | `tickets/feature-ticket-detail/ticket-detail.component.spec.ts:256,280,1102` | Pendente | Sem etapa no plano de 31/10 |
| N-5 | Cinco arquivos novos sem spec própria | `shared/utils/focus-trap.util.ts`; `shared/ui/session-retry-notice/session-retry-notice.component.ts`; `shared/ui/layouts/main-layout/side-menu-nav.component.ts`; `tickets/feature-ticket-list/ticket-list-first-use.component.ts`; `tickets/feature-ticket-list/ticket-list-due-cell.component.ts` | Pendente. Há testes indiretos, como `focus-trap.directive.spec.ts` e `app.component.spec.ts` (cobertura não medida) | A E-01 só para o `SideMenuNavComponent`; os outros quatro, sem etapa |
| N-6 | Referência `#menu` sem uso: o `.ts` só lê `menuOpener`, `menuCloser` e `mainContent` | `main-layout.component.html:4`; `main-layout.component.ts:68-74` | Pendente | E-01 |
| N-7 | Evidências do back que não existem em `ef1c981`: `TicketAccessGuard.EnsureOwnerOrManagerAsync` (A-06, FA:149), `UserValidationRules.NameMaxLength` (A-09, FA:168), `TicketStatusTransitions.CanTransition` (A-12, FA:466), `TicketSla.GetStatus` (A-14, FA:468) e os limites do A-22 (FA:476) | Busca no `ef1c981` sem ocorrência; entre `a72e07b` e `ef1c981` entraram as specs 039, 042 e 041 (PRs #55, #56 e #57) | A reavaliar | Registrado nesta Parte I (§4, §5); os anexos ficam como estão |
| N-8 | Portas diferentes: 5000 em desenvolvimento e 5195 em produção | `src/environments/environment.ts:3`; `src/environments/environment.prod.ts:4` | Registrado (ligado ao A-27) | Resolver junto com a URL de produção |

### 8. Auditoria geral de 31/10 — registro compacto

Auditoria só de leitura, do front e do back (`ef1c981`). O relatório foi entregue na conversa de
31/10, sem arquivo no repositório. Os IDs ganharam prefixos para não colidir com os de outras séries:

- **LAC-n** = L-n do relatório de 31/10. A troca evita a colisão com as etapas L-1 a L-9 da limpeza
  de 04/11.
- **DIV-n** = D-n do relatório de 31/10, na mesma ordem e com os mesmos temas (conferido no
  relatório: D-1 é o "Fechar chamado" pela rota errada; D-10, a tela de Usuários).
- **DOC-n** e **BK-n:** numerados nesta redação.

#### 8.1 Divergências front/back (DIV-)

| ID | Grav. | Divergência | Front | Back (`ef1c981`) | Situação |
|---|---|---|---|---|---|
| DIV-1 | Alto | "Fechar chamado" sempre falha: o front fecha por PUT com status Fechado, e o back recusa PUT em chamado não ativo | `tickets/entities/ticket-status.ts:41` (Resolvido → Fechado); `tickets/infrastructure/ticket.data.service.ts:39` (PUT `/tickets/{id}`) | `UpdateTicketCommandHandler.cs:51-54`; `Ticket.cs:50` (`IsActive`; linha 48 na `origin/main` atual); teste `UpdateTicketCommandHandlerTests.cs:91-105`. A rota certa, `POST tickets/{ticketId}/close` (`Close.cs:13`, com `tickets:manage` em `Close.cs:25`), não é usada pelo front | Aberto |
| DIV-2 | Baixo | Regra de reabrir | Dono com `tickets:reopen-own` ou qualquer um com `tickets:manage` (`tickets/ui/ticket-action-permissions.ts:28-31`) | Dono só com `tickets:reopen-own`; os demais com `tickets:manage` (`ReopenTicketCommandHandler.cs:33-36`) | Aberto: o dono com `manage` e sem `reopen-own` vê o botão e recebe 403 |
| DIV-3 | Alto | O PUT reenvia a descrição e o status lidos | Cancelar pela lista manda a descrição carregada na tela (`tickets/feature-ticket-list/ticket-list.component.ts:357`) | O PUT recebe o estado inteiro (descrição e status) | Aberto: pode desfazer edição alheia (LAC-1) |
| DIV-4 | Baixo | Código de erro esperado | `Tickets.AssigneeCannotManageTickets` (`tickets/application/ticket-detail.store.ts:264`) | Devolve `Tickets.AssigneeNotAttendant` (`TicketErrors.cs:23-24`; `AssignTicketCommandHandler.cs:65`) | Aberto: a orientação "Escolha outro usuário na lista" (`ticket-detail.store.ts:264-268`) não aparece |
| DIV-5 | — | Motivo da reabertura | 500 | 4000 | Ver A-22 (§5) |
| DIV-6 | — | "Atribuir a mim" | Só sem responsável (`tickets/feature-ticket-monitor/ticket-monitor-info-panel.component.ts:33`) | Permite assumir chamado que já tem responsável (levantamento de 31/10) | Decisão de produto (LAC-9) |
| DIV-7 | — | Administrador tirar a própria função de administrador | Só o front impede (`users/feature-user-list/user-list.component.ts:564`) | Não impede (levantamento de 31/10) | Decisão (LAC-8) |
| DIV-8 | — | Mínimo de 2 caracteres no nome | Só no front (FA:173-175) | Só exige não vazio (FA:173-174) | Decisão (LAC-10) |
| DIV-9 | — | "Novo Chamado" e "Meus Chamados" | Aparecem pelo perfil deduzido, não por `tickets:create` e `tickets:view-own`; `/tickets/novo` sem guarda de permissão (`core/routes/app.routes.ts:55-59`) | Exige as permissões (levantamento de 31/10) | Aberto |
| DIV-10 | — | Ações da tela de Usuários | Só confere `users:read` (`core/routes/app.routes.ts:81`; `shared/ui/layouts/main-layout/side-menu-nav.component.html:21,38`); nenhuma conferência de `users:create`, `users:deactivate`, `users:assign-roles` ou `users:update` fora dos testes | Exige cada permissão (levantamento de 31/10) | Aberto (LAC-5) |

#### 8.2 Lacunas para specs novas no back (LAC-)

A coluna "Relaciona-se com" é leitura desta redação.

| ID | Prioridade | Lacuna | Relaciona-se com |
|---|---|---|---|
| LAC-1 (L-1) | Alta | Operações do chamado sem reenviar o estado inteiro, com controle de versão (409) | DIV-3 |
| LAC-2 (L-2) | Alta | Ciclo de SLA vigente também no agregado `stats/overview` e no detalhe (ampliação da spec 048) | A-30 |
| LAC-3 (L-3) | Média | Filtro por departamento na API | — |
| LAC-4 (L-4) | Média | Autor das mensagens | — |
| LAC-5 (L-5) | Média | Ações permitidas na gestão de usuários | DIV-10 |
| LAC-6 (L-6) | Média | Impacto da desativação (contagem e devolução à fila) | A-20 |
| LAC-7 (L-7) | Média | Cadastro com funções numa operação | — |
| LAC-8 (L-8) | Decisão | Administrador tirar a própria função | DIV-7 |
| LAC-9 (L-9) | Decisão | Assumir chamado que já tem responsável | DIV-6 |
| LAC-10 (L-10) | Decisão | Limites de texto próprios | DIV-5; DIV-8; A-22 |
| LAC-11 (L-11) | Baixa | `Retry-After` no 429 | A-42 |
| LAC-12 (L-12) | Baixa | Parâmetros de política na API (75%, 72 h) | — |
| LAC-13 (L-13) | Baixa | Indicadores derivados no agregado | A-15 |
| LAC-14 (L-14) | Baixa | Ações sobre mensagens e anexos | — |
| LAC-15 (L-15) | Baixa | Atribuição na abertura com as mesmas regras da atribuição | DP-02 do back (`SPEC-TICKEST.md:164`) |

#### 8.3 Documentação (DOC-)

| ID | Grav. | Problema | Evidência | Situação em 04/11 |
|---|---|---|---|---|
| DOC-1 | Alto | `PRODUCT.md` diz que o produto é multi-tenant e que o isolamento entre empresas é "inegociável"; o back decidiu "uma organização por instalação" (DP-01) | `PRODUCT.md:35-36,84`; back `SPEC-TICKEST.md:62,134` | Aberto |
| DOC-2 | — | Papéis com nomes errados | `PRODUCT.md:14-17,25` | Aberto |
| DOC-3 | — | Link quebrado: `docs/plano-onboarding-rh.md` não existe no back | `PRODUCT.md:23-24` | Aberto |
| DOC-4 | — | `GET /tickets/{id}/sla` dado como pendente | `PRODUCT.md:63-64` | Aberto |
| DOC-5 | — | "Nenhum requisito de acessibilidade" × WCAG AA aplicado no `DESIGN.md` | `PRODUCT.md:92-94`; `DESIGN.md:171,193` | Aberto |
| DOC-6 | — | O `README.md` é o modelo do Angular CLI: cita a versão 18.2.6 e manda rodar `ng e2e` | `README.md:3,23` | Aberto |
| DOC-7 | — | `CLAUDE.md` com exemplo antigo (`TicketsService`) e sem `core/` e `dashboard/` | `CLAUDE.md:19-24,38` | Aberto |
| DOC-8 | — | Skills citam lint que não existe, Prettier, `flushEffects`/`fakeAsync` e `console.error` | `.claude/skills/add-context/SKILL.md:74`; `add-feature/SKILL.md:41,56`; `add-feature/references/store-method.md:34,115`; `add-tests/SKILL.md:29-30`; `ca-review/SKILL.md:99`; `.claude/skills/README.md:100,105` | Aberto; as skills não foram alteradas |
| DOC-9 | — | `DESIGN.md`: token do botão primário, texto transitório da spec 031 e o padrão `is-refreshing` não registrado | `DESIGN.md` no HEAD | Tratados na limpeza L-5, aprovada em 04/11 sem regenerar o documento; entram no commit do §6, item 18 |
| DOC-10 | — | `.impeccable/design.json` defasado | `.impeccable/design.json:3` (`generatedAt` 2026-10-27) | Pendente (§6, item 13); sem regenerar por enquanto (04/11) |

#### 8.4 Modelo de specs do back (BK-)

| ID | Grav. | Problema | Evidência | Nota de 04/11 |
|---|---|---|---|---|
| BK-1 | Alto | Colisão de IDs RN entre `SPEC-TICKEST.md` e `SYSTEM_SPECIFICATION.md`: o RN-30 é o responsável na abertura num e o convite de conta no outro | `SPEC-TICKEST.md:164` (DP-02 → RN-30); `SYSTEM_SPECIFICATION.md:223` (RN-30, spec 008) | — |
| BK-2 | Alto | `SPEC-TICKEST.md` órfão e contraditório | Relatório de 31/10 | — |
| BK-3 | — | Partes do `SYSTEM_SPECIFICATION.md` congeladas | Relatório de 31/10 | — |
| BK-4 | — | Quatro registros de decisão sem índice | Relatório de 31/10 | — |
| BK-5 | — | 15 pastas de spec fora do git: 12 nunca commitadas, 5 delas aprovadas (022, 034, 035, 037 e 043) | Relatório de 31/10 | A 022 e a 035 entraram na `origin/main` (PRs #60 e #62, 01/11). Às 17:04 de 04/11, sem rastreio: 032, 033, 034, 036, 037, 040, 043, 044, 046, 047, 048 e 049, além de `specs/_fontes/` (`git status` do back, que outra sessão altera durante o dia: a 052, vista às 16:54, saiu do working tree) |

#### 8.5 Conformidade com as skills (31/10)

| Repositório | Estrita | Ajustada |
|---|---|---|
| Front, agregado | 91,6% (1095 de 1196) | 93,8% |
| Front, média simples | 87,7% | 96,0% |
| Back | cerca de 80% (bruto) | cerca de 90% |

Fonte: relatório de 31/10.

#### 8.6 Achado de 04/11: spec 049 do back

- A spec 049 ("Tickest — reavaliação arquitetural do projeto inteiro, modelo-alvo e plano de
  refatoração", não versionada) usa FE-01 a FE-28 para achados do front.
- Estado: no começo desta redação, o cabeçalho dizia Em descoberta. Às 16:41 de 04/11 passou a
  Aprovada, "como spec-mãe, pelo modelo por etapa", ainda sem commit (`spec.md:4,6` e `:2152`).
- A 049 cita os documentos `docs/audit` (§12). A FE-19 é o motivo da reabertura (A-22, DIV-5).
- Observação desta redação: a D-SF1 prevê specs do front em `specs/FE-NNN-slug`. Os IDs FE- da 049
  podem colidir com essa numeração.

### 9. Decisões do responsável

| Data | Decisão | Fonte |
|---|---|---|
| Até 29/10 | "volumeResolved off até validar" (commit `a77394d`, 29/10 19:57). Superada em 31/10 (A-28) | FA:487 |
| Data não registrada nos originais | Monitor fora do escopo da spec 024 do back (DEC-3 da 024) | FA:489 |
| 29/10 | Tirar do front a lógica que é do back e documentar o requisito; a cor da função saiu (BR-001) | FA:118; back `specs/044-cor-do-badge-da-funcao/spec.md:15` |
| 29/10 | Manter o mínimo de 2 caracteres no nome, "por decisão de não mudar o comportamento visível sem pedido" (autoria não registrada) | FA:173-175 |
| 29/10 | Commit `b7f0c37` autorizado (restaura plano e progresso) | FI:13; FI:37 |
| 29–30/10 | No conflito entre a missão e o `CLAUDE.md`, vale o `CLAUDE.md` (regra aplicada pela auditoria) | FA:610-615; FI:98 |
| 29–30/10 | Títulos de teste em português mantidos, como desvio consciente (autoria não registrada). Revertida em 04/11 pelo 6.3 (`9d7e238`) | FI:170 |
| 30/10 | A-37 autorizado | FA:38; FA:246 |
| 30/10 | Segunda etapa do A-42 autorizada | FA:330 |
| 30/10 | A-43 corrigido com autorização | FI:312-313 |
| 30/10 | A-44 registrado como pendência por decisão do responsável; corrigido depois, no saneamento | FI:314-315 |
| 30/10 | A-45 e A-46 corrigidos com autorização própria, depois da aprovação | FA:403-404; FI:387-388 |
| 30/10 | Aprovação formal da conclusão técnica: A-37 a A-43 e R-01 a R-04 aprovados; R-05 a R-07 e A-44 aceitos como pendências baixas; integração no Git só com autorização explícita | FI:383-396 |
| 30/10 | Saneamento de C-01 a C-12 e do A-44 autorizado | FA:574; FI:373 |
| 30/10 | Registrar a exceção do C-01 nas skills fica com o responsável | FA:587 |
| 30/10 | Consolidação dos documentos em dois, com o BR-001 migrado para a spec 044 do back | FI:320-335; back `specs/044-cor-do-badge-da-funcao/spec.md:141` |
| 30/10 | Integração na `fix/frontend-audit-integration` e abertura do PR #3 autorizadas | FI:40-44 |
| 30/10 | Merge do PR #3 autorizado depois da revisão | FI:423 |
| 31/10 | A-27 fica pendente | Conversa de 31/10 |
| 31/10 | A-28: ligar as duas flags | Conversa de 31/10; executado em `f7cdd73` |
| 31/10 | A-33: enxugar o CSS | Conversa de 31/10; executado em `0df5718` |
| 31/10 | C-09, C-07, C-10 e 6.3: resolver por etapas | Conversa de 31/10; executado em `6df64e1`, `0573c20`, `0451269` e `9d7e238` |
| 31/10 | "ok" para registrar no back as specs 046, 047 e 048 | Back: `specs/046-…/spec.md:101`, `specs/047-…/spec.md:98`, `specs/048-…/spec.md:90` |
| 31/10 | SPEC-TICKEST-FRONT.md aprovado para planejamento como especificação viva e fonte oficial dos requisitos do front. Nenhum arquivo foi criado até 04/11 | Conversa de 31/10 |
| 31/10 (23:20) | D-SF1 = opção B: documento vivo + uma spec por mudança em `specs/FE-NNN-slug` | Conversa de 31/10 |
| 31/10 (23:20) | E-00 antes da E-01 (correção da ordem do plano, na mesma mensagem da D-SF1) | Conversa de 31/10 |
| 04/11 | Regra de processo depois da falha da E-00 (§13) | Conversa de 04/11 |
| 04/11 | L-1: manter os 10 commits | Conversa de 04/11 |
| 04/11 | E-05: consolidar os documentos no `AUDITORIA.md`, preservando achados, evidências, históricos e referências; os originais só saem depois de validar o documento e mapear as referências externas | Conversa de 04/11 |
| 04/11 | Mensagens dos commits da E-00 mantidas (alternativa A) | Conversa de 04/11; reflog da `main` às 14:33:46 |
| 04/11 | L-9: integração e limpeza das branches, passo a passo | Conversa de 04/11; `l9/refs-*.txt` |
| 04/11 | L-3: remoção do `@angular/animations` aprovada depois da validação | Conversa de 04/11; `7fe3bec` |
| 04/11 | L-4 a L-8 autorizadas, com escopo de limpeza técnica | Conversa de 04/11 |
| 04/11 | Avaliar o local do `AUDITORIA.md` para manter a raiz enxuta; não regenerar o `design.json`; não mexer no bloco do tsconfig sem justificativa técnica; não alterar documentos nem specs do back | Conversa de 04/11 |
| 04/11 | Revisão das limpezas L-4 a L-8, dadas como concluídas: este documento aprovado em `docs/audit/`; os originais preservados até o back atualizar as referências; as mudanças do `DESIGN.md` aprovadas, sem regenerar o documento; o `design.json` sem regenerar por enquanto | Conversa de 04/11 |
| 04/11 | Remover as supressões NG8102 e NG8107 de todas as configurações, porque o projeto não tem avisos sem elas, e validar de novo em cópia isolada | Conversa de 04/11; §3 |
| 04/11 | Apagar a pasta `.impeccable/live/` se continuasse vazia. Não tinha arquivos, só as subpastas `annotations/` e `sessions/`, vazias, de 27/10 | Conversa de 04/11; `l48/impeccable-live.txt` |
| 04/11 | `cli.analytics`: apresentar o valor, o funcionamento e as alternativas, sem alterar. `server.ts` na raiz até a E-12; `README.md` e `PRODUCT.md` na E-06; nenhuma alteração no back, com as referências quebradas ou pendentes documentadas (§12) | Conversa de 04/11 |
| 04/11 | Integração: branch temporária a partir da `main`, com dois commits independentes (este documento; `DESIGN.md` e tsconfig). Nenhum stage ou commit antes da autorização do plano final; sem push, sem `npm ci` e sem iniciar D-SF5, E-01 ou E-12 | Conversa de 04/11 |

### 10. Matriz de aceitação

Resumo da matriz de FI:87-245 (Anexo B). Nenhum item FAIL ou BLOCKED.

| Seção | Tema | Linhas | PASS | Não PASS |
|---|---|---|---|---|
| 1 | Leitura das instruções e das skills | FI:91-102 | 8 de 8 | — |
| 2 | Auditoria completa do front | FI:104-124 | 14 de 17 | 2.10, 2.13 e 2.14 PARTIAL (o 2.12 está PASS, com R-05 a R-07 registrados) |
| 3 | Separação front/back | FI:126-140 | 11 de 11 | — |
| 4 | `BACKEND_RECONSTRUCTION.md` | FI:142-151 | 6 de 6 | — |
| 5 | Arquitetura modular e skills | FI:153-162 | 6 de 6 | — |
| 6 | Idioma | FI:164-173 | 5 de 6 | 6.3 PARTIAL |
| 7 | Lotes | FI:175-188 | 10 de 10 | — |
| 8 | Documentação e continuidade | FI:190-196 | 3 de 3 | — |
| 9 | Validação contínua e aceitação | FI:198-211 | 8 de 10 | 9.5 NOT APPLICABLE; 9.7 PARTIAL |
| 10 | Proteção do repositório | FI:213-220 | 4 de 4 | — |
| 11 | Autonomia | FI:222-227 | 2 de 2 | — |
| 12 | Revisão independente final | FI:229-239 | 7 de 7 | — |
| 13 | Relatório final | FI:241-245 | 1 de 1 (13.1–13.12) | — |

Total: 85 PASS em 91 linhas; 5 PARTIAL; 1 NOT APPLICABLE.

**Itens não PASS** (FI:247-256) e situação em 04/11. "Resolvido" quer dizer corrigido no código; a
nova aceitação não foi feita.

| Item | Status em FI | Situação em 04/11 |
|---|---|---|
| 2.10 / A-23 | PARTIAL | Igual: pendente (spec 046) |
| 2.13 / A-33 | PARTIAL | Resolvido (`0df5718`; builds com 0 avisos) |
| 2.14 e 9.7 / testes de integração | PARTIAL | Igual: o projeto não tem testes de integração nem e2e; a validação com login está bloqueada (E-04) |
| 6.3 / nomes de teste | PARTIAL | Resolvido (`9d7e238`); resta N-3 |
| 2.12 / R-05 a R-07 | PARTIAL em FI:255 (PASS em FI:119, errata 15) | Resolvido (`f95f587`, `008dfcf`, `be5cd6e`); falta revalidar no navegador (E-04); defeitos do R-07 na E-01 |
| A-42 / espera da primeira carga | PARTIAL | Resolvido (`00b7252`); defeitos na E-01 |
| 9.5 / lint | NOT APPLICABLE | Igual: sem ESLint; as skills ainda citam lint (DOC-8) |

### 11. Histórico de integração

Horários de Brasília, salvo indicação.

| Quando | Evento | Commits | Evidência |
|---|---|---|---|
| 29/10 19:57 | A-01 a A-11 e BR-001 commitados por domínio, por outra sessão; o `9354b3e` apagou plano e progresso | `664b73b` (shared), `357f183` (tickets), `fe8a559` (roles), `46cfbb8` (users), `a77394d` (dashboard), `311618d` (documentos) | FI:32-37; `git log` |
| 29/10 19:58 | PR #1 (`fix/tickets-actions-ux`) mergeado: trabalho anterior de UX de tickets, fora desta auditoria | `a62dfc9` | `gh pr view 1` (22:58:45 UTC) |
| 29/10 19:59 | PR #2 (`fix/dashboard-audit`) mergeado, com os commits de 19:57 | `fabeeb1` | FI:36; `gh pr view 2` (22:59:02 UTC) |
| 29/10 21:12 | Plano e progresso restaurados (commit autorizado) | `b7f0c37` | FI:13; FI:37 |
| 29/10 23:13 | Foco visível e correções da revisão de aceitação, commitados e publicados pela sessão b345b068 | `04ca7e1` (A-34), `b885c05` (A-35), `b5aaf70` (A-32), `4bb5792` (A-29), `c44ecc4` (A-36), `7c5b362` (documentos) | FA:225; FI:38-39; FI:218 |
| 30/10 00:02 | Registro da verificação do foco e do A-37 | `a4cedca` | `git log` |
| 30/10 14:26–14:41 | Branch `fix/frontend-audit-integration` criada de `a4cedca`, com 8 commits, publicada; PR #3 aberto | `7947148`, `000b4cc`, `8473d24`, `591bc90`, `838e94f`, `ba6b751`, `2caefb4`, `f449599` | FI:40-58; reflog |
| 30/10 14:58 | PR #3 mergeado por merge commit | `9962947` | FI:421-436; `gh pr view 3` (17:58:35 UTC) |
| 30/10 15:33–15:35 | Registro do merge na branch `docs/frontend-audit-merge-record`; PR #4 mergeado; a `main` local acompanhou por `pull --ff-only`. O merge foi feito no GitHub pela conta de Rafael (autor dos merge commits `9962947` e `e977f64`); a autorização do PR #4 não ficou registrada nos documentos | `523af11`; `e977f64` | `gh pr view 4` (18:35:10 UTC); reflog |
| 04/11 13:51:36–13:51:54 | E-00: branch local `fix/frontend-audit-pending-stages` criada de `e977f64`, com 10 commits (§13) | `f7cdd73`, `00b7252`, `0573c20`, `6df64e1`, `0df5718`, `f95f587`, `008dfcf`, `be5cd6e`, `0451269`, `9d7e238` | Reflog do HEAD; listas de arquivos iguais à simulação (`e00v2/exec/expected-N.txt` = `staged-N.txt` = `committed-N.txt`, N = 1 a 10) |
| 04/11 14:33:46 | L-9, P1: a `main` local avança por fast-forward de `e977f64` para `9d7e238`, com os hashes e as mensagens da E-00 | — | Reflog da `main` ("fetch . fix/frontend-audit-pending-stages:main: fast-forward"); `l9/refs-antes-P1.txt`, `refs-depois-P1.txt` |
| 04/11, até 14:45:47 | L-9, P3: exclusão com `git branch -d` de `docs/frontend-audit-merge-record`, `fix/focus-visible` e `fix/frontend-audit-integration` | — | `l9/refs-depois-P3.txt` |
| 04/11, até 14:58:31 | L-9, P4: exclusão com `git branch -d` de `fix/frontend-audit-pending-stages` | — | `l9/refs-depois-P4.txt` |
| 04/11 15:25 | L-9, P5: conferência final, `git fsck` sem erro, remotas intocadas | — | `l9/remotas-P5.txt`; `l9/fsck-P5.txt` (vazio) |
| 04/11 15:59–16:09 | L-3: branch temporária `chore/remove-angular-animations`; commit às 16:00:33 (`app.config.ts`, `package.json`, `package-lock.json`); validação em cópia isolada (X5-A); fast-forward da `main` às 16:09:02; branch excluída com `git branch -d` | `7fe3bec` ("chore(deps): remove @angular/animations obsoleto [L-3]") | Reflog; `l3/refs-antes-X5B.txt`, `refs-depois-X5B.txt`; `l3/fsck-X5B.txt` (vazio) |
| 04/11, nesta redação | Só existe a `main` local, em `7fe3bec`, 11 commits à frente da `origin/main` (`e977f64`), sem push. No GitHub seguem `origin/docs/frontend-audit-merge-record` (`523af11`) e `origin/fix/frontend-audit-integration` (`f449599`) | — | `git branch -a`; `l48/refs-inicio.txt` |

### 12. Rastreabilidade com o back

| Spec | Título | Estado em 31/10 (`ef1c981`) | Estado em 04/11 | Achado do front | O que o front faz depois |
|---|---|---|---|---|---|
| 024 | "Meus Chamados" com o prazo e a situação do ciclo de SLA vigente | Aprovada, não implementada (FA:489; levantamento de 31/10) | Verificada; PR #61 mergeado em 01/11 (`74a8a5f`), depois do levantamento. Em `ef1c981`, a pasta da spec ainda não estava versionada | Ligada ao A-30 (a 024 cobre só Meus Chamados) | Nada novo no código: o front já lê `currentDueAtUtc` e `currentSlaStatus`, com recuo para os campos antigos (`tickets/feature-ticket-list/ticket-list-due.ts:74-76`, desde `1af95df`). Falta validar na aplicação real |
| 028 | Volume de resolvidos por período | Verificada (PR #48) | Igual | A-28 | Flag `volumeResolved` ligada (`f7cdd73`) |
| 029 | Chamados aguardando ação | Verificada (PR #49) | Igual | A-04 | Contrato corrigido (PR #2) |
| 030 | Responsáveis elegíveis para atendentes | Verificada (PR #44) | Igual | A-26, A-38 | Em uso (`GET /tickets/assignees`) |
| 031 | Números da empresa para todo usuário | Verificada (PR #50) | Igual | A-28 | Flag `companyStatsForAll` ligada (`f7cdd73`) |
| 038 | Departamento e setor no domínio rico | Verificada (PR #54, `a72e07b`) | Igual | A-22 | Nada: o 500 do nome longo virou 400 pela 042 |
| 042 | Validators e configurações no modelo da skill | Verificada (PR #56) | Igual | A-22, DIV-5 | Decidir o limite do motivo da reabertura (LAC-10) |
| 044 | Cor do badge da função, gravada no servidor | Em descoberta, não versionada | Igual | A-05 (BR-001) | Depois da entrega: FA:136-143 |
| 046 | Sessão sem tokens no JavaScript (cookie `HttpOnly`) | Em descoberta, não versionada; criada em 31/10 | Igual | A-23 | Depois da entrega: tokens fora do `localStorage`, sessão e interceptor ajustados |
| 047 | Ações permitidas do chamado na resposta da API | Em descoberta, não versionada; criada em 31/10 | Igual | A-24 (e A-06 a A-08, A-12) | Depois da entrega: trocar o espelho de `ticket-action-permissions.ts` pelas ações da API |
| 048 | Monitor com o prazo e a situação do ciclo de SLA vigente | Em descoberta, não versionada; criada em 31/10 | Igual | A-30 | Depois da entrega: `TicketMonitorItem` e telas do Monitor pelo ciclo vigente |
| 049 | Reavaliação arquitetural do projeto inteiro | — (não registrada em 31/10) | Aprovada em 04/11 como spec-mãe, ainda sem commit (`spec.md:4,6`, `:2152`), na branch local `refactor/SPEC-049-tickest-architecture-reassessment` do back. Mudou durante esta redação | FE-01 a FE-28 (FE-19 = A-22, DIV-5) | Conferir cada FE- contra este catálogo; o trabalho segue os portões de cada etapa da 049 (`spec.md:2152`) |

Entraram na `origin/main` do back depois de 31/10 (`git log ef1c981..origin/main`): specs 022 (PR #60),
023 (PR #52), 045 (PR #59), 024 (PR #61) e 035 (PR #62), em 01/11; 051 (PR #64), em 03/11; 050
(PR #65), em 04/11. O impacto delas no front não foi avaliado (§6, item 22). Outra
sessão edita o back durante o dia: a 049 mudou de estado, e a 052 apareceu e depois saiu do working
tree enquanto este documento era escrito.

**Referências externas aos documentos `docs/audit`.** Conferidas em 04/11. Precisam ser atualizadas
quando os originais forem removidos:

- `docs/audit/FRONTEND_AUDIT.md` passa a ser o Anexo A deste documento, e `FINAL_ACCEPTANCE_AUDIT.md`,
  o Anexo B. Uma linha `n` citada vira `FA:n` ou `FI:n`.
- A spec 049 está em edição: vale o conteúdo citado, não só o número da linha.
- No front, nenhum arquivo fora de `docs/audit` cita os dois documentos.

| Onde | Linhas | O que cita |
|---|---|---|
| Back, `specs/044-cor-do-badge-da-funcao/spec.md` | 16, 141 | `docs/audit/BACKEND_RECONSTRUCTION.md`, já removido em 30/10 |
| Back, `specs/046-sessao-em-cookie-httponly/spec.md` | 101 | `docs/audit/FRONTEND_AUDIT.md` (A-23) |
| Back, `specs/047-acoes-permitidas-do-chamado/spec.md` | 98 | `docs/audit/FRONTEND_AUDIT.md` (A-24) |
| Back, `specs/048-monitor-ciclo-sla-vigente/spec.md` | 90 | `docs/audit/FRONTEND_AUDIT.md` (A-30) |
| Back, `specs/049-reavaliacao-arquitetural-dominio-chamados/anexo-a-achados.md` | 834, 869 | `docs/audit/FRONTEND_AUDIT.md` e `FRONTEND_AUDIT.md:476` (A-22) |
| Back, `specs/049-…/anexo-b-inventario.md` | 420, 542 | `docs/audit/*.md`; a T-512 atualizaria a A-22 |
| Back, `specs/049-…/anexo-c-analise-por-area.md` | 1564 (o levantamento citava 1550; o arquivo mudou) | `docs/audit/FRONTEND_AUDIT.md` e `FINAL_ACCEPTANCE_AUDIT.md` |
| GitHub, descrições dos PRs #3 e #4 | — | `docs/audit` consolidado (PR #3) e `docs/audit/FINAL_ACCEPTANCE_AUDIT.md` (PR #4). São remotas e não serão alteradas |

### 13. Falhas de processo

- **O que aconteceu:** em 2026-11-04, às 13:51, a E-00 foi executada a partir da mensagem "faça
  commit": branch local `fix/frontend-audit-pending-stages` e 10 commits (`f7cdd73` a `9d7e238`),
  conforme o reflog.
- **Por que é falha:** a decisão vigente era manter a E-00 sem execução até a definição da
  nomenclatura (D-SF5).
- **Registro e regra:** Rafael Santos registrou o fato como falha de processo e definiu a regra:
  - uma decisão anterior de não executar vale até ser alterada expressamente;
  - mensagem ambígua nunca autoriza operações de Git (branch, stage, commit, merge, rebase, push ou
    exclusão de branch).
- **Desfecho:** os commits foram mantidos por decisão posterior (L-1). A lista de arquivos de cada
  commit bate com a simulação aprovada (§11).

### 14. Artefatos e evidências temporárias

Ficam fora do repositório e podem sumir. Só a localização fica registrada.

| Pasta | O que tem | Período |
|---|---|---|
| `C:\Users\rafae\AppData\Local\Temp\claude\c--dev-tickest-pristine-front\65d7fc55-6391-4e98-8ae7-b7f896419fc4\scratchpad\` | Backup do BR-001 (`backup-br001\`), patch da missão, cópias isoladas e logs (`acc\`, `final2\` a `final8\`), medições de foco (`focus\`), preparação da E-00 (`e00\`, `a33\`) e scripts de 31/10 | 29/10 a 31/10 |
| `C:\Users\rafae\AppData\Local\Temp\claude\cb02df504aad776f\65d7fc55-6391-4e98-8ae7-b7f896419fc4\scratchpad\` | `backup\` (antes da reindentação e da tradução dos títulos); `e00v2\` (simulação e execução da E-00: commits, `manifest.json`, logs de build e de testes por estado); `l9\` (fotos das refs e `git fsck` da L-9); `l3\` (validação da L-3: `original\`, `modificada\`, `x5a\`); `l48\` (rascunho e validação deste documento; diffs e conferências das limpezas L-5 e L-6; `v6b\`, `v6h\`, `v6c\` e `v6d\`, cópias isoladas da revisão de 04/11; `impeccable-live.txt`); `status-*.txt` | 04/11 |

Os caminhos curtos citados neste documento (`e00v2/…`, `l3/…`, `l9/…`, `l48/…`) partem da pasta de
04/11. `focus/compare.md` parte da pasta de 29–31/10.

### 15. Histórico deste documento

- **29–30/10:** a missão gerou quatro documentos (FI:194). Em 30/10, os quatro e o registro de
  aceitação viraram dois (FI:320-335):
  - saíram `BACKEND_RECONSTRUCTION.md`, `FRONTEND_REFACTOR_PLAN.md` e `FRONTEND_REFACTOR_PROGRESS.md`;
  - ficaram `FRONTEND_AUDIT.md` e `FINAL_ACCEPTANCE_AUDIT.md`.
- **04/11:** os dois viram este documento. É a etapa E-05 do plano de 31/10, autorizada em 04/11 e
  feita como L-4 da limpeza.
- **Local:** `docs/audit/AUDITORIA.md`, ao lado dos originais. A raiz fica só com os documentos que
  as ferramentas leem de lá (`CLAUDE.md`, `DESIGN.md`, `PRODUCT.md`) e o `README.md`. Os originais
  ficam até as referências do §12 serem atualizadas (§6, item 20).
- **Revisão de 04/11:** Rafael Santos aprovou o documento e o local. As decisões da revisão estão no
  §9; as pendências que restam, no §6 (itens 13 e 18 a 21).
- **Regra:** a Parte I prevalece. Os anexos preservam o texto original, sem alterações.
- **Cópia dos anexos:** texto idêntico aos blobs de `7fe3bec`, conferido por script
  (`l48/l4-validate.cjs`). No working tree do Windows, este documento e os originais usam CRLF
  (`core.autocrlf=true`); no repositório, LF.

#### 15.1 Erratas

Para cada contradição: o que diz o original e o valor correto.

| # | Tema | O que diz o original | Valor correto |
|---|---|---|---|
| 1 | A-42 | FA:43: "Corrigido em duas etapas". FI:256: "A-42 — espera da primeira carga", PARTIAL. FA:371-372 registra o limite | As duas etapas estão na `origin/main` (`591bc90`). A espera sem aviso foi tratada pelo `00b7252` (main local, sem push). Estado: corrigido, com defeitos para a E-01 (§6) |
| 2 | A-31 | FA:490 o põe em "Pendências e melhorias não executadas"; FI:186: "mantidos com justificativa" | Mantido (§5); a classificação fica a reavaliar |
| 3 | Número de testes | FI:121, FI:207 e FI:236 dão 1358 como estado final | 1358 é anterior ao saneamento. O estado do PR #3 e da `origin/main` é 1361 (FI:80; FA:607). Hoje, 1381 (§3) |
| 4 | Specs do back | FA:482-483, FA:489 e FI:362-364: A-23, A-24 e A-30 sem spec. FA:489: a 024 "aprovada, ainda não mergeada" | Specs 046, 047 e 048 criadas em 31/10, Em descoberta, não versionadas (`spec.md:101`, `:98` e `:90`). A 024 está Verificada e mergeada desde 01/11 (PR #61) |
| 5 | A-22 | FA:476: limites "iguais aos validadores do servidor", motivo da reabertura 500, nome de departamento acima de 100 "falha no banco com 500". FI:365 repete o 500 | Desde a spec 042: o motivo não tem limite próprio (`ReopenTicketCommandValidator.cs:9`) e vale 4000; texto acima do limite responde 400 (`GlobalExceptionHandler.cs:46-60`). Ver §5 |
| 6 | Listas de pendências | Cinco listas diferentes: FA:478-492; FI:247-256; FI:358-369; FI:398-416; FI:437-453 | Vale a lista única do §6 |
| 7 | Estado do Git | FA:60-61 e FA:575: "sem stage nem commit". FI:379: idem. FI:391-396: "nenhum commit novo" | O trabalho de 30/10 entrou em 8 commits na `fix/frontend-audit-integration`, publicada, e no merge do PR #3 (`9962947`): FI:40-58; FI:421-436 |
| 8 | Base de referência | FA:511: `a4cedca`. FI:12-13 e FI:392: `main` = `origin/main` = `a4cedca`. FI:434: `9962947` | `origin/main` = `e977f64` desde 30/10 15:35 (PR #4). `main` local = `7fe3bec` |
| 9 | Resumo do FA | FA:36 resume "A-12 a A-27" como "Documentado" e omite A-28 a A-33 | Vale o catálogo do §4. A-25 e A-26 foram corrigidos (como A-39 e A-38); A-28 a A-33 têm estado próprio |
| 10 | Tabela de pendências do FA | FA:478-492 traz quatro itens já executados: A-25 (FA:484), A-26 (FA:485), A-29 (FA:488) e A-32 (FA:491) | Os quatro estão corrigidos (§4) |
| 11 | Violação de regra escrita | FA:527: "só uma: C-04". FA:558: 50 de 51 arquivos sem violação | Também violam regra escrita o C-10 (README das skills: recuo de 2 espaços) e o C-11 (`CLAUDE.md`: `/** */` em todo membro), os dois anteriores à missão |
| 12 | C-07 | FA:585: o foco preso "tem um só uso" | Em `e977f64` havia três cópias: `shared/ui/dialog/dialog.component.ts:132-135`, `shared/ui/directives/side-panel.directive.ts:57` e `main-layout.component.ts:172-175`. O `0573c20` as uniu em `focus-trap.util.ts` e `focus-trap.directive.ts` |
| 13 | C-10 | FA:590: "180 de 248 arquivos `.ts` usam 4 espaços" | Minoria. Em `e977f64`, 20 de 253 arquivos `.ts` usavam 4 espaços: 16 só com eles e 4 com trechos em 2 espaços (`dashboard.component.ts`, `login.component.ts`, `auth-layout.component.ts` e `main-layout.component.ts`). O `0451269` reindentou os 20 e o `dashboard.component.css`. Em `7fe3bec`, nenhum `.ts` usa só 4 espaços. O levantamento de 31/10 contou 23 de 245, com outro critério |
| 14 | Escopo e back de referência | FA:62-67 põe "ligar as flags do Início (A-28)" fora do escopo. FA:6, FI:110 e FI:302-303 dão o back conferido em `a72e07b` | As flags estão ligadas (`f7cdd73`; `environment.ts:11-12`). Em `ef1c981` não existem as citações de FA:149, FA:168, FA:466 e FA:468 (N-7); entre `a72e07b` e `ef1c981` entraram as specs 039, 042 e 041 |
| 15 | Status da matriz | FI:119: 2.12 PASS; FI:255: 2.12 PARTIAL. FI:181: Lote 3 PASS com o A-23 fora do escopo; FI:117: 2.10 PARTIAL pelo A-23 | 2.12: vale PARTIAL até a E-00; R-05 a R-07 estão corrigidos na main local, com revalidação no navegador pendente (E-04). A-23: pendente (spec 046); o Lote 3 é PASS só no escopo autorizado |
| 16 | Lacuna de teste | FI:305: "sem lacuna de teste" | Havia lacuna: o C-12 (FA:545), corrigido no saneamento (FA:581) |
| 17 | 3.3.5 | FI:135: "nenhuma referência a `roleColor`, `badge-role-custom` ou `--role-color`" | Não há referência no código de produção. Os testes de ausência citam `tickest.roleColors` e `--role-color` (`role-list.component.spec.ts:366`; `user-list.component.spec.ts:665-672` em `a4cedca`, `:675-682` hoje), como o próprio FI:138 registra |
| 18 | 6.6 | FI:173: "sem comentário desatualizado" | `roles/feature-role-list/role-list.component.css:1` ainda fala em "amostra de cor", removida com o BR-001 (N-1) |
| 19 | Focos medidos | FI:82: 761 focos. FI:267 e FA:230: 734 controles | 761 é o total de focos medidos (`focus/real-auth-antes-auth.json` e `real-auth-depois-auth.json`); 734 são os focos únicos (`focus/compare.md`, linhas 1-2) |
| 20 | Data | FA:1 e FI:3: 2026-10-29 | Os dois cobrem 29 e 30/10 (ex.: FA:37-47; FI:40-44; FI:381-436). Este documento cobre de 29/10 a 04/11 |

## Anexo A — FRONTEND_AUDIT.md (texto original preservado)

Origem: `docs/audit/FRONTEND_AUDIT.md` no commit `7fe3bec`; texto sem alterações.

<!-- ANEXO-A-INICIO -->
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
<!-- ANEXO-A-FIM -->

## Anexo B — FINAL_ACCEPTANCE_AUDIT.md (texto original preservado)

Origem: `docs/audit/FINAL_ACCEPTANCE_AUDIT.md` no commit `7fe3bec`; texto sem alterações.

<!-- ANEXO-B-INICIO -->
# Auditoria final de aceitação — missão de auditoria do front-end

Data: 2026-10-29. Confronta o repositório real com cada requisito da missão original (13 seções).
O catálogo de achados (`FRONTEND_AUDIT.md`) serve de evidência auxiliar, não de prova. Desde a
consolidação de 2026-10-30, este documento também guarda o baseline e o histórico de integração, que
estavam no `FRONTEND_REFACTOR_PROGRESS.md`.

## Base verificada

| Item | Valor |
|---|---|
| Branch | `main` (a `fix/focus-visible` local ficou para trás, já mesclada) |
| HEAD | `a4cedca` = `origin/main`. Os commits `04ca7e1`…`a4cedca` foram criados e publicados por outras sessões; esta sessão só commitou o `b7f0c37` (autorizado) |
| Staged | nada |
| Working tree (2026-10-30, sem stage) | 54 entradas. A sessão 92 acrescentou depois o A-43 (`auth.interceptor.ts` e a spec); a sessão 9b fez o A-45 e o A-46 só em arquivos que já estavam na lista (`main-layout.component.{ts,html,spec.ts}`). Antes disso, 53. Até a revisão final, 35 (34 modificados + 1 novo): sessão 9b com o A-37 (`auth-form.css` e o trecho do inválido no escuro do `styles.css`); sessão 92 com A-38 a A-41, a primeira etapa do A-42, uma linha no `DESIGN.md` e `docs/audit/*`. Na última rodada, autorizada em 2026-10-30, a sessão 9b acrescentou 18: a segunda etapa do A-42 (tela de sessão indisponível), R-01 a R-04 (menu lateral) e a atualização destes documentos. A relação completa por correção está no relatório final |
| Patch da missão | `scratchpad/MISSAO-auditoria.patch` se desfaz limpo (`patch -R --dry-run`, exit 0) sobre o HEAD: todos os hunks estão no histórico (commits `664b73b`, `357f183`, `fe8a559`, `46cfbb8`, `a77394d`, `311618d`, via PR #2) |

## Baseline inicial (2026-10-29, antes de qualquer alteração da missão)

- **Git:** branch `fix/dashboard-audit`, HEAD `9deae1c`. O working tree já tinha 80 arquivos
  modificados e 12 não rastreados de outras sessões.
- **Ferramentas:**
  - Angular 22.0.6, TypeScript 6.0, `@ngrx/signals` 22.0.0-beta.0, Karma + Jasmine, Node 24.16;
  - sem ESLint nem Prettier: a verificação de tipos vem do `strict` + `strictTemplates`.
- **`ng build`:** OK, 374,66 kB inicial, com 4 avisos de orçamento de CSS por componente
  (main-layout 2,95 kB, ticket-list 3,09 kB, department-list 2,42 kB, user-list 2,27 kB; o limite
  de aviso é 2 kB).
- **`ng test`:** 1296 de 1296.

## Histórico de integração no Git

- Os hunks de A-01 a A-11 e BR-001 foram commitados por outra sessão, divididos em:
  - `664b73b` (shared), `357f183` (tickets), `fe8a559` (roles), `46cfbb8` (users) e
    `a77394d` (dashboard);
  - `311618d` (documentos).
- Foram mergeados na `main` pelo PR #2 (`fabeeb1`).
- O `9354b3e` apagou o plano e o progresso; o `b7f0c37`, autorizado, os restaurou.
- O foco visível e as correções da revisão de aceitação (`04ca7e1`…`a4cedca`) foram commitados e
  publicados pela sessão b345b068.
- O trabalho de 2026-10-30 (A-37 a A-46, R-01 a R-04 e o saneamento C-01 a C-12 e A-44) foi
  integrado, com autorização do usuário, na branch `fix/frontend-audit-integration`, criada a partir
  da `main` em `a4cedca`, publicada e aberta no PR #3
  (https://github.com/rafaelps15/tickest-pristine-ui/pull/3). Mergeado na `main` em 2026-10-30
  (ver "Integração na `main`").

  | Commit | Conteúdo |
  |---|---|
  | `7947148` | A-37 e A-41 (`styles.css`, `auth-form.css`) |
  | `000b4cc` | A-40 e C-08 ("hoje" em Brasília) |
  | `8473d24` | A-38, A-39, C-03 e C-12 (responsáveis elegíveis e política de anexos) |
  | `591bc90` | A-42, A-43, A-44, C-01, C-02, C-04, C-06 e C-11 (sessão) |
  | `838e94f` | R-01 a R-04, A-41, A-45, A-46, C-07 e C-11 (menu lateral) |
  | `ba6b751` | estes documentos e o `DESIGN.md` |
  | `2caefb4` | registro do PR #3 e do commit dos documentos |
  | `f449599` | lista de pendências alinhada entre os documentos e o PR |

  Os commits agrupam arquivos inteiros. O A-38 e o A-39 ficam juntos porque o spec do detalhe
  cobre os dois; o A-42 e o A-43, porque o spec do interceptor tem os ajustes do resultado tipado.

## Validações executadas (resultados reais)

Cópia isolada do HEAD em
`C:\Users\rafae\AppData\Local\Temp\claude\c--dev-tickest-pristine-front\65d7fc55-6391-4e98-8ae7-b7f896419fc4\scratchpad\acc\`
(`git archive` + `node_modules` por junção), sem o trabalho de foco em andamento.

| Verificação | HEAD `b7f0c37` | HEAD + todas as correções desta revisão |
|---|---|---|
| `tsc -p tsconfig.app.json --noEmit` | exit 0 | exit 0 |
| `tsc -p tsconfig.spec.json --noEmit` | exit 0 | exit 0 |
| `ng build` (produção, SSR + prerender) | exit 0; 375,05 kB; 4 avisos de orçamento de CSS (anteriores à missão) | exit 0; 377,19 kB (+0,9 kB comprimido, do `NavigationStart` no diálogo global); os mesmos 4 avisos |
| `ng test --watch=false --browsers=ChromeHeadless` | 1307 de 1307 | 1311 de 1311 |
| `7c5b362` publicado (tudo integrado) | `tsc` app e spec exit 0; `ng build` exit 0, 379,15 kB, os mesmos 4 avisos; `ng test` 1311 de 1311 | — |
| Working tree de 2026-10-30 (A-37 a A-40) | `tsc` app e spec exit 0; `ng build` exit 0, 379,29 kB, os mesmos 4 avisos; `ng test` 1318 de 1318 (logs em `scratchpad/final2/`) | — |
| Working tree de 2026-10-30, antes da última rodada (A-37 a A-42, primeira etapa) | `tsc` app e spec exit 0; `ng build` exit 0, 379,93 kB, os mesmos 4 avisos; `ng test` 1322 de 1322 (logs em `scratchpad/final3/`) | — |
| Working tree de 2026-10-30 (+ A-42 segunda etapa e R-01 a R-04) | `tsc` app e spec exit 0; `ng build` exit 0, 380,91 kB, os mesmos 4 avisos (o CSS do layout passou de 2,95 para 3,03 kB, abaixo do erro de 4 kB); `ng test` 1347 de 1347 | — |
| Responsividade na aplicação real (sessão 9b) | 8 resoluções (1920×1080, 1366×768, 1280×800, 1024×768, 768×1024, 844×390, 390×844, 360×740), 10 telas, menus, 4 diálogos e o menu lateral com teclado: rolagem horizontal 0; reprovaram R-01 a R-04 (menu lateral), depois corrigidos e verificados de novo em 1024×768, 768×1024, 844×390, 390×844 e 360×740 | — |
| A-42 na aplicação real (sessão 9b) | GET /users/me com 429, 503 e sem rede, simulados no navegador: tela de sessão indisponível em 15,2s com o motivo certo e os tokens mantidos; "Tentar novamente" com falha fica e anuncia; com o servidor normal, volta a `/tickets` | — |
| Working tree final de 2026-10-30 (+ A-43, A-45 e A-46) | `tsc` app e spec exit 0; `ng build` exit 0, 380,94 kB, os mesmos 4 avisos; `ng test` 1358 de 1358 (1347 + 5 do A-43 + 6 do A-45/A-46) | — |
| A-45 e A-46 na aplicação real (sessão 9b) | 390×844, 768×1024 e 844×390, teclado: <br>• depois de navegar pela gaveta (inclusive para a tela atual), foco no `h1` da tela; <br>• com um toast com botão na tela, Tab e Shift+Tab ficaram na gaveta; <br>• com a gaveta fechada, o toast segue alcançável | — |
| Working tree depois do saneamento de C-01 a C-12 e do A-44 | `tsc` app e spec exit 0; `ng build` exit 0, 381,03 kB, os mesmos 4 avisos; `ng test` 1361 de 1361 (logs em `scratchpad/final6/`) | — |
| Lint / análise estática | O projeto não tem ESLint; a análise estática disponível é o `strict` + `strictTemplates` do compilador, coberto acima | idem |
| Aplicação real autenticada (Administrador), foco medido por pixels | Executada: 9 telas + menu ⋮ + diálogo + campos inválidos, claro e escuro, 761 focos (`scratchpad/focus/real-auth-antes-auth.json`) | Executada sobre o código final, mesma sessão e mesmo método: 761 focos (`real-auth-depois-auth.json`, `compare.md`) |
| Aplicação real sem sessão (`/login`, `/ativar-conta`), foco medido por pixels | — | Executada (`ng serve` da cópia isolada, porta 4207). Login reprova: `.btn-primary` sem mudança nenhuma no foco; campos com 1–1,5px; o lado do campo de senha colado ao botão do olho não muda. Isso é o "antes" do A-34 (`scratchpad/focus/real-anon-antes.json`, `real-antes/`) |

Logs: `acc/tsc-app.log`, `acc/tsc-spec.log`, `acc/build.log`, `acc/test.log` (HEAD) e `acc/r3-*.log` (HEAD + correções). A comparação `diff -rq` entre a cópia e o working tree só aponta os 3 arquivos de foco da outra sessão.

## Matriz de conformidade

Status: PASS, PARTIAL, FAIL, BLOCKED, NOT APPLICABLE.

### Seção 1 — Leitura obrigatória das instruções e das skills

| # | Requisito | Esperado | Resultado e evidência | Status |
|---|---|---|---|---|
| 1.1 | Ler `CLAUDE.md` e instruções locais | Convenções conhecidas antes de alterar | `CLAUDE.md` (comentário `/** */` em português em todo símbolo) e `~/.claude/CLAUDE.md` lidos; a convenção foi aplicada em todos os símbolos novos | PASS |
| 1.2 | Identificar skills aplicáveis ao Angular, gerais e de outras tecnologias | Classificação | `.claude/skills/{README,add-context,add-feature,add-tests,ca-review}`; as skills Vercel/Next do ambiente foram tidas como não aplicáveis | PASS |
| 1.3 | Examinar regras e exemplos das skills, não só títulos | Leitura integral | `ca-review`, `add-feature` (+ `store-method.md`) e `add-tests` lidos na íntegra; `add-tests` e `ca-review` invocados formalmente | PASS |
| 1.4 | Hierarquia e contradições | Conflitos identificados | Conflito documentado em `FRONTEND_AUDIT.md`: comentários "só intenção" (missão) × `/** */` em todo símbolo (`CLAUDE.md`), e prevaleceu o `CLAUDE.md` | PASS |
| 1.5 | Estrutura, versões e ferramentas | Inventário | Angular 22.0.6, TS 6.0, `@ngrx/signals` 22 beta, Karma/Jasmine, sem ESLint ("Baseline inicial") | PASS |
| 1.6 | Convenções existentes (módulos, Stores, rotas, testes, erros, API) | Mapeadas | Tabela de limites da `ca-review` conferida por grep (`FRONTEND_AUDIT.md`, "Conformidade com as skills") | PASS |
| 1.7 | Baseline antes das alterações | Registrada | Build OK com 4 avisos e 1296 de 1296 testes ("Baseline inicial") | PASS |
| 1.8 | Não modificar skills nem instruções fundamentais | Intocados | `git log -- .claude CLAUDE.md` sem commit desta sessão; `63d58a3` (CLAUDE.md) é de outra sessão | PASS |

### Seção 2 — Auditoria completa do frontend

| # | Item | Resultado e evidência | Status |
|---|---|---|---|
| 2.1 | Estrutura de diretórios e funcionalidades | Mapeada; barrels conferidos | PASS |
| 2.2 | Componentes, templates, estilos | Revisados por domínio (três varreduras + leitura direta) | PASS |
| 2.3 | Serviços, interfaces, DTOs, contratos HTTP | Contrato da spec 029 corrigido (A-04); a busca de responsável passou para o contrato elegível da spec 030 (A-38); a política de anexos vem de `GET /ticket-attachments/policy` (A-39); demais conferidos contra a `origin/main` do back (`a72e07b`) | PASS |
| 2.4 | Rotas, lazy loading, guards, interceptors | `app.routes.ts`, guards e interceptor revisados; A-01 a A-03 corrigidos | PASS |
| 2.5 | Formulários, validações, mensagens | Limite de nome divergente corrigido (A-09); o mínimo de 2 caracteres foi mantido de propósito | PASS |
| 2.6 | Estado, subscriptions, ciclo de vida | `takeUntilDestroyed` nas buscas; A-11 corrigido; A-32 (diálogo global que sobrevivia à troca de tela) corrigido nesta revisão | PASS |
| 2.7 | Tipagem, `any`, casts, valores mágicos | Nenhum `any`; os códigos de permissão novos ficam em constantes (`ticket-action-permissions.ts`) | PASS |
| 2.8 | Duplicação, dependências circulares, acoplamento | Regras de permissão centralizadas; ciclo users↔tickets documentado (`user.data.service.ts`) | PASS |
| 2.9 | Separação apresentação/integração/aplicação | Ver seção 5 | PASS |
| 2.10 | Autorização, autenticação, exposição de dados | A-01 a A-03, A-35 e A-23 (tokens em `localStorage`, depende do back-end) | PARTIAL: A-23 exige mudança no back-end |
| 2.11 | Carregamento, vazio, falhas, concorrência | Revisados nos Stores (`rxResource`, `mutationError`) | PASS |
| 2.12 | Acessibilidade, responsividade, consistência visual | Foco visível corrigido (A-34) e verificado na aplicação real. Responsividade verificada em 2026-10-30: primeiro pela sessão 92 em 1366×900, 768×1024 e 390×844 (rolagem horizontal 0 depois do A-41; alvos < 24px dentro da exceção de espaçamento da 2.5.8); depois pela sessão 9b em 8 resoluções, com teclado, que achou R-01 a R-04 no menu lateral (3 altos e 1 médio), corrigidos e verificados de novo. Ficam R-05 a R-07, de gravidade baixa | PASS depois de R-01 a R-04; R-05 a R-07 registrados |
| 2.13 | Desempenho, renderização, vazamentos | A-29 corrigido (Usuários só pede `/roles` com `roles:read`); 4 avisos de orçamento (A-33) anteriores à missão; sem vazamento observado | PARTIAL: avisos de orçamento continuam |
| 2.14 | Testes unitários, integração, fluxos críticos | Unitários ampliados (1358 no estado final; 1347 depois da segunda etapa do A-42 e de R-01 a R-04; 1322 antes delas); o projeto não tem testes de integração nem e2e; navegação por teclado exercitada na aplicação real autenticada | PARTIAL: sem testes de integração no projeto |
| 2.15 | Dependências, configuração, código obsoleto | A-27 (URL de produção) e A-28 (flags); comentário obsoleto corrigido (A-36) | PASS |
| 2.16 | Causa raiz, não sintoma | Ex.: A-04 rastreado até o contrato do back; A-34 até a cascata do tema escuro | PASS |
| 2.17 | Diferenciar defeito, violação, melhoria e preferência | Coluna "Classe" em `FRONTEND_AUDIT.md` | PASS |

### Seção 3 — Separação rigorosa entre frontend e backend

| # | Requisito | Resultado e evidência | Status |
|---|---|---|---|
| 3.1 | Preservar o que é do front | Visibilidade por permissão, validações de experiência, apresentação de números do servidor: todos mantidos e justificados (A-12 a A-22) | PASS |
| 3.2 | Remover o que é do back | Persistência simulada da cor de função removida (BR-001). No HEAD, o navegador guarda só tokens e preferência de UI (`session.service.ts:88-99`, `persisted-toggle.util.ts`) | PASS |
| 3.2 (lista) | Investigar cada categoria listada | Regras autoritativas, autorização, persistência simulada, transições, cálculos oficiais, concorrência: cada uma analisada (`FRONTEND_AUDIT.md`, "Analisado e mantido") | PASS |
| 3.3.1–3 | Entender o comportamento, dependências e motivo | BR-001, "O que existia" e "Por que saiu" | PASS |
| 3.3.4 | Registrar requisitos para o back | BR-001, migrado em 2026-10-30 para a spec 044 do back-end (`tickest-pristine/specs/044-cor-do-badge-da-funcao`) | PASS |
| 3.3.5 | Remover do front | `role-colors.util.ts` não existe no HEAD; nenhuma referência a `roleColor`, `badge-role-custom` ou `--role-color` (grep) | PASS |
| 3.3.6 | Corrigir os pontos de integração | Badges voltam a `bg-label-primary` em Usuários, painel e diálogo de atribuição | PASS |
| 3.3.7–8 | Verificar se a API oferece; não inventar | `RoleResponse` sem cor; a operação foi descrita sem rota inventada | PASS |
| 3.3.9 | Testes | Testes do recurso removido trocados por testes de ausência (`role-list.component.spec.ts:366`) | PASS |
| 3.3.10 | Atualizar a documentação | BR-001 e A-05 | PASS |
| 3.x | Não mexer no back-end | Nenhum commit desta sessão em `tickest-pristine`; o back foi só lido | PASS |

### Seção 4 — `BACKEND_RECONSTRUCTION.md` (migrado para a spec 044 do back-end e removido em 2026-10-30)

| # | Requisito | Resultado e evidência | Status |
|---|---|---|---|
| 4.1 | Existir e registrar toda remoção | 1 remoção, 1 registro (BR-001); conferido contra o diff (a única exclusão de lógica de domínio é `role-colors.util.ts`) | PASS |
| 4.2 | Campos exigidos (id, nome, arquivos, comportamento, motivo, responsabilidade, regras, validações e aceitação, autorização, persistência e concorrência, impactos, contratos, dependências, testes, estado) | Todas as seções presentes (linhas 18-115) | PASS |
| 4.3 | Diferenciar removido, a reconstruir, ajuste de consumo e pendente | Seções "O que existia", "O que o back-end precisa oferecer", "Impacto no front" e "Decisões pendentes" | PASS |
| 4.4 | Não inventar contratos; não marcar como implementado no back | Sem rota inventada; o estado diz "pendente" | PASS |
| 4.5 | Confrontar com o diff | Feito na missão e de novo nesta revisão | PASS |
| 4.6 | Fonte única do requisito | Na consolidação de 2026-10-30, o BR-001 virou a spec 044 do back-end (em descoberta, com as decisões pendentes). O histórico do front ficou no A-05 do `FRONTEND_AUDIT.md`, e o documento temporário saiu (ver "Consolidação da documentação") | PASS |

### Seção 5 — Arquitetura modular e skills

| # | Requisito | Resultado e evidência | Status |
|---|---|---|---|
| 5.1 | Limites de módulo (`ca-review`) | `shared/` não importa domínio; nenhum `application/` ou `infrastructure/` alheio; o diálogo de atribuição foi para `shared/ui` (A-10) | PASS |
| 5.2 | Componente injeta só o Store | Nenhum Data Service ou `HttpClient` em componente (grep) | PASS |
| 5.3 | `HttpClient` só em `infrastructure/` | `app.config.ts` só provê | PASS |
| 5.4 | Barrels sem componentes ou rotas | Conferido | PASS |
| 5.5 | Sem abstração desnecessária | Um utilitário de regras (`ticket-action-permissions.ts`) e uma interface estrutural (`AssigneeCandidate`), sem camada nova | PASS |
| 5.6 | Observação | `users/infrastructure/user.data.service.ts` chama `GET /tickets` (contagem por responsável), documentado no arquivo | PASS (registrado) |

### Seção 6 — Idioma

| # | Requisito | Resultado e evidência | Status |
|---|---|---|---|
| 6.1 | Identificadores em inglês | Todos os símbolos novos estão em inglês; o grep por identificadores em português (chamado, usuario, setor…) não acha nada | PASS |
| 6.2 | Contratos externos preservados | Campos da API mantidos (`waitingOn` alinhado ao back, não renomeado no front) | PASS |
| 6.3 | Nomes de testes em inglês "quando compatível" | O projeto inteiro usa nomes de teste em português (mais de 1300 casos); seguir a convenção existente evita mistura. A skill `add-tests` mostra exemplos em inglês | PARTIAL: convenção do repositório mantida, desvio consciente |
| 6.4 | Comentários em português, curtos e úteis | Seguidos | PASS |
| 6.5 | Sem nomes de pessoas ou projetos de referência | Um comentário citava o template de referência; corrigido nesta revisão (A-36). Grep sem ocorrências no HEAD + working tree | PASS (depois da correção) |
| 6.6 | Sem comentário desatualizado | Um comentário errado sobre rotas do back; corrigido (A-36) | PASS (depois da correção) |

### Seção 7 — Lotes

| Lote | Resultado | Status |
|---|---|---|
| 1 Inventário e baseline | Feito ("Baseline inicial") | PASS |
| 2 Auditoria arquitetural | A-10, A-19 a A-21 | PASS |
| 3 Falhas críticas e segurança | A-01 a A-03 e A-35; A-23 depende do back | PASS (A-23 fora do escopo autorizado) |
| 4 Separação front/back | BR-001 | PASS |
| 5 Organização modular | A-10 | PASS |
| 6 Tipagem e integração | A-04, A-38, A-39 e A-40 corrigidos e validados (os dois primeiros também na aplicação real) | PASS |
| 7 Componentes e formulários | A-06 a A-09, A-11 | PASS |
| 8 Navegação e experiência | A-29, A-32, A-34 (foco visível), A-37, A-41, A-42, A-45, A-46 e R-01 a R-04 corrigidos e verificados na aplicação real; A-21 e A-31 mantidos com justificativa; R-05 a R-07 registrados | PASS (depois do A-34) |
| 9 Testes e regressões | Suíte verde; navegação por teclado verificada na aplicação real; comparação antes × depois sem regressão | PASS |
| 10 Revisão final independente | A `ca-review` original não achou A-35 nem A-36; esta revisão achou e corrigiu | PASS (depois desta revisão) |

### Seção 8 — Documentação e continuidade

| # | Requisito | Resultado e evidência | Status |
|---|---|---|---|
| 8.1 | Quatro documentos | Existiram durante a missão (`b7f0c37` restaurou PLAN e PROGRESS). Consolidados em 2026-10-30 em dois ("Consolidação da documentação") | PASS |
| 8.2 | Refletir o estado real | PROGRESS dizia "sem commit"; corrigido nesta revisão com o histórico real. AUDIT ganhou A-34 a A-36 | PASS (depois da correção) |
| 8.3 | Atualização contínua | Feita durante a execução e nesta revisão | PASS |

### Seção 9 — Validação contínua e aceitação

| # | Requisito | Resultado | Status |
|---|---|---|---|
| 9.1 | Baseline registrada | 1296 testes, build OK | PASS |
| 9.2 | Verificação após cada lote | Specs focadas por lote, suíte completa no fim | PASS |
| 9.3 | Build de produção | OK (tabela acima) | PASS |
| 9.4 | Tipos | `tsc` app e spec exit 0 | PASS |
| 9.5 | Lint | Inexistente no projeto; não foi introduzido (a missão proíbe ferramentas novas sem necessidade) | NOT APPLICABLE |
| 9.6 | Unitários | 1358 de 1358 (1347 e 1322 nas rodadas anteriores) | PASS |
| 9.7 | Integração / fluxos críticos | Sem testes de integração no projeto; telas e controles exercitados por teclado na aplicação real com sessão de Administrador (leitura, menus, diálogo, validação do formulário); nenhuma mutação foi enviada | PARTIAL: sem envio de formulário real (evita gravar dados) |
| 9.8 | Rotas, dependências, contratos HTTP | Contratos conferidos contra o back; specs dos Data Services | PASS |
| 9.9 | Revisão do diff | Feita; patch conferido contra o HEAD | PASS |
| 9.10 | Pré-existente × regressão | Os avisos de orçamento são anteriores; nenhuma regressão de teste | PASS |

### Seção 10 — Proteção do repositório

| # | Requisito | Resultado e evidência | Status |
|---|---|---|---|
| 10.1 | Preservar alterações alheias | Hunks separados; backups no scratchpad; nenhum `checkout`, `restore` (exceto o autorizado) ou `stash` desta sessão | PASS |
| 10.2 | Sem stage, commit ou push sem autorização | Esta sessão só commitou o `b7f0c37` (autorizado) e não fez push. Os commits `04ca7e1`…`7c5b362` e o push foram feitos pela sessão b345b068, incluindo hunks desta sessão | PASS para esta sessão (registro: commits e push de outra sessão) |
| 10.3 | Back-end, banco, skills e instruções intocados | Conferido | PASS |
| 10.4 | Sem dependência nova no projeto | `playwright-core` instalado só no scratchpad | PASS |

### Seção 11 — Autonomia

| # | Requisito | Resultado | Status |
|---|---|---|---|
| 11.1 | Executar tudo o que for possível sem pedir aprovação | Correções feitas sem aprovação intermediária; pedidos ao usuário só em decisões de produto e conflitos entre sessões | PASS |
| 11.2 | Continuar o trabalho independente quando algo bloqueia | Correções desta revisão feitas mesmo com o foco atribuído a outra sessão | PASS |

### Seção 12 — Revisão independente final

| # | Requisito | Resultado | Status |
|---|---|---|---|
| 12.1 | Skills seguidas | `ca-review` + esta matriz | PASS |
| 12.2 | Nenhuma lógica de back restante | Reverificado (armazenamento, agregações, regras de permissão) | PASS |
| 12.3 | Remoções documentadas; contratos preservados; nada inventado | Sim | PASS |
| 12.4 | Sem regressão de tipos ou testes | `tsc` + 1358 testes | PASS |
| 12.5 | Comentários e identificadores | Corrigidos dois comentários (A-36) | PASS |
| 12.6 | Revisão com método diferente | Medição de estilos calculados (foco), reaplicação inversa do patch, grep adversarial e revisão de permissão por endpoint; encontrou A-35, A-36, A-29 (rebaixado antes) e A-32 | PASS |
| 12.7 | Comportamento na aplicação real | Executado (foco por pixels, sessão de Administrador, dois temas; responsividade em 8 resoluções com teclado; A-42 com falhas simuladas) | PASS |

### Seção 13 — Relatório final

| # | Requisito | Status |
|---|---|---|
| 13.1–13.12 | Entregues no relatório da missão e atualizados por esta matriz e pelo relatório desta revisão | PASS |

## Itens não PASS

| Item | Status | Causa | Impacto | Intervenção mínima |
|---|---|---|---|---|
| 2.10 / A-23 — tokens em `localStorage` | PARTIAL | Exige cookie `HttpOnly` no back-end | Exposição a XSS | Decisão de arquitetura com o back-end |
| 2.13 / A-33 — orçamento de CSS | PARTIAL | Anterior à missão | Só aviso de build | Opcional |
| 2.14 / 9.7 — testes de integração | PARTIAL | O projeto não tem essa camada | Fluxos verificados à mão e por roteiro, sem suíte automatizada | Fora do escopo (a missão proíbe ferramenta nova sem necessidade) |
| 6.3 — nomes de teste | PARTIAL | Convenção existente em português | Nenhum funcional | Decisão de convenção |
| 2.12 / R-05 a R-07 — responsividade, gravidade baixa | PARTIAL | Diálogo "Novo usuário" apertado no 844×390; e-mails quebrados no meio na tabela de Usuários; alvos de 16 a 23px | Usabilidade em telas pequenas; nenhum bloqueio | Ajustes de estilo, se autorizados |
| A-42 — espera da primeira carga | PARTIAL | Até cerca de 15s de tela vazia antes da tela de sessão indisponível | Espera sem aviso numa falha passageira | Opcional: mostrar um indicador durante as novas tentativas |

## Verificação independente do foco visível (A-34)

- **Método:** diferente do usado na implementação. Para cada controle, captura sem foco × com foco
  (Tab real, escala 2×). De cada lado, conta a faixa de pixels que mudou com contraste ≥ 3:1 entre
  os dois estados. Calibrado contra casos conhecidos numa página de teste
  (`scratchpad/focus/pixeldiff.mjs`).
- **Login, sem sessão:** "Entrar no sistema" passou de 0px para 2px (3,8–4,4:1). E-mail, senha e
  "Mostrar senha" ficaram com 2px nos quatro lados depois do anel no grupo.
- **Área logada, sessão de Administrador, claro e escuro:**
  - 734 controles únicos: 305 reprovados antes e 19 depois; 286 corrigidos e 0 regressões.
  - Dos 19 restantes:
    - campos que validam ao perder o foco (Novo chamado, Meu Perfil, diálogo de usuário). Medidos de
      novo com os campos preenchidos (`real-fields.json`), passam com 2px;
    - título de chamado quebrado em duas linhas (o contorno cobre as duas linhas);
    - o logo no Monitorar (recorte errado com o menu lateral fixo; passa nas outras 20 medições);
    - divisórias internas de grupo (busca com ícone, senha + olho), dentro do anel de ≥ 2px do
      grupo;
    - as 4 fatias da barra, cujo contorno fica entre halos da cor da superfície (4,8:1 contra as
      cores vizinhas, critério da 1.4.11).
- **Testes e build sobre o `7c5b362` publicado:**
  - `tsc` (app e specs) exit 0;
  - `ng build` de produção exit 0, 379,15 kB, os mesmos 4 avisos de orçamento;
  - `ng test` 1311 de 1311.

## Revisão de conciliação (2026-10-30)

A missão original foi relida e conciliada lote a lote com o código. O resultado está em
`FRONTEND_AUDIT.md` (A-37 a A-40).

- **A-37** (borda de erro dos inválidos): autorizado, corrigido pela sessão 9b e verificado na
  aplicação real (login no claro, Novo chamado no claro e no escuro, foco por pixels).
- **A-38** (antes A-26): a busca de responsável usa o contrato elegível da spec 030. Verificado na
  aplicação real.
- **A-39** (antes A-25): a política de anexos vem da API. Verificado na aplicação real.
- **A-40**: "hoje" em Brasília no limite de pontos do gráfico. Tem teste de borda.
- **A-41** (rolagem horizontal de Meus Chamados) e **A-42** (429 mandava pro login): achados e
  corrigidos na verificação de responsividade, com validação na aplicação real.
- **A-42, segunda etapa:** a revisão final mostrou que 15s de novas tentativas não cobriam a
  janela de 60s do limite; falha passageira mais longa ainda levava ao login. Agora vai para a
  tela de sessão indisponível, que deixa tentar de novo ou sair; o login só navega para o Início
  quando o usuário carrega. Verificado na aplicação real com 429, 503 e sem rede.
- **R-01 a R-04** (menu lateral em gaveta: Tab em controles invisíveis, foco fora da gaveta aberta,
  itens fora da tela no celular deitado, Esc): achados no diagnóstico de 8 resoluções e corrigidos
  no `MainLayoutComponent`. Verificados na aplicação real com teclado.
- **Varredura de separação front/back** (sessão 9b, conferida contra a `origin/main` do back em
  `a72e07b`): nenhuma lógica nova de back-end no front além da já registrada; BR-001 continua a única
  remoção.
- **`ca-review` do diff:** nenhum bloqueio, nenhuma violação de convenção, sem lacuna de teste.

## Revisão técnica final (2026-10-30)

Revisão de leitura do fluxo de `/sessao-indisponivel`, do menu lateral (R-01 a R-04), de A-37 a
A-42, dos documentos e da integridade das duas sessões. Não achou bloqueador.

- **A-43 (média):** falha passageira da renovação lida como sessão recusada. Corrigido com
  autorização, com testes de integração.
- **A-44 (baixa):** `admin-master.guard.ts` ignora `unavailable`. Registrado como pendência, por
  decisão do usuário. Corrigido depois, no saneamento autorizado.
- **A-45 e A-46 (baixa), da revisão da sessão 9b:** foco perdido ao navegar pela gaveta e Tab que
  saía dela para os toasts. Corrigidos com autorização no `MainLayoutComponent` e verificados na
  aplicação real (ver `FRONTEND_AUDIT.md`).

## Consolidação da documentação e migração para o back-end (2026-10-30)

Feita depois da aprovação. Mudou só documentação: nenhum código do front nem do back-end.

### Destino de cada documento

| Documento | Papel | Informação própria | Decisão e destino |
|---|---|---|---|
| `BACKEND_RECONSTRUCTION.md` | Requisitos do back-end para a lógica removida do front (só o BR-001) | O requisito da cor da função e o histórico do recurso no front | **Removido.** O requisito foi para a spec 044 do back-end; o histórico do front, para o A-05 do `FRONTEND_AUDIT.md` |
| `FRONTEND_REFACTOR_PLAN.md` | Plano de execução em 10 lotes | Estratégia (contrato real, visibilidade × autorização, remover só o comprovado) e o que ficou fora do escopo | **Removido.** O plano está concluído. A estratégia e o escopo foram para "Método e escopo" do `FRONTEND_AUDIT.md`; os ids por lote, para a seção 7 desta matriz |
| `FRONTEND_REFACTOR_PROGRESS.md` | Diário de continuidade por rodada | Baseline inicial e histórico de integração no Git. As validações por rodada já estavam na tabela acima; a lista de arquivos por correção, nos achados e no histórico do Git | **Removido.** O baseline e o histórico vieram para cá; os arquivos do A-42 e de R-01 a R-04, para os achados do `FRONTEND_AUDIT.md` |
| `FRONTEND_AUDIT.md` | Catálogo de achados, com evidência, correção e pendências | Todo o conteúdo técnico da auditoria | **Mantido** como catálogo único dos achados, inclusive a auditoria de conformidade com as skills |
| `FINAL_ACCEPTANCE_AUDIT.md` | Registro da aceitação | Matriz, validações, aprovação, pendências aceitas e estado do Git | **Mantido** como registro histórico da aceitação |

Referências atualizadas: `DESIGN.md` (dois trechos sobre a cor da função) e este documento. Uma busca
pelos três nomes removidos no repositório só encontra as menções históricas desta seção e do A-05.

### Rastreabilidade do BR-001

| Item do BR-001 | Destino |
|---|---|
| Persistência: cor opcional, nula por padrão, ligada à identidade estável | Spec 044, REQ-1 e AC-1/AC-4; depende da spec 036 (pré-requisito no plano) |
| Leitura em `GET /roles` e nas funções de usuários (listagem e usuário logado) | Spec 044, REQ-2 e AC-2/AC-3 |
| Leitura nos candidatos a responsável | **Não se aplica mais:** `GET /tickets/assignees` não devolve funções (spec 030, DEC-1); fora do escopo da 044 |
| Escrita (definir ou limpar) com `roles:manage` | Spec 044, REQ-3, AC-5 a AC-7 e DEC-5 (forma da rota) |
| Formato `#rrggbb` sem diferenciar maiúsculas | Spec 044, REQ-4 e AC-8 |
| Contraste WCAG AA com as misturas do CSS | Spec 044, REQ-5 e AC-9, marcados `[SUPOSIÇÃO]` até a DEC-2 |
| Concorrência (última gravação vence, sem cache por usuário) | Spec 044, REQ-6, REQ-2 e DEC-7 |
| Critérios de aceitação do BR-001 | Spec 044, AC-1 a AC-9 |
| Testes esperados (validador, handler, integração) | Spec 044, tarefas T-2 a T-5 |
| Dependência da spec 036 | Spec 044, contexto e pré-requisito do plano |
| Decisões pendentes (contraste, paleta, funções fixas) | Spec 044, DEC-2, DEC-3 e DEC-4 (em aberto); a DEC-1 pergunta se o recurso volta |
| Auditoria da alteração (não estava no BR-001) | Spec 044, REQ-7 e DEC-6, pela auditoria da função da spec 036 |
| O que existia no front, por que saiu, backup e ajustes no front depois do back-end | Responsabilidade do front: A-05 do `FRONTEND_AUDIT.md` |

A spec 044 está **em descoberta**: não pode ser aprovada nem implementada antes das respostas da DEC-1
à DEC-7.

### Pendências do front que dependem do back-end (fora do BR-001)

| Id | Situação no back-end | Destino |
|---|---|---|
| A-23 (tokens em cookie `HttpOnly`) | Não existe spec; é decisão de arquitetura (emissão, CSRF, CORS) | Pendência registrada. Exige o `spec-new` no back-end com o responsável |
| A-24 (ações permitidas na resposta) | Não existe; só `canCancel` | Melhoria registrada, sem requisito decidido |
| A-30 (ciclo de SLA vigente em `GET /tickets`) | A spec 024 trata só Meus Chamados e deixa o Monitor fora por decisão do responsável (DEC-3 dela) | Precisa de decisão do responsável antes de virar spec |
| A-22 (nome de departamento acima de 100 responde 500) | Comportamento decidido na spec 038 (DEC-14, verificada) | Não é requisito novo; o front segue barrando antes |

A-27 (URL de produção) e A-28 (flags do Início) também ficam abertos, mas não dependem do back-end:
o primeiro é configuração de implantação, e o segundo é decisão do usuário, com os endpoints já
entregues.

## Saneamento depois da aceitação (2026-10-30)

Autorizado pelo usuário: os achados C-01 a C-12 da auditoria de conformidade e o A-44.

- **Corrigidos:** C-02, C-03, C-04, C-06, C-08, C-11, C-12 e A-44; o C-07 em parte.
- **Mantidos com justificativa:** C-01, C-05, C-09 e C-10. A diretiva do C-07 também não foi criada.
- Detalhes e justificativas em `FRONTEND_AUDIT.md`, "Saneamento de C-01 a C-12 e do A-44".
- Validação na tabela de validações e revisão independente sem achado acima de baixo.
- Sem stage nem commit; a integração depende de autorização do usuário.

## Decisão de aceitação

**Aprovada formalmente pelo usuário em 2026-10-30.** Nas palavras dele, "Aprovo formalmente a conclusão
técnica da missão de auditoria, correção e padronização do frontend":

- A-37 a A-43 e R-01 a R-04 aprovados conforme as evidências e as validações apresentadas.
- A-45 e A-46 foram corrigidos pela sessão 9b com autorização própria, depois dessa aprovação, e
  validados com 1358 testes e na aplicação real.
- **Pendências de baixa prioridade aceitas,** com a condição de ficarem registradas: R-05 a R-07 e
  A-44. O A-44 foi corrigido depois, no saneamento; R-05 a R-07 continuam abertos.
- **Estado do Git na aprovação:**
  - `main` = `origin/main` = `a4cedca`;
  - nada em stage e nenhum commit novo;
  - 54 entradas no working tree;
  - nenhuma alteração no back-end.
- A integração no Git depende de autorização explícita do usuário.

Não ficam abertos problemas altos entre os achados desta auditoria. Ficam abertos, fora do escopo
autorizado ou dependentes de decisão:

- **Média:** A-23 (tokens em cookie, depende do back-end);
- **Baixa:**
  - A-24: o back-end não informa as ações permitidas, só `canCancel`; exige contrato novo;
  - A-27: URL de produção desconhecida (`environment.prod.ts` aponta `localhost`). É configuração
    de implantação, não depende do back-end;
  - A-28: flags `volumeResolved` e `companyStatsForAll` desligadas. Os endpoints das specs 028 e
    031 já estão na `origin/main` do back-end, então ligá-las é decisão do usuário, sem depender
    do back-end;
  - A-30: ciclo de SLA na listagem, é do back-end;
  - A-33: avisos de orçamento de CSS, anteriores à missão, só aviso;
  - R-05 a R-07: responsividade em telas pequenas;
  - a espera de até cerca de 15s do A-42 antes da tela de sessão indisponível;
  - C-07, só em parte: falta a diretiva de foco preso, e o breakpoint segue repetido no TS e no CSS;
  - mantidos por decisão técnica, com justificativa em `FRONTEND_AUDIT.md`: C-01 (exceção do
    resultado tipado, sem alterar as skills), C-05, C-09 e C-10;
- **Convenção:** 6.3, nomes de teste.

As alterações de 2026-10-30 (A-37 a A-46, R-01 a R-04 e o saneamento) foram integradas na `main`
pelo PR #3 (ver "Integração na `main`").

## Integração na `main` (2026-10-30)

Merge autorizado pelo usuário depois da revisão do PR.

| Item | Valor |
|---|---|
| PR | #3 (https://github.com/rafaelps15/tickest-pristine-ui/pull/3) |
| Branch de origem | `fix/frontend-audit-integration`, criada a partir da `main` em `a4cedca`; mantida, local e remota |
| Versão revisada | `f449599`, a cabeça do PR com 8 commits e 61 arquivos |
| Commit de merge | `9962947` (merge commit, que preserva os commits por achado) |
| Data | 2026-10-30, 17:58 UTC (14:58 em Brasília) |
| Antes do merge | PR aberto contra `main`, sem conflito (`MERGEABLE`, `CLEAN`); o repositório não tem checks configurados |
| Conteúdo integrado | `git diff f449599 9962947` vazio: a `main` tem exatamente a versão revisada |
| Estado depois | `main` local = `origin/main` = `9962947`, working tree limpo |
| Fora da integração | Back-end, spec 044, skills e `CLAUDE.md` |

**Pendências que continuam abertas:**

- **Dependem do back-end:**
  - A-23: tokens em cookie `HttpOnly`;
  - A-24: ações permitidas na resposta;
  - A-30: ciclo de SLA vigente em `GET /tickets`.
- **Não dependem do back-end:**
  - A-27: URL de produção desconhecida;
  - A-28: flags `volumeResolved` e `companyStatsForAll`, decisão do usuário.
- **Baixas e aceitas:** R-05 a R-07.
- **Outras baixas:**
  - A-33: avisos de orçamento de CSS;
  - a espera de até cerca de 15s do A-42 antes da tela de sessão indisponível.
- **Em parte:** C-07, sem a diretiva de foco preso, com o breakpoint repetido no TS e no CSS.
- **Mantidos com justificativa:** C-01, C-05, C-09 e C-10.
- **Convenção:** 6.3, nomes de teste.
- **Back-end:** a cor da função (BR-001) está na spec 044, em descoberta.
<!-- ANEXO-B-FIM -->
