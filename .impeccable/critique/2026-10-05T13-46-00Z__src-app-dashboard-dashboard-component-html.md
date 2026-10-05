---
target: dashboard
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\dashboard\\dashboard.component.html"
target_fingerprint: "sha256:fbdac1b2b1a94877ed4e8a64aebe878f0a596315e29a5165dc05818262ba5174"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\dashboard\\dashboard.component.html"
timestamp: 2026-10-05T13-46-00Z
slug: src-app-dashboard-dashboard-component-html
---
Method: dual-agent (A: af42beb6b5ea777a9 · B: acb8a7f4d68d85cca)

Nota: o achado P0 (borda colorida banida pelo craft-floor) e o raio fora do token (0.85rem) já foram corrigidos antes desta síntese, a pedido do usuário.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Sem estado de carregamento nos cards; zeros aparecem antes dos dados chegarem |
| 2 | Match System / Real World | 2 | "Novo Ticket" fica dentro de "Ações Rápidas Administrativas" |
| 3 | User Control and Freedom | 3 | Bom alternador gráfico/tabela; resto é só leitura |
| 4 | Consistency and Standards | 1 | 3 de 4 cards tinham borda colorida banida pelo craft-floor (corrigido) |
| 5 | Error Prevention | 3 | Nada destrutivo nesta tela |
| 6 | Recognition Rather Than Recall | 3 | Trincas ícone+rótulo+cor são claras |
| 7 | Flexibility and Efficiency | 1 | Cards estáticos sem drill-through; sem período/visão salva |
| 8 | Aesthetic and Minimalist Design | 3 | Grid limpo; inconsistência de borda (corrigida) e cabeçalhos redundantes poluíam |
| 9 | Error Recovery | 1 | String de erro crua, sem ação de retry |
| 10 | Help and Documentation | 1 | Nenhuma orientação de onboarding/estado vazio |
| **Total** | | **20/40** | **Ruim (antes das correções)** |

## Design Specificity Verdict

**LLM assessment**: Lê como template genérico de "cards de KPI + gráfico + ações rápidas" com rótulos do Tickest colados. Ignora fatos já confirmados no PRODUCT.md (Admin Master/Supervisor não têm chamados próprios) e não carrega nenhum sinal de SLA, o diferenciador central do produto.

**Deterministic scan**: 2 achados advisory — rgb(0,0,0) na saudação (falso positivo confirmado) e border-radius 0.85rem fora da escala (genuíno, corrigido para var(--tk-radius-md)).

**Craft-floor check**: confirmado — border-start border-warning/info/success border-4 em 3 de 4 cards violava a proibição explícita do craft-floor contra borda colorida em cards. Corrigido.

**Visual overlays**: indisponíveis — rota exige sessão autenticada.

## Overall Impression

A tela mais vista do sistema (primeira após login, todo papel) é a que recebeu menos atenção de produto nesta sessão. Saudação pessoal é um bom toque, neutralizado por 4 cards que podem mostrar "0" sem narrativa.

## What's Working

- Tabela acessível espelhando o gráfico, compensando um contraste WARN documentado (html:117-146).
- Ação rápida com RBAC real via sessionService.hasPermission('users:read') (html:173).
- Import adiado do Chart.js via @defer (on idle), 450kB justificado (ts:41-54).

## Priority Issues

- **[P0] Borda colorida banida pelo craft-floor** (html:39,58,77) — CORRIGIDO nesta sessão.

- **[P1] Nenhum conteúdo diferenciado por papel**
  Por que importa: Admin Master/Supervisor não têm chamados próprios, mas a tela fala "Seus tickets" e oferece "Novo Ticket" pra todos igualmente.
  Fix: ramificar conteúdo por papel; tirar "Novo Ticket" de dentro de um painel "Administrativo".
  Comando sugerido: /impeccable adapt

- **[P2] Sem estado de carregamento nos cards** (html:13)
  Por que importa: rede lenta mostra "0" antes dos dados chegarem, parecendo "sem tickets" quando é só carregamento.
  Fix: skeleton na linha de stats enquanto store.state().loading, mesmo padrão @placeholder do gráfico.
  Comando sugerido: /impeccable harden

- **[P3] Sem onboarding de estado vazio**
  Por que importa: usuário novo vê o mesmo layout denso que um veterano, sem empurrão pra "Novo Ticket".
  Fix: painel de estado vazio condicional quando store.total() === 0.
  Comando sugerido: /impeccable onboard

## Persona Red Flags

**Jordan (novato)**: "Novo Ticket" classificado como ação administrativa — pode não reconhecer onde abrir o próprio chamado.

**Alex (usuário avançado)**: cards inertes, sem drill-through pra lista filtrada.

**Sam (acessibilidade)**: .card:hover eleva todo .card, incluindo stats não-clicáveis, sem equivalente de foco/teclado.

## Minor Observations

- 1º card não tinha a borda colorida que os outros 3 tinham (já corrigido).
- "Painel de Controle" + subtítulo quase redundantes.
- style inline no container do gráfico (html:107) — a classe .chart-container já existe no CSS.
- Gráfico sem mensagem de estado vazio quando a matriz é toda zero.

## Questions to Consider

1. Se Admin Master/Supervisor não têm chamados próprios, por que a tela ainda diz "Seus tickets"?
2. Por que a tela mais vista não carrega nenhum sinal de SLA/atraso?
3. A borda colorida era exceção deliberada ou drift que se espalharia como referência?
