# Plano da refatoração do front-end — 2026-10-29

Ordem por dependência e gravidade. Os ids remetem a `FRONTEND_AUDIT.md`; as remoções de lógica do
back-end, a `BACKEND_RECONSTRUCTION.md`.

| Lote | Conteúdo | Ids | Depende de | Resultado |
|---|---|---|---|---|
| 1 | Inventário e baseline | — | — | Feito |
| 2 | Auditoria arquitetural (limites de módulo, Store, camadas) | A-10, A-19 a A-21 | 1 | Feito; um desvio de limite |
| 3 | Falhas críticas e segurança da sessão | A-01, A-02, A-03, A-23 | 1 | A-01 a A-03 corrigidos; A-23 depende do back-end |
| 4 | Separação front/back | A-05 (BR-001), A-12 a A-18 | 2 | Uma remoção; o resto analisado e mantido |
| 5 | Organização modular | A-10 | 2 | Diálogo de atribuição em `shared/ui` |
| 6 | Tipagem e integração com a API | A-04, A-25, A-27, A-28 | 1 | A-04 corrigido; demais sem defeito ou decisão do usuário |
| 7 | Componentes e formulários | A-06 a A-09, A-11 | 6 | Corrigidos |
| 8 | Navegação e experiência | A-21, A-29, A-31 | 7 | Analisado; sem mudança |
| 9 | Testes e regressões | — | 3 a 7 | Specs novas e ajustadas; suíte completa verde |
| 10 | Revisão final independente | — | 9 | `ca-review` nos hunks da missão; diff conferido com os documentos |

## Estratégia

- **Trabalho paralelo no mesmo working tree.** Outras sessões editavam Início, Monitorar, Usuários
  e Funções. Cada alteração foi um hunk pequeno, aplicado depois de reler o arquivo, sem stage nem
  commit. O patch só desta missão fica no scratchpad (ver `FRONTEND_REFACTOR_PROGRESS.md`).
- **Contrato real como referência.** Cada divergência foi checada no back-end da `origin/main`
  (`0eff7b6`); nenhum endpoint ou campo foi inventado.
- **Visibilidade, não autorização.** As regras de permissão do front só escondem o que a API
  recusaria; a autorização continua no servidor.
- **Remover só o comprovado.** Lógica que parece de negócio, mas só apresenta números do servidor ou
  orquestra chamadas que ele valida, ficou e está justificada na auditoria.

## Fora do escopo desta missão

Back-end (nenhuma alteração), tokens em cookie (A-23), ligar as flags do Início (A-28), URL de
produção (A-27), ler a política de anexos da API (A-25), busca de responsáveis elegíveis (A-26).
