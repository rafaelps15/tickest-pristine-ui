---
target: Tela Usuários (Gestão de Usuários)
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\users\\feature-user-list"
timestamp: 2026-10-25T18-02-11Z
slug: src-app-users-feature-user-list
closed: true
---
Method: dual-agent (A: design review · B: detector + browser evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Spinners/toasts/aria-live bons; correção de página fora do intervalo acontece em silêncio |
| 2 | Match System / Real World | 3 | pt-BR bom; aria-label da linha ("Selecionar" + nome) reusa o verbo do checkbox de lote, que faz algo diferente |
| 3 | User Control and Freedom | 3 | Esc, devolução de foco, alternar seleção, limpar filtros — tudo presente |
| 4 | Consistency and Standards | 3 | Reaproveita bem a trilha/overlay do Monitor; mas o novo clique-na-linha convive sem diferenciação visual com o checkbox já existente |
| 5 | Error Prevention | 3 | Confirmações nomeando a pessoa, autodesativação bloqueada; falta validação cruzada de datas (de/até) |
| 6 | Recognition Rather Than Recall | 3 | Filtros na URL ajudam muito; busca excluída da URL sem explicação na tela |
| 7 | Flexibility and Efficiency | 2 | Seleção em lote só na página atual, sem ordenação, sem reativação em lote |
| 8 | Aesthetic and Minimalist Design | 3 | No padrão visual do sistema; "Atividade da Equipe" é placeholder puro em tela ultralarga |
| 9 | Error Recovery | 3 | Mensagens de erro contextuais por ação; sem retry inline nos alertas |
| 10 | Help and Documentation | 3 | Guia da Tela é ajuda real; não explica a distinção linha-clicável vs. checkbox |
| **Total** | | **29/40** | **Sólido — a maioria das interfaces reais fica entre 20-32** |

## Design Specificity Verdict

**LLM**: Autoral pra Tickest, não genérico. Aplica com fidelidade as regras nomeadas do DESIGN.md (Badge Pair Rule, Row Actions "⋮", The One Accent Rule). O Guia da Tela é conteúdo específico do produto.

**Deterministic scan**: 7 achados, todos severidade "advisory"/categoria "quality". Nenhum achado bloqueante.
- `rgba(0,0,0,.5)` no backdrop do painel — **falso positivo**: bate com o padrão de "overlay escurecido" já documentado no DESIGN.md (usado no off-canvas da sidebar).
- Tamanhos de fonte 0.8rem/0.85rem — **provável falso positivo**: caem dentro da faixa de Label (0.72–0.85rem) que o próprio DESIGN.md documenta como intervalo, não valor fixo.
- 4 textos pretos puros (`rgb(0,0,0)`) em títulos — inclusive o `<h4>` "Administração / Gestão de Usuários" que já existia antes desta sessão e não foi tocado. **Não é regressão desta fatia**: é um padrão que já existia (ou uma limitação do detector em resolver variáveis CSS), vale investigar separadamente, fora do escopo de hoje.

**Visual overlays**: não disponível nesta rodada — back-end não estava rodando e a tela fica atrás de login, sem credenciais disponíveis. Nenhuma evidência visual ao vivo.

## Overall Impression

A tela está estruturalmente sólida e fiel ao design system, mas a feature mais nova (seleção de linha pro painel) tem uma ambiguidade real de interação que ninguém resolveu explicitamente: a mesma linha responde a 3 cliques diferentes (checkbox, corpo da linha, menu "⋮") com duas semânticas de "selecionado" competindo visualmente. É a maior oportunidade antes de isso virar confusão de verdade em produção.

## What's Working

1. Aplicação fiel e não-decorativa das regras do DESIGN.md (badges, menu "⋮", acento único).
2. Engenharia de estado cuidadosa: filtros na URL com a exclusão de busca documentada, recuperação de página fora do intervalo, tabela que não "pisca vazia" ao trocar filtro.
3. Guia da Tela como ajuda contextual persistida de verdade, não decoração.

## Priority Issues

**[P1] Duas semânticas de "selecionado" na mesma linha, sem diferenciação visual**
Why it matters: o checkbox de lote marca pra uma ação destrutiva (desativar em massa); clicar na linha abre um painel só de leitura. As duas usam o mesmo realce visual, e nada na tela explica a diferença.
Fix: diferenciar visualmente os dois estados (ex.: barra de acento à esquerda pra seleção do painel, tingimento de fundo só pro lote) e acrescentar uma linha no Guia da Tela explicando a distinção.
Suggested command: /impeccable clarify

**[P1] Padrão ARIA inválido na linha selecionável**
Why it matters: `aria-selected` foi aplicado num elemento com `role="button"` — não é uma combinação válida na especificação ARIA, então esse estado provavelmente nunca é anunciado por leitor de tela. O `aria-label` também é estático e nunca reflete se o painel está aberto.
Fix: trocar pra `aria-pressed` (compatível com `role="button"`), e fazer o `aria-label`/estado refletir a seleção atual.
Suggested command: /impeccable audit

**[P2] Seleção em lote só alcança a página atual**
Why it matters: quem faz limpeza em massa não tem como selecionar "todos que batem com o filtro", só os da página visível — sem aviso disso na barra de ação em lote.
Fix: adicionar uma ação "selecionar todos os N que batem com o filtro", ou deixar explícito na mensagem que a seleção é só da página atual.
Suggested command: /impeccable clarify

**[P2] "Atividade da Equipe" promete 3 métricas específicas sem confirmação de roadmap**
Why it matters: nomeia "Cadastros recentes", "Distribuição por função" e "Atividade de login" como coisas que "vêm por aí" — compromisso específico não confirmado no PRODUCT.md. Risco pequeno mas real de credibilidade pro "painel de controle confiável".
Fix: confirmar essas métricas como roadmap real (registrar em PRODUCT.md) ou generalizar a cópia.
Suggested command: /impeccable clarify

**[P3] Exclusão da busca livre da URL não é explicada na tela**
Why it matters: a decisão (por privacidade — pode conter e-mail) só está documentada em comentário de código; quem usa a tela não sabe por que recarregar não mantém o texto da busca.
Fix: uma nota de uma linha perto do campo de busca ou no Guia da Tela.
Suggested command: /impeccable clarify

## Persona Red Flags

**Administrador sob pressão de tempo (limpeza em lote)**: bloqueado pela seleção em lote só-da-página, sem aviso de que "selecionados" ≠ "todos que batem com o filtro".

**Administrador novato**: a linha reage de 3 jeitos diferentes a clique, sem nenhuma pista distinguindo "estou só olhando" de "estou selecionando pra uma ação em lote".

## Minor Observations

Falta validação cruzada de datas (de/até); correção silenciosa de página fora do intervalo; `.status-dot` duplicado em 3 arquivos CSS (limitação de encapsulamento do Angular, já reconhecida em comentário); Editar cadastro/Atribuir funções agora alcançáveis tanto pelo menu "⋮" quanto pelo painel, sem indicação de qual é o caminho preferido; vale conferir ao vivo, num navegador de verdade, a largura das trilhas com o painel de informações aberto ao mesmo tempo, entre 1900-2000px.

## Questions to Consider

- Por que o nome acessível da linha usa "Selecionar" — o mesmo verbo que o checkbox de lote já usa — quando a função real é "ver detalhes"?
- "Atividade da Equipe" é um rollout em estágios ou uma promessa prematura?
