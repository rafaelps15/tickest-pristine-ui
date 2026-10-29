---
target: tela roles
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:c:\\dev\\tickest-pristine-front\\src\\app\\roles\\feature-role-list\\role-list.component.html"
target_fingerprint: "sha256:9d9e6a494ae2ce928cfba2a490aa424514ca2d775ad2a857f23d4b86f8caa06d"
target_path: "c:\\dev\\tickest-pristine-front\\src\\app\\roles\\feature-role-list\\role-list.component.html"
timestamp: 2026-10-29T01-50-37Z
slug: eature-role-list-role-list-component-html-185d21a7
---
Method: dual-agent (A: design review · B: detector + browser). Browser unavailable (Chrome extension not connected) — source-only review, checked against backend.

## Design Health Score — Funções (/roles): 21/40 (Acceptable)
| # | Heurística | Nota | Problema |
|---|---|---|---|
| 1 | Visibilidade do estado | 2 | Recarga troca a tabela pelo spinner; falha do catálogo invisível |
| 2 | Mundo real | 3 | "back-end ainda não guarda cor" na UI |
| 3 | Controle | 2 | Cancelar de Permissões não trava no envio; Remover cor sem desfazer |
| 4 | Consistência | 2 | Diverge de Usuários/Departamentos (recarga, erro, aria-disabled) |
| 5 | Prevenção | 2 | Nova Função → POST /roles 405 |
| 6 | Reconhecimento | 2 | +N só em title |
| 7 | Eficiência | 1 | 17 caixas sem contador/marcar grupo |
| 8 | Minimalismo | 3 | Bolinha índigo sem informação |
| 9 | Recuperação | 1 | Erro vira vazio + alerta vermelho |
| 10 | Ajuda | 3 | Guia com frase imprecisa |

## Priority Issues
- [P0] "Nova Função" chama POST /roles inexistente (405) — html:3, :39 — harden/clarify
- [P1] Erro vira dado e recarga apaga a tabela — html:32-44 — harden
- [P1] Diálogo de Permissões sem estado de carga/erro do catálogo, sem contador/marcar grupo/resumo de mudanças, Cancelar não trava — html:145-185 — distill/harden
- [P2] +N e motivo do desabilitado só em title; color input 24px — html:68,76; css:9 — harden/adapt
- [P2] Copy: "back-end", "nada administrativo", "não só você" — clarify

## Persona red flags
Alex: 17 caixas sem atalhos. Sam: title-only, spinner sem nome, check sem aria-hidden. Admin Master: não consegue criar Supervisor/RH; cor só local.

## Minor
Badges fora do flex do nome; (change) vs (input) no seletor; Remover cor sem desfazer; número grande pra "funções cadastradas".
