---
name: Tickest
description: Helpdesk corporativo interno — canal único e rastreável para solicitações entre departamentos, com cumprimento de SLA.
colors:
  primary: "#696cff"
  primary-dark: "#5f61e6"
  primary-darker: "#3a3ca3"
  success: "#71dd37"
  warning: "#ffab00"
  info: "#03c3ec"
  danger: "#ff3e1d"
  text-primary: "#2b2c40"
  text-secondary: "#5f6f82"
  text-muted: "#65707e"
  surface: "#ffffff"
  page-bg: "#f5f5f9"
  border: "#e7e7ff"
  input-border: "#d9dee3"
  text-primary-dark: "#e9ecef"
  text-secondary-dark: "#adb5bd"
  text-muted-dark: "#868e96"
  surface-dark: "#212529"
  page-bg-dark: "#1a1d20"
  border-dark: "#3a3f44"
  success-text: "#2e7d14"
  warning-text: "#92400e"
  info-text: "#0c6478"
  danger-text: "#991b1b"
  secondary-text: "#5a6b7d"
typography:
  display:
    fontFamily: "Sora, sans-serif"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-2px"
  title:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
  heading:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  small:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 700
    letterSpacing: "0.06em"
rounded:
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1.25rem"
  pill: "999px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "0.5rem 1rem"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
  badge-primary:
    backgroundColor: "#e7e7ff"
    textColor: "{colors.primary-darker}"
    rounded: "{rounded.pill}"
  badge-success:
    backgroundColor: "#e8fadf"
    textColor: "{colors.success-text}"
    rounded: "{rounded.pill}"
  badge-warning:
    backgroundColor: "#fff2e2"
    textColor: "{colors.warning-text}"
    rounded: "{rounded.pill}"
  badge-info:
    backgroundColor: "#e5f5fa"
    textColor: "{colors.info-text}"
    rounded: "{rounded.pill}"
  badge-danger:
    backgroundColor: "#ffe5e5"
    textColor: "{colors.danger-text}"
    rounded: "{rounded.pill}"
  badge-secondary:
    backgroundColor: "#eceef1"
    textColor: "{colors.secondary-text}"
    rounded: "{rounded.pill}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
  modal:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 0.875rem"
---

# Design System: Tickest

## Overview

**Creative North Star: "O Painel de Controle Confiável"**

Tickest é a ferramenta que uma empresa usa internamente, todo dia, pra substituir pedidos
informais por e-mail e WhatsApp por um canal único e rastreável. Ninguém escolhe usar o Tickest
por prazer estético — escolhe porque confia que vai encontrar o que precisa rápido e vai saber o
que está acontecendo com cada chamado. Por isso o sistema é construído sobre uma base de admin
limpa e consistente (herança visível do padrão Materio/Sneat para Bootstrap 5: sidebar fixa,
cards com sombra suave, badges em pílula), com um único acento de cor — o Índigo Confiança — que
aparece com disciplina: botões primários, estado ativo do menu, foco de formulário. Nada decora
por decorar; cada elemento visual existe pra apoiar uma decisão ou uma ação.

O sistema sustenta dois modos — claro e escuro — espelhando a escala de cinza nativa do Bootstrap
5.3 no escuro, pra não haver costura entre os tokens do Tickest e os componentes nativos (card,
modal, dropdown, tabela). As telas de entrada (login/ativação) são a única exceção: mantêm um
tratamento de marca fixo e mais "premium" (vidro/blur sobre gradiente), sempre claro,
independente da preferência do sistema operacional — a porta de entrada carrega a identidade da
marca; a área de trabalho, depois do login, responde à preferência de quem está usando.

**Key Characteristics:**
- Admin limpo com um único acento de cor usado com disciplina, nunca decorativo
- Suporte real a claro/escuro na área autenticada; login/ativação fixos no visual de marca
- Elevação suave e ambiente (sombra tintada de índigo no claro, preta no escuro) — nunca bordas pesadas
- Cantos generosamente arredondados; badges e avatares em pílula/círculo completo
- Tom profissional e confiável, com um toque de acolhimento (saudação por nome no dashboard)
- Português (pt-BR) em toda a interface, incluindo mensagens de erro e rótulos de formulário

## Colors

A paleta é construída sobre um único acento (Índigo Confiança) e uma escala neutra, com cores
semânticas reservadas estritamente para status/prioridade — nunca usadas como decoração.

### Primary
- **Índigo Confiança** (`#696cff`): a cor da marca. Usada em botões primários (como gradiente,
  ver Components), estado ativo do menu lateral, anel de foco de formulário, ícones de destaque.
  Aparece em ≤10% de qualquer tela — ver **The One Accent Rule** abaixo.
- **Índigo Confiança Escuro** (`#5f61e6`): ponta clara do gradiente do botão primário (branco
  sobre ele dá 4,8:1; sobre o `#696cff` puro dava só 4,0:1 — trocado na critique 2 de
  Departamentos, 2026-10-28).
- **Índigo Profundo** (`#3a3ca3`): acento mais escuro — wordmark ("tickest") no login/ativação,
  a outra ponta do gradiente do botão primário (misturado ao escuro) e, via `--tk-primary-text`,
  o índigo usado **como texto** sobre fundo claro (7,5:1). No tema escuro, `--tk-primary-text`
  vira `#b3b5ff` (6,9:1). Texto em índigo usa `--tk-primary-text`, nunca o `--tk-primary` puro.

### Neutral
- **Grafite Texto** (`#2b2c40`): texto principal (claro).
- **Ardósia Secundária** (`#5f6f82`): texto secundário/rótulos de formulário (claro).
  Escurecida em 2026-10-27 (era `#697a8d`: ~4,40:1 sobre branco, ~4,05:1 sobre o fundo de página)
  — agora ~5,1:1 sobre branco e ~4,7:1 sobre `#f5f5f9`; achado do audit de Meus Chamados.
- **Névoa Terciária** (`#65707e`, escurecido em 2026-10-28 pra passar 4,5:1 também sobre o fundo da página): texto terciário/placeholder, cabeçalho de tabela (claro). O `.text-muted` do Bootstrap continua o dele (`--bs-secondary-color`, mais escuro): trocá-lo pelo token derrubava o contraste abaixo de 4,5:1 sobre fundos com tinta no escuro (revisão de 2026-10-29).
  Escurecido em 2026-10-08 (era `#a1acb8`, ~2,31:1) pra passar 4,5:1 WCAG AA — auditado no
  Dashboard.
- **Branco Superfície** (`#ffffff`): fundo de cards, modais, inputs (claro).
- **Lavanda Nebulosa** (`#f5f5f9`): fundo de página, por trás dos cards (claro).
- **Contorno Lavanda** (`#e7e7ff`): bordas sutis entre superfícies (claro).
- **Gelo Escuro** (`#e9ecef`), **Cinza Médio** (`#adb5bd`), **Grafite Esmaecido** (`#868e96`):
  equivalentes de texto primário/secundário/terciário no modo escuro.
- **Carvão Superfície** (`#212529`), **Breu de Página** (`#1a1d20`), **Contorno Carvão**
  (`#3a3f44`): equivalentes de superfície/fundo/borda no modo escuro.

### Semantic (status e prioridade — nunca decorativas)
- **Verde Resolução** (`#71dd37`): status "Ativo"/"Resolvido", ação de reativar. Em gráficos,
  ícones e qualquer uso de área (não texto pequeno).
- **Âmbar Atenção** (`#ffab00`): status "Aberto", prioridade "Alta". Mesma ressalva de uso acima.
- **Ciano Andamento** (`#03c3ec`): status "Em Andamento". Mesma ressalva de uso acima.
- **Vermelho Alerta** (`#ff3e1d`): ação destrutiva (excluir, desativar), prioridade "Urgente",
  SLA atrasado/perdido. Mesma ressalva de uso acima. Status "Cancelado" saiu do vermelho em
  2026-10-27: é um estado final, muitas vezes escolhido pelo próprio solicitante, e não um alerta —
  usa o badge neutro, como "Fechado" (achado do critique de Meus Chamados).

### Semantic Text (texto de badge "soft" — contraste AA sobre o fundo pastel)
A cor semântica "pura" acima, usada direto como texto sobre o próprio fundo pastel do badge,
mede entre 1,6:1 e 3,8:1 de contraste — falha WCAG AA (4,5:1). Auditado e corrigido em
2026-10-08: estas são versões escurecidas do mesmo matiz, só para texto pequeno sobre fundo claro.
- **Verde Resolução Texto** (`#2e7d14`): ~4,7:1 sobre `#e8fadf`.
- **Âmbar Atenção Texto** (`#92400e`): ~6,4:1 sobre `#fff2e2`.
- **Ciano Andamento Texto** (`#0c6478`): ~6,0:1 sobre `#e5f5fa`.
- **Vermelho Alerta Texto** (`#991b1b`): ~7,0:1 sobre `#ffe5e5`.
- **Ardósia Secundária Texto** (`#5a6b7d`): ~4,7:1 sobre `#eceef1` (badge neutro).
- Badge primário reusa o Índigo Profundo (`#3a3ca3`) já existente — ~7,3:1 sobre `#e7e7ff`.
- As variantes de modo escuro dos badges (texto mais claro sobre fundo de baixa opacidade) já
  media 6:1+ antes desta correção e não foram alteradas.

