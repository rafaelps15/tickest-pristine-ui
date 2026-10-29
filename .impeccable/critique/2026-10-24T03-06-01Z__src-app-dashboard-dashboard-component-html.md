---
target: Dashboard (fix dashboard / melhoria geral)
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 1
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\dashboard\\dashboard.component.html"
target_fingerprint: "sha256:c97d80a25e0f4ef23de028c34eef7002f3fd59f0474f1139fa6b28d497df5551"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\dashboard\\dashboard.component.html"
timestamp: 2026-10-24T03-06-01Z
slug: src-app-dashboard-dashboard-component-html
closed: true
---
### Nota de Saúde do Design

| # | Heurística | Nota | Problema-chave |
|---|---|---|---|
| 1 | Visibilidade do status do sistema | 3 | Spinners com anúncio distinto por card, botão de retry; pequena falha: spinner do @defer placeholder tem role="status" + aria-hidden="true" juntos |
| 2 | Compatibilidade com o mundo real | 3 | Vocabulário de status correto, mas ignora o enquadramento de SLA que o resto do produto usa |
| 3 | Controle e liberdade do usuário | 4 | Toggle tabela/gráfico, retry, group-by com aria-pressed — tudo funcional |
| 4 | Consistência e padrões | 2 | Paleta do gráfico quebra a One Accent Rule do DESIGN.md; Ações Rápidas mostra itens que o PRODUCT.md diz que Admin/Supervisor não deveriam ver |
| 5 | Prevenção de erros | 4 | Nenhuma ação destrutiva nesta tela |
| 6 | Reconhecimento, não memorização | 4 | Estado ativo do group-by, ícones rotulados, nada escondido |
| 7 | Flexibilidade e eficiência de uso | 2 | Cards clicáveis ajudam power users, mas é o único acelerador |
| 8 | Design estético e minimalista | 3 | Corte de 5→2 em Ações Rápidas foi certeiro; prejudicado pela paleta do gráfico e redundância Total/detalhamento |
| 9 | Ajuda a reconhecer/diagnosticar/recuperar erros | 4 | Mensagem clara + retry |
| 10 | Ajuda e documentação | 1 | Zero orientação contextual em qualquer lugar da tela |
| Total | | 30/40 | Bom |

(Comparado ao critique anterior desta sessão no mesmo arquivo: 24/40 → 30/40, depois do pacote colorize/harden/clarify/layout/polish.)

### Veredito de Especificidade de Design

Misto, tendendo a genérico-com-boa-execução. O esqueleto linha-de-stats + gráfico + ações rápidas é o padrão de qualquer admin template. A especificidade do domínio aparece em detalhes de execução, mas falta onde mais importa: o norte do produto no DESIGN.md é "O Painel de Controle Confiável" sobre cumprimento de SLA, e esta tela não fala essa língua em nenhum momento. Ressalva confirmada no PRODUCT.md: métricas/dashboards de SLA ainda não existem no sistema — pode ser escopo legítimo adiado.

Varredura determinística: 1 achado, o mesmo falso-positivo recorrente desta sessão (rgb(0,0,0) no h4 da saudação) — reverificado de forma independente: confirmado falso-positivo (detector sem styles.css carregado).

Cross-check com DESIGN.md: .html/.css do dashboard limpos (zero hex/rgb literais). Ponto fraco no .ts: CHART_SURFACE_LIGHT/CHART_TEXT_LIGHT são aproximações manuais em vez de tokens reais, e a paleta categórica de 5 cores não existe no DESIGN.md.

### Impressão Geral

Tela estruturalmente sólida e mais polida que a versão anterior desta sessão, mas com desalinhamento de fundo: desenhada como "painel de todo mundo", quebrando exatamente nos pontos onde o PRODUCT.md já tem opinião formada (Ações Rápidas) e na ausência de contexto de SLA.

### O Que Está Funcionando

1. Anúncios de loading distintos por card (texto visually-hidden único por spinner).
2. Espelho acessível da tabela do gráfico (table real com scope e caption visually-hidden).
3. Reaproveitamento disciplinado do DNA do .card-stats-btn de Monitorar Tickets em vez de inventar um padrão novo.

### Priority Issues

[P0] "Ações Rápidas" contradiz a direção de produto já confirmada para Admin/Supervisor. PRODUCT.md (linhas 16-21): Admin "não abre nem atende chamados operacionalmente", Supervisor "sem Meus Tickets". Hoje Novo Ticket/Meus Tickets aparecem pra todo mundo sem condição. Fix: condicionar por tickets:manage. Comando: /impeccable clarify

[P1] Afordância falsa: hover de elevação (.card-stats:hover) não está restrito a .card-stats-clickable — cards não clicáveis recebem o mesmo convite visual sem fazer nada ao clicar. Fix: mover a regra para .card-stats-clickable:hover. Comando: /impeccable harden

[P2] Números não fecham a conta: total inclui Fechados+Cancelados mas nenhum card mostra esse detalhamento (10 ≠ 3+2+4=9 no próprio fixture do spec). Fix: legenda explicativa ou linha de detalhamento. Comando: /impeccable clarify

[P2] Paleta do gráfico quebra a One Accent Rule do DESIGN.md (5 cores arbitrárias por índice de barra). Fix: renderizar todas as barras no índigo único da marca. Comando: /impeccable colorize

[P3] SLA ausente da tela que todo mundo vê primeiro (ressalva: PRODUCT.md confirma que dashboards de SLA ainda não existem — risco de backlog, não bug). Comando: /impeccable adapt

### Persona Red Flags

Alex (Admin/Supervisor): hover do card Total convida ao clique sem fazer nada; Ações Rápidas 100% morto pra esse papel; pergunta diária real (SLA furando) não tem rastro aqui.

Sam (acessibilidade): aria-label do stretched-link redundante com o texto estático do card; copy "toque" sem equivalente claro pra teclado (herdado, não é regressão nova); canvas sem aria-label/alternativa textual própria.

Priya (Requester de primeira vez): metade de cima irrelevante pro objetivo dela; única ação relevante é item 2 de uma lista de 2; nada sobre SLA/prazo do próprio chamado.

### Minor Observations

- Toggle "Ver como tabela" sem aria-pressed/aria-label, inconsistente com os botões de group-by.
- Spinner placeholder do @defer com role="status" + aria-hidden="true" juntos (contraditório).
- Badges de ícone sem flex-shrink-0 (risco pequeno de compressão em viewports estreitos).
- .badge.rounded (custom !important) convive com a utilitária .rounded do Bootstrap (!important) — funciona hoje só porque os valores concordam, mesma classe de conflito do bug .text-warning encontrado 4x nesta sessão.
- h3 { font-weight: 600; } duplica o peso padrão do Bootstrap — excesso inofensivo.

### Questions to Consider

1. E se o dashboard liderasse com a mesma faixa de saúde de SLA de Monitorar Tickets, em vez de contagens genéricas de status?
2. E se Ações Rápidas renderizasse conteúdo por papel em vez de um painel estático meio-morto?
3. E se o card Total mostrasse seu próprio detalhamento pra os números sempre baterem visivelmente?
