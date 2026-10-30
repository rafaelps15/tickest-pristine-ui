# Progresso da refatoração do front-end

Registro de continuidade da auditoria de 2026-10-29. Se a sessão for interrompida, retome pelo
último lote marcado aqui e confira o `git status` antes de confiar neste arquivo.

## Lote 1 — Inventário e baseline (concluído)

**Estado do Git no início:** branch `fix/dashboard-audit`, HEAD `9deae1c`. O working tree já
tinha 80 arquivos modificados e 12 não rastreados de outras sessões do Claude (Início, Funções,
Usuários, Departamentos, Chamados, Monitorar, `DESIGN.md`, `styles.css`, critiques do
impeccable). Duas outras sessões do front estavam ativas no mesmo working tree durante esta
auditoria. Por isso, cada edição desta missão foi feita em hunks próprios, relendo o arquivo
imediatamente antes de alterá-lo, sem stage nem commit.

**Ferramentas:** Angular 22.0.6, TypeScript 6.0, `@ngrx/signals` 22.0.0-beta.0, Karma + Jasmine,
Node 24.16. O projeto não tem ESLint nem Prettier configurados (`package.json` só tem `build`,
`test`, `watch`, `start` e o servidor SSR); a verificação de tipos vem do `ng build`
(`strict`, `strictTemplates`).

**Baseline (working tree no início, antes de qualquer alteração desta missão):**

| Verificação | Comando | Resultado |
|---|---|---|
| Build de produção (SSR + prerender) | `ng build` | OK, 374,66 kB inicial; 4 avisos de orçamento de CSS por componente (main-layout 2,95 kB, ticket-list 3,09 kB, department-list 2,42 kB, user-list 2,27 kB; limite de aviso 2 kB) |
| Testes unitários | `ng test --watch=false --browsers=ChromeHeadless` | 1296 de 1296 passando |
| Lint | — | Não existe no projeto |

Os avisos de orçamento já existiam antes da missão.

## Lotes 2 a 10 — concluídos em 2026-10-29

Auditoria por domínio (Chamados, Início, Usuários/Funções/Departamentos/shared), com cada achado
conferido no código e no back-end antes de agir. Resultado em `FRONTEND_AUDIT.md`.

### Arquivos alterados por esta missão

- **Sessão e renovação (A-01 a A-03):** `shared/services/session.service.ts` (+spec),
  `shared/services/token-refresh.service.ts` (+spec nova), `shared/interceptors/auth.interceptor.ts`
  (+spec).
- **Confirmação (A-11):** `shared/services/confirm-dialog.service.ts` (+spec).
- **Contrato da spec 029 (A-04):** `tickets/entities/ticket-dashboard.ts`,
  `tickets/entities/ticket-monitor-item.ts`, `tickets/infrastructure/ticket.data.service.ts` (+spec),
  `dashboard/dashboard.component.ts`, `tickets/feature-ticket-monitor/ticket-monitor.component.html`,
  `ticket-monitor-info-panel.component.html` e as duas specs.
- **Permissões de ação (A-06 a A-08):** `tickets/ui/ticket-action-permissions.ts` (novo, +spec),
  `tickets/feature-ticket-detail/ticket-detail.component.{ts,html,spec.ts}`,
  `tickets/feature-ticket-list/ticket-list.component.{ts,html,spec.ts}`,
  `tickets/feature-ticket-monitor/ticket-monitor.component.{ts,spec.ts}`,
  `dashboard/dashboard-insights.component.{ts,html,spec.ts}`, `dashboard/dashboard.component.{html,spec.ts}`.
- **Cor de função removida (A-05, BR-001):** excluídos `shared/utils/role-colors.util.ts` e a spec;
  `shared/index.ts`, `roles/feature-role-list/role-list.component.{ts,html,css,spec.ts}`,
  `users/feature-user-list/user-list.component.{ts,html,spec.ts}`,
  `user-list-info-panel.component.{ts,html,spec.ts}`, `user-list-guide.component.html`,
  `src/styles.css`, `DESIGN.md`.
- **Limite de nome (A-09):** `users/entities/user-profile.ts`,
  `users/feature-profile-edit/profile-edit.component.{ts,html,spec.ts}`, `user-list.component.{ts,html}`.