### Named Rules
**The One Accent Rule.** O Índigo Confiança é a única cor não-semântica do sistema. Se um
elemento precisa de cor e não é status/prioridade, a resposta é índigo ou neutro — nunca uma cor
nova inventada para aquela tela.

**The No Factory Blue Rule.** Componente do Bootstrap que usa a cor primária (ex.: `btn-outline-primary`, `text-primary`, `border-primary`) é sobrescrito pro índigo da marca em `styles.css` — nunca aparece o azul de fábrica `#0d6efd`. Links de texto (`<a>` sem classe de botão) também: `--bs-link-color` aponta pro `--tk-primary-text` nos dois temas. Texto sobre índigo preenchido usa `--tk-primary-dark` ou mais escuro (o `--tk-primary` não passa AA com texto branco pequeno). O contornado secundário (`btn-outline-secondary`) também não usa o cinza de fábrica `#6c757d` (4,3:1 sobre o fundo da página): texto, borda e preenchido do hover no `--tk-text-secondary` do tema.

**The Host-Context Dark Rule.** Em CSS de componente (encapsulado), o tema escuro se escreve `:host-context([data-bs-theme="dark"]) .x` — nunca `[data-bs-theme="dark"] .x`, que o Angular prende ao componente e nunca casa com o `<html>` (a barra superior ficava clara no escuro por isso).

**The Status Color Rule.** Cada status do chamado tem uma cor só na tela inteira, em área (barra,
gráfico, marcador de legenda), pelos tokens `--tk-status-open` (âmbar), `--tk-status-in-progress`
(ciano), `--tk-status-resolved` (verde) e `--tk-status-closed` (o cinza neutro `--tk-text-muted`).
Cancelado não tem cor de área: não é fila nem entrega. No gráfico do Início, "Criados" usa o índigo
da marca (não é status) e "Resolvidos" o verde de Resolvido. A paleta categórica de 5 cores que o
gráfico antigo usava como ritmo visual foi aposentada no redesenho de 2026-10-28.

### Tokens semânticos de status e de risco de SLA
Toda cor com significado operacional vem de um token; cor nunca é o único sinal — vem sempre com
rótulo, número ou ícone. Duas escalas, que não se misturam no mesmo gráfico:

**Status do chamado** (estado atual; áreas como barra, fatia e marcador):

