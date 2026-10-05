---
target: user
total_score: 34
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\users\\feature-user-list\\user-list.component.html"
target_fingerprint: "sha256:020e1a872474262f722dbbef8155810a2924142909d2183ed71415de3cfecb67"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\users\\feature-user-list\\user-list.component.html"
timestamp: 2026-10-05T13-24-49Z
slug: eature-user-list-user-list-component-html-b2da68d1
---
Method: dual-agent (A: a7d6a853a5be210bb · B: af951d5c920fe75a8)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Criar/editar usuário só fecha o modal; desativar/reativar/atribuir funções já mostram toast |
| 2 | Match System / Real World | 4 | "Desativar" = bloquear login, não "excluir" — bate com a prática real |
| 3 | User Control and Freedom | 3 | Reativar é o único "desfazer"; sem cancelar lote em andamento |
| 4 | Consistency and Standards | 3 | Tokens seguem o DESIGN.md; padrão de feedback varia entre mutações |
| 5 | Error Prevention | 4 | Confirmações nominais; auto-bloqueio da própria conta impedido estruturalmente |
| 6 | Recognition Rather Than Recall | 4 | Nomes repetidos nos diálogos e nos toasts |
| 7 | Flexibility and Efficiency | 3 | Sem ordenação de coluna, sem filtro por função/departamento |
| 8 | Aesthetic and Minimalist Design | 4 | Contenção do passo "quieter" é visível e intencional |
| 9 | Error Recovery | 4 | Falha parcial do lote relata exatamente quem falhou, pelo nome |
| 10 | Help and Documentation | 2 | Nenhuma ajuda inline/tooltip além do aviso no modal de funções |
| **Total** | | **34/40** | **Bom** |

## Design Specificity Verdict

**LLM assessment**: Enraizado no produto. `isCurrentUser` impede autodesativação, aviso "substitui completamente" antes de sobrescrever funções, desativação em lote como melhor esforço contra endpoint sem API de lote, copy "O login dele será bloqueado imediatamente" — tudo específico do domínio RBAC/sessão do Tickest. Ponto genérico: nenhuma menção a auditoria/LGPD perto de ação quase-destrutiva, apesar de LGPD ser a barra de conformidade confirmada no PRODUCT.md.

**Deterministic scan**: 1 achado advisory (`design-system-color`, `rgb(0,0,0)` no `<h4>` do breadcrumb) — falso positivo confirmado (sem regra `color` autorada em lugar nenhum, é o default do navegador). Achado manual adicional: `rgba(255,62,29,...)`/`rgba(113,221,55,...)` no CSS do componente são literais, não tokens `--tk-*`, mas reaproveitam valores já usados em `styles.css`/layout principal — lacuna pré-existente no sistema de tokens, não drift desta tela.

**Visual overlays**: indisponíveis — bloqueio de múltiplas sessões Chrome sem desambiguação. Nenhuma captura obtida.

## Overall Impression

A tela mais madura das três revisadas nesta sessão — o padrão de feedback (toast, confirmação nominal, badge com limite) está bem internalizado. A maior lacuna agora é eficiência para uso diário: sem ordenação/filtro por função, e o bloqueio de mutação é global (a linha toda "congela" quando qualquer usuário está sendo desativado).

## What's Working

- `isCurrentUser` (user-list.component.ts:196-198, aplicado em html:164) impede o Admin Master de se autodesativar.
- Badge "+N" de funções ocultas totalmente acessível: `tabindex="0"` + `title` + `aria-label` (html:126-131).
- Desativação em lote relata exatamente quem falhou pelo nome em falha parcial (users.store.ts:215-250).

## Priority Issues

- **[P1] Feedback de sucesso inconsistente entre mutações** (ts:73-91 vs 210/226/171)
  **Por que importa**: criar/editar usuário só fecham o modal, sem toast; desativar/reativar/atribuir funções já mostram.
  **Fix**: adicionar `toastService.show(...)` no sucesso de `createUser`/`onEditSubmit`.
  **Comando sugerido**: /impeccable clarify

- **[P1] Bloqueio de mutação é global, não por linha** (users.store.ts:26-27, html:168,172,67)
  **Por que importa**: `deactivating`/`activating` são booleanos únicos, desabilitam o botão de TODA linha ao agir sobre uma.
  **Fix**: rastrear ids em andamento num `Set<string>`, desabilitar só a(s) linha(s) afetada(s).
  **Comando sugerido**: /impeccable harden

- **[P2] Sem `aria-current` na paginação, sem `aria-live` pra seleção/toast** (html:202-205, html:62)
  **Por que importa**: página ativa só por cor; seleção/toasts sem região viva pra leitor de tela.
  **Fix**: `aria-current="page"` no botão ativo; `aria-live="polite"` na contagem de seleção e no container de toast.
  **Comando sugerido**: /impeccable harden

- **[P2] Sem ordenação de coluna nem filtro por função/departamento** (html:23-48)
  **Por que importa**: auditar "quem tem a função Admin" exige paginar manualmente por tudo.
  **Fix**: ordenação clicável em Nome/Cadastrado em + filtro de função ao lado do Status.
  **Comando sugerido**: /impeccable optimize

- **[P3] Fan-out de desativação em lote sem limite de concorrência** (store.ts:220-226, pageSize até 100)
  **Por que importa**: "selecionar todos" com 100 itens dispara 100 requisições simultâneas.
  **Fix**: lotear requisições (ex.: 10 por vez) ou pedir endpoint de lote no backend.
  **Comando sugerido**: /impeccable harden

## Persona Red Flags

**Alex (usuário avançado)**: sem ordenação/filtro por função força varredura manual; filtros voltam ao padrão em todo `ngOnInit` (ts:98), visão filtrada não pode ser salva/compartilhada.

**Sam (dependente de acessibilidade)**: página ativa só por cor; seleção/toasts sem `aria-live`; bloqueio global de botões lê como "tudo desabilitado" sem motivo declarado.

**Riley (testador de estresse)**: lote de 100 desativações em paralelo contra endpoint de item único, sem limite de concorrência.

## Minor Observations

- Sem validação cruzada mín/máx entre as datas de período (html:42-46).
- Usuário sem nenhuma função mostra só "—" (html:124), sem aviso.
- Faltam `--tk-danger-rgb`/`--tk-success-rgb` no sistema de tokens (literais já espalhados pelo projeto, não introduzidos aqui).

## Questions to Consider

1. `deactivatedAtUtc` é limpo no backend ao reativar? Se não, um usuário reativado pode mostrar permanentemente um "Desativado em" vermelho (html:142-144).
2. A lacuna de toast em criar/editar foi corte de escopo intencional ou esquecimento?
3. O fan-out sem endpoint de lote é limitação de backend aceita, ou vale escalar antes de páginas maiores?
