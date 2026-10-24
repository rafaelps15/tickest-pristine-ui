---
target: Detalhe do Chamado (debug na tela ticket)
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\tickets\\feature-ticket-detail\\ticket-detail.component.html"
target_fingerprint: "sha256:ec9436ae4c607a0195df63aa7f0d5e3d9a550033aa7b7433717105d84c83df7c"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\tickets\\feature-ticket-detail\\ticket-detail.component.html"
timestamp: 2026-10-24T21-09-54Z
slug: icket-detail-ticket-detail-component-html-7b791ace
---
### Nota de Saúde do Design

| # | Heurística | Nota | Problema-chave |
|---|---|---|---|
| 1 | Visibilidade do status do sistema | 3 | Spinners existem, mas nenhum anuncia pra tecnologia assistiva; sem sinal de "atualizado há Xmin" |
| 2 | Compatibilidade com o mundo real | 2 | Breadcrumb "Meus Tickets /" fixo, errado pra quem chega via Monitorar Tickets |
| 3 | Controle e liberdade do usuário | 2 | "Voltar" sempre leva a /tickets, mesmo pra quem entrou por Monitorar Tickets |
| 4 | Consistência e padrões | 2 | Menos acessibilidade/completude que a tela-irmã Monitorar Tickets: sem role=status/alert, sem retry, sem flex-wrap |
| 5 | Prevenção de erros | 3 | Validação client-side, botões desabilitados durante mutação, confirmação em ações destrutivas |
| 6 | Reconhecimento, não memorização | 2 | Prazo só com data/hora absoluta — usuário precisa calcular atraso |
| 7 | Flexibilidade e eficiência de uso | 2 | Boa navegação por teclado no modal, mas sem atalho "Atribuir a mim" |
| 8 | Design estético e minimalista | 3 | Limpo, fiel aos tokens |
| 9 | Ajuda a reconhecer/diagnosticar/recuperar erros | 3 | Mensagens específicas por status HTTP, mas sem retry em nenhum dos 3 estados de erro |
| 10 | Ajuda e documentação | 1 | Zero ajuda contextual |
| Total | | 26/40 | Aceitável |

### Veredito de Especificidade de Design

Parcialmente autoral, parcialmente genérico. Copy, modelo de permissões e a confirmação de reatribuição são bem pensados pro Tickest; o layout lê como template de "página de detalhe" genérico — dl inteira em texto pequeno/apagado, badges do mesmo peso, nenhuma escalada visual pra SLA.

Varredura determinística: 1 achado, mesmo falso-positivo recorrente (rgb(0,0,0)) — reverificado e confirmado falso-positivo.

Cross-check DESIGN.md: limpo, só .max-w-700 como número mágico sem escala documentada.

### Impressão Geral

Tela cuidadosa onde há risco de dano (ações destrutivas, mensagens de erro específicas), rasa onde o usuário precisa de orientação/segurança emocional: sem urgência de SLA, sem retry em erro, trata quem chega de Monitorar Tickets como se fosse sempre o solicitante.

### O Que Está Funcionando

1. Rede de segurança do fluxo de reatribuição (confirmação explícita "substitui X por Y", botão relabela).
2. Mensagens de erro cientes de papel e código HTTP no store.
3. Padrão de listbox acessível na busca de responsável (tabindex circular, aria-activedescendant, aria-live).

### Priority Issues

[P0] "Voltar" e breadcrumb errados pra quem não é o Solicitante no próprio chamado. routerLink="/tickets" e "Meus Tickets /" fixos ignoram papel/origem. Fix: passar state do router nas duas origens (/tickets e /tickets/monitorar). Comando: /impeccable clarify

[P1] Descumprimento de SLA sem escalada visual — badge mesmo peso de status/prioridade, prazo só absoluto. Monitor já tem text-danger no overdue, detalhe não. Fix: copy de urgência relativa + mirror do tratamento de cor. Comando: /impeccable bolder

[P1] Nenhum canal de comunicação no chamado, apesar do domínio modelar MessageAdded/Edited/Removed. Provavelmente depende de escopo de produto/back-end. Comando: /impeccable layout

[P2] Regressões de acessibilidade vs Monitor: sem role=status/alert; upload control (label+input oculto) inalcançável por teclado; botões de download/exclusão ícone-apenas sem aria-label. Fix: replicar padrões do Monitor + trocar label por button real + aria-label nos botões. Comando: /impeccable harden

[P3] Marcas de "polido em momentos diferentes": sem flex-wrap no cabeçalho, sem text-break no nome do anexo, sem retry nos 3 erros. Comando: /impeccable polish

### Persona Red Flags

Jordan (Solicitante): prazo só absoluto; sem canal de comunicação; "SLA" sem explicação.

Sam (acessibilidade): spinners sem role=status; alerts sem role=alert; upload control inalcançável por teclado (confirmado por análise de código).

Riley (stress-tester): histórico/anexos sem contêiner de scroll/voltar ao topo; título longo pode colidir com Voltar; nome de anexo longo sem text-break.

### Minor Observations

- t.description (conteúdo real) em text-muted, mesma demoção dos rótulos.
- Até 4 alertas de erro podem empilhar simultaneamente em Anexos.
- .max-w-700 é número mágico sem escala no DESIGN.md.
- Remover responsável/excluir anexo usam o modal global; reatribuir usa confirmação própria no rodapé — não é violação, mas dois padrões coexistindo.
- Nenhum conflito utilitário-Bootstrap/seletor-customizado encontrado nesta tela.
- Badge "+N" de funções ocultas reaproveitado é consistência positiva.

### Questions to Consider

1. E se "Voltar" usasse state do router em vez de link fixo — resolveria a tela pra todo papel de uma vez?
2. E se o topo tivesse uma faixa de status que mudasse com o SLA, em vez de um badge do mesmo peso?
3. Quanto da fricção atual serve o Solicitante às custas do fluxo diário do Atendente (sem atalho "Atribuir a mim")?
