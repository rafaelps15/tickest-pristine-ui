---
target: tela login
total_score: 30
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 1
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\shared\\feature-login\\login.component.html"
target_fingerprint: "sha256:24e373e51465bc3a0532c548e3401cbeed16593b04de0d1ff66c0b02aa880b2a"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\shared\\feature-login\\login.component.html"
timestamp: 2026-10-24T01-11-21Z
slug: src-app-shared-feature-login-login-component-html
closed: true
---
### Design Health Score

| # | Heurística | Nota | Problema-chave |
|---|---|---|---|
| 1 | Visibilidade do status do sistema | 3 | Botão troca pra spinner + "Autenticando..." e desabilita; nada sinaliza a busca "na fila" durante o debounce (n/a aqui, mas vale notar em telas de busca). |
| 2 | Compatibilidade com o mundo real | 4 | "E-mail Corporativo" / copy pt-BR apropriada para ferramenta corporativa. |
| 3 | Controle e liberdade do usuário | 3 | Sem cancelar um envio em andamento; fora isso, adequado para um formulário de login. |
| 4 | Consistência e padrões | 3 | Reaproveita auth-form.css com first-access; achado aberto (ver Priority Issues) no botão primário. |
| 5 | Prevenção de erros | 3 | type="email" + Validators bloqueiam envios obviamente inválidos antes da rede. |
| 6 | Reconhecimento, não memorização | 4 | Rótulos + placeholders nos dois campos; toggle de senha remove a adivinhação. |
| 7 | Flexibilidade e eficiência de uso | 2 | autocomplete correto pra gerenciadores de senha; sem "lembrar-me" nem SSO, gap plausível pra uma ferramenta corporativa multi-tenant (ver Minor Observations). |
| 8 | Design estético e minimalista | 4 | Dois campos, um CTA, hierarquia limpa; o vidro/blur documentado agora está implementado de verdade. |
| 9 | Ajuda a reconhecer/diagnosticar/recuperar de erros | 4 | Contraste do alerta corrigido (era ~2,8:1, falha AA); "Esqueceu?" deixou de ser um link morto. |
| 10 | Ajuda e documentação | n/a | Login corporativo forçado — usuário bloqueado liga pro suporte de TI, não consulta docs in-app. |
| **Total** | | **30/36** | **Bom** (9 heurísticas aplicáveis — #10 n/a) |

Evolução: 29 → 30/36 (mesma sessão: a maioria dos achados originais foi corrigida, um achado novo surgiu numa auditoria posterior).

### Design Specificity Verdict

**LLM assessment**: Deixou de ser um login de admin-template genérico. O vidro/blur sobre gradiente índigo documentado no DESIGN.md como exceção exclusiva desta tela está de fato implementado agora (antes era fundo liso pontilhado com a sombra do resto do app) — o momento de entrada finalmente expressa a identidade que o próprio sistema de design reserva pra ele. O wordmark "ickest" também passou a renderizar na cor certa (índigo escuro), não no azul padrão do Bootstrap que vinha renderizando por um bug de especificidade CSS nunca detectado antes.

**Deterministic scan**: 1 achado, advisory, falso-positivo confirmado (`rgb(0,0,0)` num `h4` sem cor própria atribuída — o detector renderiza o fragmento HTML sem o CSS/Bootstrap carregado). Achado manual: o botão primário desta tela (e das duas telas irmãs — primeiro acesso e auto-registro) usa a classe `shadow-sm` do Bootstrap, que vem com `!important` e vence a sombra índigo que `.btn-primary` define — o CTA mais importante da tela está com a sombra genérica do Bootstrap, não a da marca. Ainda não corrigido (achado numa auditoria feita depois deste critique).

**Visual overlays**: indisponíveis — extensão do Chrome não conecta nesta sessão; evidência via leitura de código e HTML servido pelo dev server (curl), não captura visual.

### Overall Impression

Dos achados originais (dois P0, um P1, um P2, um P3), só um resta genuinamente aberto fora desta sessão (SSO/lembrar-me, uma decisão de produto, não um defeito) — e um achado novo apareceu numa auditoria técnica posterior (o botão com a sombra errada). A tela evoluiu de "competente mas genérica" pra efetivamente expressar a identidade documentada.

### What's Working

1. Vidro de verdade: `backdrop-filter: blur(10px)` sobre um gradiente com dois brilhos suaves em índigo — o card tem algo real pra desfocar agora, não um fundo liso.
2. `autocomplete="username"`/`"current-password"` corretos — compatibilidade com gerenciador de senha, fácil de esquecer e foi acertado.
3. Mensagem de erro não vaza qual campo errou ("E-mail ou senha incorretos." pra ambos os casos) — boa prática de segurança, mantida.

### Priority Issues

[P1] Botão primário com a sombra errada (achado na auditoria técnica de 24/10, ainda não corrigido). `login.component.html`, `first-access.component.html` e `register.component.html` (auto-registro) usam `class="btn btn-primary ... shadow-sm"` — `.shadow-sm` é utilitário do Bootstrap com `!important`, vence a sombra índigo de `.btn-primary`. Fix: remover `shadow-sm` dos três botões. Comando: /impeccable harden

[P2] Sem SSO nem "lembrar-me" numa ferramenta corporativa multi-tenant. Gap plausível, não necessariamente um defeito — decisão de produto a confirmar. Comando: /impeccable shape

### Persona Red Flags

- Sam (acessibilidade): resolvido nesta sessão — contraste do alerta corrigido, aria-describedby adicionado nos dois campos.
- Riley (testador): sem lockout/rate-limit no LoginStore (só PasswordChangeRequired, 400/500 genéricos, falha de rede) — tentativa repetida não tem reforço dedicado. Não corrigido, não necessariamente um defeito de UI (pode ser política de back-end).

### Minor Observations

- `autofocus` no campo de e-mail — padrão aceitável, vale notar para quem usa leitor de tela.
- Toggle de mostrar/ocultar senha não tem affordance visual de hover/foco além do cursor.
- `data-bs-theme` forçado pra "light" no AuthLayoutComponent, corretamente revertido ao entrar na área autenticada — confirmado que não vaza tema claro pro dashboard.

### Questions to Consider

1. Vale abrir uma frente de SSO/lembrar-me, ou isso é intencionalmente fora do modelo de provisionamento atual (Admin gerencia usuários centralmente)?
2. O bug de especificidade CSS (`!important` de utilitário vencendo regra customizada) já apareceu 3 vezes nas telas de autenticação — vale uma varredura dedicada no resto do app?
