---
target: roles (Funções)
total_score: 19
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\roles\\feature-role-list\\role-list.component.html"
target_fingerprint: "sha256:90f44c1f8426b2b5e577ca18dec9d300fdb9c6de7fef3f18d958090669633c6b"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\roles\\feature-role-list\\role-list.component.html"
timestamp: 2026-10-05T03-53-19Z
slug: eature-role-list-role-list-component-html-185d21a7
closed: true
---
Method: dual-agent (A: a804fd38aa6d90f30 · B: adfe84c3e1dac4610)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Spinner sem texto/`aria-live`; erro de mutação renderiza acima da tabela — invisível com qualquer modal aberto |
| 2 | Match System / Real World | 3 | Bom vocabulário de domínio (Função, Permissões, Administrador) |
| 3 | User Control and Freedom | 2 | Sem confirmação ao salvar mudança de permissões; fechar o modal descarta a edição em silêncio |
| 4 | Consistency and Standards | 2 | Viola a própria regra de badge do `DESIGN.md` (máx. 2 + "+N") — badges de permissão renderizam sem limite |
| 5 | Error Prevention | 1 | Nenhuma fricção/confirmação extra antes de tirar permissões `isAdministrative` de uma função |
| 6 | Recognition Rather Than Recall | 3 | Descrição sob cada checkbox ajuda; mas sem busca/filtro pra um catálogo que só cresce |
| 7 | Flexibility and Efficiency | 1 | Sem marcar/limpar tudo por grupo, sem busca, sem operação em lote — lacuna real pra um admin de uso frequente |
| 8 | Aesthetic and Minimalist Design | 3 | Limpo em escala pequena, quebra com muitas permissões/badges |
| 9 | Error Recovery | 1 | Falha ao salvar deixa o usuário no modal sem motivo visível — o erro fica atrás do backdrop |
| 10 | Help and Documentation | 1 | Nenhuma explicação do que "administrativa" implica ou o que perder uma permissão quebra |
| **Total** | | **19/40** | **Poor** |

## Design Specificity Verdict

**LLM assessment**: Lê como uma tela genérica de matriz de permissões em Bootstrap vestindo a pele visual do Tickest, não uma pensada pra este modelo de RBAC específico. O modelo de dados é genuinamente interessante — roles são dados dinâmicos, permissões carregam metadado de `group`/`isAdministrative` construído pra agrupar e sinalizar risco — mas o template mal usa essa riqueza semântica. `isAdministrative` só ganha um badge pequeno inline; nada no layout, cor ou interação trata "uma permissão que pode conceder controle do sistema" de forma diferente de "uma permissão pra ver um relatório". A tela poderia ser igualmente uma tela genérica de feature flags.

**Deterministic scan**: 2 achados. **1 falso positivo** (mesmo padrão `rgb(0,0,0)` no `<h4>` de breadcrumb, confirmado por leitura do código-fonte — sem cor literal autorada). **1 achado real**: `font-size: 0.8125rem` fora da escala tipográfica documentada no `DESIGN.md`, em `role-list.component.css:2` — e, no mesmo seletor CSS, a cor ao lado corretamente usa `var(--tk-text-muted)`, enquanto o tamanho de fonte ficou hardcoded. Inconsistência real de disciplina de token dentro da mesma regra.

**Visual overlays**: não disponíveis — mesmo bloqueio de múltiplos navegadores Chrome conectados à conta, sem acesso à ferramenta que resolveria a escolha. Nenhuma captura obtida.

## Overall Impression

A mais fraca das 3 telas revisadas. O único caminho realmente protegido (a role Administrador) é bem tratado, mas o fluxo que é o próprio motivo de existir desta tela — atribuir permissões — tem lacunas reais de prevenção de erro e de escala.

## What's Working

- Botão de permissões da role Administrador corretamente desabilitado, com `title` explicando o motivo (`role-list.component.html:51-53`).
- Permissões agrupadas por `group`, preservando a ordem vinda da API — estrutura real de agrupamento (`roles.store.ts:56-71`).
- Formulário de criação de role com validação simples e no escopo certo.

## Priority Issues

- **[P0] Erro de mutação renderiza fora dos dois modais** (`role-list.component.html:12-14`)
  **Por que importa**: uma falha ao criar role ou atribuir permissões fica invisível pra quem está olhando o modal aberto — ele simplesmente não vê por que nada aconteceu.
  **Fix**: renderizar o erro dentro do corpo de cada modal, não só no topo da página.
  **Comando sugerido**: `/impeccable harden`

- **[P1] Nenhuma confirmação ao remover permissões administrativas**
  **Por que importa**: tirar uma permissão `isAdministrative` de uma role em uso ativo tem zero fricção, aviso ou contexto de impacto — contradiz o próprio princípio de Confirm Dialog que documentamos pra ações sensíveis.
  **Fix**: um passo extra de confirmação (reaproveitando o `ConfirmDialogService`) quando a diferença remove uma permissão administrativa.
  **Comando sugerido**: `/impeccable harden`

- **[P1] Badges de permissão sem limite na tabela** (`role-list.component.html:44-48`)
  **Por que importa**: viola a própria regra de overflow de badge que documentamos (máx. 2 + "+N").
  **Fix**: aplicar o mesmo limite/tooltip já usado em Usuários.
  **Comando sugerido**: `/impeccable polish`

- **[P2] Checklist de permissões sem busca/marcar-tudo** — inutilizável a partir de ~50 permissões no catálogo.
  **Fix**: busca + marcar/limpar por grupo.
  **Comando sugerido**: `/impeccable layout`

- **[P3] Spinner de carregamento sem rótulo acessível.**
  **Comando sugerido**: `/impeccable polish`

## Persona Red Flags

**Alex (usuário avançado)**: sem seleção em lote nem busca no modal de permissões — precisa rolar e clicar checkbox por checkbox toda vez.

**Sam (dependente de acessibilidade)**: spinner não anuncia nada; a justificativa do botão desabilitado só existe num `title` de hover, não confiavelmente exposta a tecnologia assistiva; grupos usam `<h6>` em vez de `fieldset`/`legend`, então os grupos de checkbox não têm associação programática.

## Minor Observations

- `role-list.component.css` tem uma única regra (o achado real do detector está nela).
- Badge "Padrão para novos colaboradores" usa `bg-label-secondary` genérico, não uma cor semântica do `DESIGN.md`.

## Questions to Consider

- Se permissões são "dado, não código" segundo o `PRODUCT.md`, por que a interface trata o catálogo como pequeno e estático em vez de pesquisável e escalável?
- Atribuir/remover uma permissão administrativa deveria algum dia ser uma ação de um clique só, sem confirmação?
