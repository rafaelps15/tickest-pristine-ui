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
  (https://github.com/rafaelps15/tickest-pristine-ui/pull/3). O merge na `main` depende de nova
  autorização.

  | Commit | Conteúdo |
  |---|---|
  | `7947148` | A-37 e A-41 (`styles.css`, `auth-form.css`) |
  | `000b4cc` | A-40 e C-08 ("hoje" em Brasília) |
  | `8473d24` | A-38, A-39, C-03 e C-12 (responsáveis elegíveis e política de anexos) |
  | `591bc90` | A-42, A-43, A-44, C-01, C-02, C-04, C-06 e C-11 (sessão) |
  | `838e94f` | R-01 a R-04, A-41, A-45, A-46, C-07 e C-11 (menu lateral) |
  | `ba6b751` | estes documentos e o `DESIGN.md` |

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
  - A-27: URL de produção, valor desconhecido;
  - A-28: flags do Início, decisão do usuário;
  - A-30: ciclo de SLA na listagem, é do back-end;
  - A-33: avisos de orçamento de CSS, anteriores à missão, só aviso;
  - R-05 a R-07: responsividade em telas pequenas;
  - a espera de até cerca de 15s do A-42 antes da tela de sessão indisponível;
  - C-07, só em parte: falta a diretiva de foco preso, e o breakpoint segue repetido no TS e no CSS;
  - mantidos por decisão técnica, com justificativa em `FRONTEND_AUDIT.md`: C-01 (exceção do
    resultado tipado, sem alterar as skills), C-05, C-09 e C-10;
- **Convenção:** 6.3, nomes de teste.

As alterações de 2026-10-30 (A-37 a A-46, R-01 a R-04 e o saneamento) estão no working tree, sem
stage nem commit, aguardando autorização para a integração.
