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
  text-muted: "#6b7684"
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
- **Ardósia Secundária** (`#5f6f82`): texto secundário/rótulos de formulário (claro).
  Escurecida em 2026-10-27 (era `#697a8d`: ~4,40:1 sobre branco, ~4,05:1 sobre o fundo de página)
  — agora ~5,1:1 sobre branco e ~4,7:1 sobre `#f5f5f9`; achado do audit de Meus Chamados.
- **Névoa Terciária** (`#6b7684`): texto terciário/placeholder, cabeçalho de tabela (claro).
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

*Exceção deliberada:* o gráfico "Chamados criados" do Dashboard usa uma paleta categórica de 5 cores
(azul, laranja, verde, âmbar, rosa — validada pra daltonismo) só como ritmo visual entre barras, a
pedido do usuário em 2026-10-24. A cor ali não carrega significado; a exceção vale só pra esse
gráfico, não abre precedente pra outras telas.

**The RGB Token Rule.** Fundo ou realce translúcido de marca/alerta usa os tokens em RGB —
`rgba(var(--tk-primary-rgb), α)` e `rgba(var(--tk-danger-rgb), α)` — nunca o valor literal
(`rgba(105, 108, 255, …)`). Consolidado em 2026-10-27.

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
- **Title** (700, 1.5rem/`h4`): título de cada tela (ex. "Usuários", "Bom dia, {nome}!").
  Semanticamente é o `h1` da tela (`<h1 class="h4">`); títulos de card são `<h2 class="h5">` — o
  nível do heading segue a estrutura, o tamanho vem da classe (sem pular de `h4` pra `h6`).
- **Body** (400, 1rem): texto corrido, valores de tabela, conteúdo de formulário.
- **Label** (600–700, 0.72–0.85rem, uppercase, tracking 0.06–0.08em): rótulos de formulário,
  cabeçalho de tabela, cabeçalho de seção do menu lateral ("ADMINISTRAÇÃO"), títulos de seção do
  Guia da Tela e os rótulos da lista rótulo/valor do painel lateral (`.info-list dt`, 0.72rem —
  com o valor ao lado no corpo, 1rem; nunca dois tamanhos quase iguais pra rótulo e valor).

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

**Celular:** tabelas com várias colunas viram uma lista de cards abaixo de `md` (ver
`.table-stack` em Components) em vez de rolar pro lado. Quando a ordem visual muda entre desktop e
celular, a ordem do DOM segue a do celular (leitura e Tab iguais ao que se vê) e só o desktop
reordena com `order-lg-*`. No Dashboard: o que pede ação (Alertas de SLA, Ações Rápidas) vem antes
do volume histórico.

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
- **Cor de função (prévia local):** o admin escolhe a cor de cada função na tela Funções
  (`.badge-role-custom`, fundo `cor 15% + branco`, texto `cor 65% + preto`). Cor sem contraste AA
  nesse par é recusada na escolha e na criação, e `getRoleColor` devolve `null` (índigo) pra qualquer
  cor salva que não passe — nenhuma tela que mostra o badge revalida por conta própria.
- **Convite pendente** (conta cadastrada, ainda sem senha): `bg-label-warning` — âmbar é "esperando
  alguém", o mesmo raciocínio do "Aberto" nos chamados. Abaixo do badge, uma linha pequena diz a
  validade do convite ("Vale até 01/11 15:00") ou "Convite expirado".

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
Usado em Meus Chamados e Monitorar Chamados. Texto que não quebra linha (`text-truncate`) dentro do
card precisa de `width: 0; min-width: 100%`, senão alarga a página inteira.

### Icon Tile (`.icon-tile`)
Ícone centralizado num quadrado/círculo de fundo suave — sempre junto de `.badge.bg-label-*` e
`.rounded`/`.rounded-circle`, com `aria-hidden` (é decoração do rótulo ao lado). Tamanhos:
`-sm` 2.25rem (linhas de lista), padrão 2.5rem, `-lg` 3rem (KPIs), `-xl` 4rem (estado vazio/primeiro
uso).

### Alertas de SLA (assinatura do produto)
O SLA é o diferencial do Tickest, e o card que o mostra segue regras próprias:
- Lista vencidos **e** em risco em 5 vagas: até 3 vencidos (o vencido há mais tempo primeiro) e até
  2 em risco (o que vence primeiro), e a sobra de um grupo vai pro outro — só por prazo, muitos
  vencidos escondiam os em risco, os únicos que ainda dá pra salvar. Os totais da empresa ficam no
  topo, com o mesmo número grande dos KPIs, cada um levando à fila de Monitorar já filtrada.
- O card mostra "Atualizado às HH:mm" e tem um botão "Atualizar" que recarrega só os alertas; ao
  voltar pra aba com uma lista de mais de 5 minutos, recarrega sozinho (não é polling).
