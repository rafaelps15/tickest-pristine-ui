---
target: tela departamentos
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:C:\\dev\\tickest-pristine-front\\src\\app\\departments\\feature-department-list\\department-list.component.html"
target_fingerprint: "sha256:8cfafc840fe7011107ed779e4fb3e1687b406a5b87e9e56326890daa2443f9f2"
target_path: "C:\\dev\\tickest-pristine-front\\src\\app\\departments\\feature-department-list\\department-list.component.html"
timestamp: 2026-10-27T22-56-18Z
slug: tment-list-department-list-component-html-d611d7fa
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score — 22/40 (Acceptable)
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 1 | 500 em GET /departments → "Carregando…" eterno; excluir sem progresso/sucesso |
| 2 | Match System / Real World | 3 | pt-BR bom; capitalização "Novo Departamento"/"Novo departamento" |
| 3 | User Control and Freedom | 2 | sem desfazer; modal de edição travado só sai pelo Cancelar |
| 4 | Consistency and Standards | 2 | btn-outline-primary azul Bootstrap; ⋮ com 2 ações; seletor de responsável não reusa listbox; excluir sem toast |
| 5 | Error Prevention | 3 | confirmação não cita chamados; excluir sem guarda de mutating |
| 6 | Recognition Rather Than Recall | 3 | busca por setor não mostra qual setor bateu |
| 7 | Flexibility and Efficiency | 1 | sem ordenação, visão compacta ou filtro sem setor/sem responsável |
| 8 | Aesthetic and Minimalist Design | 2 | grade 2 colunas desigual; 1º card em y≈890 |
| 9 | Error Recovery | 1 | modal "Erro" duplicado + Salvar desabilitado; alerta de exclusão longe e permanente |
| 10 | Help and Documentation | 3 | Guia repete subtítulo e linha de setor vazio |

## Design Specificity
Bootstrap genérico com texto específico do produto; relação departamento → setor → recebe chamados não aparece no visual.
Detector CLI: 3 design-system-color rgb(0,0,0) linha 0 (falsos positivos). Browser: btn-primary 4.0:1 e sidebar ativa 3.4:1 (tema), line-length Guia ~148ch e subtítulo ~110ch, cramped-padding no empty state mobile (department-list.component.html:42 sem card-body).

## Priority Issues
- [P0] Erro de carga congela a tela: departments.store.ts:38/:42 leem _listResource.value() direto (lança em erro). Fix: valueOf() + spec de erro. /impeccable harden
- [P1] Modal de edição trava quando detalhe falha (loadingCurrentResponsible fica true). Fix: onError encerra loading, mensagem específica, permite salvar. /impeccable harden
- [P1] Excluir sem retorno/proteção: sem guarda mutating, sem toast, erro longe do card, foco perdido, confirmação não cita chamados. Fix: [busy], toast, botão "Excluir departamento e N setores", contar chamados. /impeccable clarify + harden
- [P2] Grade desigual, departamento com 0 setores não se destaca, Resumo sem ação. Fix: lista densa/recolhível, 0 setores âmbar, avisos viram filtro. /impeccable layout
- [P2] btn-outline-primary rgb(13,110,253) fora da marca (10 usos); descrição herda fw 600; ⋮ com 2 ações. Fix: override global com --tk-primary, fw-normal, ícones visíveis. /impeccable colorize / polish

## Persona Red Flags
Alex: sem ordenação/filtro; busca sem realce; 5 setores = 5 modais, sem "Salvar e adicionar outro".
Sam: h2 inclui badge; candidatos sem listbox/aria-live; spinners sem rótulo; foco perdido após excluir; ícones sem aria-hidden; alvos 31/36px.
Admin primeira vez: não há passagem criar departamento → adicionar setor; descrição obrigatória só no departamento; nada confirma disponibilidade na abertura de chamados.

## Minor Observations
Dica da busca vazia ignora setores; Resumo 0/0 sobre empty state; Guia repete subtítulo; alerta de mutação não fecha; Guia sem max-width em ch.

## Questions to Consider
1. Departamento deveria existir sem setor?
2. Tela de configuração ou de saúde da estrutura?
3. Excluir estrutura com chamados não deveria ser arquivar-primeiro?
