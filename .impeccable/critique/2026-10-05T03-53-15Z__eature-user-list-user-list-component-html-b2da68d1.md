---
target: user (Gestão de Usuários)
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\users\\feature-user-list\\user-list.component.html"
target_fingerprint: "sha256:d51bcb992df185098dfc0653b7946dfa1ed75829a9fcfce9de3d6fd7c13d3f73"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\users\\feature-user-list\\user-list.component.html"
timestamp: 2026-10-05T03-53-15Z
slug: eature-user-list-user-list-component-html-b2da68d1
closed: true
---
Method: dual-agent (A: af6b8333fe6ae1e0d · B: a62aa90c3db754abe)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Nenhum toast de sucesso após desativar/reativar/editar/atribuir — só a lista se atualiza em silêncio |
| 2 | Match System / Real World | 3 | "dele" no texto de confirmação assume gênero |
| 3 | User Control and Freedom | 2 | Sem desfazer; "Limpar filtros" reseta tudo de uma vez, sem limpeza granular |
| 4 | Consistency and Standards | 3 | `card-footer bg-white` fixo quebra o contrato de tema escuro que o `DESIGN.md` promete pras telas autenticadas |
| 5 | Error Prevention | 2 | `[class.disabled]` nos itens do dropdown é só CSS — não `aria-disabled`, continua clicável em pleno meio de uma mutação |
| 6 | Recognition Rather Than Recall | 3 | Modal de atribuir funções não tem busca/diff; admin precisa lembrar o estado anterior rolando uma lista de checkboxes |
| 7 | Flexibility and Efficiency | 1 | Sem ordenar coluna, sem seleção/desativação em lote, sem exportar — fraco pra uma ferramenta administrativa de uso diário |
| 8 | Aesthetic and Minimalist Design | 3 | Disciplinado; mas "Desativado em" fica "—" na maioria das linhas, ruído |
| 9 | Error Recovery | 3 | Mensagens em português por status são boas; mas aparecem só num banner no topo da página, longe da linha que falhou |
| 10 | Help and Documentation | 2 | Bom aviso inline no modal de funções; nada em mais nenhum lugar |
| **Total** | | **25/40** | **Acceptable** |

## Design Specificity Verdict

**LLM assessment**: Não é um scaffold genérico fingindo estar temático — aplica de verdade as próprias regras do sistema do Tickest: o badge "+N" de funções excedentes bate exatamente com a Badge Pair Rule do `DESIGN.md`, o menu de ações "⋮" com `appDropdownFixedPosition` implementa a correção de posicionamento documentada ao pé da letra, e a cor do modal de confirmação segue a regra nomeada "vermelho=destrutivo/verde=restaurativo". O texto ("O login dele será bloqueado imediatamente") é específico do domínio, não é texto de preenchimento. Onde escorrega pro genérico é estrutural: card de filtros → tabela → paginação → 3 modais é o template Materio/Sneat quase sem alteração, sem nenhuma pista visual específica do que está realmente em jogo aqui (RBAC como dado, responsabilidade de LGPD) além de uma frase de aviso estática.

**Deterministic scan**: 1 achado (`design-system-color`, *advisory*) — mesmo padrão `rgb(0,0,0)` no `<h4>` de breadcrumb. Verificação cruzada: nenhuma cor literal autorada em nenhum dos dois arquivos escaneados (todo `color:` usa token `var(--tk-*)`) — **falso positivo confirmado**, cor padrão herdada do navegador.

**Visual overlays**: não disponíveis — mesmo bloqueio de ambiguidade de múltiplos navegadores Chrome conectados à conta, sem acesso à ferramenta que resolveria a escolha. Nenhuma captura obtida.

## Overall Impression

A tela mais madura das 3 revisadas — fidelidade real ao sistema de design — mas ainda falta polimento de feedback (nenhum toast de sucesso) e tem uma violação real de token de tema escuro. A maior oportunidade: fechar o ciclo de feedback das mutações e consertar o único ponto que quebra o modo escuro.

## What's Working

- Atualização suave por opacidade em vez de apagar tudo pra um spinner (`user-list.component.css:74-86`).
- `isCurrentUser()` impede autodesativação — evita um jeito real de travar a própria sessão.
- Cor do modal de confirmação bate exatamente com o `DESIGN.md` (`user-list.component.ts:191-211`).

## Priority Issues

- **[P1] Nenhum feedback de sucesso nas mutações (desativar/reativar/atribuir funções) fora dos modais**
  **Por que importa**: a única confirmação é notar sozinho que o badge de status mudou de cor — fácil de perder, mina a confiança de que a ação "pegou".
  **Fix**: toast transitório ao concluir desativar/ativar/atribuir funções.
  **Comando sugerido**: `/impeccable clarify`

- **[P1] `card-footer bg-white` fixo quebra o contrato de dark mode** (`user-list.component.html:162`)
  **Por que importa**: é a única quebra encontrada do sistema de temas que construímos nesta sessão — um admin com SO em modo escuro vê um rodapé branco destoando do resto.
  **Fix**: remover o `bg-white`, deixar herdar o token de superfície do tema.
  **Comando sugerido**: `/impeccable polish`

- **[P2] Itens de dropdown "desabilitados" só por CSS continuam operáveis** (`user-list.component.html:141,145`)
  **Por que importa**: `[class.disabled]` numa `<a>` não impede clique real nem é exposto como desabilitado pra leitor de tela/teclado durante uma mutação em andamento.
  **Fix**: `[attr.aria-disabled]` + guarda real no handler, ou trocar por `<button disabled>`.
  **Comando sugerido**: `/impeccable harden`

- **[P2] Nenhuma ação em lote** para cenários de desligamento de vários colaboradores de uma vez.
  **Fix**: seleção múltipla + barra de ação em lote (desativar vários).
  **Comando sugerido**: `/impeccable shape`

- **[P3] Modal de atribuir funções sem busca/resumo de diferença antes de salvar** (`user-list.component.html:316-325`)
  **Fix**: mostrar "vai adicionar/remover" antes de confirmar, já que salvar substitui o conjunto inteiro.
  **Comando sugerido**: `/impeccable clarify`

## Persona Red Flags

**Alex (usuário avançado)**: sem colunas ordenáveis, sem ações em lote, confirmação uma a uma por usuário — não escala além de um punhado de mudanças.

**Sam (dependente de acessibilidade)**: tooltip de funções ocultas usa só `title` nativo — não é confiavelmente exposto a tecnologia assistiva nem alcançável por teclado; itens de dropdown "desabilitados" só por CSS são uma armadilha real pra quem usa teclado/leitor de tela.

## Minor Observations

- Sem "limpar" por campo individual, só o reset geral de todos os filtros.
- Sem copiar e-mail pra área de transferência.
- Período de cadastro (de/até) sem validação cruzada de mín/máx.

## Questions to Consider

- Dado que LGPD é princípio declarado do produto, desativar um usuário deveria pedir um motivo/nota de auditoria em vez de uma confirmação de uma linha?
- O modal de atribuir funções deveria mostrar as *permissões* que cada função concede, não só o nome dela?
- Essa IA está pronta pro futuro multi-tenant já confirmado, ou um seletor de empresa vai precisar ser encaixado depois?
