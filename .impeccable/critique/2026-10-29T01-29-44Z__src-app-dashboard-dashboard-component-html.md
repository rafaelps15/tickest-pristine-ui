---
target: Início completo
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\dashboard\\dashboard.component.html"
target_fingerprint: "sha256:9358d4d8e1c39e5c7f9d1cb2d8b817379781cb9c2e9128d3f1ddc05e8a446faf"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\dashboard\\dashboard.component.html"
timestamp: 2026-10-29T01-29-44Z
slug: src-app-dashboard-dashboard-component-html
---
# Critique + audit — Início completo (2026-10-28, 22h)
Method: dual-agent (A design, B detector) + audit técnico. Só código, sem navegador.
Critique 27/40 (H1 3, H2 3, H3 3, H4 2, H5 3, H6 3, H7 2, H8 2, H9 3, H10 3). Audit 14/20 (A11y 3, Perf 3, Responsivo 3, Theming 2, Integridade 3).
Detector: 4 falsos positivos rgb(0,0,0).

## Prioridades
1. [P1] --tk-danger-rgb não existe (styles.css): realce "acabou de vencer" e fundo do badge Atrasado no escuro somem.
2. [P1] Admin sem tickets:manage cai numa página vazia (só "em breve").
3. [P1] Solicitante vê "em breve" antes dos próprios chamados; primeiro uso sem convite.
4. [P1] Supervisor: Atrasados é o 6º de 6 KPIs; frase do gráfico fala de volume.
5. [P2] Central/SLA: stat-card não compacto (maior que os KPIs) e zero em vermelho (stat-card toneValue).
6. [P2] Mesmos números nos KPIs e na barra de composição.
7. [P2] Alternador Empresa/Com filtros mora no gráfico mas muda a página toda.
8. [P2] Gráfico não redesenha ao trocar o tema; "Atualizado há" 4,24:1 sobre o fundo; alertas de erro reanunciados a cada 2 min; links no azul do Bootstrap.
9. [P2] Toque: botão de tabela 32px de largura; fatias da barra 6px; tocar na barra navega sem tooltip.
10. [P3] opacity em aria-disabled; código morto atrás de flags ligadas; esqueleto duplicado; "recorte" no Guia; timers; departamentos pedidos pra todos.