- Cada item tem etiqueta "Vencido"/"Em risco" em texto **e** cor, e o prazo relativo vivo ("vence
  em 2h 14min" / "venceu há 35 min"), recalculado a cada 30s com a aba visível e ancorado na hora
  do servidor (`serverNowUtc`), nunca no relógio da máquina.
- Quando um item vence com a tela aberta: vira "Vencido", os totais acompanham, um `aria-live`
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
- **Telas de entrada** (login, registro, primeiro acesso) não usam o cabeçalho — o título do card é
  o `<h1 class="h4">` da página.

### Guia da Tela e Resumo
- **Guia da Tela (`<app-screen-guide storageKey="…">` + `<app-guide-section title="…">`,
  `shared/ui/screen-guide`):** card recolhível logo abaixo do cabeçalho, **aberto só na primeira
  visita** a cada tela (depois começa fechado), com a escolha do usuário lembrada no navegador. Borda fina e sem sombra (`.guide-card`):
  apoio, mais discreto que o conteúdo. Seções com título `h2` em versalete. O componente do domínio
  (`*-guide.component`) só escreve o texto. Explica legenda e comportamento da tela — nunca repete
  o que a interface já diz.
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
mostra primeiro "Seus chamados" — em aberto, em andamento e resolvidos, do próprio usuário
(`MyTicketsSummaryStore`, GET /tickets/mine/summary), cada card levando a Meus Chamados — e só
depois "Toda a empresa", com os números de sempre, iguais pra todo papel. Os grupos ganham um
rótulo em versalete (`.section-label`).

### Cards de estatística (`<app-stat-card>`, `shared/ui/stat-card`)
Rótulo, número (`div.stat-value`, nunca heading), legenda e ícone em `.icon-tile` no tom semântico.
Carregando: spinner no lugar do número; falhou: "—". Interação sempre no card inteiro: `[pressed]`
vira um botão `aria-pressed` que filtra a própria tela (Monitorar), ou um `<a class="stretched-link">`
projetado navega (Dashboard). Nada de "toque pra filtrar" — a legenda descreve o dado.

### Filtros e paginação
- **Filtros (`<app-filter-bar (clear)>`, `shared/ui/filter-bar`):** card discreto (`.filters-card`)
  com o rótulo "Filtros", os campos numa `row g-3` (cada um traz a sua `col-*`) e um rodapé com os
  extras (`filterExtras`, ex.: um switch) à esquerda e "Limpar filtros" à direita. No máximo 3–4
  campos visíveis; os de uso raro vão numa linha "Mais filtros (n)" recolhida (Monitorar).
- **Escopo da tela:** um filtro que muda *também* os números do topo (o Setor do Monitorar) fica
  acima deles, fora da barra de filtros, com uma linha dizendo o que ele afeta.
- **Responsável (Monitorar):** "Qualquer um", "Atribuídos a mim" (a fila pessoal de quem atende) ou
  "Sem responsável" — um select visível ao lado de Status e SLA, não um switch escondido. O Início
  leva direto pra "Atribuídos a mim" (`?assignedToMe=true`; o id de quem está logado não vai pra URL).
- **Paginação (`<app-pagination>`, `shared/ui/pagination`):** rodapé do card da tabela — "Exibindo
  X–Y de N {itens}", Anterior/números/Próxima (no celular só "Página X de Y") e "Por página".

### Estados de dado (carregando, erro, vazio, primeiro uso)
- **Carregando:** spinner com texto pra leitor de tela, no lugar do valor. Uma lista ou bloco
  inteiro usa `<app-loading-state label="Carregando usuários…">` (spinner + texto visível,
  `role="status"`) — nunca um spinner mudo.
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
e `.modal-footer`. Cancelar fica à esquerda do primário no rodapé.

### Atribuir responsável (`<app-ticket-assign-dialog>`, `tickets/ui`)
Igual no detalhe e no Monitorar: busca com debounce, candidatos como listbox navegável por setas,
marca um e só atribui no botão "Atribuir"/"Reatribuir" — com o aviso "Isso substitui X por Y"
quando já há responsável. Nunca atribuir no primeiro clique.

### Detalhe do chamado
De `lg` pra cima, duas colunas: à esquerda o trabalho (resumo com as ações, conversa e anexos); à
direita, num `<aside>`, o apoio (SLA e histórico). Abaixo disso, coluna única nessa mesma ordem.

### Cor da função
A cor do badge (prévia só neste navegador) se escolhe no diálogo "Cor do badge…" do "⋮" da linha,
com prévia ao vivo e a checagem de contraste; a linha da tabela mostra só a amostra da cor.

### Confirm Dialog
Toda confirmação de ação sensível (excluir, desativar, reativar) usa o modal de confirmação
global do sistema — nunca o `confirm()` nativo do navegador, que quebra a identidade visual. O
botão de confirmação muda de cor conforme a gravidade: vermelho para destrutivo, verde para
restaurativo, índigo para neutro. Quando a ação confirmada começa com "Cancelar" (ex. "Cancelar
ticket"), o botão de desistir se chama "Voltar", não "Cancelar". Implementação: a instância do
`bootstrap.Modal` é criada no momento de abrir, ligada ao elemento atual — criada no nascimento
do componente, ela ficava presa a um elemento que a hidratação do SSR descartava e nenhuma
confirmação abria (corrigido em 2026-10-27).

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
- **Título da tela = item do menu** ("Usuários", não "Gestão de Usuários").
- **Botões de criar** em caixa de título: "Novo Chamado", "Novo Usuário", "Nova Função", "Novo Departamento".
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
- **Do** manter login/registro sempre no tema claro, independente da preferência do sistema
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