| Significado | Token de área | Contorno (≥3:1) | Texto sobre a área | Onde aparece |
|---|---|---|---|---|
| Aberto | `--tk-status-open` (#ffab00) | `--tk-status-open-edge` | `--tk-status-label` | marcador do KPI, fatia, legenda |
| Em andamento | `--tk-status-in-progress` (#03c3ec) | `--tk-status-in-progress-edge` | `--tk-status-label` | idem |
| Resolvido | `--tk-status-resolved` (#71dd37) | `--tk-status-resolved-edge` | `--tk-status-label` | idem; série "Resolvidos" do gráfico |
| Fechado | `--tk-status-closed` (= `--tk-text-muted`) | `--tk-status-closed-edge` | `--tk-status-closed-label` (branco no claro, `--tk-page-bg` no escuro) | idem |
| Cancelado | sem cor de área | — | texto secundário | "+ N cancelados" fora da barra |

Os contornos são o mesmo matiz escurecido (`color-mix` 55% com preto; no canvas, `edgeColor()`),
porque âmbar, ciano e verde puros ficam ~2:1 contra o branco (WCAG 1.4.11). "Criados", no gráfico,
é o índigo da marca (`--tk-primary`): evento, não status.

**Risco de SLA** (prazo dos chamados ativos; regra do back-end em `TicketSlaFilters`):

| Significado | Token | Observação |
|---|---|---|
| No prazo | `--tk-text-muted` (neutro) | calmo de propósito: não pede ação |
| Em risco (≥ 75% do prazo) | `--tk-warning-text` (âmbar escuro) | mais escuro que o âmbar de Aberto, pra os dois não se confundirem quando aparecem juntos |
| Atrasado (prazo vencido) | `--tk-danger-text` (vermelho) | o único vermelho de risco; só com contagem acima de zero |
| Cumprido / perdido | `--tk-success-text` / `--tk-danger-text` | resolvidos dentro / fora do prazo |

Vermelho é só risco operacional: falha técnica (erro de leitura) fica em texto secundário.

**Estados de interação:** foco visível (teclado, `:focus-visible`) com contorno de 2px em
`--tk-focus-ring`, afastado 2px do elemento. O token é o índigo da marca com folga de contraste:
`--tk-primary-dark` no claro e `--tk-primary-text` no escuro (≥ 3:1 contra todo fundo vizinho medido; o
`--tk-primary` puro caía a 3,0–3,6:1 nos cards de alerta e no item de menu em foco). Vale para botões,
links e qualquer focável (regra-base com `:where()`, que os componentes com regra própria sobrepõem),
no lugar do anel translúcido do Bootstrap (1,0–2,0:1). Item de menu: contorno por dentro. Botão em
grupo (Empresa | Com filtros, Dia | Semana | Mês) e fatia da barra de composição: o vizinho encosta,
então um halo de 6px da superfície separa o contorno da cor ao lado. Toast colorido: contorno na cor
do texto dele (revisão de acessibilidade de 2026-10-30);
hover/selecionado em card com a sombra `--tk-shadow-md`; barra destacada no gráfico (hover ou
teclado) com contorno de 2px em `--tk-text-primary`; desabilitado-mas-focável com `aria-disabled` e
opacidade 0.65 e o motivo num tooltip de hover/foco ("Em breve", "Período longo demais").

**The RGB Token Rule.** Fundo ou realce translúcido de marca/alerta usa os tokens em RGB —
`rgba(var(--tk-primary-rgb), α)`, `rgba(var(--tk-danger-rgb), α)` e `rgba(var(--tk-success-rgb), α)`
(o verde, desde 2026-10-28: hover do "Reativar" e badge escuro) — nunca o valor literal
(`rgba(105, 108, 255, …)`). Consolidado em 2026-10-27. O fundo âmbar "soft" do badge de aviso tem
token próprio, `--tk-warning-soft-bg` (`#fff2e2` no claro; o âmbar a 16% no escuro), usado pelo
`.bg-label-warning` e pelo chip "sem setor" pressionado (2026-10-28).

**The Badge Pair Rule.** Toda cor semântica (success/warning/info/danger) existe em dois pares:
um "soft" (fundo pastel claro + texto na variante escurecida do matiz, ver **Semantic Text**
acima — não a cor semântica pura, que falha contraste sobre o próprio fundo pastel) para o modo
claro, e um "soft dark" (fundo do mesmo matiz em baixa opacidade sobre fundo escuro + texto mais
claro) para o modo escuro. Nunca usar o par claro diretamente sobre fundo escuro — fica estourado.

## Typography

**Display Font:** Sora (com fallback `sans-serif`) — só na wordmark "tickest" do cabeçalho de
login/ativação.
**Body Font:** Public Sans (com fallback `system-ui, -apple-system, "Segoe UI", sans-serif`) —
todo o resto da interface, de parágrafos a títulos de tela.

**Character:** Public Sans é uma grotesca neutra e muito legível — carrega o peso operacional do
dia a dia sem chamar atenção pra si. Sora entra só no momento de marca (o nome do produto no
login), com peso 700, minúsculo e rastreamento apertado (-2px) — a única vez que a tipografia tem
permissão de ter personalidade própria.

### Hierarchy
- **Display** (700, 3rem, line-height 1): a wordmark "tickest" em login/ativação. Único uso de
  Sora no sistema.
- **Title** (700, 1.5rem/`h4`): título de cada tela (ex. "Usuários", "Bom dia, {nome}!").
  Semanticamente é o `h1` da tela (`<h1 class="h4">`); títulos de card são `<h2 class="h5">` — o
  nível do heading segue a estrutura, o tamanho vem da classe (sem pular de `h4` pra `h6`).
- **Body** (400, 1rem): texto corrido, valores de tabela, conteúdo de formulário.
- **Label** (600–700, 0.72–0.85rem, uppercase, tracking 0.06–0.08em): rótulos de formulário,
  cabeçalho de tabela, cabeçalho de seção do menu lateral ("ADMINISTRAÇÃO"), títulos de seção do
  Guia da Tela e os rótulos da lista rótulo/valor do painel lateral (`.info-list dt`, 0.72rem —
  com o valor ao lado no corpo, 1rem; nunca dois tamanhos quase iguais pra rótulo e valor).

### Named Rules
**The Brand-Only Display Rule.** Sora nunca aparece fora da wordmark de login/ativação — títulos
de tela, mesmo os mais importantes, usam Public Sans em peso 700. A fonte de marca é reservada
para o momento de marca, não para hierarquia geral.

## Layout

Grid de 12 colunas do Bootstrap 5, mobile-first: toda coluna declara uma camada base (`col-12`
ou `col-6` para pares compactos) antes das camadas `md`/`lg`, porque o Bootstrap só aplica largura
a partir do menor breakpoint explicitamente declarado — sem a camada base, o elemento fica sem
`flex-basis` abaixo dela.

A área autenticada usa um shell fixo: sidebar de 260px (`.layout-menu`) + conteúdo fluido
(`.layout-page`, fundo `page-bg`), com uma navbar flutuante com vidro/blur (`.layout-navbar`)
ancorada no topo do conteúdo. Abaixo de 1199px a sidebar vira off-canvas (`position: fixed`,
deslizando com `transform: translateX`), com um overlay escurecido atrás.

O ritmo de espaçamento segue a escala padrão do Bootstrap (múltiplos de 0.25rem via utilitários
`p-*`/`g-*`/`gap-*`/`m-*`) — não há escala de espaçamento customizada. Cards de filtro/listagem
usam `p-3`; corpo de card de conteúdo usa `p-4`; grupos de campo usam `g-3`.

**Celular:** tabelas com várias colunas viram uma lista de cards abaixo de `md` (ver
`.table-stack` em Components) em vez de rolar pro lado. Quando a ordem visual muda entre desktop e
celular, a ordem do DOM segue a do celular (leitura e Tab iguais ao que se vê) e só o desktop
reordena com `order-lg-*`. No Início (redesenho de 2026-10-28): cabeçalho, faixa de
indicadores e o gráfico principal da operação ocupam a primeira dobra (1366×650 de área útil); o que
pede ação (Central de atenção e Alertas de SLA, lado a lado) vem logo abaixo, empilhando no celular.

## Elevation & Depth

Sistema de sombra ambiente e suave — nunca estrutural/dura. Cards e modais não têm borda
(`border: none`); a sombra é o único sinal de que uma superfície está "acima" da página. No modo
claro a sombra é tintada da cor da marca (`rgba(105, 108, 255, alpha)`); no modo escuro vira preto
puro em opacidade maior, porque uma sombra colorida sobre fundo já escuro não lê como profundidade.

### Shadow Vocabulary
- **sm** (`0 0.125rem 0.375rem rgba(105,108,255,.08)` / escuro `rgba(0,0,0,.3)`): cards em
  repouso, inputs.
- **md** (`0 0.375rem 1.25rem rgba(105,108,255,.12)` / escuro `rgba(0,0,0,.4)`): navbar flutuante,
  elementos de destaque médio.
- **lg** (`0 1rem 3rem rgba(105,108,255,.18)` / escuro `rgba(0,0,0,.55)`): modais — a camada mais
  alta da interface.

Login e ativação de conta têm sua própria camada de elevação, mais dramática e fixa (não dark-aware): o card
de autenticação usa `0 20px 60px rgba(0,0,0,.2)` com `backdrop-filter: blur(10px)` sobre um fundo
em gradiente — o único lugar do sistema com vidro de verdade, reservado pro momento de entrada.

### Named Rules
**The Tinted-Light, Neutral-Dark Rule.** Sombra no modo claro é tintada da marca; no modo escuro é
preto neutro. Nunca o inverso — preto no claro lê como sujeira, índigo no escuro sobre fundo já
escuro não aparece.

## Shapes

Cantos generosamente arredondados em três passos (`sm` 0.5rem para inputs/botões, `md` 0.75rem
para cards, `lg` 1.25rem para modais), mais um passo "pílula" (`999px`) para badges e para o
indicador de página ativa na paginação. Avatares e o indicador de status "online" são círculos
completos. Não há elementos com cantos retos nem clipping customizado — tudo no sistema é curvo.

## Components

### Buttons
- **Shape:** `rounded-sm` (0.5rem).
- **Primary:** gradiente `linear-gradient(to right, índigo-escuro, índigo-escuro misturado ao
  profundo)`, texto branco (≥4,8:1 em toda a extensão), sombra tintada no repouso — no tema
  escuro, sombra neutra do tema (a tintada virava brilho).
- **Hover:** eleva 1px (`translateY(-1px)`) e inverte a direção do gradiente; sombra cresce.
- **Outline (secondary/danger/success):** transparente com borda, mesmo lift de 1px no hover, sem
  gradiente — reservado para ações secundárias ou destrutivas fora do botão primário da tela. No
  escuro, o contornado secundário usa `--tk-text-secondary` como texto (o cinza de fábrica dava
  3,3:1 — a paginação inteira reprovava AA, medido em 2026-10-28).
- **Link (baixa ênfase):** usado só para ações de frequência muito baixa (ex. "Limpar filtros") —
  sem fundo, sem borda, cor neutra que escurece no hover. Nunca compete visualmente com o botão
  primário da tela.

### Badges
- **Style:** fundo "soft" (pastel no claro, baixa opacidade no escuro) + texto na variante
  escurecida da cor semântica (AA, ver **Semantic Text**), sempre em pílula (999px). Ver
  **The Badge Pair Rule** em Colors.
- **Uso:** status de usuário/ticket, prioridade de ticket, papel/função atribuída. Uma célula com
  múltiplos badges (ex. funções de um usuário) mostra no máximo 2 e agrupa o resto num badge
  "+N" neutro com tooltip nativo — nunca deixa a linha da tabela esticar.
- **Cor de função:** todas as funções usam o badge índigo (`bg-label-primary`). A prévia de cor
  por função guardada no navegador foi removida na auditoria de 2026-10-29 (era persistência
  simulada de um atributo da função que o back-end não tem); volta quando o back-end guardar a
  cor (spec 044 do back-end, `tickest-pristine/specs/044-cor-do-badge-da-funcao`).
- **Status do usuário** (`<app-user-status-badge>`, `users/feature-user-list`): Ativo (verde),
  Convite pendente (âmbar), Inativo (neutro), com o ponto `.badge-dot` — o mesmo componente na
  tabela, no painel e no Guia. (`.badge-dot`, não `.status-dot`: esse é o marcador de status de
  chamado do Início, e o nome repetido fazia uma regra sobrescrever a outra.)
- **Convite pendente** (conta cadastrada, ainda sem senha): `bg-label-warning` — âmbar é "esperando
  alguém", o mesmo raciocínio do "Aberto" nos chamados. Abaixo do badge, uma linha pequena diz a
  validade do convite ("Vale até 01/11/2026 15:00", com ano também na tabela) ou, vencido, "Convite
  expirado: reenvie pelo ⋮" em âmbar AA e peso 600 — vencido pede ação, não é só espera.

### Cards / Containers
- **Corner Style:** `rounded-md` (0.75rem); modais usam `rounded-lg` (1.25rem).
- **Background:** `surface` (branco/carvão conforme o tema).
- **Shadow Strategy:** ver Elevation & Depth — `shadow-sm` em repouso; cards de estatística do
  dashboard sobem para uma sombra maior e elevam 5px no hover.
- **Border:** nenhuma — a sombra é o único separador.
- **Internal Padding:** `p-3` (filtros, listas compactas) a `p-4`/`p-lg-5` (corpo de formulário).

### Inputs / Fields
- **Style:** borda de 1.5px em cinza neutro, `rounded-sm`, fundo `surface`.
- **Focus:** a borda vira `--tk-focus-ring` e ganha um anel sólido de 1px colado nela (`box-shadow`),
  uma faixa de ≥ 2px sem mexer no layout; o anel de 15% da marca dava 1,1:1. Vale também no escuro e no
  login. Em grupo (busca com ícone, senha com "Mostrar senha"), o anel vai no grupo, não no campo (do lado
  colado ao vizinho, o do campo sumia), e o botão do grupo tem contorno por dentro, acima do campo; no
  login, o campo em grupo não sobe 1px no foco. Campo com erro em foco: anel vermelho de 2px, no lugar do
  anel vermelho de 25% do Bootstrap. Nunca `outline: none` sem substituto.
- **Error:** classe `.is-invalid` do Bootstrap + mensagem abaixo do campo, nunca só cor.

### Navigation
- **Ícones do menu:** glifo de 1.25rem (`.menu-icon`) — tamanho de ícone, não um passo da escala de texto.
- **Sidebar:** 260px fixos, fundo `surface`, itens agrupados sob cabeçalhos em maiúsculas
  rastreadas (ex. "ADMINISTRAÇÃO", visível só com a permissão correspondente). Item ativo ganha
  fundo em gradiente suave da marca + barra vertical de 3px à esquerda + texto em `--tk-primary-text`
  (o índigo puro sobre o fundo tingido dava 3,4:1 no claro e 3,2:1 no escuro). Hover
  desloca o item 0.15rem para a direita (`transform`, nunca `padding` — ver Named Rule abaixo).
- **Navbar:** barra flutuante com vidro/blur ancorada no topo do conteúdo, não no topo da viewport.
- **Mobile (<1199px):** sidebar vira off-canvas deslizante, com overlay escurecido.
  - Fechada, a gaveta fica `inert`, fora do Tab.
  - Ao abrir, o foco vai para "Fechar menu", o resto da página fica `inert` e o Tab dá a volta
    dentro da gaveta (toasts e diálogo global ficam fora do layout).
  - Escolher um item ou o logo fecha a gaveta e leva o foco ao `h1` da nova tela.
  - Esc, "Fechar menu" e o overlay fecham a gaveta e devolvem o foco ao ☰.
  - A gaveta tem a altura da janela e rolagem própria, para os itens não sumirem no celular deitado.

### Row Actions (menu "⋮")
Quando uma linha de tabela tem mais de duas ações possíveis, elas vão num menu dropdown
acionado por um ícone de três pontos verticais — nunca uma fileira de botões texto+ícone lado a
lado. Um único "⋮" por linha, com a classe global `.btn-row-actions`: discreto (sem borda) até
hover/foco/aberto, quando ganha só um realce índigo leve. O título da linha é o link pro detalhe
(sem botão "Ver detalhes" separado) — exceto onde o título abre o painel lateral em vez do
detalhe (Monitorar Chamados): ali "Ver detalhes" fica no "⋮", e é o único item de um chamado já
encerrado. Dropdowns dentro de um container com scroll
(`.table-responsive`) usam posicionamento `fixed` do Popper, não o `absolute` padrão do Bootstrap,
pra não ficarem cortados pelo scroll. Implementação: `<app-row-actions [label] [busy] [rowKey]>`
(`shared/ui/row-actions`) com os `<li>` projetados — nunca montar o dropdown à mão.

### Tabelas no celular (`.table-stack`)
Utilitário global: abaixo de `md`, cada linha vira um card; cada célula com `data-label` vira um
par rótulo/valor; a célula `.table-stack-actions` (o "⋮") vai pro canto superior direito do card.
Usado em Meus Chamados, Monitorar Chamados e Usuários. Texto que não quebra linha (`text-truncate`) dentro do
card precisa de `width: 0; min-width: 100%`, senão alarga a página inteira. A célula do título leva
`.table-stack-title` quando não é a primeira (em Usuários a primeira é o checkbox, vazio nas linhas
fora do lote): sem isso, o nome subia pra baixo do "⋮". Valor com mais de um elemento (badge +
validade do convite) vai num `.cell-value`, senão o flex do par rótulo/valor os separa.

### Icon Tile (`.icon-tile`)
Ícone centralizado num quadrado/círculo de fundo suave — sempre junto de `.badge.bg-label-*` e
`.rounded`/`.rounded-circle`, com `aria-hidden` (é decoração do rótulo ao lado). Tamanhos:
`-sm` 2.25rem (linhas de lista), padrão 2.5rem, `-lg` 3rem (KPIs), `-xl` 4rem (estado vazio/primeiro
uso).

### Alertas de SLA (assinatura do produto)
O SLA é o diferencial do Tickest, e o card que o mostra segue regras próprias:
- Desde o redesenho de 2026-10-28, fica **logo abaixo do gráfico principal**, ao lado da Central de
  atenção (Central à esquerda, Alertas à direita; no celular, os Alertas vêm primeiro). O número de
  atrasados mora na primeira tela, o primeiro KPI de quem atende a fila. Com o agregado da
  operação (spec 026), os Alertas não repetem totais: ficam só com a lista do que agir e "Ver a fila
  pelo prazo" (decisão de 2026-10-28). **Escopo:** no "Com filtros", a lista segue o mesmo recorte dos
  números (setores, prioridade, responsável e período de abertura, pela GET /tickets da spec 025) e o
  subtítulo diz "Com os filtros"; no da empresa, "Toda a empresa" (decisão de 2026-10-28, que substitui
  a anterior de Alertas sempre da empresa toda). Card com espaço (container ≥ 40rem): resumo à esquerda e lista
  à direita; com a fila em dia, vira uma linha compacta — o tamanho do card é a mensagem, por isso
  ele nunca estica pra casar a altura com o vizinho.
- Lista atrasados **e** em risco em 5 vagas: até 3 atrasados (o atrasado há mais tempo primeiro) e
  até 2 em risco (o que vence primeiro), e a sobra de um grupo vai pro outro — só por prazo, muitos
  atrasados escondiam os em risco, os únicos que ainda dá pra salvar. Os totais da empresa ficam no
  topo, com o mesmo número grande dos KPIs, cada um levando à fila de Monitorar já filtrada.
- O card mostra "Atualizado às HH:mm" e tem um botão "Atualizar" que recarrega só os alertas; quem
  recarrega sozinho é a atualização automática do Início (a cada 2 min com a aba visível). Num erro, o
  aviso vem antes do carregamento: a nova tentativa não troca o aviso pelo spinner nem o anuncia de novo.
- Cada item tem etiqueta "Atrasado"/"Em risco" em texto **e** cor, e o prazo relativo vivo ("vence
  em 2h 14min" / "venceu há 35 min"), recalculado a cada 30s com a aba visível e ancorado na hora
  do servidor (`serverNowUtc`), nunca no relógio da máquina.
- Quando um item vence com a tela aberta: vira "Atrasado", os totais acompanham, um `aria-live`
  anuncia só a virada e a linha recebe um realce vermelho único de 1,6s (sem animação com
  `prefers-reduced-motion`).
- Sem nenhum alerta, o vazio é dito com clareza: "Fila em dia", com check na cor de sucesso.

### Seleção em lote e linha da tabela
- **Abrir o painel pela linha:** o clique na linha inteira é só atalho de mouse. O alvo de teclado
  e leitor de tela é um `<button>` no título/nome da linha, com `aria-expanded` e o texto visível
  como nome acessível (sem `aria-label` que repita o estado). Nunca `role="button"` no `<tr>`: apaga
  a semântica de linha de tabela e aninha o checkbox e o "⋮" dentro de outro botão.
- **Badge "+N" na tabela:** não é controle (nada de `tabindex` em `<span>`): o "+N" é
  `aria-hidden` e os nomes ocultos vão num `.visually-hidden`; a lista completa fica no painel.
- **Checkbox de seleção em lote:** dentro de um `<label class="select-hit">` que preenche a célula
  com 44×44px (`.col-select` sem padding) — tocar em qualquer ponto da célula marca, sem abrir o
  painel da linha.
- **Item inativo** (usuário desativado): nunca `opacity` na linha — derruba e-mail, data e badge
  abaixo de AA. O estado é dito pelo badge; a linha só recua o nome pra `text-secondary`.
- **Linha sem checkbox** (a própria conta, quem já está inativo): a célula diz o motivo em
  `.visually-hidden`, nunca fica muda. A própria conta leva o badge "Você" ao lado do nome, e o ⋮
  troca "Desativar" por uma linha neutra ("Sua própria conta não pode ser desativada.").
- **"Selecionar todos" no celular:** o cabeçalho da tabela some no `.table-stack`, então o checkbox
  ganha uma linha visível acima dos cards (`.select-all-mobile`, com texto); o do cabeçalho fica
  `d-none` abaixo de `md` — invisível e focável seria armadilha de teclado.
- **Linha com o painel aberto:** tinge pela camada de estado da tabela (`--bs-table-bg-state`, a
  mesma do hover) e o nome vai pro índigo de texto. `background-color` no `<tr>` não aparece: o
  fundo das células cobre (dava 1,07:1).
- **Foco depois de uma ação da linha:** o "⋮" leva `[rowKey]` e `[busy]` (spinner enquanto conta
  chamados, desativa, reativa ou reenvia convite); confirmação cancelada ou ação concluída devolvem
  o foco a ele. "Limpar seleção" e o fim do lote levam o foco ao "selecionar todos" visível.

### Painel lateral "Informações do X" (`appSidePanel`)
Consulta rápida do item selecionado na tabela (Usuários, Monitorar Chamados), sem sair da tela.
- **Layout:** de `lg` pra cima, coluna `col-lg-4` ao lado da tabela, `sticky` (`.info-panel`).
  Abaixo de `lg`, overlay de tela cheia (`.info-panel-col`) sobre um fundo preto a 50%
  (`.info-panel-backdrop`, o mesmo do `.modal-backdrop`), z-index entre o layout (1045) e os toasts
  (1080). Estilos globais em `styles.css`.
- **Acessibilidade** (diretiva `shared/ui/directives/side-panel.directive.ts`): `role="region"` no
  desktop, `role="dialog"` + `aria-modal` no overlay (`injectSidePanelOverlay()`). Só no overlay: Tab
  preso dentro do painel e foco no título (`data-side-panel-title`, `tabindex="-1"`) ao abrir e a
  cada troca de item — chaveado pelo **id**, nunca pelo objeto, que a lista recria a cada recarga.
  No desktop o foco fica na linha que abriu (o painel vem depois da tabela no DOM).
- **Fechar:** botão X, clique no fundo, ou Esc de qualquer lugar — exceto Esc nascido dentro de um
  modal ou de um "⋮" (`isEscapeFromNestedLayer`), que só fecha aquela camada. Ao fechar, o foco
  volta pro botão que abriu.
- **Conteúdo:** título do item, badges de estado, lista rótulo/valor (`.info-list`) e os atalhos
  que a linha já oferece — o painel nunca tem ação que a tela não tenha. Listas que a tabela agrupa
  em "+N" aparecem inteiras aqui.

### Esqueleto da tela
Toda tela autenticada segue a mesma ordem, de cima pra baixo: **Cabeçalho → Guia → Resumo →
alerta de ação → Filtros → barra de lote → Conteúdo** (tabela, cards, formulário), com o painel
lateral "Informações do X" ao lado do conteúdo quando houver.
- **Cabeçalho (`<app-page-header>`, `shared/ui/page-header`):** `title`, `subtitle` e `crumbs`;
  ações da tela projetadas com `pageActions` (à direita, quebrando pra baixo no celular). Gera o
  único `<h1 class="h4">` da tela; a trilha (`Administração`, `Início / Meus Chamados`) fica num
  `<nav aria-label="Trilha">` acima, fora do `h1`, com link nos níveis que têm tela própria. Nunca
  montar cabeçalho à mão, nem `h4` cru, nem `pt-3`/`py-3` no título.
- **Telas de entrada** (login, ativação de conta, primeiro acesso) não usam o cabeçalho — o título do card é
  o `<h1 class="h4">` da página.

### Guia da Tela e Resumo
- **Guia da Tela (`<app-screen-guide storageKey="…">` + `<app-guide-section title="…">`,
  `shared/ui/screen-guide`):** card recolhível logo abaixo do cabeçalho, **aberto só na primeira
  visita** a cada tela (depois começa fechado), com a escolha do usuário lembrada no navegador. Borda fina e sem sombra (`.guide-card`):
  apoio, mais discreto que o conteúdo. Seções com título `h2` em versalete. O componente do domínio
  (`*-guide.component`) só escreve o texto. Explica legenda e comportamento da tela — nunca repete
  o que a interface já diz.
- **Exceção — Início:** o Guia não fica no corpo da tela. Um botão "Guia da tela" (ícone +
  texto, `btn-outline-secondary`) nas ações do cabeçalho abre um `<app-dialog size="lg">` com uma
  seção curta por bloco (indicadores, gráfico, filtros, Central de atenção, Alertas de SLA,
  atualização). Aberto no corpo, ele empurrava os números pra baixo da dobra; no diálogo, quem
  precisa lê sem tirar espaço de quem não precisa. Seções com `h3.section-label` (o título do diálogo
  é o `h2`).
- **Exceção — Departamentos:** o Guia também começa fechado (critique 2 de 2026-10-28). O
  subtítulo já traz a regra que importa ("sem setor, o departamento não aparece na abertura de
  chamados"), e aberto ele empurrava o primeiro departamento pra baixo da dobra no desktop e
  ocupava a primeira tela do celular. Na mesma rodada, a busca saiu do card próprio e virou uma
  barra acima da lista (busca, "Mostrando X de Y" e "Limpar filtros" juntos), e o Resumo trocou os
  números grandes por uma linha de apoio — o que pede ação ali são os chips de filtro.
- **Exceção — Usuários (mesmo padrão de Departamentos, critique de 2026-10-28):** Guia fechado até
  na 1ª visita (aberto, a primeira linha da tabela ficava a 1086px num 1366×768; agora 483px).
  Resumo numa linha de apoio: total, ativos, **com convite pendente** (ícone âmbar, só quando há) e
  inativos, do `GET /users/stats/status` (spec 020) — convite pendente não conta mais como ativo.
  Sem chip de filtro pros pendentes enquanto a lista não filtra por isso no back-end. Filtros numa
  barra colada à tabela (`.user-toolbar`): busca, status, botão "Período de cadastro" (recolhido;
  os campos "De"/"Até" ficam sempre à vista quando há um período aplicado), o resultado ("N
  usuários encontrados.", `aria-live`) e "Limpar filtros" só com filtro aplicado. Recarga não
  esmaece a tabela: a barra diz "Atualizando…".
- **Sempre no fluxo:** Guia e Resumo ficam no topo da tela, na largura do conteúdo, em qualquer
  resolução e navegador. Nunca `position: fixed` nas margens do `container-xxl`: o antigo modo
  "trilha lateral" (≥1900px, ~130–170px de largura) dependia do viewport real — zoom, escala do
  Windows, barra lateral do Edge, barra de rolagem dentro de `100vw` — e cortava o texto no Edge
  enquanto o Chrome caía no fluxo normal. Removido em 2026-10-27.
- **Resumo (`<app-summary-card [loading] [failed]>`, `shared/ui/summary-card`):** números calculados
  da lista da tela, em `.insights-section`/`.insights-stat` (passo Title, 1.5rem). Enquanto a lista
  carrega ou quando falhou, o card mostra "—" e o motivo por contrato — nunca `0`, nunca uma
  afirmação ("todas têm permissão") sobre uma lista que não chegou.

### Seus chamados (Início)
Pra quem abre chamados e não atende a fila (`tickets:view-own` sem `tickets:manage`), o Início
mostra "Seus chamados" — do próprio usuário (`MyTicketsSummaryStore`, GET /tickets/mine/summary),
cada card levando a Meus Chamados — com título de card (`h2.h5`, passo heading) como os blocos vizinhos.
- **Os grupos da lista (decisão de 2026-10-28):** Em aberto (abertos e em andamento), Encerrados
  (resolvidos, fechados e cancelados) e Todos — os mesmos de Meus Chamados, que não filtra por um
  status só. Cada card tem o número da lista que abre; a divisão fica no apoio ("2 abertos, 1 em
  andamento"; "5 resolvidos ou fechados, 0 cancelados") e no nome acessível do link.
- **O conteúdo do papel primeiro (decisão de 2026-10-28):** enquanto os números da empresa não
  existem pra este papel (spec 031), nada de aviso "em breve" antes dele — "Seus chamados" é a tela,
  o subtítulo diz "Como estão os seus chamados." e não há card de Ações rápidas ("Ver todos" já leva
  a Meus Chamados).
- **Primeiro uso:** sem nenhum chamado, os três zeros dão lugar a um convite ("Você ainda não abriu
  nenhum chamado." + "Abrir o primeiro chamado").
- **Quem administra sem atender a fila** vê um card "Administração" com os atalhos que as permissões
  dão (Usuários, Funções, Departamentos e setores), e não uma página vazia; sem números na tela, o
  "Atualizado há" e o botão de atualizar não aparecem. O Guia só explica os blocos que o papel vê.

### Início (gráfico principal, indicadores e operação)
- **Para todo colaborador, números da empresa:** a faixa de indicadores (ver "Risco primeiro" abaixo:
  quatro números pra quem atende a fila; total e status pros demais) e o gráfico principal mostram agregados da empresa
  inteira, vindos do servidor; nada é contado a partir de uma página de lista. O drill-down abre a
  lista que a pessoa pode ver; quando ela vê menos que o número, o card diz ("Você tem acesso a 12
  dos 340 chamados").
- **Faixa de indicadores (`<app-dashboard-kpi-strip>`):** cards densos (~72px), rótulo com o
  marcador da cor do status, número em `stat-value` e apoio curto na mesma linha. Números até 9.999
  completos ("1.240"), acima compactos ("12,3 mil"), com o completo no `title`. Um título
  `visually-hidden` ("Indicadores") pra quem navega por títulos. O apoio fica ao lado do número e,
  quando não cabe (celular, tablet, ou "abertos no período, passaram do prazo"), desce pra linha de
  baixo e quebra — nunca some nem passa da borda do card.
- **Risco primeiro, quatro números (decisão de 2026-10-28):** pra quem atende a fila, a faixa é
  Atrasados, Sem responsável, Na fila e Total — numa linha só a partir de 768px. Acima de zero, os
  dois primeiros ganham fundo e número na cor do alerta (vermelho e âmbar, `.kpi-alert-*`), e o apoio
  sobe pro cinza secundário (o muted não chega a 4,5:1 sobre esses fundos); zero
  fica neutro. A divisão por status (em andamento, resolvidos, fechados) mora só na barra de
  composição do gráfico, logo abaixo. Pros demais papéis, a faixa de sempre (total, na fila, em
  andamento, resolvidos, fechados, SLA cumprido).
- **Escopo dos números:** "Empresa / Com filtros" fica numa linha própria acima dos indicadores (e
  não dentro do gráfico), porque vale pra faixa, o gráfico, a Central e o SLA. Abrir "Com filtros"
  mostra a barra logo abaixo e leva o foco ao primeiro filtro. O escopo vem da URL a cada visita (com
  filtros, "Com filtros"; sem, a empresa toda), nunca da visita anterior; com um departamento da URL
  esperando a lista, as buscas ficam paradas até ele chegar, em vez de sair com o recorte vazio.
- **Gráfico principal (`<app-dashboard-hero-chart>`):** uma toolbar só (frase de destaque à
  esquerda; Dia/Semana/Mês e o ícone da tabela à direita; o título do card é `visually-hidden`; o
  escopo Empresa/Com filtros não mora aqui, ver acima), a barra de composição com a legenda dentro das fatias (status, número e %
  conforme a largura da fatia; abaixo de 1200px, uma legenda compacta numa linha embaixo) e
  "+ N cancelados" à direita, o fluxo com ~300px de plotagem a 1366×650 (o eixo pode cair um pouco
  abaixo da dobra — decisão de 2026-10-28) e um rodapé com o intervalo e o que ainda vem. Frase de
  destaque com regras e limiares em `dashboard-insight-rules.ts`; sem amostra, nenhuma frase; a regra
  de fila só com a flag dos resolvidos. No celular, uma série só.
  Referências desenhadas no gráfico (P0 de 2026-10-28): linha tracejada da **média dos períodos
  completos** (o período atual, pela metade, fica fora; rótulo "Média 4,3 por dia"), **faixas claras
  nos sábados e domingos** (só no agrupamento por dia; o dia da semana também aparece no tooltip e na
  tabela) e o **valor do maior período** escrito acima da barra. O rodapé diz o que o tracejado e as
  faixas significam. **Teclado:** a área do gráfico é focável; setas percorrem os períodos (barra
  destacada + tooltip + anúncio no leitor de tela), Home/End vão pras pontas, Enter abre a lista do
  período e Esc tira o destaque. **Legenda da barra:** os itens também
  abrem a lista do status, abaixo de 1200px e, no toque, em qualquer largura (alvo de 44px); cada fatia tem pelo menos
  24px de largura (WCAG 2.5.8). **Tema:** trocar o tema
  com a tela aberta redesenha o canvas com as cores novas (as cores vêm dos tokens no desenho).
- **Classes globais do Início:** `.status-fill-{open|inProgress|resolved|closed}` (cor de área +
  contorno `--edge` do mesmo matiz, ≥3:1), `.status-dot` (marcador) e `.tk-skeleton` (esqueleto com
  brilho, parado com movimento reduzido).
- **Filtros:** a barra aparece só no escopo "Com filtros". No escopo da empresa, filtros vindos da
  URL valem pras listas do drill-down e ficam à vista numa linha discreta ("Filtros aplicados às
  listas: …" + "Limpar") — filtro ativo e invisível é armadilha.
- **Duas portas pro "Com filtros":** os números (KPIs, Central, SLA) seguem os filtros com o agregado
  (spec 026); o fluxo do gráfico, só com o volume do recorte (spec 028). Entre as duas, o rodapé do
  gráfico diz "Números com os filtros; o fluxo ainda é o da empresa toda", e o clique num período
  abre a lista sem os filtros, pra bater com a barra.
- **Resolvidos no fluxo (spec 028):** a série verde conta resoluções no período (um chamado reaberto
  e resolvido de novo conta outra vez), não o status atual — o Guia diz isso. O back-end aceita até
  366 pontos: num período de mais de um ano, "Dia" fica `aria-disabled` com "Período longo demais" e
  o gráfico pede o menor agrupamento que cabe (semana), sem erro.
- **Abaixo da dobra:** Central de atenção e Alertas de SLA lado a lado; depois SLA detalhado e tempos
  (quem atende a fila) ou "Seus chamados" (quem abre), e as Ações Rápidas.
- **Um número, um lugar:** "Atrasados" e "Sem responsável" moram só no topo; a Central mostra
  críticos e aguardando; "Em risco" e a taxa de SLA moram no grupo de SLA (a regra dos 75% só na
  descrição dele); os Alertas, só a lista; as Ações Rápidas não repetem atalhos que a Central já
  mostra com número.
- **Idade dos números:** "Atualizado há N min" + botão de atualizar nas ações do cabeçalho. A tela
  se atualiza a cada 2 min com a aba visível (pausa com a aba oculta); a recarga mantém os números
  como estão (sem esmaecer) e só gira um indicador discreto no cabeçalho. Uma atualização que falha
  também mantém os números (incluindo os do agregado e os tempos) e o cabeçalho diz "Falha ao atualizar · números
  das HH:mm"; sem números anteriores, o erro aparece uma vez só (na faixa do topo, com "Tentar novamente") e
  os grupos que dependem da mesma leitura (Central, SLA, a barra de composição) dizem "Indisponível no
  momento — veja o aviso acima". "Seus chamados" segue a mesma regra: na recarga, os números ficam; numa
  falha com números na tela, o cabeçalho diz "Falha ao atualizar". Com algum bloco em erro sem
  números (Alertas, tempos, "Seus chamados") e outro com números, a falha é parcial: o cabeçalho diz
  "Nem todos os números carregaram". Sem nenhum bloco com números e nada mais carregando, a falha é
  total: "Não foi possível carregar os números"; na nova tentativa depois dela, o cabeçalho diz
  "Atualizando…" com o indicador de carga, sem a marca de falha. Nos dois casos a hora não anda, a marca de falha
  aparece e a atualização pedida anuncia a falha ("Não foi possível atualizar os números" na parcial,
  "Não foi possível carregar os números" na total), nunca "Atualizado agora"; a primeira carga não
  anuncia nada sozinha (os avisos de erro dos blocos já falam). Revisão visual de 2026-10-29.
  **Anúncio da atualização, manual x automática:** o botão "Atualizar" anuncia o resultado de cada
  pedido ("Atualizado agora" ou a falha), mesmo sem mudança. A atualização automática (a cada 2 min)
  só fala quando o resultado muda: uma falha nova, a troca entre falha total e parcial, ou a volta
  ("Números de volta: atualizado agora"). Sucesso contínuo e falha que persiste ficam em silêncio. Um
  pedido manual durante uma automática em curso vale como manual, e uma troca de escopo no meio fala
  só o resumo do recorte (decisão de 2026-10-29).
  Enquanto a nova tentativa
  carrega, o aviso de erro fica (o resource do Angular mantém o erro num `reload()` com os mesmos
  parâmetros; trocar o recorte zera e mostra o esqueleto): não pisca pro esqueleto nem é lido
  de novo a cada 2 min. Nos Alertas, o botão do aviso gira ("Tentando…", `aria-disabled`); se a
  tentativa pedida no botão falha de novo, o leitor de tela ouve "Ainda não foi possível" uma vez (a
  atualização automática não anuncia); se dá certo, o foco vai pro título do card, sem tirar o foco de
  quem já foi pra outro lugar. Na atualização, o leitor de tela nunca ouve os números (só as frases acima);
  ao trocar um filtro ou o escopo, ouve um resumo curto dos números novos ("Números com os filtros: 3
  atrasados, 12 na fila."). Os botões de atualizar usam `aria-disabled` (não `disabled`) enquanto
  carregam, pra não tirar o foco de quem usa teclado.
- **Tempos:** mediana em destaque (`stat-value`), média ao lado, "horário útil"; abaixo da amostra
  mínima do back-end (`minimumSampleSize`), "Dados insuficientes" com quantos entraram na conta.
  Carregando, o esqueleto dos dois cards (como nos grupos de números). Com período, entram os
  respondidos ou resolvidos nele (a data da conclusão, spec 027).

### Cards de estatística (`<app-stat-card>`, `shared/ui/stat-card`)
Rótulo, número (`div.stat-value`, nunca heading), legenda e ícone em `.icon-tile` no tom semântico.
Carregando: spinner no lugar do número; falhou: "—". O número tem separador de milhar ("1.240") e
o zero fica neutro, sem a cor do tom ("Críticos 0" em vermelho anunciaria um alarme que não existe).
Abaixo de uma faixa de indicadores, use `[compact]="true"`. Interação sempre no card inteiro: `[pressed]`
vira um botão `aria-pressed` que filtra a própria tela (Monitorar), ou um `<a class="stretched-link">`
projetado navega (Dashboard). Nada de "toque pra filtrar" — a legenda descreve o dado.

### Filtros e paginação
- **Filtros (`<app-filter-bar (clear)>`, `shared/ui/filter-bar`):** card discreto (`.filters-card`)
  com o rótulo "Filtros", os campos numa `row g-3` (cada um traz a sua `col-*`) e um rodapé com os
  extras (`filterExtras`, ex.: um switch) à esquerda e "Limpar filtros" à direita. No máximo 3–4
  campos visíveis; os de uso raro vão numa linha "Mais filtros (n)" recolhida (Monitorar; no Início,
  período, departamento e setor à vista e prioridade/responsável em "Mais filtros").
- **Escopo da tela:** um filtro que muda *também* os números do topo (o Setor do Monitorar) fica
  acima deles, fora da barra de filtros, com uma linha dizendo o que ele afeta. No Monitorar, o Setor
  mora nas ações do cabeçalho (`pageActions`) e uma linha só acima dos cards diz o escopo — antes eram
  uma linha própria pro Setor e duas frases, e a fila caía abaixo da dobra (critique de 2026-10-28). Os
  números vêm do agregado da operação (spec 026) e seguem setores, prioridade, responsável e período;
  quando há busca, Status, SLA ou Aguardando aplicados, a linha acima dos cards diz que esses não valem pra eles.
  "Limpar filtros" limpa a barra e mantém o Setor e o "Por página" (escopo e preferência, não filtro).
- **Responsável (Monitorar):** "Qualquer um", "Atribuídos a mim" (a fila pessoal de quem atende) ou
  "Sem responsável" — um select visível ao lado de Status e SLA, não um switch escondido. O Início
  leva direto pra "Atribuídos a mim" (`?assignedToMe=true`; o id de quem está logado não vai pra URL).
- **Fila de trabalho (Monitorar):** sem `status` na URL, a tela abre nos ativos com o prazo que vence
  primeiro no topo; "Todos os status" vai na URL como `?status=all`, e todo drill-down sem status
  manda `status=all`. Ordenar fica no topo da tabela, ao lado do total — não é filtro nem conta em
  "Mais filtros". Os filtros de "Mais filtros" aplicados aparecem em texto ao lado do botão.
- **SLA e prazo numa célula (Monitorar):** etiqueta e, pros ativos, o prazo relativo ("vence em 2h" /
  "venceu há 35 min") pela hora do servidor (`serverNowUtc` do resumo de SLA), recalculado a cada
  30s; atrasado também em texto e peso, não só cor; a data exata no `title`. O selo acompanha o
  relógio: um ativo "No prazo"/"Em risco" que vence com a tela aberta vira "Atrasado" na linha e no
  painel sem esperar recarga. O topo da tabela diz "Atualizado às HH:mm" com um "Atualizar" discreto,
  e a lista recarrega sozinha ao voltar pra aba depois de 5 minutos (não é polling).
- **Tabela com o painel aberto (Monitorar):** Solicitante, Atendente e Setor saem (o painel mostra os
  três) e o título tem largura mínima de 13rem, quebrando só entre palavras — nunca `.text-break` num
  título de coluna estreita, que deixava uma letra por linha. A rolagem horizontal, quando houver, fica
  dentro do `.table-responsive` (`width: 0; min-width: 100%`), nunca na página.
- **Cards de filtro (Monitorar):** o nome acessível leva o número ("Atrasados: 86. Filtrar a tabela"),
  e o segundo clique no card pressionado desfaz o filtro de SLA.
- **Selects que dependem de lista assíncrona** (setor, responsável): a seleção vai no `[selected]` de
  cada opção, não no `[value]` do select — as opções chegam depois e o `[value]` ficaria em "Todos".
- **Paginação (`<app-pagination>`, `shared/ui/pagination`):** rodapé do card da tabela — "Exibindo
  X–Y de N {itens}", Anterior/números/Próxima (no celular só "Página X de Y") e "Por página".

### Estados de dado (carregando, erro, vazio, primeiro uso)
- **Carregando:** spinner com texto pra leitor de tela, no lugar do valor. Uma lista ou bloco
  inteiro usa `<app-loading-state label="Carregando usuários…">` (spinner + texto visível,
  `role="status"`) — nunca um spinner mudo.
- **Disponível em breve:** um bloco cujo endpoint o back-end ainda não entrega (flag desligada em
  `DASHBOARD_FEATURES`, sem requisição) mostra uma linha compacta, neutra, com o ícone
  `bx-info-circle` e texto secundário — nunca esqueleto (promete carga) nem gráfico fantasma (parece
  dado). Vários blocos indisponíveis na mesma linha viram um aviso só.
- **Falha técnica é neutra:** erro de leitura usa `<app-dashboard-notice kind="error">` (texto
  secundário, `btn-outline-secondary` "Tentar novamente"); vermelho fica pro risco operacional (SLA
  vencido, prioridade urgente), nunca pra uma falha do sistema.
- **Erro:** nunca vira dado. Um número que falhou mostra "—" (com "indisponível" pro leitor de
  tela), nunca o `0` de fallback; um gráfico que falhou mostra o erro com "Tentar novamente",
  nunca o vazio "nenhum ticket".
- **Vazio:** diz o que está vazio e, se houver, a próxima ação (`.empty-state`: ícone
  `display-6` em `.empty-state-icon` — cinza neutro, nunca `opacity` —, uma frase em negrito, uma
  linha de orientação e o botão). Filtro sem resultado oferece "Limpar filtros"; lista ainda vazia
  oferece criar o primeiro item. Implementação: `<app-empty-state icon title hint>` com a ação
  projetada (`shared/ui/data-state`).
- **Filtro incoerente** (ex. período com início depois do fim): não é aplicado; o último filtro
  válido continua valendo e a mensagem aparece embaixo dos campos (`.is-invalid` + `aria-invalid`).
- **Erro de ação dentro de um modal:** aparece dentro do próprio modal — o alerta do topo da página
  fica coberto pelo fundo do modal e ninguém vê.
- **Primeiro uso** (empresa sem nenhum ticket): o vazio vira convite com a próxima ação real —
  cadastrar departamentos/setores pra quem administra, abrir o primeiro ticket pros demais.

### Diálogos (`<app-dialog>`, `shared/ui/dialog`)
Todo modal de formulário/escolha é um `<app-dialog title subtitle [busy] (closed)>` mostrado com
`@if` pela tela — nunca `data-bs-toggle="modal"` + "clicar no X escondido" pra fechar. O componente
cuida de fundo escurecido, `role="dialog"`/`aria-modal`, foco inicial (`data-dialog-focus` ou o
primeiro controle), Tab preso, Esc/clique fora (travados enquanto `busy`), rolagem da página
travada e foco devolvido a quem abriu. Formulário: `<form dialogContent>` envolvendo `.modal-body`
e `.modal-footer`. Todo diálogo que envia algo passa `[busy]` com o estado de envio — X, Esc e
clique fora não fecham no meio do salvamento. Cancelar fica à esquerda do primário no rodapé.

### Atribuir responsável (`<app-ticket-assign-dialog>`, `shared/ui`)
Igual no detalhe e no Monitorar: busca com debounce, candidatos como listbox navegável por setas,
marca um e só atribui no botão "Atribuir"/"Reatribuir" — com o aviso "Isso substitui X por Y"
quando já há responsável. Nunca atribuir no primeiro clique. A lista traz só quem a atribuição
aceita (`GET /tickets/assignees`: ativo com `tickets:manage`), com nome completo e setor, sem e-mail.

### Detalhe do chamado
De `lg` pra cima, duas colunas: à esquerda o trabalho (resumo com as ações, conversa e anexos); à
direita, num `<aside>`, o apoio (SLA e histórico). Abaixo disso, coluna única nessa mesma ordem.

### Departamentos e setores
- **Lista em uma coluna:** cada departamento é um card de largura total (`<section>` rotulada pelo
  nome) e os setores dele se distribuem numa grade interna (`.sector-grid`, 1 a 3 colunas).
- **Adicionar setor como a próxima célula da grade** (`.sector-add`): contorno tracejado em índigo
  a 35%, alvo de 44px, índigo só no hover/foco — um lugar a preencher, não um botão por card
  competindo com os setores. Sem nenhum setor, vira "Adicionar o primeiro setor" sob o aviso âmbar.
- **Avisos do Resumo como chips de filtro** (`.insights-chip`): pílula com ícone e contagem ("1
  sem nenhum setor", "2 sem responsável"), `aria-pressed`; "sem setor" em âmbar (é o que tira o
  departamento da abertura de chamados), o resto neutro.
- **Item recém-criado** (`.item-new`): realce índigo que se desfaz em 4s e rolagem até ele — a
  lista reordena por nome e o item novo podia nascer fora da tela. Com `prefers-reduced-motion`,
  só o fundo, sem animação, e a rolagem salta direto. Mesmo tempo da linha nova de Usuários. O
  realce vai do tingido à superfície do card (`--bs-card-bg`), nunca a `transparent`, que mostrava
  o fundo da página por 4s.
- **Sem setor primeiro** (critique 3 de 2026-10-28): os departamentos sem nenhum setor — os únicos
  que somem da abertura de chamados — vêm no topo; o resto segue em ordem alfabética.
- **Busca que acha um setor** marca o nome dele (tingido índigo + "encontrado pela busca" pro leitor
  de tela), pra mostrar o que a busca encontrou dentro do card.
- **"Criar e adicionar outro"** no diálogo de setor novo: cria, limpa o formulário e diz no próprio
  diálogo o que criou (região viva fixa); o botão de fechar vira "Concluir". Os botões de enviar
  dizem a ação: "Criar departamento", "Criar setor", "Salvar alterações".
- **Erros no lugar certo:** falha de leitura da lista num aviso neutro acima dela (com "Tentar
  novamente" contornado em cinza); falha de salvar só dentro do diálogo, descartada ao fechar; falha
  de excluir no card.
- **Responsável na edição:** sem responsável na listagem, não busca o detalhe (o "Salvar
  alterações" já vale). Se a busca do atual falha, o aviso oferece "Tentar de novo" e "Remover
  responsável", e o botão desabilitado aponta pra ele (`aria-describedby`).

### Funções (catálogo fixo)
As funções vêm do back-end como catálogo fixo (identificadas pelo nome): a tela não cria, renomeia
nem exclui — e por isso não tem "Nova Função" (critique de 2026-10-28; o `POST /roles` não existe).
- **Permissões** no "⋮" da linha: "Editar permissões" abre o diálogo com o total marcado, os grupos
  em `<fieldset>` com uma caixa "Todas" (indeterminada com parte marcada), realce índigo leve em cada
  opção que difere do salvo e, no rodapé, o resumo do que mudou ("2 adicionadas e 1 removida"). O
  "Salvar" só habilita com mudança; fechar com marcações não salvas pede "Descartar as alterações?".
  O Administrador tem "Ver permissões": o mesmo diálogo, só leitura, com o motivo à vista.
- **Catálogo que não carregou:** o diálogo diz o que falhou, com "Tentar novamente", e trava o "Salvar".
- **Cor do badge:** removida em 2026-10-29 (ver "Cor de função" acima e a spec 044 do back-end).

### Confirm Dialog
Toda confirmação de ação sensível (excluir, desativar, reativar) usa o modal de confirmação
global do sistema — nunca o `confirm()` nativo do navegador, que quebra a identidade visual. O
botão de confirmação muda de cor conforme a gravidade: vermelho para destrutivo, verde para
restaurativo, índigo para neutro. Quando a ação confirmada começa com "Cancelar" (ex. "Cancelar
chamado"), o botão de desistir se chama "Voltar", não "Cancelar". Implementação: o mesmo
`<app-dialog>` de todos os modais, mostrado com `@if` enquanto o `ConfirmDialogService` tem um pedido
(foco inicial no lado seguro, Esc/clique fora resolvem como "não"); montado depois do
`router-outlet`, fica por cima de um diálogo da tela, e só ele responde ao Esc enquanto aberto.

### Toasts (`ToastService`, `shared/ui/toast-container`)
- Confirmam uma ação feita fora de modal, no canto inferior direito, e somem sozinhos em 4s.
- **Toast com ação** (`show(mensagem, variante, { label, run })`): pra desfazer ou completar a ação
  na hora — "Desfazer" depois de desativar, "Reenviar convite" depois de reativar quem nunca ativou
  a conta. Fica 8s (o dobro), pra dar tempo de ler e alcançar o botão.
- **Prefira "Desfazer" a confirmar** quando a ação é reversível e segura; confirmação fica pro que
  é destrutivo (desativar ainda confirma, porque bloqueia o acesso de alguém na hora).

### Convite e ativação de conta
Ninguém define a senha de outra pessoa (spec 008 do back-end):
- **Cadastro** (só pelo modal "Novo Usuário"; não existe cadastro público — o login orienta a pedir convite ao administrador): só nome, sobrenome, e-mail e funções. O modal
  diz que um convite vai pro e-mail, com validade de 72 horas. Botões "Enviar convite" e "Convidar
  e cadastrar outro"; o toast confirma "Convite enviado para {e-mail}".
- **Ativação** (`/ativar-conta`, pública, visual do login): o token vem no fragmento `#token=` e
  sai da barra de endereço assim que é lido. A pessoa cria a senha (regras visíveis antes de
  digitar). Três estados: formulário, "Conta ativada" com o botão "Entrar" (a ativação não abre
  sessão) e "Link inválido ou expirado", que troca o formulário pela orientação de pedir outro
  convite — a API não diz se expirou, foi usado ou revogado, e a tela também não.
- **Desativar quem atende chamados:** a confirmação diz quantos chamados em aberto a pessoa atende
  ("atende 3 chamados em aberto, que continuam atribuídos a essa pessoa: reatribua em Monitorar
  Chamados"). Se a contagem falhar, a confirmação sai sem o aviso — nunca bloqueia a desativação.
- **Desativar em lote** tem o mesmo amparo do individual (critique de 2026-10-28): soma os chamados
  em aberto dos selecionados ("2 dessas pessoas atendem 5 chamados em aberto…"), lista até 8 nomes
  ("e mais N" depois), oferece "Desfazer" no toast (reativa só quem foi desativado agora) e, se algo
  falhar, o motivo vai no próprio toast — nunca "o motivo está acima da lista".
- **Erro na tela de Usuários:** falha de carga é neutra (`alert-secondary` + "Tentar novamente",
  `btn-outline-secondary`) e a tabela diz "A lista não carregou" em vez do vazio de primeiro uso;
  erro de uma ação continua `alert-danger`, com "X" pra fechar (recarregar não o resolve).
- **Reenviar convite:** no ⋮ da linha e no painel, só pra conta pendente e ativa. Recusa do
  back-end (limite de 5 em 24 horas) aparece acima da lista, com o motivo dele.

### Named Rules
**The Transform-Not-Padding Rule.** Microinterações de deslocamento (hover de item de menu, por
exemplo) animam `transform`, nunca `padding`/`margin` — a primeira é compositada pelo navegador, a
segunda força recálculo de layout a cada quadro.

### Linguagem da interface
- **Sem gênero gramatical presumido:** o nome não diz o gênero da pessoa. "O acesso de Maria Silva
  é bloqueado", não "o login dele"; "Seu acesso está pronto", não "você foi convidado(a)".
- **"Chamado"**, nunca "ticket", em todo texto visível (títulos, botões, legendas, avisos, leitor de
  tela). "Ticket" fica só no código e nas rotas.
- **SLA com um termo por situação:** "No prazo", "Em risco", **"Atrasado"** (passou do prazo e ainda
  está aberto — inclusive por objetivo) e **"Resolvido com atraso"** (encerrado depois do prazo).
  Nunca "vencido" nem "violado".
- **"Início"** é o nome da tela inicial — no menu, nas trilhas e nos "Voltar".
- **"Na fila"** é aberto + em andamento (nunca "backlog"); **"com os filtros"**, nunca "recorte"; tempo de SLA é **"horário útil"**, nunca "minutos úteis".
- **Título da tela = item do menu** ("Usuários", não "Gestão de Usuários").
- **Botões de criar** em caixa de título: "Novo Chamado", "Novo Usuário", "Novo Departamento".
- **Formulário:** Cancelar à esquerda do primário, alinhados à direita no rodapé; erro de envio logo
  acima do botão de enviar (login, ativar conta e primeiro acesso iguais).

## Do's and Don'ts

### Do:
- **Do** reservar o Índigo Confiança para ação primária e estado ativo — ver **The One Accent
  Rule**.
- **Do** usar o par claro/escuro de cada badge semântico conforme o tema ativo — ver **The Badge
  Pair Rule**.
- **Do** declarar a camada de grid base (`col-12`/`col-6`) antes de `col-md-*`/`col-lg-*` em
  qualquer linha de formulário ou card.
- **Do** agrupar mais de duas ações de linha de tabela num menu "⋮" em vez de botões lado a lado.
- **Do** usar `transform` para microinterações de deslocamento, nunca `padding`/`margin`.
- **Do** manter login/ativação sempre no tema claro, independente da preferência do sistema
  operacional do usuário.
- **Do** mostrar "—" e uma mensagem de erro quando um dado não carregou — ver **Estados de dado**.
- **Do** usar movimento só pra explicar uma mudança de estado, sempre com um caminho
  `prefers-reduced-motion` (o realce do alerta de SLA que vence é o modelo).
- **Do** dar a todo controle só de ícone um `<button>` com `aria-label` e 44px (`.btn-icon`) — nada
  de `<a href="javascript:void(0)">`.
- **Do** usar o painel lateral com a diretiva `appSidePanel` e os estilos globais `.info-panel*` em
  qualquer nova tela de lista com consulta rápida — ver **Painel lateral**.
- **Do** dar 44×44px de alvo a todo controle tocável, inclusive checkbox de tabela (`.select-hit`)
  e o botão de mostrar senha.

### Don't:
- **Don't** usar gradiente em texto — é decoração sem função; use peso ou tamanho para ênfase.
- **Don't** usar o `confirm()`/`alert()` nativo do navegador para qualquer confirmação — sempre o
  modal de confirmação do sistema.
- **Don't** aplicar sombra tintada de índigo no modo escuro, nem sombra preta pura no modo claro —
  ver **The Tinted-Light, Neutral-Dark Rule**.
- **Don't** inventar uma nova cor de acento para uma tela específica — toda necessidade de cor não
  resolvida por índigo ou pelas quatro cores semânticas é um sinal pra reusar um token existente,
  não criar um novo.
- **Don't** prometer "ao vivo"/tempo real numa tela que não se atualiza sozinha.
- **Don't** forçar `text-transform: uppercase` em badges — o rótulo já vem escrito como deve ser lido.
- **Don't** usar `opacity` pra dizer "inativo" ou "decorativo" em linha, ícone ou texto que precisa
  ser lido — derruba o contraste abaixo de AA; use cor de token (`text-secondary`, `text-muted`).
- **Don't** publicar trilha/painel "Em breve" sem dado real numa tela nova — só onde já foi decidido
  manter como prévia (Monitorar Chamados).
- **Don't** fazer coreografia de carregamento (números contando, entradas em sequência) em tela de
  operação — quem abre o Dashboard quer o número, não a animação.
