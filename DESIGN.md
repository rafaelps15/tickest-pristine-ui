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
  text-secondary: "#697a8d"
  text-muted: "#6b7684"
  surface: "#ffffff"
  page-bg: "#f5f5f9"
  border: "#e7e7ff"
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
  body:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Public Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 700
    letterSpacing: "0.08em"
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
modal, dropdown, tabela). As telas de entrada (login/registro) são a única exceção: mantêm um
tratamento de marca fixo e mais "premium" (vidro/blur sobre gradiente), sempre claro,
independente da preferência do sistema operacional — a porta de entrada carrega a identidade da
marca; a área de trabalho, depois do login, responde à preferência de quem está usando.

**Key Characteristics:**
- Admin limpo com um único acento de cor usado com disciplina, nunca decorativo
- Suporte real a claro/escuro na área autenticada; login/registro fixos no visual de marca
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
- **Índigo Confiança Escuro** (`#5f61e6`): ponta escura do gradiente do botão primário e seu
  estado de hover.
- **Índigo Profundo** (`#3a3ca3`): acento mais escuro, usado só na wordmark da marca
  ("tickest") no cabeçalho de login/registro.

### Neutral
- **Grafite Texto** (`#2b2c40`): texto principal (claro).
- **Ardósia Secundária** (`#697a8d`): texto secundário/rótulos de formulário (claro).
- **Névoa Terciária** (`#6b7684`): texto terciário/placeholder, cabeçalho de tabela (claro).
  Escurecido em 2026-10-08 (era `#a1acb8`, ~2,31:1) pra passar 4,5:1 WCAG AA — auditado no
  Dashboard. `--tk-text-secondary` (`#697a8d`, ~4,40:1) ficou próximo do limite nessa correção e
  também merece revisão numa próxima rodada.
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
- **Vermelho Alerta** (`#ff3e1d`): status "Cancelado", ação destrutiva (excluir, desativar),
  prioridade "Urgente". Mesma ressalva de uso acima.

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

**The Badge Pair Rule.** Toda cor semântica (success/warning/info/danger) existe em dois pares:
um "soft" (fundo pastel claro + texto na variante escurecida do matiz, ver **Semantic Text**
acima — não a cor semântica pura, que falha contraste sobre o próprio fundo pastel) para o modo
claro, e um "soft dark" (fundo do mesmo matiz em baixa opacidade sobre fundo escuro + texto mais
claro) para o modo escuro. Nunca usar o par claro diretamente sobre fundo escuro — fica estourado.

## Typography

**Display Font:** Sora (com fallback `sans-serif`) — só na wordmark "tickest" do cabeçalho de
login/registro.
**Body Font:** Public Sans (com fallback `system-ui, -apple-system, "Segoe UI", sans-serif`) —
todo o resto da interface, de parágrafos a títulos de tela.

**Character:** Public Sans é uma grotesca neutra e muito legível — carrega o peso operacional do
dia a dia sem chamar atenção pra si. Sora entra só no momento de marca (o nome do produto no
login), com peso 700, minúsculo e rastreamento apertado (-2px) — a única vez que a tipografia tem
permissão de ter personalidade própria.

### Hierarchy
- **Display** (700, 3rem, line-height 1): a wordmark "tickest" em login/registro. Único uso de
  Sora no sistema.