- **Limite de módulo (A-10):** `tickets/ui/ticket-assign-dialog/*` movido para
  `shared/ui/ticket-assign-dialog/*` (tipo `AssigneeCandidate`); imports no detalhe, no Monitorar e no
  Início; `DESIGN.md`.

Patch só com os hunks desta missão (estado no início → final, sem as alterações das outras sessões):
`C:\Users\rafae\AppData\Local\Temp\claude\c--dev-tickest-pristine-front\65d7fc55-6391-4e98-8ae7-b7f896419fc4\scratchpad\MISSAO-auditoria.patch`.
Backup do recurso de cor removido: `...\scratchpad\backup-br001\`.

### Verificações finais

| Verificação | Resultado |
|---|---|
| `ng build` (produção, SSR + prerender) | OK, 375,05 kB inicial; os mesmos 4 avisos de orçamento de CSS da baseline, nenhum novo |
| `ng test --watch=false --browsers=ChromeHeadless` (suíte completa) | 1307 de 1307 passando (baseline: 1296; saíram os testes da cor de função e entraram os novos) |
| Lint | Não existe no projeto |
| `ca-review` nos hunks da missão | Sem bloqueios: `shared` não importa domínio, nenhum import de `application`/`infrastructure` alheio, nenhuma referência antiga restante; a lacuna de teste de `ticket-action-permissions.ts` foi coberta |
| Conferência do diff × `BACKEND_RECONSTRUCTION.md` | Única remoção de lógica de back-end no diff: cor de função (BR-001). As demais exclusões de arquivo são a mudança de pasta do diálogo de atribuição |

**Não validado:** conferência visual no navegador (o `ng serve` da 4200 é compartilhado com
outras sessões, e não houve sessão autenticada nesta missão), e testes de integração e e2e (o
projeto não tem).

### Integração no Git (registrada depois)

Outra sessão do Claude commitou e mergeou o trabalho desta missão sem passar por um commit único:

- os hunks foram divididos entre `664b73b` (shared), `357f183` (tickets), `fe8a559` (roles),
  `46cfbb8` (users), `a77394d` (dashboard) e `311618d` (documentos);
- todos foram mergeados na `main` pelo PR #2 (`fabeeb1`) e publicados;
- o commit `9354b3e` apagou este arquivo e o `FRONTEND_REFACTOR_PLAN.md`;
- o `b7f0c37` (local, sem push, autorizado pelo usuário) os restaurou exatamente como estavam no
  `311618d`.

Conferência: o patch da missão (`MISSAO-auditoria.patch`) se desfaz limpo sobre o HEAD, ou seja,
todos os hunks estão no histórico.

## Revisão final de aceitação — 2026-10-29

Matriz completa em `FINAL_ACCEPTANCE_AUDIT.md`.

**Correções feitas nesta revisão** (working tree, sem stage nem commit):

- **A-35:** troca de conta em outra aba recarrega a aplicação.
  `shared/services/session.service.ts` (+2 testes).
- **A-36:** dois comentários. `tickets/application/ticket-dashboard.store.ts` e
  `shared/ui/layouts/main-layout/main-layout.component.css`.
- **A-29:** Usuários só pede `GET /roles` com `roles:read`.
  `users/feature-user-list/user-list.component.ts` (+1 teste).
- **A-32:** o diálogo de confirmação é cancelado ao trocar de tela.
  `shared/ui/confirm-dialog/confirm-dialog.component.ts` (+1 teste).
- Este arquivo e o `FRONTEND_AUDIT.md`.

**Fora desta sessão:** as alterações de foco visível (A-34) em `src/styles.css` e
`src/app/shared/ui/auth-form.css` pertencem à sessão b345b068, por decisão do usuário. Elas estão no
mesmo working tree, sem commit, e não fazem parte desta validação.

### Próximo passo

- Conferência na aplicação real, com uma conta autenticada (pendente; ver `FINAL_ACCEPTANCE_AUDIT.md`).
- Conclusão e validação do foco visível pela sessão b345b068.
- Commit das correções desta revisão, só com autorização do usuário.
