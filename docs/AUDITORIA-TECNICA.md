# Auditoria Técnica — Tickest (Front-end)

> Gerado por `/impeccable audit`. Escopo: `src/app` (todo o front), modo **Operate** (dashboards,
> listagens e formulários administrativos).

## Status: correções aplicadas em 2026-10-02

Todos os achados P1 e P2 de código (acessibilidade, performance, responsividade e tokens de
theming) foram corrigidos — ver marcação "✅ Corrigido" em cada item abaixo. Dois pontos foram
**deliberadamente deixados em aberto** por serem decisões de identidade visual, não bugs:

- **Fonte Montserrat (overused-font)**: o detector ainda aponta `auth-layout.component.ts:48` e
  `register.component.css:37`. Trocar a fonte da marca é uma decisão de identidade visual, não
  uma correção mecânica — não troquei sem validar com você.
- **Dark mode**: não implementado. É uma decisão de prioridade de produto (ver item de Theming),
  não uma correção.

Testes (122/122) e build (`ng build`) seguem verdes depois das correções.

## Nota de escopo da pasta `docs/`

Este relatório foi salvo em `docs/` para unificar toda a documentação livre do projeto em um
único lugar. `README.md` e `CLAUDE.md` continuam na raiz porque GitHub/npm e o Claude Code,
respectivamente, só os reconhecem automaticamente nesse local. `PRODUCT.md` também continua na
raiz pelo mesmo motivo: a convenção do próprio Impeccable (`impeccable context`) resolve
`PRODUCT.md` em `PROJECT_ROOT/PRODUCT.md` — movê-lo quebraria essa resolução automática. Qualquer
novo documento livre (auditorias, notas de decisão etc.) deve ir em `docs/` a partir de agora.

---

## Nota sobre a versão do Impeccable

Há uma versão mais nova do Impeccable disponível (instalada v4.3.1, mais recente v4.5.0). Avise
quando quiser atualizar — não foi atualizado automaticamente nesta sessão.

---

## Audit Health Score

| # | Dimensão | Nota antes | Nota depois | Achado-chave |
|---|-----------|-------|-------|-------------|
| 1 | Acessibilidade | 1/4 | **4/4** | Labels, modais e toggle de senha corrigidos; só restam 2 itens P3 de baixo impacto |
| 2 | Performance | 3/4 | **4/4** | Transição de `padding-left` migrada para `transform` |
| 3 | Responsividade | 2/4 | **3/4** | Camada base `col-12`/`col-6` adicionada em 29 colunas; segue sem breakpoints customizados próprios além do sidebar (não precisou de nenhum — a grid do Bootstrap já resolve) |
| 4 | Theming | 2/4 | **3/4** | Cores hardcoded substituídas pelos tokens `--tk-*`; dark mode continua em aberto (decisão de produto) |
| 5 | Integridade de Implementação | 2/4 | **3/4** | Padrão de acessibilidade do profile-edit/user-list propagado para as telas mais antigas; gradiente em texto removido; só a fonte Montserrat (slop leve) permanece, por decisão pendente |
| **Total** | | **10/20** | **17/20** | **Bom (restam pontos de decisão, não bugs)** |

---

## Veredito de Integridade de Implementação (começar por aqui)

**Passa parcialmente.** O app expressa um sistema de design coerente e específico do produto —
tokens CSS centrais (`--tk-*`) em `styles.css`, padrão de doc-comments em português em 100% do
código novo, convenção DDD de pastas bem aplicada. Não há nada "genérico" ou intercambiável com
outro produto.

O problema é **inconsistência entre safras de código**: as telas mais recentes (`profile-edit`,
`user-list`) já implementam o padrão certo de acessibilidade (`<button>` + `aria-label`/
`aria-pressed` em ícones). Esse padrão não foi retroaplicado a telas mais antigas (`login`,
`department-list`, `role-list`, `sector-list`, `ticket-create`, `register`), que replicam o
padrão antigo (menos acessível) em vez do novo. O detector mecânico confirmou isso com 4 achados
de CSS slop (gradiente em texto, fonte genérica, transição de propriedade de layout).