- **Title** (700, 1.5rem/`h4`): título de cada tela (ex. "Gestão de Usuários", "Seja bem-vindo(a),
  {nome}!").
- **Body** (400, 1rem): texto corrido, valores de tabela, conteúdo de formulário.
- **Label** (600–700, 0.72–0.85rem, uppercase, tracking 0.06–0.08em): rótulos de formulário,
  cabeçalho de tabela, cabeçalho de seção do menu lateral ("ADMINISTRAÇÃO").

### Named Rules
**The Brand-Only Display Rule.** Sora nunca aparece fora da wordmark de login/registro — títulos
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

Login/registro têm sua própria camada de elevação, mais dramática e fixa (não dark-aware): o card
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
- **Primary:** gradiente `linear-gradient(to right, índigo, índigo-escuro)`, texto branco, sombra
  tintada no repouso.
- **Hover:** eleva 1px (`translateY(-1px)`) e inverte a direção do gradiente; sombra cresce.
- **Outline (secondary/danger/success):** transparente com borda, mesmo lift de 1px no hover, sem
  gradiente — reservado para ações secundárias ou destrutivas fora do botão primário da tela.
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

### Cards / Containers
- **Corner Style:** `rounded-md` (0.75rem); modais usam `rounded-lg` (1.25rem).
- **Background:** `surface` (branco/carvão conforme o tema).
- **Shadow Strategy:** ver Elevation & Depth — `shadow-sm` em repouso; cards de estatística do
  dashboard sobem para uma sombra maior e elevam 5px no hover.
- **Border:** nenhuma — a sombra é o único separador.
- **Internal Padding:** `p-3` (filtros, listas compactas) a `p-4`/`p-lg-5` (corpo de formulário).

### Inputs / Fields
- **Style:** borda de 1.5px em cinza neutro, `rounded-sm`, fundo `surface`.
- **Focus:** borda muda para índigo + anel de foco (`box-shadow` em baixa opacidade da marca) —
  nunca só `outline: none` sem substituto.
- **Error:** classe `.is-invalid` do Bootstrap + mensagem abaixo do campo, nunca só cor.

### Navigation
- **Sidebar:** 260px fixos, fundo `surface`, itens agrupados sob cabeçalhos em maiúsculas
  rastreadas (ex. "ADMINISTRAÇÃO", visível só com a permissão correspondente). Item ativo ganha
  fundo em gradiente suave da marca + barra vertical de 3px à esquerda + texto em índigo. Hover
  desloca o item 0.15rem para a direita (`transform`, nunca `padding` — ver Named Rule abaixo).
- **Navbar:** barra flutuante com vidro/blur ancorada no topo do conteúdo, não no topo da viewport.
- **Mobile (<1199px):** sidebar vira off-canvas deslizante, com overlay escurecido.

### Row Actions (menu "⋮")
Quando uma linha de tabela tem mais de duas ações possíveis, elas vão num menu dropdown
acionado por um ícone de três pontos verticais — nunca uma fileira de botões texto+ícone lado a
lado. O botão do menu é discreto (sem borda) até hover/foco. Dropdowns dentro de um container com
scroll (`.table-responsive`) usam posicionamento `fixed` do Popper, não o `absolute` padrão do
Bootstrap, pra não ficarem cortados pelo scroll.

### Confirm Dialog
Toda confirmação de ação sensível (excluir, desativar, reativar) usa o modal de confirmação
global do sistema — nunca o `confirm()` nativo do navegador, que quebra a identidade visual. O
botão de confirmação muda de cor conforme a gravidade: vermelho para destrutivo, verde para
restaurativo, índigo para neutro.

### Named Rules
**The Transform-Not-Padding Rule.** Microinterações de deslocamento (hover de item de menu, por
exemplo) animam `transform`, nunca `padding`/`margin` — a primeira é compositada pelo navegador, a
segunda força recálculo de layout a cada quadro.

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
- **Do** manter login/registro sempre no tema claro, independente da preferência do sistema
  operacional do usuário.

### Don't:
- **Don't** usar gradiente em texto — é decoração sem função; use peso ou tamanho para ênfase.
- **Don't** usar o `confirm()`/`alert()` nativo do navegador para qualquer confirmação — sempre o
  modal de confirmação do sistema.
- **Don't** aplicar sombra tintada de índigo no modo escuro, nem sombra preta pura no modo claro —
  ver **The Tinted-Light, Neutral-Dark Rule**.
- **Don't** inventar uma nova cor de acento para uma tela específica — toda necessidade de cor não
  resolvida por índigo ou pelas quatro cores semânticas é um sinal pra reusar um token existente,
  não criar um novo.
