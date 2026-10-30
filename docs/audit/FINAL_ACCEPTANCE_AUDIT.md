# Auditoria final de aceitação — missão de auditoria do front-end

Data: 2026-10-29. Confronta o repositório real com cada requisito da missão original (13 seções).
Os relatórios anteriores (`FRONTEND_AUDIT.md`, `FRONTEND_REFACTOR_PROGRESS.md`) servem de evidência
auxiliar, não de prova.

## Base verificada

| Item | Valor |
|---|---|
| Branch | `fix/focus-visible` |
| HEAD | `7c5b362` = `origin/main` (publicado). Os commits `04ca7e1` (foco visível), `b885c05`, `b5aaf70`, `4bb5792`, `c44ecc4` e `7c5b362` (correções e documentos desta revisão) foram criados e publicados pela **sessão b345b068**, não por esta |
| Staged | nada |
| Working tree | Só este documento, atualizado depois do commit `7c5b362` (sem stage) |
| Patch da missão | `scratchpad/MISSAO-auditoria.patch` se desfaz limpo (`patch -R --dry-run`, exit 0) sobre o HEAD: todos os hunks estão no histórico (commits `664b73b`, `357f183`, `fe8a559`, `46cfbb8`, `a77394d`, `311618d`, via PR #2) |

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
| 1.5 | Estrutura, versões e ferramentas | Inventário | Angular 22.0.6, TS 6.0, `@ngrx/signals` 22 beta, Karma/Jasmine, sem ESLint (`FRONTEND_REFACTOR_PROGRESS.md`, Lote 1) | PASS |
| 1.6 | Convenções existentes (módulos, Stores, rotas, testes, erros, API) | Mapeadas | Tabela de limites da `ca-review` conferida por grep (`FRONTEND_AUDIT.md`, "Conformidade com as skills") | PASS |
| 1.7 | Baseline antes das alterações | Registrada | Build OK com 4 avisos e 1296 de 1296 testes (`FRONTEND_REFACTOR_PROGRESS.md`, Lote 1) | PASS |
| 1.8 | Não modificar skills nem instruções fundamentais | Intocados | `git log -- .claude CLAUDE.md` sem commit desta sessão; `63d58a3` (CLAUDE.md) é de outra sessão | PASS |

### Seção 2 — Auditoria completa do frontend

| # | Item | Resultado e evidência | Status |
|---|---|---|---|
| 2.1 | Estrutura de diretórios e funcionalidades | Mapeada; barrels conferidos | PASS |
| 2.2 | Componentes, templates, estilos | Revisados por domínio (três varreduras + leitura direta) | PASS |
| 2.3 | Serviços, interfaces, DTOs, contratos HTTP | Contrato da spec 029 corrigido (A-04); demais conferidos contra a `origin/main` | PASS |
| 2.4 | Rotas, lazy loading, guards, interceptors | `app.routes.ts`, guards e interceptor revisados; A-01 a A-03 corrigidos | PASS |
| 2.5 | Formulários, validações, mensagens | Limite de nome divergente corrigido (A-09); o mínimo de 2 caracteres foi mantido de propósito | PASS |
| 2.6 | Estado, subscriptions, ciclo de vida | `takeUntilDestroyed` nas buscas; A-11 corrigido; A-32 (diálogo global que sobrevivia à troca de tela) corrigido nesta revisão | PASS |
| 2.7 | Tipagem, `any`, casts, valores mágicos | Nenhum `any`; os códigos de permissão novos ficam em constantes (`ticket-action-permissions.ts`) | PASS |
| 2.8 | Duplicação, dependências circulares, acoplamento | Regras de permissão centralizadas; ciclo users↔tickets documentado (`user.data.service.ts`) | PASS |
| 2.9 | Separação apresentação/integração/aplicação | Ver seção 5 | PASS |
| 2.10 | Autorização, autenticação, exposição de dados | A-01 a A-03, A-35 e A-23 (tokens em `localStorage`, depende do back-end) | PARTIAL: A-23 exige mudança no back-end |
| 2.11 | Carregamento, vazio, falhas, concorrência | Revisados nos Stores (`rxResource`, `mutationError`) | PASS |
| 2.12 | Acessibilidade, responsividade, consistência visual | A auditoria original não mediu o foco no navegador (A-34). O foco foi corrigido no `04ca7e1` e verificado de forma independente na aplicação real: 734 controles únicos, 305 reprovados antes e 19 depois, 0 regressões; os 19 são artefatos de medição, divisórias internas de grupo ou fatias que passam na 1.4.11, todos conferidos em captura. Responsividade fora de tela não foi verificada | PASS para foco; responsividade não verificada |
| 2.13 | Desempenho, renderização, vazamentos | A-29 corrigido (Usuários só pede `/roles` com `roles:read`); 4 avisos de orçamento (A-33) anteriores à missão; sem vazamento observado | PARTIAL: avisos de orçamento continuam |
| 2.14 | Testes unitários, integração, fluxos críticos | Unitários ampliados (1311); o projeto não tem testes de integração nem e2e; navegação por teclado exercitada na aplicação real autenticada | PARTIAL: sem testes de integração no projeto |
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
| 3.3.4 | Registrar requisitos para o back | BR-001, "O que o back-end precisa oferecer" | PASS |
| 3.3.5 | Remover do front | `role-colors.util.ts` não existe no HEAD; nenhuma referência a `roleColor`, `badge-role-custom` ou `--role-color` (grep) | PASS |
| 3.3.6 | Corrigir os pontos de integração | Badges voltam a `bg-label-primary` em Usuários, painel e diálogo de atribuição | PASS |
| 3.3.7–8 | Verificar se a API oferece; não inventar | `RoleResponse` sem cor; a operação foi descrita sem rota inventada | PASS |
| 3.3.9 | Testes | Testes do recurso removido trocados por testes de ausência (`role-list.component.spec.ts:366`) | PASS |
| 3.3.10 | Atualizar a documentação | BR-001 e A-05 | PASS |
| 3.x | Não mexer no back-end | Nenhum commit desta sessão em `tickest-pristine`; o back foi só lido | PASS |

### Seção 4 — `BACKEND_RECONSTRUCTION.md`

| # | Requisito | Resultado e evidência | Status |
|---|---|---|---|
| 4.1 | Existir e registrar toda remoção | 1 remoção, 1 registro (BR-001); conferido contra o diff (a única exclusão de lógica de domínio é `role-colors.util.ts`) | PASS |
| 4.2 | Campos exigidos (id, nome, arquivos, comportamento, motivo, responsabilidade, regras, validações e aceitação, autorização, persistência e concorrência, impactos, contratos, dependências, testes, estado) | Todas as seções presentes (linhas 18-115) | PASS |
| 4.3 | Diferenciar removido, a reconstruir, ajuste de consumo e pendente | Seções "O que existia", "O que o back-end precisa oferecer", "Impacto no front" e "Decisões pendentes" | PASS |
| 4.4 | Não inventar contratos; não marcar como implementado no back | Sem rota inventada; o estado diz "pendente" | PASS |
| 4.5 | Confrontar com o diff | Feito na missão e de novo nesta revisão | PASS |

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
| 1 Inventário e baseline | Feito | PASS |
| 2 Auditoria arquitetural | Feito | PASS |
| 3 Falhas críticas e segurança | A-01 a A-03 e A-35; A-23 depende do back | PASS (A-23 fora do escopo autorizado) |
| 4 Separação front/back | BR-001 | PASS |
| 5 Organização modular | A-10 | PASS |
| 6 Tipagem e integração | A-04 | PASS |
| 7 Componentes e formulários | A-06 a A-09, A-11 | PASS |
| 8 Navegação e experiência | Foco visível corrigido e verificado na aplicação real, nos dois temas | PASS (depois do A-34) |
| 9 Testes e regressões | Suíte verde; navegação por teclado verificada na aplicação real; comparação antes × depois sem regressão | PASS |
| 10 Revisão final independente | A `ca-review` original não achou A-35 nem A-36; esta revisão achou e corrigiu | PASS (depois desta revisão) |

### Seção 8 — Documentação e continuidade

| # | Requisito | Resultado e evidência | Status |
|---|---|---|---|
| 8.1 | Quatro documentos | Existem no HEAD (`b7f0c37` restaurou PLAN e PROGRESS) | PASS |
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
| 9.6 | Unitários | 1311 de 1311 | PASS |
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
| 12.4 | Sem regressão de tipos ou testes | `tsc` + 1311 testes | PASS |
| 12.5 | Comentários e identificadores | Corrigidos dois comentários (A-36) | PASS |
| 12.6 | Revisão com método diferente | Medição de estilos calculados (foco), reaplicação inversa do patch, grep adversarial e revisão de permissão por endpoint; encontrou A-35, A-36, A-29 (rebaixado antes) e A-32 | PASS |
| 12.7 | Comportamento na aplicação real | Executado (foco por pixels, sessão de Administrador, dois temas) | PASS |

### Seção 13 — Relatório final

| # | Requisito | Status |
|---|---|---|
| 13.1–13.12 | Entregues no relatório da missão e atualizados por esta matriz e pelo relatório desta revisão | PASS |

## Itens não PASS

| Item | Status | Causa | Impacto | Intervenção mínima |
|---|---|---|---|---|
| A-37 — borda de erro dos campos inválidos | FAIL (defeito anterior ao foco) | No escuro (área logada), `[data-bs-theme="dark"] .form-control { border-color }` vence o `.is-invalid`: borda `rgb(58, 63, 68)` em vez de vermelha (medido no Novo chamado). No login (claro), o `.form-control` do `auth-form.css`, encapsulado, faz o mesmo: borda `rgb(217, 222, 227)`. O erro continua no texto e no ícone | Consistência visual do erro; não bloqueia WCAG (o erro tem texto) | Correção de 2 hunks (`styles.css` e `auth-form.css`), descrita em `FRONTEND_AUDIT.md`. A sessão b345b068 informou que o usuário registrou o item como "sem autorização para correção neste momento"; esta sessão não pôde confirmar isso e não editou os arquivos, que estão sob responsabilidade daquela sessão |
| 2.10 / A-23 — tokens em `localStorage` | PARTIAL | Exige cookie `HttpOnly` no back-end | Exposição a XSS | Decisão de arquitetura com o back-end |
| 2.13 / A-33 — orçamento de CSS | PARTIAL | Anterior à missão | Só aviso de build | Opcional |
| 2.14 / 9.7 — testes de integração | PARTIAL | O projeto não tem essa camada | Fluxos verificados à mão e por roteiro, sem suíte automatizada | Fora do escopo (a missão proíbe ferramenta nova sem necessidade) |
| 6.3 — nomes de teste | PARTIAL | Convenção existente em português | Nenhum funcional | Decisão de convenção |

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

## Decisão de aceitação

**Dentro do escopo autorizado, a missão está concluída**, com uma ressalva explícita:

- **A-37**, a borda de erro dos campos inválidos: defeito anterior, de gravidade média, sem quebra de
  WCAG. A correção está pronta para aplicar, mas depende de autorização do usuário: segundo a outra
  sessão, o usuário o deixou para depois.

Continuam fora do escopo, por depender do back-end ou de decisão de convenção: A-23, A-33 e 6.3.

Nenhum item crítico ou alto fica aberto. Todas as correções verificáveis foram verificadas com
evidência.