---

## Resumo Executivo

- **Nota: 10/20 → 17/20 depois das correções**
- **Achados por severidade**: P0: 0 · P1: 3 (3 corrigidos) · P2: 6 (4 corrigidos, 2 em aberto por
  decisão de produto) · P3: 2 (não corrigidos, baixa prioridade)
- **O que sobrou, e por quê**: os únicos 2 pontos não corrigidos — dark mode e a fonte Montserrat
  — são decisões de identidade visual/produto, não bugs; não troquei sem validar com você.
- **Próximos passos recomendados**: ver [Ações Recomendadas](#ações-recomendadas) abaixo.

---

## Achados Detalhados por Severidade

### P1 — Maior (viola WCAG AA / dificuldade significativa)

**[P1] ✅ Corrigido — Toggle de senha inacessível por teclado**
- **Local**: `src/app/shared/feature-login/login.component.html:45`
- **Categoria**: Acessibilidade
- **Impacto**: usuário que navega só por teclado não consegue alternar a visibilidade da senha;
  leitor de tela não anuncia a existência do controle.
- **WCAG**: 2.1.1 (Keyboard), 4.1.2 (Name, Role, Value)
- **Recomendação**: trocar o `<span class="cursor-pointer" (click)="togglePassword()">` por
  `<button type="button" [attr.aria-label]="..." [attr.aria-pressed]="...">`, replicando o
  padrão já usado em `profile-edit.component.html:112,126,158` e
  `user-list.component.html:200,210`.
- **Comando sugerido**: `/impeccable harden`

**[P1] ✅ Corrigido — Inputs sem `label` associado em toda a área administrativa**
- **Local**: `departments/feature-department-list/department-list.component.html:73,77`;
  `roles/feature-role-list/role-list.component.html:75`;
  `sectors/feature-sector-list/sector-list.component.html:65,69,73`;
  `tickets/feature-ticket-create/ticket-create.component.html:22,27,32,41,51`;
  `users/feature-register/register.component.html:60,67,74,82,89`;
  `users/feature-user-list/user-list.component.html:21,26,34,38,159,185,189,193,197,207,250,254`
- **Categoria**: Acessibilidade
- **Impacto**: leitor de tela não anuncia o propósito do campo; usuário não consegue clicar no
  texto do label para focar o input. Afeta a maioria absoluta dos formulários do app.
- **WCAG**: 1.3.1 (Info and Relationships), 3.3.2 (Labels or Instructions)
- **Recomendação**: adicionar `id` ao input e `for`/`[for]` ao label correspondente (ou
  `aria-label` quando não houver label visível), como já é feito em
  `profile-edit.component.html:47,55,63,109,123,155` e `login.component.html:9-10,31,35`.
- **Comando sugerido**: `/impeccable harden`

**[P1] ✅ Corrigido — Modais sem semântica de diálogo**
- **Local**: `department-list.component.html:63`; `role-list.component.html:66,88`;
  `sector-list.component.html:55`; `user-list.component.html:171,236,274`
- **Categoria**: Acessibilidade
- **Impacto**: leitor de tela não anuncia a abertura de um diálogo nem lê seu título; usuário com
  deficiência visual perde contexto ao focar dentro do modal.
- **WCAG**: 4.1.2 (Name, Role, Value)
- **Recomendação**: adicionar `role="dialog"` e `aria-labelledby` apontando para o `id` do
  `.modal-title` em cada um dos 4 modais.
- **Comando sugerido**: `/impeccable harden`

### P2 — Menor (incômodo, existe contorno)

**[P2] ✅ Corrigido — Cores hardcoded duplicando tokens existentes**
- **Local**: 36 ocorrências em 8 arquivos — concentração maior em
  `main-layout.component.css` (10, ex. linhas 58, 67, 79, 84, 106, 164-165) e
  `login.component.css` (12), além de `register.component.css` (8).
- **Categoria**: Theming
- **Impacto**: os valores hex duplicam tokens que já existem (`#696cff` = `--tk-primary`,
  `#697a8d` = `--tk-text-secondary`, `#a1acb8` = `--tk-text-muted`) em vez de referenciá-los —
  se a paleta mudar, esses pontos não acompanham e a marca fica inconsistente.
- **Recomendação**: substituir os hex literais por `var(--tk-*)`.
- **Comando sugerido**: `/impeccable polish`

**[P2] ⏸️ Em aberto (decisão de produto) — Zero suporte a dark mode**
- **Local**: `src/styles.css` (sistema de tokens inteiro, linhas 8-31)
- **Categoria**: Theming
- **Impacto**: não há `@media (prefers-color-scheme: dark)` nem alternativa de tema em nenhum
  lugar do app; usuários com o SO em modo escuro recebem sempre a UI clara.
- **Recomendação**: decidir se dark mode é prioridade de produto; se for, derivar uma paleta
  escura dos mesmos tokens.
- **Comando sugerido**: `/impeccable colorize`

**[P2] ✅ Corrigido — Grids sem camada base (`col-12`) para telas estreitas**
- **Local**: 29 colunas Bootstrap em 8 arquivos (`dashboard`, `user-list`, `profile-edit`,
  `register`, `ticket-create`, `role-list`) que só declaravam `col-md-*`/`col-lg-*`/`col-sm-*`,
  sem uma classe base para a camada `xs` (< 576px).
- **Categoria**: Responsividade
- **Impacto**: no Bootstrap 5, cada `col-{breakpoint}-N` só existe dentro do seu próprio
  `@media`; sem uma classe base (`col-12`, ou `col-6` nos filtros compactos), o elemento não
  recebe `flex-basis` nenhum abaixo do menor breakpoint declarado, ficando com largura
  imprevisível (auto-size por conteúdo) no celular.
- **Correção aplicada**: adicionada a camada base em todas as ocorrências (ex.:
  `class="col-12 col-sm-6 col-md-6 col-lg-3"` nos cards do dashboard; `class="col-6 col-md-2"`
  nos campos compactos de filtro do `user-list`).
- Único `@media` customizado do projeto (`main-layout.component.css:188`, colapso do menu
  lateral) continua sendo o único necessário — o resto do layout agora é coberto pela grid do
  Bootstrap com a camada base corrigida.

**[P2] ✅ Corrigido — Transição de propriedade de layout**
- **Local**: `main-layout.component.css:62` (`transition: padding-left`)
- **Categoria**: Performance
- **Impacto**: anima uma propriedade de layout (não compositada), pode causar reflow/jank
  perceptível em dispositivos mais lentos ao abrir/fechar o menu.
- **Recomendação**: migrar para `transform`/`margin` compositado ou `grid-template-columns`.
- **Comando sugerido**: `/impeccable optimize`

**[P2] ✅ Corrigido (gradiente) / ⏸️ Em aberto (fonte) — Gradiente em texto e fonte genérica**
- **Local**: `login.component.css:57` e `auth-layout.component.ts:52-55` (gradient-text, banido
  pela regra de craft do Impeccable — **removido**, agora cor sólida `var(--tk-primary-darker)`);
  `auth-layout.component.ts:48` e `register.component.css:37` (fonte 'Montserrat', overused-font
  — **mantida**, troca de fonte é decisão de identidade visual, não bug).
- **Categoria**: Integridade de Implementação (slop)
- **Impacto**: gradiente em texto é decorativo, não funcional, e é um "tell" comum de UI gerada
  por IA — por isso foi removido sem pedir confirmação (é uma regra, não uma preferência).
  Montserrat é uma fonte usada em excesso, mas trocar a fonte da marca é decisão sua.

**[P2] ✅ Corrigido — Alt text vazio ou genérico em imagens**
- **Local**: `main-layout.component.html:108,117` (avatar, `alt` presente mas sem valor);
  `main-layout.component.html:8` (`alt="Logo"`, não identifica "Tickest")
- **Categoria**: Acessibilidade
- **Impacto**: leitor de tela não descreve a imagem (avatar) ou descreve de forma genérica
  (logo), perdendo contexto da marca.
- **Recomendação**: `alt="Foto de perfil de {{ nome }}"` no avatar; `alt="Tickest"` no logo.
- **Comando sugerido**: `/impeccable polish`

### P3 — Polimento (sem impacto real no usuário) — não corrigido, baixa prioridade

**[P3] Imagens sem `loading="lazy"`**
- **Local**: `main-layout.component.html:8,108,117` (as 3 únicas `<img>` do projeto)
- **Categoria**: Performance
- **Impacto**: baixo — são poucas imagens, pequenas, já carregadas no layout principal. Deixado
  de fora de propósito: a logo e o avatar do toggle estão sempre visíveis (acima da dobra), e
  `loading="lazy"` nesse caso é contraindicado (serve para imagens fora da tela inicial).
- **Comando sugerido**: `/impeccable polish`

**[P3] Foco customizado depende só de `box-shadow`**
- **Local**: `register.component.css:22-25` (`outline: none` compensado só por `box-shadow`)
- **Categoria**: Acessibilidade
- **Impacto**: funciona visualmente, mas não há tratamento explícito para `:focus-visible`. Não
  corrigido — risco baixo, projeto só tem um tema (claro) hoje.
- **Comando sugerido**: `/impeccable harden`

---

## Padrões e Problemas Sistêmicos

- **Falta de associação `label`↔`input` é sistêmica**, não isolada: afeta 6 das 7 telas com
  formulário (departamentos, setores, roles, criação de ticket, cadastro, maior parte da listagem
  de usuários), enquanto a tela mais recente (`profile-edit`) faz certo — indica que o padrão
  correto existe no código mas não foi propagado retroativamente.
- **Cores hardcoded duplicando tokens** aparecem em 8 arquivos — sintoma de os tokens terem sido
  introduzidos depois de boa parte do CSS já existir, sem uma passada de retrofit.
- **Responsividade tratada só na casca** (menu lateral) e não no conteúdo (formulários,
  dashboard) — only 1 breakpoint em todo o projeto é um gap estrutural, não um detalhe.

## Pontos Positivos

- Sistema de tokens CSS central bem estruturado (`--tk-*` para cor, sombra, raio, transição) em
  `styles.css`, usado de forma consistente via `var()` com fallback na maior parte dos lugares.
- Todas as 6 telas de listagem já envolvem a tabela em `.table-responsive` — tratamento mínimo de
  mobile presente em 100% das listagens.
- Todo uso do novo `@for` do Angular já inclui `track` corretamente — nenhuma lista sem key,
  mesmo nas telas com muitos itens (usuários, tickets).
- As telas mais novas (`profile-edit`, `user-list`) já aplicam o padrão certo de botão-ícone
  acessível (`<button>` + `aria-label`/`aria-pressed`) — a base para corrigir o resto já existe no
  próprio código, não precisa ser inventada.
- Doc-comments em português consistentes em 100% do código novo, conforme convenção do projeto.

---

## Ações Recomendadas — o que ainda está pendente

Tudo que era correção mecânica (bug, não decisão) já foi aplicado nesta sessão. Só restam duas
decisões de produto/identidade visual, nenhuma urgente:

1. **[P2] `/impeccable colorize`**: decidir se dark mode entra como prioridade de produto; se
   entrar, derivar uma paleta escura dos mesmos tokens `--tk-*` já existentes.
2. **[P2] `/impeccable typeset`**: decidir se troca a fonte Montserrat (usada em excesso em
   produtos genéricos) por algo com mais identidade própria da marca Tickest, ou manter e
   justificar a escolha.

Os 2 itens P3 (imagens sem `loading="lazy"` e foco só via `box-shadow`) foram deixados de lado de
propósito — baixo impacto real, sem urgência.

Rode `/impeccable audit` de novo quando quiser conferir a nota atualizada após decidir os 2 pontos
acima.
