---
target: tickets (ticket-list/create/detail)
total_score: 18
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\tickets\\feature-ticket-list\\ticket-list.component.html"
target_fingerprint: "sha256:0c1c3576e5c7bc033135bb5b516053bbdef3f53bb8a4ede5d1fe1f9b67a750e5"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\tickets\\feature-ticket-list\\ticket-list.component.html"
timestamp: 2026-10-05T03-53-12Z
slug: re-ticket-list-ticket-list-component-html-a194a4c9
---
Method: dual-agent (A: a7f99640b12ffac18 · B: a7a15870aaacde5b5)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Detail page conflates "ainda carregando" com "não encontrado/sem acesso" num único alerta |
| 2 | Match System / Real World | 3 | Cascata Depto→Setor espelha a estrutura real; mas nenhum sinal de "aberto há Xd" ou agente responsável |
| 3 | User Control and Freedom | 2 | Sem edição pós-criação; sem distinção entre "Cancelar" e "Excluir" (o próprio fluxo do produto nomeia os dois) |
| 4 | Consistency and Standards | 2 | Viola a própria regra do sistema: linha da lista mostra 3 ícones soltos em vez do menu "⋮" |
| 5 | Error Prevention | 1 | Formulário de criação não tem nenhum erro inline por campo — só o botão desabilitado |
| 6 | Recognition Rather Than Recall | 1 | Ações só com ícone (clipe/atualizar/lixeira, baixar/lixeira) sem label/title/aria-label em nenhum lugar |
| 7 | Flexibility and Efficiency | 1 | Nenhum filtro/busca/ordenação/paginação em "Meus Tickets"; sem ações em lote |
| 8 | Aesthetic and Minimalist Design | 3 | Limpo e consistente com os tokens |
| 9 | Error Recovery | 2 | Banners genéricos ("Erro ao carregar tickets") sem botão de tentar de novo |
| 10 | Help and Documentation | 1 | Nenhuma dica contextual ou link de ajuda em lugar nenhum |
| **Total** | | **18/40** | **Poor** |

## Design Specificity Verdict

**LLM assessment**: Lê como um CRUD administrativo genérico bem tokenizado com rótulos em português colados em cima, não uma superfície pensada para o que está em jogo num helpdesk interno de verdade. O sistema do `DESIGN.md` (acento índigo, badges em pílula, sombras tintadas) é aplicado corretamente e com consistência, mas as telas de Tickets nunca expressam o que diferencia esse domínio: nenhum sinal de SLA/tempo, nenhuma noção de "quem está cuidando do meu problema", nenhum reconhecimento de que um ticket representa a impressora quebrada ou o pagamento travado de alguém. A cascata Departamento→Setor na criação é o único toque genuinamente específico do domínio; o resto (linha de ícone nu, lista plana, célula de descrição sem truncamento) poderia pertencer a qualquer painel administrativo.

**Deterministic scan**: 3 achados, todos o mesmo padrão (`design-system-color`, severidade *advisory*) — `rgb(0, 0, 0)` no `<h4>` de breadcrumb das 3 telas, sinalizado como fora da paleta do `DESIGN.md`. Verificação cruzada no código-fonte: nenhuma das 3 tem cor literal nesse elemento (nem inline, nem classe, nem variável) — é a cor preta padrão herdada do navegador/Bootstrap, não algo autorado. **Falso positivo confirmado**, mesmo padrão sistêmico nas 3 telas, não 3 problemas distintos.

**Visual overlays**: não disponíveis nesta rodada — a criação de aba no Chrome falhou porque a conta tem duas janelas do Chrome conectadas e nenhuma foi selecionada para esta sessão; o subagente de detector não tem acesso à ferramenta que resolveria essa escolha. Nenhuma captura de tela foi obtida; isso é reportado como sinal de fallback, não inventado.

## Overall Impression

