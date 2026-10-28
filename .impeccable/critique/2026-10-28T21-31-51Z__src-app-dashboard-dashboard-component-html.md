---
target: tela Início (dashboard)
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\dashboard\\dashboard.component.html"
target_fingerprint: "sha256:cf105a216dc5b137dcc0dab11c948c68c7e8db59668381586b383fcef0a1299e"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\dashboard\\dashboard.component.html"
timestamp: 2026-10-28T21-31-51Z
slug: src-app-dashboard-dashboard-component-html
closed: true
---
Method: dual-agent (A: revisão de design · B: detector + audit técnico). Navegador ao vivo indisponível (sessão exige login do usuário); A e B usaram capturas reais (1366×650, 1440, 1920, 768, 390, escuro, carregando) e o código.

## Heurísticas de Nielsen — 27/40 (Aceitável/Bom)
1 Visibilidade 3 (86 atrasados só abaixo da dobra) · 2 Mundo real 3 ("Na fila 118" × "Abertos 59"; dica some a 1366) · 3 Controle 3 · 4 Consistência 2 (3 contagens repetidas KPI × barra; DESIGN.md se contradiz sobre a posição dos Alertas de SLA) · 5 Prevenção 3 · 6 Reconhecimento 3 (KPIs sem pista de clique) · 7 Eficiência 2 · 8 Minimalismo 2 ("Disponível em breve" repetido; navbar vazia) · 9 Recuperação 3 · 10 Ajuda 3.

## Audit técnico — 16/20 (Bom)
A11y 3 · Performance 4 · Responsivo 3 · Tema 3 · Integridade 3. Detector: 13 avisos (4 cor = falsos positivos de render sem CSS global; 9 tamanho de fonte, 7 verdadeiros: 0.8125/0.875/0.9375rem fora da escala).

## Problemas prioritários
1. [P1] Risco de SLA (86 atrasados) fora da primeira dobra — conflita com a decisão do produto de pôr os alertas abaixo do gráfico. layout.
2. [P1] Contagens duplicadas: Em andamento/Resolvidos/Fechados no KPI e na barra; "Na fila" não bate com fatia. distill.
3. [P2] "Disponível em breve" repetido acima da dobra (card SLA cumprido + rodapé). quieter.
4. [P2] Frase de destaque alarmista com base pequena (125% sobre ~10 chamados): mostrar absoluto. clarify.
5. [P2] Uma falha dos totais gera dois role=alert (KPI + composição). harden.
6. [P2] Título do alerta em --tk-primary no hover (~4,0:1). polish.
7. [P2] Alvos de toque <44px: "Tentar novamente", "Limpar", "Ver todos". adapt.
8. [P3] Escala tipográfica com 4 passos pequenos quase iguais; colspan fixo; promessa rejeitada do Chart.js em cache; "0 em risco" em âmbar; texto colado na fatia; logo em retângulo branco no escuro (fora do Início).

## Personas
Alex: sem período livre; pico do gráfico leva à lista só por clique/tabela; auto-refresh sem desligar. Sam: paradas de Tab duplicadas (KPI e fatia para a mesma lista); sem resumo textual da série fora da tabela; title do valor do KPI não acessível por teclado.
