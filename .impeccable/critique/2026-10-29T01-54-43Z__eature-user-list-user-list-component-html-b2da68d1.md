---
target: tela Usuários
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
target_identity: "file:c:\\dev\\tickest-pristine-front\\src\\app\\users\\feature-user-list\\user-list.component.html"
target_fingerprint: "sha256:9775a4fb1a6e2c4978c98cf975f428b5311204dd0d80ff5373849eaa29460f23"
target_path: "c:\\dev\\tickest-pristine-front\\src\\app\\users\\feature-user-list\\user-list.component.html"
timestamp: 2026-10-29T01-54-43Z
slug: eature-user-list-user-list-component-html-b2da68d1
---
# Critique — Usuários (2026-10-28)
Method: dual-agent (A design review · B detector) + audit técnico; navegador via Playwright/CDP (extensão desconectada, sem overlay).

Heurísticas: 3,3,3,3,3,3,2,2,2,3 = 27/40 (Aceitável). Audit: A11y 3, Perf 3, Resp 2, Theming 3, Integridade 2 = 13/20.

## Priority issues
- [P1] Lista abaixo da dobra: 1ª linha a 1086px em 1366x768 (Guia aberto na 1ª visita + Resumo + card de filtros). distill/layout.
- [P1] Rolagem horizontal no celular (433px em 390): duas datas lado a lado. adapt.
- [P1] Falha de carga vira "Nenhum usuário cadastrado ainda"; alerta de falha técnica vermelho. harden.
- [P1] Desativar em lote sem contagem de chamados, sem nomes >8, sem Desfazer, falha "acima da lista". harden/clarify.
- [P2] Convites pendentes invisíveis; GET /users/stats/status (spec 020) já entrega pendingActivationCount. distill/clarify.

## Audit (técnico)
- [P1] Busca emite '' inicial → setSearch reseta página e faz GET extra (falta skip(1)).
- [P1] Badge de função com cor customizada no escuro < AA (validador só checa o claro).
- [P2] Foco perdido após ações do ⋮/lote (row-actions sem [busy]/[rowKey]); selecionar-todos focável e invisível no celular; nome sob o ⋮ em linhas sem checkbox; alvos btn-sm ~31px; período sem rótulos visíveis no nome acessível; forms sem aria-invalid/required; getRoleColor lê localStorage por badge; .status-dot duplicado em styles.css; doc comments faltando.
- [P3] Ícones sem aria-hidden; .btn-password-toggle morto; comentários desatualizados; overlay do painel não trava rolagem; e-mail sem quebra; textos do convite expirado divergentes.

Detector: 4 design-system-color, todos falsos positivos (preto computado sem styles.css global).
