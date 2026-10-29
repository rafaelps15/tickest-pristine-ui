---
target: dashboard
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 1
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\dashboard\\dashboard.component.html"
target_fingerprint: "sha256:e570cb658c9897c2df81d9c2e093a090c0fa8ccb6ea0d1102b8bd10dad57f330"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\dashboard\\dashboard.component.html"
timestamp: 2026-10-24T02-16-28Z
slug: src-app-dashboard-dashboard-component-html
---
### Design Health Score

| # | Heuristica | Nota | Problema-chave |
|---|---|---|---|
| 1 | Visibilidade do status do sistema | 2 | store.state().loading existe no Store mas nunca e lido no template |
| 2 | Compatibilidade com o mundo real | 3 | Termos e icones corretos |
| 3 | Controle e liberdade do usuario | 3 | Toggles reversiveis; sem retry manual no erro |
| 4 | Consistencia e padroes | 2 | 3 quebras concretas do DESIGN.md |
| 5 | Prevencao de erros | 3 | Pouco a errar |
| 6 | Reconhecimento, nao memorizacao | 3 | Cores/icones de status consistentes |
| 7 | Flexibilidade e eficiencia de uso | 2 | Nenhum card leva a lugar nenhum |
| 8 | Design estetico e minimalista | 3 | Grade limpa; comeca a lotar com 5 Acoes Rapidas |
| 9 | Ajuda a reconhecer/diagnosticar/recuperar erros | 1 | Alerta generico, sem retry |
| 10 | Ajuda e documentacao | 2 | Nada explica o que o grafico conta de fato |
| Total | | 24/40 | Aceitavel |

### Veredito de Especificidade de Design

Le como um dashboard de admin-template generico com os rotulos do Tickest colados em cima - nada aqui e consciente de SLA, mesmo o PRODUCT.md citando SLA como proposta de valor central. A copy promete "ao vivo", mas o Store so carrega uma vez no ngOnInit, sem polling nem refresh. Mapeamento semantico de cor correto nos 4 cards, mas a execucao falha (ver P0).

Varredura deterministica: 1 achado, falso-positivo confirmado por inspecao de codigo. Achado manual: a paleta categorica do grafico tem um comentario afirmando "validada" mas o DESIGN.md nao documenta nenhuma paleta categorica - a afirmacao nao e verificavel hoje.

### Priority Issues

[P0] Numeros dos cards falham contraste AA no modo claro. text-warning/text-info/text-success nos h3 renderizam hex puro do Bootstrap (~1,96:1/2,10:1/1,74:1) - mesma classe de bug de especificidade CSS (!important de utilitario vencendo token) encontrada 3x hoje no login. Fix: promover warning-text/info-text/success-text a variaveis --tk-* reutilizaveis + regra global .text-warning/.text-info/.text-success, mesmo padrao ja aplicado a .text-primary. Comando: colorize

[P1] Sem estado de carregamento - loading e "zero tickets" sao visualmente identicos. Fix: skeleton/opacidade ligados a loading, retry no erro, estado vazio dedicado. Comando: harden

[P2] Cards reaproveitam a linguagem visual de "card clicavel que filtra" (ja usada em Monitorar Tickets) mas nao levam a nada. Fix: para tickets:manage, os 3 cards de status levam a /tickets/monitorar?status=... . Comando: clarify

[P2] Acoes Rapidas virando um segundo menu de navegacao, duplicando a sidebar. Fix: limitar a 1-2 itens contextuais. Comando: layout

[P3] Hover-elevation documentado no DESIGN.md ausente no codigo (.card-stats:hover nao existe). Comando: polish

### Persona Red Flags

- Sam: canvas sem aria-label/role=img; mais o P0 de contraste.
- Jordan (empresa nova): boas-vindas "ao vivo" acima de 4 cards em zero, sem moldura de primeiro uso.
- Casey (mobile): cabecalho do grafico quebra em varias linhas; ~4 telas de rolagem antes de algo especifico do papel.

### Minor Observations

- Se status e volume falharem juntos, so o erro de status aparece.
- Paleta do grafico e decorativa, sem significado por status (admitido no proprio comentario).
- "Tickets Abertos por Periodo" e ambiguo entre "abertos no periodo" e "com status Aberto no periodo".
- aria-pressed no toggle de periodo mas nao no de "Ver como tabela".

### Questions to Consider

1. "Ao vivo" descreve o escopo (empresa inteira) ou a entrega (tempo real)? A copy deveria refletir isso.
2. Cards clicaveis ja existem em Monitorar Tickets - por que o Dashboard usa o mesmo visual sem a mesma interacao?
3. E um placeholder deliberado ate metricas de SLA chegarem, ou a experiencia de entrada pretendida no longo prazo?