Esqueleto limpo e corretamente tokenizado, mas emocionalmente neutro e sem os sinais de domínio que o próprio propósito declarado do produto (SLA, rastreabilidade) exige. A maior oportunidade: fazer um ticket parecer um problema real sendo acompanhado, não uma linha de tabela.

## What's Working

- `ConfirmDialogService` usado de forma consistente em toda ação destrutiva — nunca `confirm()` nativo.
- Validação client-side antecipada espelhando os limites de anexo do back-end (`ticket-detail.component.ts:60-69`).
- Select em cascata Departamento→Setor com habilitar/desabilitar/resetar corretos (`ticket-create.component.ts:38-57`).

## Priority Issues

- **[P0] Formulário de criação sem feedback de validação por campo** (`ticket-create.component.html:21-58`)
  **Por que importa**: usuário só descobre o que está errado quando o botão simplesmente não habilita, sem saber o motivo.
  **Fix**: `is-invalid` + mensagem por campo, no padrão já documentado no `DESIGN.md` para inputs.
  **Comando sugerido**: `/impeccable harden`

- **[P0] Ações da linha da lista violam a própria regra do sistema e não têm rótulo acessível** (`ticket-list.component.html:47-59`)
  **Por que importa**: 3 ícones soltos em vez do menu "⋮" já padronizado em Usuários; nenhum tem `aria-label`/`title`, leitor de tela anuncia só "botão".
  **Fix**: consolidar num dropdown "⋮" com rótulos, igual ao que já existe em `user-list`.
  **Comando sugerido**: `/impeccable polish`

- **[P1] Ambiguidade entre "carregando" e "não encontrado" na tela de detalhe** (`ticket-detail.component.html:24-28`)
  **Por que importa**: pode piscar uma mensagem alarmante ("não foi possível carregar... pode não ser seu") bem no momento em que o usuário só está esperando a página carregar.
  **Fix**: separar visualmente o estado de carregamento do estado de aviso/erro.
  **Comando sugerido**: `/impeccable clarify`

- **[P1] Nenhum carimbo de tempo/responsável/histórico em lugar nenhum — `Ticket` não tem `createdAt`** (`entities/ticket.ts:5-13`)
  **Por que importa**: mina a promessa central do produto (SLA, rastreabilidade) — não dá pra cumprir SLA sem saber há quanto tempo um ticket está aberto.
  **Fix**: decisão de produto/back-end antes de mexer no front — provavelmente maior que um polish pontual.
  **Comando sugerido**: `/impeccable shape`

- **[P2] Nenhuma confirmação de sucesso após criar um ticket** (`ticket-create.component.ts:67-72`)
  **Por que importa**: o momento de pico da jornada (reportar um problema real) termina num `router.navigate` silencioso — anticlimático.
  **Fix**: toast ou tela de sucesso breve antes/durante o redirecionamento.
  **Comando sugerido**: `/impeccable delight`

## Persona Red Flags

**Sam (dependente de acessibilidade)**: todo botão só-ícone (lista e anexos) não tem `aria-label`/`title` — leitor de tela não anuncia o que o botão faz.

**Alex (usuário avançado)**: nenhum filtro/busca/ordenação em "Meus Tickets", sem ações em lote — escanear a lista cresce linearmente com a quantidade de tickets.

**Riley (testador metódico)**: mensagem ambígua de carregando/não-encontrado, nenhuma confirmação pós-envio, texto genérico de exclusão igual pra ticket e anexo independente da gravidade.

## Minor Observations

- Descrições longas na célula da lista não têm truncamento/clamp.
- Nenhum contador de caracteres nos limites de 200/500.

## Questions to Consider

- Dado que SLA é o propósito declarado do produto, por que `Ticket` não carrega `createdAt` nem mostra tempo em aberto/responsável em lugar nenhum?
- O `DESIGN.md` já manda usar o menu "⋮" acima de duas ações — por que esta lista específica ainda usa 3 ícones soltos?
- "Cancelar" deveria existir como ação mais branda, distinta do "Excluir" permanente?
