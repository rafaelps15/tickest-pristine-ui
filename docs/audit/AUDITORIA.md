# Auditoria do front-end Tickest

## Parte I — Consolidação vigente

### 0. Cabeçalho

| Item | Valor |
|---|---|
| Período | 2026-10-29 a 2026-11-06 |
| Responsável | Rafael Santos |
| Front (`tickest-pristine-front`) | `main` = `origin/main` = `387f5e6` desde 06/11, com a E-16, a E-18 e o bloco E-02, E-17 e E-03 integrados. Três fast-forwards da `main`, cada um com conferência do valor antigo e push sem force: `333f4c2` → `0e7cc4e` (E-16) às 23:10 de 05/11, `0e7cc4e` → `413a447` (E-18) às 23:17 e `413a447` → `387f5e6` (bloco, 28 commits) às 14:45 de 06/11. As branches foram excluídas com `git branch -d`, e as worktrees, removidas (§11). Antes, das 16:58 às 23:10 de 05/11, a `main` estava em `333f4c2`, com a E-01 e a E-12 sobre o PR #5 (`5cd3dce`) |
| Working tree do front nesta redação | O working tree principal segue na branch `fix/SPEC-049-fe0-front-alignment` (`4b7b0de`, local e remota), da outra sessão, com a edição dela no `CLAUDE.md` e neste documento: até 06/11, depois das 14:45, ela não tinha commitado (conferido só pelo Git). O texto dela, na cópia das 19:08 de 05/11, está neste documento desde o `455230a` (E-16a), que resolveu os 3 conflitos (DOC-25). Esta redação não leu nem alterou esse working tree: trabalhou numa worktree própria, na branch `docs/audit-bloco-1`, criada da `main` em `387f5e6` |
| Atualizações de 05/11 | Na FE-0 (PR #5, `4b7b0de`, merge `5cd3dce`), pela edição da outra sessão: o A-22 e o que depende dele (DIV-5 e a pendência 7 do §6), o nome do guard no A-21 e as DIV-1 e DIV-4, resolvidas. Na redação da E-12: a D-SF5, a E-01 e a E-12 (§1, §3, §6, §7, §9 e §11), na `origin/main` desde as 16:58. Depois, o registro do merge e do push (§11) e a reauditoria de 05/11, com os estados conferidos, os achados novos, o plano e as decisões de 05/11 (§16) |
| Atualizações de 06/11 | O registro da E-16 e da E-18, integradas em 05/11, e do bloco E-02, E-17 e E-03, integrado em 06/11: os números (§1, §3 e §8.5), o histórico (§11), os estados dos IDs corrigidos (§4 a §8, §10, §12 e §16) e o plano (§16.7). E 7 achados da execução, com ID novo, conferidos no `387f5e6` (§16.10) |
| Back (`tickest-pristine`) | Conferido na `origin/main` `ef1c981` (merge do PR #57, 2026-10-31 00:36) durante a auditoria de 31/10. Em 04/11, a `origin/main` do back estava em `e5d8a38`, 45 commits depois. Na reauditoria de 05/11, `251da97` (merge do PR #71, G1 da spec 049, às 17:11), em cópia fixa (§12; §16.1), que o §16.10 também cita |
| Documentos de origem | `docs/audit/FRONTEND_AUDIT.md` ("FA", Anexo A) e `docs/audit/FINAL_ACCEPTANCE_AUDIT.md` ("FI", Anexo B), no commit `7fe3bec` |

**Como ler**

- A Parte I prevalece sobre os anexos. Os anexos guardam o texto original, sem nenhuma alteração. Onde
  divergem, valem a Parte I e as erratas (§15.1).
- `FA:n` e `FI:n` apontam a linha `n` do arquivo original. É a mesma linha `n` contada a partir do
  marcador de início de cada anexo.
- Caminhos do front partem de `src/app/`, salvo os da raiz (`src/styles.css`, `src/environments/`,
  `src/index.html`). O `server.ts` saiu com o SSR no `06f537b` (E-12) e só aparece como histórico.
  Linhas do front são do `7fe3bec`, salvo indicação; até o `82c7462`, o código de `src/` não mudou
  depois desse commit. O PR #5, a E-01, a E-12, a E-18 e o bloco E-02, E-17 e E-03 mudam `src/`
  (§1). As linhas do §16 são do `333f4c2`, salvo as do §16.10 e as marcadas, do `387f5e6`.
- Arquivos de código do back aparecem pelo nome, com linhas do commit `ef1c981`, salvo indicação;
  no §16, do `251da97`. As specs 044 a 048 do back não são versionadas: foram lidas no working tree
  do back em 04/11 e copiadas de novo em 05/11 (§16.1). A 049 está versionada desde o `bcf0356`
  (PR #71).
- **Gravidade** (FA:8-10): Crítica (segurança, perda de sessão ou dado); Alta (contrato quebrado ou
  recurso que não funciona); Média (divergência de regra visível ao usuário ou violação de limite de
  módulo); Baixa (duplicação ou risco futuro sem efeito hoje). "—" quer dizer que o original não dá
  gravidade. No §8, os rótulos são os do relatório de 31/10 (Alto, Baixo; prioridade Alta, Média, Baixa).
- **Classe** (FA:12-14): Defeito, Skill, Back-end, Melhoria, Mantido.
- **Estado atual:**
  - **Corrigido (origin/main):** publicado até o PR #4 (`e977f64`);
  - **Corrigido (main local):** nos commits de 04/11 (E-00), integrados à `main` local e publicados
    no push de 04/11, às 22:51 (§11). Desde 05/11, às 16:58, `main` e `origin/main` são o mesmo
    commit (`333f4c2`); o rótulo guarda só a época da correção;
  - **Corrigido (`hash`, E-xx):** no §16, corrigido no commit e na etapa indicados, na `origin/main`
    desde 05/11 (E-16 e E-18) ou desde 06/11 (E-02, E-17 e E-03);
  - **Removido:** só o A-05 (BR-001);
  - **Mantido:** analisado e mantido, com justificativa;
  - **Pendente:** aberto, com a dependência indicada;
  - **A reavaliar:** o texto original deixou de valer e falta decisão ou nova conferência;
  - **a confirmar:** fato não comprovado nesta redação.
- **IDs estáveis:**
  - A-, R-, C-, 6.3 e BR-001 não foram renumerados. O back cita A-06, A-08, A-12, A-22, A-23, A-24,
    A-27 e A-30 (specs 046 a 049).
  - Apelidos: BR-001 = A-05; P-2 = A-45; P-3 = A-46 (FA:403).
  - Achados novos do front começam em A-47, R-08 e C-13. A reauditoria de 05/11 criou A-47 a A-59,
    R-08 a R-10 e C-13 a C-41 (§16). A execução de 05 e 06/11 criou A-60 a A-63, C-42, DIV-16 e
    DOC-44 (§16.10).
  - Outras séries: N- (conferência de 31/10, §7); DIV-, LAC-, DOC- e BK- (auditoria geral de 31/10,
    §8; os de 05/11, DIV-11 a DIV-15, LAC-16 e LAC-17, DOC-11 a DOC-43 e BK-6 a BK-30, no §16);
    BA- (arquitetura e código do back, criada em 05/11, §16.3); E- (etapas do plano de 31/10, com
    E-16 a E-25 acrescentadas em 05/11, §16.7); L- (etapas da limpeza de 04/11); D-SF (decisões
    sobre o SPEC-TICKEST-FRONT); FE- (achados do front na spec 049 do back). Os IDs provisórios da
    reauditoria (T-DOC, T-FEA, T-BEA, T-SEP, T-ETP e T-SPC) aparecem só na coluna Origem do §16.
  - O `SPEC-TICKEST.md` do back tem uma série própria A-n (ex.: A-6, A-11 e A-12 em
    `SPEC-TICKEST.md:62,67,68`), sem relação com este catálogo.

### 1. Resumo executivo

- **Publicado na `origin/main` (`e977f64`, PR #4):**
  - A-01 a A-11 (o A-05 como remoção), A-25, A-26, A-29, A-32, A-34 a A-41 e A-43 a A-46;
  - as duas etapas do A-42 (`591bc90`);
  - R-01 a R-04;
  - C-02, C-03, C-04, C-06, C-08, C-11 (membros listados) e C-12.
  - Validação desse estado: 1361 testes; build inicial de 381,03 kB com 4 avisos de orçamento
    (FA:606-607; repetida em 04/11 em `e00v2/logs/test-0.log` e `build-0.log`).
- **Publicado no push de 04/11, às 22:51 (`e977f64` → `d1f5d97`, 14 commits):**
  - os 10 commits da E-00: A-28, aviso de nova tentativa do A-42, C-07, C-09, A-33, R-05, R-06, R-07,
    C-10 e 6.3;
  - a L-3 (`7fe3bec`), que remove o `@angular/animations`;
  - as limpezas L-4 a L-6, em três commits: este documento (`2445a2a`), o `DESIGN.md` (`56495bd`) e
    o tsconfig sem as supressões NG8102 e NG8107 (`d1f5d97`).
- **Publicado no push de 04/11, às 22:59:** o `cli.analytics` como `false` (`2ccf5d5`) e o registro da
  integração (`82c7462`).
- **Na `origin/main` desde 05/11, às 00:50 (merge do PR #5, `5cd3dce`):** a FE-0 da spec 049 do back
  (`4b7b0de`), feita por outra sessão. Neste documento, o PR #5 mudou o A-21, o A-22, o DIV-5, a
  pendência 7 e as DIV-1 e DIV-4; as outras tarefas foram conferidas na reauditoria de 05/11 (§6,
  item 31; §16.2).
- **Na `origin/main` desde 05/11, às 16:58 (fast-forward da `main` para o `333f4c2` e push; §11), a
  E-01 e a E-12, rebaseadas sobre o `5cd3dce`:**
  - E-01: os defeitos conhecidos (C-09, A-42, R-07, A-33, N-3, N-6 e N-1) e a spec do
    `SideMenuNavComponent`, em 10 commits validados um a um. O N-2 já veio resolvido pelo PR #5, e o
    commit do N-2 saiu no rebase;
  - E-12: remoção do SSR, Angular 22.2 e `@ngrx/signals` 22.0.1 estável, fontes e ícones no próprio
    build, SRI e lint com o `angular-eslint`, em 12 commits validados um a um.
- **Na `origin/main` desde 05 e 06/11, por fast-forward com conferência do valor antigo e push sem
  force (§11):**
  - 05/11, às 23:10: a E-16, com o registro da E-01 e da E-12 conciliado com a FE-0 (`455230a`) e a
    reauditoria de 05/11 (`0e7cc4e`);
  - 05/11, às 23:17: a E-18, rebaseada sobre o `0e7cc4e` e revalidada: A-51 (`0043cbf`) e R-08
    (`413a447`);
  - 06/11, às 14:45: o bloco E-02, E-17 e E-03, em 28 commits (`92b9e93` a `387f5e6`). E-02: C-41,
    A-52, A-57, A-58, A-54, DIV-12, DIV-13, DIV-15, DIV-11, DIV-2 e a mitigação do DIV-3. E-17: C-33,
    com a parte da flag do C-34 e o token do C-15, A-50, A-53, DIV-9, C-24 e R-10. E-03: C-30, C-31
    (só o `SessionService`), C-17, C-21, A-49, A-48, C-13, C-40, A-47, C-14 e C-15 (os mapas de badge);
  - cada commit validado sozinho, em cópia isolada: build sem aviso, todos os testes verdes e lint com
    0 erros. Em cada correção de comportamento, os testes novos falham no código anterior;
  - as branches foram excluídas com `git branch -d`, sem recusa, e as worktrees, removidas; nenhuma
    delas esteve no GitHub;
  - seguem pendentes a guarda de plataforma do Monitor (§6, item 25) e o DIV-3 no back (§8.1).
- **Números da `main` em 04/11 (`2ccf5d5`, cópia isolada com o `node_modules` do `npm ci` de 04/11):** 1381 de
  1381 testes; build inicial de 382,02 kB, 0 avisos (`l48/v7a/.v7a/test.log` e `build.log`, ver §14).
- **Números da `origin/main` (`5cd3dce`, extraído por `git archive`):** 1439 testes; build inicial de
  382,56 kB, 0 avisos.
- **Números da E-01 (`79e5129`):** 1454 testes; build inicial de 380,25 kB, 0 avisos.
- **Números da E-12 (`2647ab3`) e da ponta `333f4c2`, a `main` das 16:58 às 23:10 de 05/11:** 1456
  testes; build inicial de 433,61 kB, 0 avisos; lint sem erros; `npm audit` das dependências de
  produção sem vulnerabilidades (§3).
- **Números da E-18 (`413a447`):** 1469 testes; build inicial de 433,88 kB, 0 avisos (§3).
- **Números do `387f5e6`, ponta do bloco 1 e base deste registro:** 1567 testes; build inicial de
  433,27 kB, 0 avisos; lint sem erros; conformidade estrita pela média simples de 90,4% (88,0% no
  `333f4c2`) e agregado estrito de 93,0%, 1153 de 1240 (§8.5).
- **Números do back na reauditoria de 05/11 (`251da97`):** build sem aviso; 940 testes unitários e
  134 de arquitetura passando, executados numa cópia; 674 de integração, declarados pela 049 (§16.1).
- **Mantidos com justificativa:** A-12 a A-21, A-31, C-05 e o breakpoint repetido do C-07 (§5).
- **Pendentes (§6):**
  - com o back: A-23 (spec 046), A-24 (047), A-30 (048) e a volta da cor da função (A-05/BR-001,
    spec 044), todas em descoberta; as DECs das 046 a 048 foram decididas em 05/11 (§16.8), e o texto e
    a implementação no back dependem de autorização;
  - com Rafael Santos: a URL de produção do A-27 (pendente de propósito; a topologia, mesma origem com
    proxy em `/api`, foi decidida em 05/11). Também decididos em 05/11 (§16.8): a exceção do C-01 entra
    nas skills (E-07), o `.impeccable/design.json` fica sem regenerar e os originais de `docs/audit` só
    saem depois de o back atualizar as referências; segue aberta a decisão 12 (conferência de
    permissão por recurso, no back);
  - D-SF5 definida em 04/11 (§9); E-01 e E-12 rebaseadas sobre o PR #5 e na `origin/main` desde
    05/11, às 16:58 (§6, itens 8, 10 e 21 a 24). Restam da E-12 a guarda de plataforma do
    `TicketMonitorComponent` (item 25; as quatro do `SessionService` saíram no `857c4d0`, C-31), a
    URL de produção do A-27 (item 5) e a CSP (A-56, §16.3);
  - reconferidas em 05/11 no `251da97`: as evidências do back que não existem mais desde o `ef1c981`
    (N-7); os substitutos registrados conferem (§7). O A-22 foi corrigido em 05/11, na `origin/main`
    pelo PR #5 (§5).
- **Abertos da auditoria geral de 31/10 (§8):**
  - dez divergências front/back, seis resolvidas: a DIV-1 ("Fechar chamado" sempre falha), a DIV-4, a
    DIV-5 e a DIV-10 em 05/11, pelo PR #5, e a DIV-2 e a DIV-9 em 06/11, no bloco 1 (`b9c614e` e
    `ef7f70e`). Das duas de gravidade Alto, resta a DIV-3 (o PUT reenvia descrição e status lidos),
    mitigada no front (`e813444`) e com a correção do back pendente (T-501 e T-502 da 049). As DIV-6 a
    DIV-8 têm decisão de 05/11 e esperam spec no back (§16.8);
  - quinze lacunas para specs novas no back; a LAC-11 foi entregue no back pela G1 da 049, e faltam o
    front e o cabeçalho no CORS (LAC-16);
  - problemas de documentação no front e no modelo de specs do back.
- **Falha de processo (§13):** a E-00 foi executada sem autorização válida. Os commits ficaram por
  decisão posterior (L-1).
- **Reauditoria de 05/11 (§16):** só de leitura, em seis frentes, sobre o `333f4c2` e o back
  `251da97`. 128 IDs novos (13 A, 3 R, 29 C, 33 DOC, 5 DIV, 2 LAC, 18 BA e 25 BK), dos 102 IDs provisórios das frentes e dos itens de 31/10 sem registro; nenhum de gravidade Crítica; Alta: A-59 (INFERIDO) e BK-27 (31/10); Média: A-47, A-48, A-50, A-53, A-56, LAC-17, BA-13 e BA-17; o resto, Baixa ou sem gravidade dada pela frente. Plano revisto no §16.7. Decisões de 05/11 no §16.8: a E-16 (a e b)
  e a Onda 0 aprovadas, menos a decisão 12, que segue aberta com a proposta.
- **Achados da execução de 05 e 06/11 (§16.10):** 7 IDs novos (A-60 a A-63, C-42, DIV-16 e DOC-44),
  todos abertos e conferidos no código do `387f5e6`; nenhum de gravidade Crítica ou Alta; Média: A-61
  ("Disponível em breve" no card de SLA do Início).

### 2. Escopo e método

Os detalhes ficam nos anexos.

| Rodada | Escopo | Método | Onde |
|---|---|---|---|
| Auditoria do front, 29–30/10 | Todo o `src/` (Angular 22, NgRx Signal Store, Karma/Jasmine), contra as skills, o `CLAUDE.md` e o back (`0eff7b6`, depois `a72e07b`) | Escalas de gravidade e classe (FA:8-14). Princípios: contrato real, visibilidade × autorização, remover só o comprovado, hunks pequenos (FA:52-61). Fora do escopo: FA:62-67 | FA:1-14; FA:52-67 |
| Foco visível (A-34) | Aplicação real, sessão de Administrador, claro e escuro | Captura sem foco × com foco; conta a faixa que muda com contraste ≥ 3:1; calibrado em página de teste (FA:210-232; FI:260-276) | FA:195-232; FI:258-280 |
| Aceitação | As 13 seções da missão original | Matriz PASS, PARTIAL, FAIL, BLOCKED, NOT APPLICABLE (FI:87-245); validações em cópia isolada (FI:60-85) | FI:60-256 |
| Conformidade com as skills e saneamento, 30/10 | 51 arquivos de `src` sobre `a4cedca` | Revisor independente, só leitura; depois, saneamento autorizado (FA:509-608) | FA:509-608 |
| Auditoria geral, 31/10 | Front e back (`ef1c981`), só leitura | Relatório entregue na conversa, sem arquivo no repositório; plano E-00 a E-15 | §7; §8 |
| Execuções de 04/11 | E-00, L-9, L-3 e as limpezas L-4 a L-6, integradas à `main` e publicadas no push das 22:51; depois, o `cli.analytics` (`2ccf5d5`) e o `npm ci`. Na revisão de 04/11, as supressões NG8102 e NG8107 saíram de todas as configurações, e a pasta `.impeccable/live/`, sem arquivos e ignorada pelo Git, foi apagada | Cada mudança validada em cópia isolada antes de entrar na `main` | §3; §11; §14 |
| Esta consolidação, 04/11 | FA, FI, Git e código do front e do back | Só leitura. As linhas citadas dos originais foram conferidas. A redação não rodou build, teste nem `npm`: os números do §3 vêm dos logs. Na revisão de 04/11, o build e os testes do estado final rodaram numa cópia isolada, sem `npm install` nem `npm ci` (§3) | — |
| Reauditoria, 05/11 | Front `333f4c2` e back `251da97`, em cópias fixas; specs fora do Git copiadas do working tree do back | Só leitura, em seis frentes, com o roteiro de 31/10; classes COMPROVADO, DECLARADO, INFERIDO e NÃO VERIFICADO; `eslint` e `tsc` no front; build e testes unitários e de arquitetura no back | §16 |
| Execução e registro, 05–06/11 | A E-16, a E-18 e o bloco E-02, E-17 e E-03, integrados à `main`; este registro, sobre o `387f5e6` | Cada commit validado sozinho em cópia isolada (build, testes e lint), com os testes novos falhando no código anterior. Este registro só leu o código do `387f5e6` e o Git, sem build nem testes, e foi montado por script | §1; §3; §11; §16.10 |

### 3. Linha de base e validações

| Marco | Data | Testes | Build inicial | Avisos de orçamento | Fonte |
|---|---|---|---|---|---|
| Baseline (`9deae1c`, antes da missão) | 29/10 | 1296 | 374,66 kB | 4 | FI:20-28 |
| HEAD `b7f0c37` | 29/10 | 1307 | 375,05 kB | 4 | FI:70-71 |
| HEAD + correções da revisão de aceitação | 29/10 | 1311 | 377,19 kB | 4 | FI:70-71 |
| `7c5b362` publicado | 29/10 | 1311 | 379,15 kB | 4 | FI:72; FI:277-280 |
| Working tree com A-37 a A-40 | 30/10 | 1318 | 379,29 kB | 4 | FI:73 |
| + A-41 e 1ª etapa do A-42 | 30/10 | 1322 | 379,93 kB | 4 | FI:74 |
| + 2ª etapa do A-42 e R-01 a R-04 | 30/10 | 1347 | 380,91 kB | 4 | FI:75 |
| + A-43, A-45 e A-46 | 30/10 | 1358 | 380,94 kB | 4 | FI:78 |
| + saneamento (C-01 a C-12 e A-44): conteúdo do PR #3, igual em `e977f64` | 30/10 | 1361 | 381,03 kB | 4 | FI:80; FA:606-607; `e00v2/logs/test-0.log`, `build-0.log` |
| E-00 (`9d7e238`) | 04/11 | 1381 | 386,51 kB | 0 | `e00v2/logs/test-final.log`, `build-final.log` |
| L-3 (`7fe3bec`) | 04/11 | 1381 | 382,02 kB | 0 | `l3/modificada/.x2/` e `l3/x5a/.x5a/` (`test.log`, `build.log`) |
| Limpeza L-4 a L-6, estado final: `7fe3bec` com este documento, o `DESIGN.md` e os tsconfig sem as supressões NG8102 e NG8107 | 04/11 | 1381 | 382,02 kB | 0 | `l48/v6b/.v6b/` (`test.log`, `build.log`) |
| Commit `d1f5d97`, extraído por `git archive` | 04/11 | 1381 | 382,02 kB | 0 | `l48/v6e/.v6e/` (`test.log`, `build.log`) |
| `main` em `2ccf5d5`, com o `node_modules` do `npm ci` | 04/11 | 1381 | 382,02 kB | 0 | `l48/v7a/.v7a/` (`test.log`, `build.log`) |
| E-01 sobre o `82c7462`, antes do rebase: cada um dos 11 commits numa cópia própria | 05/11 | 1396 | 379,72 kB | 0 | `e01-val/<commit>/.val/`; `e01-logs/valida-commits.txt` |
| E-12 sobre a E-01, antes do rebase, com lint sem erros e `npm audit` de produção sem vulnerabilidades | 05/11 | 1398 | 433,02 kB | 0 | `e12-val/lint-5-autofocus/.val/` |
| `origin/main` em `5cd3dce` (merge do PR #5), extraído por `git archive` | 05/11 | 1439 | 382,56 kB | 0 | `rebase/val/5cd3dce/.val/` |
| E-01 rebaseada sobre o `5cd3dce` (`79e5129`): cada um dos 10 commits numa cópia própria | 05/11 | 1454 | 380,25 kB | 0 | `rebase/val/79e5129/.val/`; `rebase/val-e01/<commit>/.val/` |
| E-12 rebaseada sobre a E-01 (`2647ab3`): cada um dos 12 commits numa cópia própria, com o `node_modules` exato do seu lockfile; lint sem erros e `npm audit` de produção sem vulnerabilidades | 05/11 | 1456 | 433,61 kB | 0 | `rebase/val-e12/` (uma pasta por commit, de 01 a 12); `rebase/audit/` |
| Ponta da E-12 (`333f4c2`, com o registro da E-12), a `main` das 16:58 às 23:10 de 05/11 | 05/11 | 1456 | 433,61 kB | 0 | `rebase/val-e12/13-333f4c2-ponta/.val/`; conferido pela reauditoria (§16.1), sem reexecutar |
| E-18 rebaseada sobre o `0e7cc4e` (`0043cbf` e `413a447`): cada commit numa cópia própria | 05/11 | 1469 | 433,88 kB | 0 | `e18/val/3-0043cbf-rebaseado/.val/`; `e18/val/4-413a447-rebaseado/.val/` |
| E-02 sobre o `413a447`: cada um dos 11 commits numa cópia própria, com lint sem erros | 06/11 | 1517 | 433,88 kB | 0 | `e02/validacao.txt`; `e02/val/` |
| E-17 sobre a E-02: cada um dos 6 commits numa cópia própria, com lint sem erros | 06/11 | 1534 | 433,85 kB | 0 | `e17/validacao.txt`; `e17/val/` |
| E-03 rebaseada sobre a E-17: cada um dos 11 commits numa cópia própria, com lint sem erros; a ponta, `387f5e6`, é a base deste registro | 06/11 | 1567 | 433,27 kB | 0 | `e03/val/resultado.txt`; `e03/val/` |

- Os 4 avisos eram de orçamento de CSS por componente, anteriores à missão (FI:25-27). Saíram com o
  A-33 (`0df5718`).
- A E-00 foi validada commit a commit: build e testes de cada um dos 10 estados
  (`e00v2/logs/build-1.log` a `build-10.log`, `test-1.log` a `test-10.log`, `progresso.log`).
- A L-3 tirou 4,49 kB do build inicial (386,51 → 382,02 kB), sem mudar o número de testes. A
  validação foi feita duas vezes, com o mesmo resultado (X2 em `l3/modificada/`, X5-A em `l3/x5a/`).
- A remoção das supressões NG8102 e NG8107 não mudou a saída. O build do estado final (`l48/v6b/`)
  é idêntico, byte a byte, nos 122 arquivos, ao de uma cópia igual com os tsconfig do `7fe3bec`
  (`l48/v6h/`), feita nas mesmas condições (`l48/v6b/.v6b/dist-v6b-x-v6h.txt`). As duas cópias usam,
  por junção, o `node_modules` de `l48/l6/`, sem `npm ci`. Por isso os nomes dos chunks diferem dos
  de `l3/x5a/`, que tem `node_modules` próprio (`dist-v6h-x-x5a.txt`); sem junção, `l48/l6/` saiu
  idêntica a `l3/x5a/`.
- Com um `??` e um `?.` desnecessários de propósito no `LoadingStateComponent`, só nas cópias, o
  build sem as supressões avisa NG8102 e NG8107 e termina com sucesso (`l48/v6c/.v6c/build.log`).
  Com as supressões do `7fe3bec`, o mesmo código não gera aviso (`l48/v6d/.v6d/build.log`).
- O build do `d1f5d97` saiu igual ao da cópia v6b em 116 dos 122 arquivos. Os outros 6 (os HTML e o
  manifest do SSR) diferem só na CSS das fontes do Google, que o build de produção baixa e embute no
  HTML: o Google devolveu URLs diferentes às 22:21 e às 22:48
  (`l48/v6e/.v6e/dist-v6e-x-v6b-fontes.txt`). A saída do build depende, portanto, da resposta do
  Google Fonts (§6, item 23).
- Na E-01, importar o `CurrentUserService` pelo caminho direto, e não pelo barrel `./shared`, tirou
  2,47 kB do build inicial (`75413f2`: 382,56 → 380,09 kB; antes do rebase, 2,46 kB).
- Na E-12, o build inicial foi a 355,53 kB sem o SSR e sem a hidratação (`06f537b`), a 359,19 kB
  com o Angular 22.2 (`1135935`) e a 433,61 kB com as fontes e o Boxicons no próprio build
  (`ce43d3f`). Este último salto é quase todo o CSS do Boxicons (68 KB), que antes o navegador
  baixava do unpkg. Com as fontes no build, dois builds seguidos saem idênticos, byte a byte, nos 90
  arquivos (`rebase/val-e12/`, pasta 05; antes do rebase, `e12-val/fontes/.val/`).
- Até a E-12, o build de produção pré-renderizava só `/login` ("Prerendered 1 static route",
  `l3/x5a/.x5a/build.log`), e as outras rotas respondiam 500 no servidor SSR (§6, item 10). Sem o
  SSR (`06f537b`), o build gera só a saída do navegador.
- Lint: até a E-12, o projeto não tinha ESLint, e a análise estática era o `strict` +
  `strictTemplates` (FI:81). Com a E-12 (`21735f4`), `npm run lint` roda o `angular-eslint`; na
  ponta (`333f4c2`), sem erros. Na reauditoria de 05/11, `eslint src` numa cópia: sem erro nem aviso
  (§16.3).
- Os 1358 de FI:121, FI:207 e FI:236 são anteriores ao saneamento (errata 3).
- No bloco 1, o build inicial foi de 433,88 kB (E-18 e E-02) a 433,85 kB na E-17 e a 433,27 kB na E-03:
  o C-30 tirou 0,22 kB, o C-31 0,09 kB e o C-14 0,27 kB (`e17/validacao.txt`; `e03/val/resultado.txt`).

### 4. Catálogo-mestre de achados

Todos os 66 IDs dos documentos. "Detalhe" aponta as linhas do original no anexo.

| ID | Título curto | Gravidade | Estado atual | Onde (commit/PR) | Evidência principal | Detalhe |
|---|---|---|---|---|---|---|
| A-01 | Corrida de renovação entre abas revogava todas as sessões | Crítica | Corrigido (origin/main) | `664b73b`, PR #2 (`fabeeb1`) | `SessionService` ouve o evento `storage` (FA:73-81) | Anexo A, FA:71-81 |
| A-02 | Falha passageira na renovação deslogava | Alta | Corrigido (origin/main) | `664b73b`, PR #2 | `token-refresh.service.ts` (FA:85-91) | FA:83-91 |
| A-03 | Segunda renovação para requisição com token antigo | Média | Corrigido (origin/main) | `664b73b`, PR #2 | `auth.interceptor.ts` (FA:95-99) | FA:93-99 |
| A-04 | Contrato da spec 029 com nomes errados | Alta | Corrigido (origin/main) | `357f183`, PR #2 | `ticket-dashboard.ts`, `ticket-monitor-item.ts`, `ticket.data.service.ts` (FA:103-114) | FA:101-114 |
| A-05 (= BR-001) | Cor de função gravada no `localStorage` | Alta (classe Back-end) | Removido; a volta depende da spec 044 do back (Em descoberta) | `664b73b`, `fe8a559`, `46cfbb8`, `311618d`, PR #2 | `role-colors.util.ts` excluído; testes de ausência em `roles/feature-role-list/role-list.component.spec.ts:366` | FA:116-143; FI:337-356 |
| A-06 | "Reabrir" visível sem permissão | Média | Corrigido (origin/main); evidência do back reconferida em 05/11 (N-7) | `357f183`, `a77394d`, PR #2 | `tickets/ui/ticket-action-permissions.ts:27-31`. O `TicketAccessGuard.EnsureOwnerOrManagerAsync` (FA:149) não existe em `ef1c981`; a regra está em `ReopenTicketCommandHandler.cs:33-36` e é mais estrita para o dono (DIV-2); em `251da97`, `:33-41`, e a documentação do back descreve a regra do front (BK-6). Desde 06/11, o front segue a regra do back (`b9c614e`, DIV-2) | FA:145-164 |
| A-07 | "Editar" visível para dono sem `tickets:update-own` | Média | Corrigido (origin/main) | `357f183`, PR #2 | `ticket-action-permissions.ts:22-25`. Back conferido em `ef1c981`: a regra de FA:151 segue em `UpdateTicketCommandHandler.cs:35-44` | FA:145-164 |
| A-08 | "Atribuir responsável" visível sem `tickets:assign` | Média | Corrigido (origin/main) | `357f183`, `a77394d`, PR #2 | Back conferido em `ef1c981`: `Assign.cs:28` (`tickets:manage`) e `AssignTicketCommandHandler.cs:30-32` (`tickets:assign`), como em FA:152-153 | FA:145-164 |
| A-09 | Nome limitado a 50; o servidor aceita 100 | Média | Corrigido (origin/main); evidência do back reconferida em 05/11 (N-7) | `46cfbb8`, PR #2 | `users/entities/user-profile.ts:2` (`USER_NAME_MAX_LENGTH = 100`). `UserValidationRules.NameMaxLength` (FA:168) não existe em `ef1c981`; o limite está nas colunas (`UserConfiguration.cs:16-17`) | FA:166-175 |
| A-10 | Início importava componente interno de `tickets/ui` | Média (classe Skill) | Corrigido (origin/main) | `664b73b`, `357f183`, `a77394d`, PR #2 | Diálogo em `shared/ui/ticket-assign-dialog/` (FA:183-185) | FA:177-185 |
| A-11 | Novo pedido de confirmação deixava o anterior sem resposta | Baixa | Corrigido (origin/main) | `664b73b`, PR #2 | `confirm-dialog.service.ts` (FA:189-193) | FA:187-193 |
| A-12 | Transições de status no front | — | Mantido; evidência do back reconferida em 05/11 (N-7) | — | `tickets/entities/ticket-status.ts:38-44`. `TicketStatusTransitions.CanTransition` (FA:466) não existe em `ef1c981`; hoje é `Ticket.CanTransitionTo` (`Ticket.cs:120` em `ef1c981`; `:376-392` em `251da97`) | FA:466 |
| A-13 | Janela de cancelamento do dono | — | Mantido | — | `tickets/ui/ticket-cancel-window.ts` (FA:467) | FA:467 |
| A-14 | Reclassificação para "Atrasado" entre recargas | — | Mantido; evidência do back reconferida em 05/11 (N-7) | — | `TicketSla.GetStatus` (FA:468) não existe em `ef1c981`; em `251da97`, a regra é o `Ticket.GetSlaStatus` (`Ticket.cs:403-426`), com o limiar do `TicketSlaPlan.cs:19-20` (spec 045). O selo só promove a "Atrasado" (§16.4) | FA:468 |
| A-15 | Aritmética do Início sobre contadores | — | Mantido | — | `dashboard.component.ts` (FA:469) | FA:469 |
| A-16 | Frases e limites de tendência | — | Mantido; a frase "Fila estável" saiu no `f700aea` (A-53, E-17) | — | `dashboard-overview.ts`, `dashboard-insight-rules.ts` (FA:470) | FA:470 |
| A-17 | Seleção dos Alertas (3 + 2) | — | Mantido | — | `ticket-summary.store.ts` (FA:471) | FA:471 |
| A-18 | Somas de ativos e finalizados | — | Mantido | — | `my-tickets-summary.store.ts` (FA:472) | FA:472 |
| A-19 | Busca e contagem em Departamentos e Funções | — | Mantido | — | `departments/feature-department-list/*`, `role-insights` (FA:473) | FA:473 |
| A-20 | Impacto e ações em lote de Usuários | — | Mantido; risco de 429 no lote (A-59, INFERIDO) | — | `users.store.ts` (FA:474) | FA:474 |
| A-21 | Guards e menus só como UX | — | Mantido | — | `permission.guard.ts` (antes `admin-master.guard.ts`, nome trocado em 05/11), `main-layout` (FA:475) | FA:475 |
| A-22 | Limites de texto iguais aos do servidor | — | Corrigido (origin/main) | `4b7b0de`, PR #5 (`5cd3dce`) | Front: motivo da reabertura 4000 (`TICKET_REOPEN_REASON_MAX_LENGTH`, `tickets/ui/ticket-reopen-dialog/ticket-reopen-dialog.component.ts:6,41`; o spec ao lado envia 600 caracteres e bloqueia 4001), antes 500. Back: `ReopenTicketCommandValidator.cs:9` só confere o id; limite efetivo 4000 (spec 042); texto acima do limite responde 400 (`GlobalExceptionHandler.cs:46-60`). Ver §5 | FA:476; FI:365 |
| A-23 | Tokens de acesso e de renovação no `localStorage` | Média | Pendente → spec 046 do back | — | FA:482; back `specs/046-sessao-em-cookie-httponly/spec.md:101` | FA:482; FI:362 |
| A-24 | A API só informa `canCancel` | Baixa | Pendente → spec 047 | — | FA:483; back `specs/047-acoes-permitidas-do-chamado/spec.md:98` | FA:483; FI:363 |
| A-25 | Limites de anexo fixos no front | Baixa | Corrigido (origin/main), como A-39; texto revisto em 05/11 (DOC-42) | `8473d24`, PR #3 | FA:484 diz que os limites por chamado "continuam só no back-end". Desde `6df64e1` o Store os aplica quando a lista está completa (`tickets/application/ticket-attachments.store.ts:18-34`). É regra nova do C-09, não mudança de lugar: o detalhe só conferia tamanho e tipo. Quantidade e soma batem com o domínio (`TicketAttachment.cs:103`); a extensão e o tipo normalizado, desde o `597b075` (A-57); o arquivo vazio e o nome com "..", ainda não (A-60, §16.10) | FA:484 |
| A-26 | Busca de responsável em `GET /users` | Média | Corrigido (origin/main), como A-38 | `8473d24`, PR #3 | FA:485 | FA:485 |
| A-27 | URL de produção ausente | Baixa | Pendente (de propósito, decisão de 31/10) | — | `src/environments/environment.prod.ts:3-4` (TODO e `http://localhost:5195`) | FA:486 |
| A-28 | Flags `volumeResolved` e `companyStatsForAll` desligadas | Baixa | Corrigido (main local). A flag `volumeResolved` seguiu no código, "até a conferência do A-28"; o critério foi dado como cumprido em 05/11 (decisão 15), e ela saiu no `5b67103` (E-17, C-33) | `f7cdd73`; `4b7b0de` (T-517); `5b67103` (C-33) | Em `f7cdd73`, `src/environments/environment.ts:11-12` e `environment.prod.ts:12-13` com `true`. Desde o PR #5, só a `volumeResolved` (`environment.ts:9`; `environment.prod.ts:10`; `shared/entities/dashboard-features.ts:4-7`); desde o `5b67103`, nenhuma, e o `dashboard-features.ts` saiu. O rodapé "disponível em breve" saiu no `7af23b7` (A-50); o card "SLA cumprido" ainda diz "Disponível em breve" (A-61) | FA:487 |
| A-29 | 403 de `GET /roles` disparava `GET /users/me` | Baixa | Corrigido (origin/main) | `4bb5792` | `users/feature-user-list/user-list.component.ts:323` | FA:488 |
| A-30 | SLA do primeiro ciclo em `GET /tickets` | Baixa | Pendente → spec 048 | — | FA:489; back `specs/048-monitor-ciclo-sla-vigente/spec.md:90` | FA:489; FI:364 |
| A-31 | Linha "Prazo" do detalhe com o relógio do navegador | Baixa | Mantido; classificação a reavaliar | — | FA:490 o lista como pendência; FI:186 como mantido (errata 2) | FA:490 |
| A-32 | Diálogo global sobrevivia à troca de tela | Média | Corrigido (origin/main) | `b5aaf70` | `ConfirmDialogComponent` cancela em `NavigationStart` (FA:491) | FA:491 |
| A-33 | 4 avisos de orçamento de CSS | Baixa | Corrigido (main local); a reserva do `--bs-card-bg` e a cópia do Monitor saíram na E-01; restam C-36 e C-37 | `0df5718`; `887fee5`, `4c5c575` | Builds da E-00 e da L-3 com 0 avisos (`e00v2/logs/build-final.log`; `l3/x5a/.x5a/build.log`) | FA:492; FI:252 |
| A-34 | Foco visível abaixo de WCAG 2.4.7 e 1.4.11 | Alta | Corrigido (origin/main); revalidar no navegador depois da E-00 (E-04): o A-33 mudou o anel de `.sector-add` e `.btn-row-name`, e sete contornos locais seguem em `--tk-primary` (R-09) | `04ca7e1` (sessão b345b068) | 734 controles: 305 reprovados antes, 19 depois, 0 regressões (FA:230) | FA:195-232; FI:258-280 |
| A-35 | Troca de conta em outra aba | Média | Corrigido (origin/main) | `b885c05` | `SessionService.syncFromStorage` (FA:270-272) | FA:262-272 |
| A-36 | Comentários fora da regra | Baixa | Corrigido (origin/main) | `c44ecc4` | FA:276-281 | FA:274-281 |
| A-37 | Campo inválido sem borda vermelha (escuro e login) | Média | Corrigido (origin/main) | `7947148`, PR #3 | Medição em FA:255-259 | FA:234-260 |
| A-38 | Diálogo de atribuição oferecia qualquer usuário ativo | Média | Corrigido (origin/main) | `8473d24`, PR #3 | `GET /tickets/assignees` (FA:288-289) | FA:283-289; FA:485 |
| A-39 | Limites de anexo duplicados no front | Baixa | Corrigido (origin/main) | `8473d24`, PR #3 | `GET /ticket-attachments/policy` (FA:294-295) | FA:290-295; FA:484 |
| A-40 | "Hoje" do gráfico em UTC | Baixa | Corrigido (origin/main) | `000b4cc`, PR #3 | `todayInSaoPaulo` (FA:298-300) | FA:296-300 |
| A-41 | Rolagem horizontal de Meus Chamados | Média | Corrigido (origin/main) | `7947148`, `838e94f`, PR #3 | FA:306-311 | FA:302-314 |
| A-42 | 429 mandava pro login quem tinha sessão válida | Alta | Corrigido: as duas etapas na origin/main (`591bc90`, PR #3); o aviso da espera na main local (`00b7252`); defeitos corrigidos na E-01 (`75413f2`, `39f1982`), na origin/main desde 05/11; o anúncio do aviso (R-08, `413a447`) e o login sem aviso (A-51, `0043cbf`) foram corrigidos na E-18, na origin/main desde 05/11 (§16.5) | `591bc90`; `00b7252`; `0043cbf`; `413a447` | `app.component.ts:7-8`; `shared/ui/session-retry-notice/session-retry-notice.component.ts` | FA:316-372; FI:256 |
| A-43 | Falha passageira da renovação lida como sessão recusada | Média | Corrigido (origin/main) | `591bc90`, PR #3 | FA:446-451 | FA:433-460 |
| A-44 | `admin-master.guard` ignorava `unavailable` | Baixa | Corrigido (origin/main) | `591bc90`, PR #3 | `redirectWhenUserNotLoaded` (FA:582) | FA:45; FA:582; FI:314-315 |
| A-45 (= P-2) | Foco perdido ao navegar pela gaveta | Baixa | Corrigido (origin/main) | `838e94f`, PR #3 | FA:406-412 | FA:401-431 |
| A-46 (= P-3) | Tab saía da gaveta para os toasts | Baixa | Corrigido (origin/main) | `838e94f`, PR #3 | FA:413-417 | FA:401-431 |
| R-01 | Controles da gaveta fechada no Tab | Alta | Corrigido (origin/main) | `838e94f`, PR #3 | FA:381 | FA:374-396 |
| R-02 | Foco não entrava na gaveta aberta | Alta | Corrigido (origin/main) | `838e94f`, PR #3 | FA:382 | FA:374-396 |
| R-03 | Itens fora da tela no celular deitado | Alta | Corrigido (origin/main) | `838e94f`, PR #3 | FA:383 | FA:374-396 |
| R-04 | Esc não fechava a gaveta | Média | Corrigido (origin/main) | `838e94f`, PR #3 | FA:384 | FA:374-396 |
| R-05 | Diálogo "Novo usuário" apertado em 844×390 | Baixa | Corrigido (main local); revalidar no navegador (E-04) | `f95f587` | `src/styles.css:1359-1374` (`:1367-1382` em `333f4c2`) | FA:397-399; FI:255 |
| R-06 | E-mails quebrados no meio na tabela de Usuários | Baixa | Corrigido (main local); revalidar no navegador (E-04) | `008dfcf` | `<wbr>` antes do "@" em `users/feature-user-list/user-list.component.html:217,219` (`:221,223` em `333f4c2`) | FA:397-399; FI:255 |
| R-07 | Alvos de 16 a 23px | Baixa | Corrigido (main local); defeitos corrigidos na E-01 (`d95b336`), na origin/main desde 05/11; o espaço antes do chevron (R-10) foi corrigido no `62f3a43` (E-17) | `be5cd6e` | `.tap-target` em `src/styles.css:312-326`; bloco de toque em `src/styles.css:1347-1357` (`:1348-1365` em `333f4c2`) | FA:397-399; FI:255 |
| C-01 | Resultado tipado no serviço de sessão | Baixa | Pendente: registrar a exceção nas skills é decisão de Rafael Santos | `591bc90` (resultado tipado) | `shared/entities/current-user.ts`, `shared/services/current-user.service.ts` (FA:534) | FA:534; FA:587 |
| C-02 | `transientFailureReason` no utilitário genérico de HTTP | Baixa | Corrigido (origin/main) | `591bc90` | Movido para `session-unavailable.util.ts` (FA:583) | FA:535; FA:583 |
| C-03 | Três cópias da busca de responsáveis | Média | Corrigido (origin/main) | `8473d24` | `tickets/application/ticket-assignee-search.ts` (FA:579) | FA:536; FA:579 |
| C-04 | `constructor()` sem `/** */` | Baixa | Corrigido (origin/main) | `591bc90` | FA:580 | FA:537; FA:580 |
| C-05 | `SessionRecoveryStore` fora do padrão `resource()` | Baixa | Mantido | — | FA:588 | FA:538; FA:588 |
| C-06 | Política diferente no `unauthenticated` (guard × Stores) | Baixa | Corrigido (origin/main) | `591bc90` | `redirectWhenUserNotLoaded` (FA:582) | FA:539; FA:582 |
| C-07 | Foco preso duplicado; breakpoint repetido; `100dvh` sem reserva | Baixa | Corrigido: `100vh` de reserva na origin/main (`838e94f`); utilitário e diretiva de foco na main local (`0573c20`); o breakpoint repetido fica (Mantido, §5) | `838e94f`; `0573c20` | `shared/utils/focus-trap.util.ts`, `shared/ui/directives/focus-trap.directive.ts`; breakpoint em `main-layout.component.ts:110` (`:105` em `333f4c2`) e `.css:110`; restos do foco preso no C-35 | FA:540; FA:585 |
| C-08 | Reexportação de `todayInSaoPaulo` | Baixa | Corrigido (origin/main) | `000b4cc` | FA:584 | FA:541; FA:584 |
| C-09 | Validação de anexo no componente; campos sem uso | Baixa | Corrigido (main local); defeito corrigido na E-01 (`0ae9ee4`), na origin/main desde 05/11 | `6df64e1` | `attachmentPolicyViolation` e `uploadIfValid` em `tickets/application/ticket-attachments.store.ts:18-34,209-214` (`:212-217` em `333f4c2`); os erros que passavam de um chamado ao outro (A-49) saíram no `dbce65b` (E-03) | FA:542; FA:589 |
| C-10 | Indentação de 4 espaços | Baixa | Corrigido (main local) | `0451269` (21 arquivos: 20 `.ts` e o `dashboard.component.css`) | Em `7fe3bec`, nenhum `.ts` usa só 4 espaços. A contagem de FA:590 está errada (errata 13) | FA:543; FA:590 |
| C-11 | Membros sem `/** */` | Baixa | Corrigido (origin/main) nos membros listados | `591bc90`, `838e94f` | FA:586 | FA:544; FA:586 |
| C-12 | Stub do teste do Monitor com o tipo antigo | Baixa | Corrigido (origin/main) | `8473d24` | FA:581 | FA:545; FA:581 |
| 6.3 | Nomes de teste em inglês | — | Corrigido (main local); o título que restava (N-3) saiu na E-01 (`855ad11`); resíduos no C-39 | `9d7e238` (95 arquivos) | `shared/interceptors/auth.interceptor.spec.ts:117` | FI:170; FI:254 |

Contagem: 38 corrigidos na `origin/main` (o A-05 como remoção); 10 corrigidos só na `main` local
(A-28, A-33, A-42 na parte do aviso, R-05, R-06, R-07, C-07 na parte do foco preso, C-09, C-10 e
6.3); 12 mantidos (A-12 a A-21, A-31 e C-05); 5 pendentes (A-23, A-24, A-27, A-30 e C-01). O A-22,
antes a reavaliar, foi corrigido em 05/11 na `origin/main` (`4b7b0de`, PR #5). Os achados novos de
05/11 (A-47 a A-59, R-08 a R-10 e C-13 a C-41) e os de 06/11 (A-60 a A-63 e C-42) estão no §16,
fora desta contagem.

### 5. Analisados e mantidos

Justificativas completas em FA:462-476 e FA:585-590.

| ID | Onde (front) | Por que fica | Nota de 04/11 |
|---|---|---|---|
| A-12 | `tickets/entities/ticket-status.ts:38-44` (`TICKET_STATUS_TRANSITIONS`) e `TICKET_ACTIVE_STATUSES` | Só escolhe quais botões mostrar; o servidor valida a transição | A citação do back mudou (`Ticket.CanTransitionTo`, `Ticket.cs:120`; `:376-392` em `251da97`). A transição Resolvido → Fechado ia por PUT e falhava (DIV-1); desde 05/11 vai pelo `POST tickets/{id}/close` (PR #5). A spec 047 (DEC-3) pode aposentar o mapa |
| A-13 | `tickets/ui/ticket-cancel-window.ts` | Usa `canCancel` e `ownerCancelDeadlineUtc` do servidor; o relógio só esconde o botão quando a janela vence com a tela aberta | — |
| A-14 | `ticket-monitor.component.ts` (`displaySlaStatus`) e `dashboard-insights.component.ts` | Reclassifica para "Atrasado" entre recargas, com a fórmula do servidor e o relógio de `serverNowUtc` | `TicketSla.GetStatus` não existe em `ef1c981`. A spec 045 ("fórmula única de prazo", `bb15575`) entrou na `origin/main` do back em 01/11. Reconferido em 05/11: o front não calcula prazo; a promoção a "Atrasado" bate com a regra do back na borda de 1 ms (`Ticket.cs:420`), e o selo nunca promove a "Em risco" (§16.4) |
| A-15 | `dashboard.component.ts` | Aritmética de apresentação sobre contadores do servidor | A LAC-13 pede indicadores derivados no agregado |
| A-16 | `dashboard-overview.ts`, `dashboard-insight-rules.ts` | Textos de leitura do gráfico; os limites são regra de redação | A frase "Fila estável" deduzia a fila de criados × resolvidos e saiu no `f700aea` (A-53, E-17) |
| A-17 | `ticket-summary.store.ts` | Seleção de exibição sobre páginas do servidor; os totais vêm do servidor | — |
| A-18 | `my-tickets-summary.store.ts` | Somas de contadores com o agrupamento do back (`OwnTicketStatusGroup`) | — |
| A-19 | `departments/feature-department-list/*` e `role-insights` | `GET /departments` e `GET /roles` vêm sem paginação; filtrar a lista carregada é apresentação | Muda se o back paginar |
| A-20 | `users.store.ts` | Aviso informativo e orquestração de chamadas que o servidor valida uma a uma | A LAC-6 pede o impacto da desativação no back. Com 100 selecionados, a contagem e o lote podem passar do limite de 100 requisições por minuto (A-59, INFERIDO) |
| A-21 | `permission.guard.ts` (antes `admin-master.guard.ts`, nome trocado em 05/11), `main-layout` | Só UX; a API aplica `[HasPermission]` | DIV-10 resolvida e DIV-9 em parte pelo PR #5 (T-512). Em 06/11, os atalhos do Início passaram a seguir as permissões (DIV-9, `ef7f70e`), e as quatro telas que mostravam ou escondiam ações sem a permissão certa foram corrigidas na E-02 (DIV-11 a DIV-13 e DIV-15, §16.4). Resta o DIV-16 (§16.10) |
| A-31 | Linha "Prazo" do detalhe, quando o painel de SLA não carrega | Fallback documentado no template; o painel de SLA usa o relógio do servidor | Classificação a reavaliar (errata 2) |
| C-05 | `shared/application/session-recovery.store.ts` | Mesmo formato do `LoginStore` e do `ActivateAccountStore`; não há resource a duplicar | — |
| C-07 (breakpoint) | `shared/ui/layouts/main-layout/main-layout.component.ts:110` (`:105` em `333f4c2`) e `.css:110` | O CSS não lê constantes do TS; um comentário liga os dois (FA:585) | O resto do C-07 foi corrigido (`0573c20`) |

**A-22 revisto** (limites de texto; back em `ef1c981`):

| Campo | Front | Back | Situação |
|---|---|---|---|
| Mensagem | 4000 (`tickets/entities/ticket-message.ts:12`) | Coluna 4000 (`TicketMessageConfiguration.cs:16`) | Igual |
| Título do chamado | 200 (`tickets/feature-ticket-create/ticket-create.component.ts:35`) | Coluna 200 (`TicketConfiguration.cs:20`) | Igual |
| Descrição do chamado | 10 a 500 (`ticket-create.component.ts:36`; `tickets/ui/ticket-edit-dialog/ticket-edit-dialog.component.ts:47`) | Coluna 500 (`TicketConfiguration.cs:23`) e check de 10 a 500 (spec 042, REQ-3) | Igual; desde 06/11, o diálogo de edição e a criação validam o texto aparado (A-52, `159a9db`) |
| Motivo da reabertura | 4000 desde 05/11 (`TICKET_REOPEN_REASON_MAX_LENGTH`, `ticket-reopen-dialog.component.ts:6,41`); antes 500 | Sem limite próprio: `ReopenTicketCommandValidator.cs:9` só confere o id; vale a coluna da mensagem, 4000 (spec 042, REQ-4 e DEC-17) | Igual desde 05/11 (DIV-5 resolvido); antes, o front recusava texto que o back aceita |
| Nome e descrição de departamento e de setor | 100 e 500 (`departments/feature-department-list/department-list.component.ts:195-196,201-202`) | Colunas 100 e 500 (`DepartmentConfiguration.cs:15,23`; `SectorConfiguration.cs:15,23`) | Igual. Acima do limite, o back responde 400, não 500 (`GlobalExceptionHandler.cs:46-60`; spec 042, REQ-7 e AC-6) |
| Nome e sobrenome do usuário | 100 (`users/entities/user-profile.ts:2`) e mínimo de 2 | Colunas 100 (`UserConfiguration.cs:16-17`), sem mínimo | Máximo igual; mínimo só no front (DIV-8) |
| Senha | Mínimo 6 e `strongPasswordValidator` (ex.: `shared/feature-activate-account/activate-account.component.ts:45`) | Senha forte no validator (spec 042, REQ-1) | Igual, reconferido em 05/11: mínimo 6, maiúscula e caractere especial com as mesmas expressões (`shared/utils/password.validators.ts:7-8` × `Password.cs:12,24-29,39-43`); nova diferente da atual nos dois lados |

Conclusão: o A-22 segue válido como validação de experiência, menos no motivo da reabertura. O 500
de FA:476 e FI:365 vale para a spec 038; a spec 042 (PR #56, anterior a `ef1c981`) o trocou por
400. Próximo passo: a LAC-10 (limites de texto próprios) e a FE-19 da spec 049, que propõe 4000.

Atualização de 05/11: o motivo da reabertura passou a 4000, o limite efetivo do back (T-512 da spec
049 do back, AC-515 e FE-19), na `origin/main` pelo PR #5. Com isso, o A-22 vale para todos os
campos da tabela; a LAC-10 continua aberta para o mínimo do nome (DIV-8).

### 6. Pendências abertas

Lista única. Substitui as cinco listas dos originais (errata 6).

| # | Pendência | Depende de | Referência | Próximo passo |
|---|---|---|---|---|
| 1 | A-23: tokens no `localStorage` | Back: spec 046, Em descoberta, não versionada | FA:482; `specs/046-sessao-em-cookie-httponly/spec.md` | DECs decididas em 05/11 (§16.8, decisões 8 e 8a), com a recomendação técnica do §16.6; a implementação no back depende de autorização (E-11). Depois da entrega, o front tira os tokens do `localStorage` (sessão e interceptor) e coordena a renovação entre abas (A-55), na E-24 |
| 2 | A-24: a API só informa `canCancel` | Back: spec 047 | FA:483; `specs/047-acoes-permitidas-do-chamado/spec.md` | DECs decididas em 05/11 (§16.8, decisão 9): DEC-1 com booleanos por ação, mais `canStartProgress` e `canResolve`; DEC-2 (b), com o Monitor; DEC-3 (b), sem `nextStatuses`; DEC-4, depois da fase 2 de chamados da 049; DEC-5 (a), mensagens e anexos numa spec própria (LAC-14). O mecanismo depende da decisão 12, aberta. Depois da entrega, trocar o espelho de `tickets/ui/ticket-action-permissions.ts` e o `TICKET_STATUS_TRANSITIONS` pelos campos da API (E-24) |
| 3 | A-30: SLA do primeiro ciclo em `GET /tickets` (Monitorar) | Back: spec 048; a LAC-2 estende ao agregado e ao detalhe | FA:489; `specs/048-monitor-ciclo-sla-vigente/spec.md` | DECs decididas em 05/11 (§16.8, decisão 10): o ciclo vigente na lista, no filtro, na ordenação, nos dois resumos e no detalhe (LAC-2), com uma definição em SQL, depois da parte 1 da 043, e o `serverNowUtc` (DEC-66 da 049). Depois da entrega, `TicketMonitorItem` e as telas do Monitor pelo ciclo vigente (048, `spec.md:64`; E-24) |
| 4 | Volta da cor da função (A-05/BR-001) | Back: spec 044, Em descoberta, DEC-1 a DEC-7 abertas | FA:116-143; FI:337-356 | Responder as DECs. Depois da entrega, os passos de FA:136-143 |
| 5 | A-27: URL de produção | Implantação; pendente de propósito (Rafael Santos, 31/10) | `src/environments/environment.prod.ts:3-4` | Informar a URL na implantação; ver N-8 (portas). Topologia decidida em 05/11 (decisão 16): front e API na mesma origem, com proxy em `/api`, que é a DEC-4 (a) da 046 (DOC-32); a URL de produção segue com Rafael Santos (E-25, §16.7) |
| 6 | C-01: exceção do resultado tipado nos serviços de sessão | Rafael Santos | FA:534; FA:587 | Decidido em 05/11 (decisão 20): registrar a exceção nas skills, na E-07, que precisa de autorização específica |
| 7 | A-22: motivo da reabertura (500 × 4000) | Rafael Santos (LAC-10) | §5 | Resolvido em 05/11: o limite ficou em 4000, o do back (T-512 da spec 049 do back), na `origin/main` pelo PR #5 |
| 8 | Defeitos conhecidos das etapas integradas | — | Tabela abaixo; §11 | Resolvido em 05/11: corrigidos na E-01 (`0ae9ee4` a `79e5129`), na `origin/main` desde o `333f4c2` (16:58). O N-2 veio resolvido pelo PR #5. O que 31/10 apontou e ficou fora da tabela está no §16.5 (R-08, R-10, C-36, C-37, C-39 e DOC-42) |
| 9 | Validação visual com login | API: o container `webapi:dev` não respondia | Etapa E-04 | Revalidar na aplicação real o A-34, R-05 a R-07 e o aviso do A-42. Desde 05/11, primeiro o A-59 (lote e 429), e depois também R-08 a R-10, A-50, A-55 e os efeitos visuais do A-33 (E-04, §16.7). Desde 06/11, também as correções da E-18, da E-02 e da E-17 contra a API real e os efeitos dos achados da execução (§16.10) |
| 10 | SSR responde 500 nas rotas não pré-renderizadas: `new CommonEngine()` sem `allowedHosts` | Front; problema preexistente | `server.ts:15`; `l3/modificada/.x2/ssr-requests-localhost.txt` e `ssr-server.log` | Resolvido na E-12 com a remoção do SSR (`06f537b`), na `origin/main` desde 05/11. A implantação passa a servir arquivos estáticos (item 28) |
| 11 | `node_modules` local sem sincronizar | — | `l48/integ/npm-ci.log` | Resolvido em 04/11: `npm ci` às 22:52, sem mudar o lockfile; o `@angular/animations` saiu do `node_modules` |
| 12 | Push da `main` | — | §11 | Resolvido em 04/11: push às 22:51 (`e977f64` → `d1f5d97`, 14 commits) e às 22:59 (`2ccf5d5` e o registro da integração, `82c7462`). Em 05/11, com autorização: fast-forward da `main` para o `333f4c2` (16:58:43) e push `5cd3dce..333f4c2` (16:58:53), com a E-01 e a E-12 (§11) |
| 13 | `.impeccable/design.json` defasado | Rafael Santos (decidido) | `.impeccable/design.json:3` (`generatedAt` 2026-10-27); DOC-10 | Mantido sem regenerar: decisão de 04/11, confirmada em 05/11 (decisão 14). A defasagem fica registrada no DOC-10: 23 commits do `DESIGN.md` depois do `generatedAt`, e o badge de sucesso do `design.json` em 1,58:1 |
| 14 | Evidências do back que não existem mais (N-7); texto do A-25; classificação do A-31 | Front (documentação) | §4; §5; §7 | Em parte em 05/11: o N-7 foi reconferido no `251da97` (§7) e o texto do A-25, revisto (DOC-42). Falta a classificação do A-31 |
| 15 | N-4 e N-5 | Front; Rafael Santos (incluir no plano) | §7 | A spec do `SideMenuNavComponent` (N-5) entrou na E-01, na `origin/main` desde 05/11, e a do aviso de nova tentativa, na E-18 (`413a447`). O N-4 e os outros três arquivos do N-5 entram na E-20 (§16.7), em andamento desde 06/11 |
| 16 | D-SF5: nomenclatura de specs, branches e commits do front | — | §9 | Definida em 04/11: `FE-NNN` espelhando o back (§9). Vale para o trabalho do SDD; as etapas do plano de 31/10 seguem com os IDs da auditoria |
| 17 | Achados da auditoria geral de 31/10 (DIV-, LAC-, DOC-, BK-) | Front, back e responsável | §8; §16 | Seguem no plano, revisto em 05/11 (§16.7): E-00, E-01, E-02, E-03 (menos a guarda do Monitor, item 25), E-05, E-12 (menos o A-27 e a CSP), E-13, E-16, E-17 e E-18 feitas; E-08, E-19 e E-20 em andamento desde 06/11. A DIV-3 (Alto) tem só a mitigação no front (`e813444`) e segue aberta no back; a DIV-1 (Alto), a DIV-4 e a DIV-10 foram resolvidas pelo PR #5 (FE-0 da spec 049 do back), e a DIV-2 e a DIV-9, no bloco 1 (`b9c614e` e `ef7f70e`). Estados conferidos em 05/11 no §8, com as mudanças de 06/11 |
| 18 | Commit das limpezas L-4, L-5 e L-6 | — | §9; §11 | Resolvido em 04/11: três commits independentes (`2445a2a`, `56495bd`, `d1f5d97`), integrados à `main` por fast-forward e publicados |
| 19 | Supressões NG8102 e NG8107 (`extendedDiagnostics`, no `tsconfig.app.json` e no `tsconfig.spec.json` do `7fe3bec`) | — | §3; §9 | Resolvido em 04/11: removidas de todas as configurações no `d1f5d97` |
| 20 | Excluir `docs/audit/FRONTEND_AUDIT.md` e `FINAL_ACCEPTANCE_AUDIT.md` | Rafael Santos; back (referências do §12) | §12; §15 | Preservar os dois até o back atualizar as referências (decisão de 04/11, confirmada em 05/11, decisão 19). O front não altera o back. Em 05/11, a 049, agora versionada, também cita os originais, e a 044 não os cita (DOC-28; §16.2) |
| 21 | Itens da revisão da raiz de 04/11 | Rafael Santos | §9; relatório das limpezas L-4 a L-8 | O `server.ts` saiu da raiz com o SSR, na E-12 (`06f537b`, na `origin/main` desde 05/11); `README.md` (DOC-6) e `PRODUCT.md` (DOC-1 a DOC-5) ficam para a E-06. Resolvidos em 04/11: o `cli.analytics` como `false` (`2ccf5d5`) e a pasta `.impeccable/live/`, apagada (a regra `.impeccable/live/` do `.gitignore` continua) |
| 22 | Impacto no front das specs do back mergeadas depois de 31/10 (022, 023, 045, 024, 035, 051 e 050) | Front | §12 | Em parte em 05/11 (§16.4): a 023 dispensou o detalhe do departamento (T-519 do PR #5); a 024 deixou morto o recuo de Meus Chamados (C-41, que saiu no `92b9e93`); a 022 entrega a contagem de chamados ativos, que o front passou a usar no `6a3c88e` (A-58); a 045 mudou a regra citada no A-14 (reconferida). A 035, a 050 e a 051 não foram avaliadas |
| 23 | Fontes do Google embutidas no build | Front (E-12) | `src/index.html:9-12`; §3 | Resolvido na E-12 (`ce43d3f`, na `origin/main` desde 05/11): Public Sans (400, 400 itálico, 500, 600 e 700) e Sora (700) pelo `@fontsource`, e o Boxicons pelo npm. Dois builds seguidos saem idênticos, e o navegador não busca mais fontes no Google nem no unpkg |
| 24 | Vulnerabilidades nas dependências | Front (E-12) | `l48/integ/npm-audit-prod.json`; `npm-audit-completo.txt` | Resolvido na E-12 para as dependências de produção (`06f537b`, sem a cadeia do Express; `1135935`, Angular 22.2; `c1508a6`, `@ngrx/signals` 22.0.1): `npm audit --omit=dev` sem vulnerabilidades. Restam as de desenvolvimento (item 27) |
| 25 | Guarda `isPlatformBrowser` que sobrou no `TicketMonitorComponent` | Front | `55c5744` tirou as outras cinco | Inofensiva num app só de navegador. Tirar num commit próprio. Em 05/11, também quatro guardas `typeof window` no `SessionService` (C-31). A E-03 tirou as quatro (`857c4d0`) e deixou esta como estava, de propósito (mensagens do `857c4d0` e do `463d123`): segue pendente, em `ticket-monitor.component.ts:2,292` no `387f5e6` |
| 26 | Menu lateral: só os itens de chamados expõem `aria-current`, e os ícones decorativos não têm `aria-hidden` | Front (acessibilidade) | Achado da spec do `SideMenuNavComponent` (E-01, N-5) | Usar `ariaCurrentWhenActive` nos `routerLinkActive` e `aria-hidden="true"` nos ícones. Confirmado em 05/11 (`side-menu-nav.component.html:8,16,34`) |
| 27 | Vulnerabilidades nas dependências de desenvolvimento | Front | `npm audit` de 05/11 na ponta da E-12 (`rebase/audit/`) | 23 (17 moderadas, 6 altas), no ferramental de lint e de testes, fora do pacote entregue. Na primeira medição da E-12, antes do rebase, eram 8 (2 moderadas, 6 altas), com o mesmo lockfile: a diferença é um aviso do `minimatch` (GHSA-g3hv-75wg-m249) que não aparecia antes e chega pelo `eslint`, pelo `typescript-eslint` e pelo `angular-eslint`; a correção que o npm sugere rebaixa esses pacotes de versão major. As 6 altas são da cadeia do Karma (`body-parser`, `engine.io`, `socket.io-parser`, `follow-redirects`), do `brace-expansion` e do `browserslist`. O Karma foi descontinuado: avaliar o runner de testes recomendado para o Angular 22 e um `overrides` do `minimatch`. Runner decidido em 05/11 (decisão 17): Vitest, pelo builder de testes unitários do Angular CLI, na E-25, com o mesmo número de casos |
| 28 | Implantação sem SSR | Implantação (A-27) | `06f537b` | Servir `dist/tickest-pristine/browser` como arquivos estáticos, com as rotas desconhecidas redirecionadas para o `index.html` |
| 29 | Bootstrap ainda vem do jsDelivr | Front | `src/index.html` | Tem `integrity`. Trazer o pacote `bootstrap` 5.3.3 para o build deixaria a página toda na mesma origem e a CSP mais simples |
| 30 | Build inicial perto do aviso de orçamento | Front | §3 | 433,27 kB no `387f5e6` (433,61 kB no `333f4c2`) contra o aviso de 500 kB; quase todo o salto da E-12 é o CSS do Boxicons. Avaliar usar só os ícones que o app usa |
| 31 | Tarefas da FE-0 (PR #5) sem conferência nesta Parte I | Front (documentação) | Mensagem do `4b7b0de`; §6; §7; §8 | Resolvido em 05/11: a reauditoria conferiu cada tarefa contra o §6, o §7 e o §8 (§16.2). A T-500 é o DIV-1 e a T-504 (parte), o DIV-4, registrados pela outra sessão; a T-512 resolveu a DIV-10 e, em parte, a DIV-9; a T-517 cobriu o N-2 e deixou a flag do A-28 (C-33); a T-518 trouxe os valores 12 e 13 do histórico e tirou o `responsibleId`; a T-519 dispensou o detalhe do departamento; a T-514 criou as specs dos 9 Data Services (DOC-18). O comportamento contra o back fica para a E-04 |
| 32 | Registro no `AUDITORIA.md` (E-16) | Outra sessão (commit da edição dela) | §16.7 | Resolvido em 05/11: a E-16a (`455230a`) e a E-16b (`0e7cc4e`), aprovadas por volta das 22:15, entraram na `main` às 23:10, por fast-forward, e na `origin/main` às 23:11 (§11), sem esperar o commit da outra sessão: o documento já trazia o texto dela. Segue o DOC-25: até 06/11, a outra sessão não tinha commitado a edição dela (`4b7b0de`) |
| 33 | Decisões da Onda 0 | Rafael Santos | §16.7; §16.8 | Aprovadas em 05/11, menos a decisão 12 (conferência de permissão por recurso), aberta com a proposta. O bloco 1 aplicou as decisões 1 (DIV-2), 5 (DIV-9) e 15 (C-33) |
| 34 | Achados novos da reauditoria de 05/11 | Front, back e responsável | §16.2 a §16.6 | 128 IDs novos (13 A, 3 R, 29 C, 33 DOC, 5 DIV, 2 LAC, 18 BA e 25 BK), dos 102 IDs provisórios das frentes e dos itens de 31/10 sem registro; nenhum de gravidade Crítica; Alta: A-59 (INFERIDO) e BK-27 (31/10); Média: A-47, A-48, A-50, A-53, A-56, LAC-17, BA-13 e BA-17; o resto, Baixa ou sem gravidade dada pela frente. Seguem o plano revisto (§16.7). Em 06/11: 34 corrigidos (os 8 DOC da E-16 e 26 no código, na E-18 e no bloco 1) e 2 em parte (C-31 e C-34); os outros seguem abertos (§16) |
| 35 | Flag `volumeResolved` (A-28) | Front | §4; §16.5 | Resolvido em 06/11: com o critério cumprido em 05/11 (decisão 15), a flag, o `DASHBOARD_FEATURES` e os ramos mortos saíram no `5b67103` (E-17, C-33); a validação visual fica na E-04. Sobraram o tipo `'unavailable'` do aviso do Início (C-42) e o texto do `DESIGN.md` (DOC-44) |
| 36 | DIV-3 e A-59, de gravidade Alta | Back; front | §8.1; §16.8 | Tratamento pedido em 05/11. DIV-3: mitigado no front em 06/11 (`e813444`, E-02), relendo o chamado logo antes de todo `PUT` dele, não só o de cancelar; a correção segue com o back (T-501 e T-502 da 049; Q-83), e a mitigação sai com a troca no front na E-24. A-59: primeiro item da E-04; confirmado, a REQ-505 da 049 com a 034 (E-23) |
| 37 | Achados da execução de 05 e 06/11 | Front; Rafael Santos (decisão do DIV-16) | §16.10 | 7 IDs novos, todos abertos e conferidos no `387f5e6`. Etapas sugeridas: A-60 e DIV-16, resto da E-02; A-62 e A-63, resto da E-03; A-61 e C-42, resto da E-17; DOC-44, E-06 |

**Defeitos conhecidos para a E-01**

| Origem | Defeito | Onde |
|---|---|---|
| C-09 (`6df64e1`) | A mensagem de validação de anexo não some depois de excluir um anexo: o `delete()` limpa só o `mutationError` | `tickets/application/ticket-attachments.store.ts:182-202` |
| A-42 (`00b7252`) | O `CurrentUserService` é importado pelo barrel `./shared`; o aviso aparece também em nova tentativa de fundo | `app.component.ts:8` |
| R-07 (`be5cd6e`; o bloco veio para o `styles.css` no `0df5718`) | No toque: o `box-sizing` do `.btn-close` e o alinhamento do `.dropdown-item` | `src/styles.css:1347-1357` |
| A-33 (`0df5718`) | Falta valor de reserva para `--bs-card-bg`, e há regras repetidas nos CSS de componente, como o `.table.is-refreshing` do Monitor, com opacidade 0,6, sobre o global, com 0,5 | `src/styles.css:1335-1343`; `tickets/feature-ticket-monitor/ticket-monitor.component.css:81-84`; `src/styles.css:1319-1322` |
| 6.3 (N-3) | Um título de teste em português | `shared/interceptors/auth.interceptor.spec.ts:117` |
| N-6 | Referência `#menu` sem uso | `shared/ui/layouts/main-layout/main-layout.component.html:4` |
| N-1, N-2 | Comentários desatualizados | `roles/feature-role-list/role-list.component.css:1`; `shared/entities/dashboard-features.ts:4-8` |
| N-5 (parte) | Falta a spec do `SideMenuNavComponent` | `shared/ui/layouts/main-layout/side-menu-nav.component.ts` |

Todos corrigidos na E-01, um commit por item, rebaseados sobre o `5cd3dce` e na `origin/main` desde
05/11, às 16:58 (§11):
C-09 em `0ae9ee4`; A-42 em `75413f2` (import) e `39f1982` (aviso só na primeira carga); R-07 em
`d95b336`; A-33 em `887fee5` (reserva do `--bs-card-bg`) e `4c5c575` (cópia do Monitor); N-3 em
`855ad11`; N-6 em `a0eb626`; N-1 em `77fb19d`; e a spec do `SideMenuNavComponent` em `79e5129`, que
amplia a que o PR #5 criou. O N-2 veio resolvido pelo PR #5 (T-517), e o commit do N-2 saiu no rebase.

### 7. Itens novos da conferência de 31/10

| ID | Achado | Evidência | Estado | Próximo passo |
|---|---|---|---|---|
| N-1 | Comentário fala em "amostra de cor", que saiu com o BR-001 | `roles/feature-role-list/role-list.component.css:1` | Corrigido na E-01 (`77fb19d`), na `origin/main` desde 05/11 | — |
| N-2 | Comentário diz que as flags do Início esperam endpoint que o back "ainda não entrega"; hoje as cinco flags estão ligadas | `shared/entities/dashboard-features.ts:4-8`; `src/environments/environment.ts:9-13` | Corrigido na `origin/main` pelo PR #5 (T-517, `4b7b0de`): ficou só a flag `volumeResolved`, e o comentário foi reescrito. O commit da E-01 saiu no rebase. A flag e o arquivo saíram no `5b67103` (E-17, C-33) | — |
| N-3 | Título de teste em português ("deve manter a sessão…") | `shared/interceptors/auth.interceptor.spec.ts:117` | Corrigido na E-01 (`855ad11`), na `origin/main` desde 05/11 | — |
| N-4 | Variáveis com nome em português em teste (`prazoDd`, `prazoText`, `prazoLines`) | `tickets/feature-ticket-detail/ticket-detail.component.spec.ts:256,280,1102` (`:1124` em `333f4c2`) | Pendente | E-20 (§16.7) |
| N-5 | Cinco arquivos novos sem spec própria | `shared/utils/focus-trap.util.ts`; `shared/ui/session-retry-notice/session-retry-notice.component.ts`; `shared/ui/layouts/main-layout/side-menu-nav.component.ts`; `tickets/feature-ticket-list/ticket-list-first-use.component.ts`; `tickets/feature-ticket-list/ticket-list-due-cell.component.ts` | Em parte: o PR #5 criou a spec do `SideMenuNavComponent`, com 2 testes, e a E-01 (`79e5129`, na `origin/main` desde 05/11) a amplia para 13; a E-18 criou a do aviso de nova tentativa (`413a447`). Os outros três seguem só com testes indiretos, como o `focus-trap.directive.spec.ts` | Os outros três na E-20, com o C-23 (§16.7) |
| N-6 | Referência `#menu` sem uso: o `.ts` só lê `menuOpener`, `menuCloser` e `mainContent` | `main-layout.component.html:4`; `main-layout.component.ts:68-74` | Corrigido na E-01 (`a0eb626`), na `origin/main` desde 05/11 | — |
| N-7 | Evidências do back que não existem em `ef1c981`: `TicketAccessGuard.EnsureOwnerOrManagerAsync` (A-06, FA:149), `UserValidationRules.NameMaxLength` (A-09, FA:168), `TicketStatusTransitions.CanTransition` (A-12, FA:466), `TicketSla.GetStatus` (A-14, FA:468) e os limites do A-22 (FA:476) | Busca no `ef1c981` sem ocorrência; entre `a72e07b` e `ef1c981` entraram as specs 039, 042 e 041 (PRs #55, #56 e #57) | Reconferido em 05/11 no `251da97`: os cinco símbolos seguem inexistentes, e os substitutos registrados no §4 e no §5 conferem (A-06: `ReopenTicketCommandHandler.cs:33-41`; A-12: `Ticket.cs:376-392`; A-14: `Ticket.cs:403-426` e `TicketSlaPlan.cs:19-20`) | Os anexos ficam como estão |
| N-8 | Portas diferentes: 5000 em desenvolvimento e 5195 em produção | `src/environments/environment.ts:3`; `src/environments/environment.prod.ts:4` | Registrado (ligado ao A-27) | Resolver junto com a URL de produção (E-25, §16.7) |

### 8. Auditoria geral de 31/10 — registro compacto

Auditoria só de leitura, do front e do back (`ef1c981`). O relatório foi entregue na conversa de
31/10, sem arquivo no repositório. Os IDs ganharam prefixos para não colidir com os de outras séries:

- **LAC-n** = L-n do relatório de 31/10. A troca evita a colisão com as etapas L-1 a L-9 da limpeza
  de 04/11.
- **DIV-n** = D-n do relatório de 31/10, na mesma ordem e com os mesmos temas (conferido no
  relatório: D-1 é o "Fechar chamado" pela rota errada; D-10, a tela de Usuários).
- **DOC-n** e **BK-n:** numerados nesta redação.
- **05/11:** os estados abaixo foram conferidos na reauditoria (front `333f4c2`, back `251da97`), com as
  decisões de 05/11 (§16.8). Os IDs novos das mesmas séries (DIV-11 a DIV-15, LAC-16 e LAC-17, DOC-11 a
  DOC-43 e BK-6 a BK-30) estão no §16.
- **06/11:** o bloco 1 resolveu a DIV-2 e a DIV-9 e mitigou a DIV-3 no front (§8.1; §11). Da execução,
  o DIV-16 e o DOC-44 estão no §16.10.

#### 8.1 Divergências front/back (DIV-)

| ID | Grav. | Divergência | Front | Back (`ef1c981`) | Situação |
|---|---|---|---|---|---|
| DIV-1 | Alto | "Fechar chamado" sempre falha: o front fecha por PUT com status Fechado, e o back recusa PUT em chamado não ativo | `tickets/entities/ticket-status.ts:41` (Resolvido → Fechado); `tickets/infrastructure/ticket.data.service.ts:39` (PUT `/tickets/{id}`) | `UpdateTicketCommandHandler.cs:51-54`; `Ticket.cs:50` (`IsActive`; linha 48 na `origin/main` atual); teste `UpdateTicketCommandHandlerTests.cs:91-105`. A rota certa, `POST tickets/{ticketId}/close` (`Close.cs:13`, com `tickets:manage` em `Close.cs:25`), não era usada pelo front | Resolvido em 05/11 pelo PR #5 (T-500 da spec 049 do back): o front fecha pelo `POST tickets/{id}/close`; Iniciar, Resolver e Cancelar seguem no `PUT`. Conferido em 05/11 no `333f4c2` (`ticket.data.service.ts:42-45`; `ticket-detail.store.ts:175-177`) |
| DIV-2 | Baixo | Regra de reabrir | Dono com `tickets:reopen-own` ou qualquer um com `tickets:manage` (`tickets/ui/ticket-action-permissions.ts:28-31`) | Dono só com `tickets:reopen-own`; os demais com `tickets:manage` (`ReopenTicketCommandHandler.cs:33-36`) | Resolvido no front em 06/11 (`b9c614e`, E-02), pela decisão 1 de 05/11, em que vale o código do back (§16.8): o dono só vê "Reabrir" com `tickets:reopen-own`, e quem não é dono, com `tickets:manage` (`ticket-action-permissions.ts:31-34` no `387f5e6`). Antes, o dono com `manage` e sem `reopen-own` via o botão e recebia 403. Falta o back corrigir a RN-06, a 047 e o anexo C da 049, que descrevem a regra antiga do front (BK-6). Só afetava funções personalizadas |
| DIV-3 | Alto | O PUT reenvia a descrição e o status lidos | Cancelar pela lista manda a descrição carregada na tela (`tickets/feature-ticket-list/ticket-list.component.ts:357`) | O PUT recebe o estado inteiro (descrição e status) | Mitigado no front em 06/11 (`e813444`, E-02): todo `PUT` do chamado (cancelar e editar em Meus Chamados; iniciar, resolver, cancelar e editar no detalhe) relê o chamado logo antes e manda a descrição e o status relidos, trocando só o que a operação muda (`tickets/application/ticket-fresh-update.ts:12` no `387f5e6`). A janela em que a edição alheia se perde cai de "desde a carga da tela" para o intervalo entre as duas requisições, sem sumir. Aberto no back: a correção é o `PUT` parcial, com a versão do chamado (T-501 e T-502 da 049, abertas; Q-83; LAC-1), e a mitigação sai na E-24. Antes da mitigação, conferido em 05/11: cancelar pela lista mandava a descrição da tela, editar mandava o status, e mudar o status mandava a descrição (`ticket-list.component.ts:340,360`; `ticket-detail.store.ts:177,206`) |
| DIV-4 | Baixo | Código de erro esperado | `Tickets.AssigneeCannotManageTickets` (`tickets/application/ticket-detail.store.ts:264`) | Devolve `Tickets.AssigneeNotAttendant` (`TicketErrors.cs:23-24`; `AssignTicketCommandHandler.cs:65`) | Resolvido em 05/11 pelo PR #5 (T-504 da spec 049 do back): o front espera `Tickets.AssigneeNotAttendant`, e a orientação "Escolha outro usuário na lista" aparece. Conferido em 05/11 (`ticket-detail.store.ts:269`) |
| DIV-5 | — | Motivo da reabertura | 4000 desde 05/11 (antes 500) | 4000 | Resolvido em 05/11, na `origin/main` pelo PR #5 (A-22, §5) |
| DIV-6 | — | "Atribuir a mim" | Só sem responsável (`tickets/feature-ticket-monitor/ticket-monitor-info-panel.component.ts:33`) | Permite assumir chamado que já tem responsável (levantamento de 31/10) | Decisão de produto (LAC-9). Conferido em 05/11: quem tem `tickets:manage` assume qualquer chamado ativo, mesmo com responsável, e o segundo de dois cliques em sequência toma o chamado sem conflito (`AssignTicketCommandHandler.cs:28-39,68-73`). Decidido em 05/11 (decisão 2): assumir chamado que já tem responsável passa a exigir `tickets:assign`, numa spec própria no back; o front já se comporta assim |
| DIV-7 | — | Administrador tirar a própria função de administrador | Só o front impede (`users/feature-user-list/user-list.component.ts:564`) | Não impede (levantamento de 31/10) | Decisão (LAC-8). Conferido em 05/11: o back só protege o último administrador ativo (`AssignUserRolesCommandHandler.cs:69-80`). Decidido em 05/11 (decisão 3): a proteção vira regra do back, e o front mantém o espelho até lá |
| DIV-8 | — | Mínimo de 2 caracteres no nome | Só no front (FA:173-175) | Só exige não vazio (FA:173-174) | Decisão (LAC-10). Conferido em 05/11 (`RegisterUserCommandValidator.cs:9-10`; `UpdateUserProfileCommandValidator.cs:10-11`). Decidido em 05/11 (decisão 4): o mínimo de 2 vira regra do back, e o front mantém o espelho até lá |
| DIV-9 | — | "Novo Chamado" e "Meus Chamados" | Aparecem pelo perfil deduzido, não por `tickets:create` e `tickets:view-own`; `/tickets/novo` sem guarda de permissão (`core/routes/app.routes.ts:55-59`) | Exige as permissões (levantamento de 31/10) | Resolvido em 06/11 (`ef7f70e`, E-17), pela decisão 5 de 05/11: no Início, "Novo Chamado" segue `tickets:create` e "Meus Chamados", `tickets:view-own`, em qualquer papel, e sem `tickets:view-own` nenhum número leva a `/tickets` (`dashboard/dashboard.component.ts:146-150` no `387f5e6`). Antes, em parte desde 05/11 (PR #5, T-512): rotas, menu e Meus Chamados já conferiam `tickets:view-own` e `tickets:create` (`core/routes/app.routes.ts:50-63`; `side-menu-nav.component.html:13`), e o Início escondia os atalhos de quem tinha qualquer permissão administrativa e ligava os números a `/tickets` sem conferir `tickets:view-own` (`dashboard/dashboard.component.ts:158-167,315-320`; `.html:29,181`, no `333f4c2`) |
| DIV-10 | — | Ações da tela de Usuários | Só confere `users:read` (`core/routes/app.routes.ts:81`; `shared/ui/layouts/main-layout/side-menu-nav.component.html:21,38`); nenhuma conferência de `users:create`, `users:deactivate`, `users:assign-roles` ou `users:update` fora dos testes | Exige cada permissão (levantamento de 31/10) | Resolvido em 05/11 pelo PR #5 (T-512): as ações conferem `users:create`, `users:update`, `users:assign-roles` e `users:deactivate` (`user-list.component.ts:109-119`). Resta a regra por alvo (LAC-5). Os dois resíduos foram corrigidos em 06/11, na E-02: as funções no cadastro sem `users:assign-roles` (DIV-12, `acb3698`) e a contagem por `GET /tickets` sem `tickets:manage` (A-54, `9cf880d`). Com `users:assign-roles` e sem `roles:read`, as listas de funções ficam vazias (DIV-16, §16.10) |

#### 8.2 Lacunas para specs novas no back (LAC-)

A coluna "Relaciona-se com" é leitura desta redação.

| ID | Prioridade | Lacuna | Relaciona-se com |
|---|---|---|---|
| LAC-1 (L-1) | Alta | Operações do chamado sem reenviar o estado inteiro, com controle de versão (409) | DIV-3 |
| LAC-2 (L-2) | Alta | Ciclo de SLA vigente também no agregado `stats/overview` e no detalhe (ampliação da spec 048) | A-30 |
| LAC-3 (L-3) | Média | Filtro por departamento na API | — |
| LAC-4 (L-4) | Média | Autor das mensagens | — |
| LAC-5 (L-5) | Média | Ações permitidas na gestão de usuários | DIV-10 |
| LAC-6 (L-6) | Média | Impacto da desativação (contagem e devolução à fila) | A-20 |
| LAC-7 (L-7) | Média | Cadastro com funções numa operação | — |
| LAC-8 (L-8) | Decisão | Administrador tirar a própria função | DIV-7 |
| LAC-9 (L-9) | Decisão | Assumir chamado que já tem responsável | DIV-6 |
| LAC-10 (L-10) | Decisão | Limites de texto próprios | DIV-5; DIV-8; A-22 |
| LAC-11 (L-11) | Baixa | `Retry-After` no 429 | A-42 |
| LAC-12 (L-12) | Baixa | Parâmetros de política na API (75%, 72 h) | — |
| LAC-13 (L-13) | Baixa | Indicadores derivados no agregado | A-15 |
| LAC-14 (L-14) | Baixa | Ações sobre mensagens e anexos | — |
| LAC-15 (L-15) | Baixa | Atribuição na abertura com as mesmas regras da atribuição | DP-02 do back (`SPEC-TICKEST.md:164`) |

**Estado em 05/11** (§16.4; decisões de 05/11 no §16.8):

| Lacuna | Estado | Onde está registrada |
|---|---|---|
| LAC-1 | Continua, com spec em parte | 049 REQ-501, DEC-61, T-501 e T-502, abertas; a versão no contrato é só pergunta (Q-83) |
| LAC-2 | Continua; decidido em 05/11 que entra na 048 (decisão 10) | A 048 só cobre `GET tickets`; a Q-61 da 049 só cita as listas |
| LAC-3 | Continua, com spec | 049 DEC-67, REQ-508, T-510 e AC-513; em andamento na 043 |
| LAC-4 | Continua, com spec | 049 DEC-65, REQ-506 e T-508 |
| LAC-5 | Continua, só como pergunta | Q-64 da 049; a visibilidade pela permissão saiu no PR #5 (T-512) |
| LAC-6 | Continua, em parte | Contagem: 034 e 049 REQ-505; devolução à fila só na 014, fora da `main` (BK-27) |
| LAC-7 | Continua, com spec | 049 REQ-505, T-506, T-507 e AC-510 |
| LAC-8 | Decidida em 05/11 (decisão 3): a proteção vira regra do back | Q-64 da 049; falta a spec (E-10) |
| LAC-9 | Decidida em 05/11 (decisão 2): exige `tickets:assign`, numa spec própria | Nem a 047 nem a 049 a tinham; falta a spec (E-10) |
| LAC-10 | Em parte; decidido em 05/11 que o mínimo do nome vira regra do back (decisão 4) | Motivo da reabertura resolvido (049 REQ-510, AC-515); limites só no banco (049 DEC-62, T-503, AC-525) |
| LAC-11 | Mudou: entregue no back (G1, DEC-58) | Faltam o front (T-504, AC-523) e o cabeçalho no CORS (LAC-16) |
| LAC-12 | Continua, sem spec | Inclui a janela de 15 minutos do cancelamento |
| LAC-13 | Continua, sem spec | — |
| LAC-14 | Decidida em 05/11 (decisão 9, DEC-5 (a) da 047): spec própria | DEC-5 da 047; Q-62 da 049 |
| LAC-15 | Continua, com spec | 049 REQ-211 e DEC-35 (b), G3-b; hoje o back aceita `AssignedToUserId` sem `tickets:assign` |

#### 8.3 Documentação (DOC-)

| ID | Grav. | Problema | Evidência | Situação em 04/11 e em 05/11 |
|---|---|---|---|---|
| DOC-1 | Alto | `PRODUCT.md` diz que o produto é multi-tenant e que o isolamento entre empresas é "inegociável"; o back decidiu "uma organização por instalação" (DP-01) | `PRODUCT.md:35-36,84`; back `SPEC-TICKEST.md:62,134` | Aberto; igual em 05/11 |
| DOC-2 | — | Papéis com nomes errados | `PRODUCT.md:14-17,25` | Aberto; pior em 05/11: o "Admin Master" do `PRODUCT.md:16` não existe mais em `src/` |
| DOC-3 | — | Link quebrado: `docs/plano-onboarding-rh.md` não existe no back | `PRODUCT.md:23-24` | Aberto; igual em 05/11 |
| DOC-4 | — | `GET /tickets/{id}/sla` dado como pendente | `PRODUCT.md:63-64` | Aberto; igual em 05/11 |
| DOC-5 | — | "Nenhum requisito de acessibilidade" × WCAG AA aplicado no `DESIGN.md` | `PRODUCT.md:92-94`; `DESIGN.md:171,193` | Aberto; igual em 05/11 |
| DOC-6 | — | O `README.md` é o modelo do Angular CLI: cita a versão 18.2.6 e manda rodar `ng e2e` | `README.md:3,23` | Aberto em 05/11; o `README.md` também não cita o `npm run lint` nem o back na porta 5000 (DOC-38) |
| DOC-7 | — | `CLAUDE.md` com exemplo antigo (`TicketsService`) e sem `core/` e `dashboard/` | `CLAUDE.md:19-24,38` | Aberto; pior em 05/11: o `CLAUDE.md:31` cita o `admin-master.guard.ts`, renomeado no PR #5 (DOC-11) |
| DOC-8 | — | Skills citam lint que não existe, Prettier, `flushEffects`/`fakeAsync` e `console.error` | `.claude/skills/add-context/SKILL.md:74`; `add-feature/SKILL.md:41,56`; `add-feature/references/store-method.md:34,115`; `add-tests/SKILL.md:29-30`; `ca-review/SKILL.md:99`; `.claude/skills/README.md:100,105` | Em parte: o lint passou a existir na E-12 (`21735f4`, `npm run lint`, na `origin/main` desde 05/11). As skills não foram alteradas e ainda citam Prettier, `flushEffects`/`fakeAsync` e `console.error`. Igual em 05/11; o padrão real de espera é o `whenStable` (DOC-18) |
| DOC-9 | — | `DESIGN.md`: token do botão primário, texto transitório da spec 031 e o padrão `is-refreshing` não registrado | `DESIGN.md` no HEAD | Tratados na limpeza L-5, aprovada em 04/11 sem regenerar o documento (`56495bd`); resolvido em 05/11 (o texto da 031 saiu no PR #5, que trouxe o DOC-13) |
| DOC-10 | — | `.impeccable/design.json` defasado | `.impeccable/design.json:3` (`generatedAt` 2026-10-27) | Mantido sem regenerar (04/11; confirmado em 05/11, decisão 14). Defasagem ampliada em 05/11: 23 commits do `DESIGN.md` depois do `generatedAt`; badge de sucesso a 1,58:1 (§6, item 13) |

#### 8.4 Modelo de specs do back (BK-)

| ID | Grav. | Problema | Evidência | Nota de 04/11 e de 05/11 |
|---|---|---|---|---|
| BK-1 | Alto | Colisão de IDs RN entre `SPEC-TICKEST.md` e `SYSTEM_SPECIFICATION.md`: o RN-30 é o responsável na abertura num e o convite de conta no outro | `SPEC-TICKEST.md:164` (DP-02 → RN-30); `SYSTEM_SPECIFICATION.md:223` (RN-30, spec 008) | 05/11: ampliado; o RN-30, o RN-34 e o RN-35 têm significados diferentes (`SPEC-TICKEST.md:351,355,356` × `SYSTEM_SPECIFICATION.md:223,227,228`), e o "RN-35" do PR #5 é ambíguo (DOC-13) |
| BK-2 | Alto | `SPEC-TICKEST.md` órfão e contraditório | Relatório de 31/10 | 05/11: continua |
| BK-3 | — | Partes do `SYSTEM_SPECIFICATION.md` congeladas | Relatório de 31/10 | 05/11: não reconferido |
| BK-4 | — | Quatro registros de decisão sem índice | Relatório de 31/10 | 05/11: não reconferido |
| BK-5 | — | 15 pastas de spec fora do git: 12 nunca commitadas, 5 delas aprovadas (022, 034, 035, 037 e 043) | Relatório de 31/10 | A 022 e a 035 entraram na `origin/main` (PRs #60 e #62, 01/11). Às 17:04 de 04/11, sem rastreio: 032, 033, 034, 036, 037, 040, 043, 044, 046, 047, 048 e 049, além de `specs/_fontes/` (`git status` do back, que outra sessão altera durante o dia: a 052, vista às 16:54, saiu do working tree). Em 05/11: 11 pastas e `specs/_fontes/contratos-central-atendimento.md` fora do Git (032, 033, 034, 036, 037, 040, 043, 044, 046, 047 e 048); a 049, a 050 e a 051 foram versionadas (`back-wt-status.txt`). Decidido em 05/11 que o back versiona as pastas soltas (decisão 21) |

#### 8.5 Conformidade com as skills (31/10)

| Repositório | Estrita | Ajustada |
|---|---|---|
| Front, agregado | 91,6% (1095 de 1196) | 93,8% |
| Front, média simples | 87,7% | 96,0% |
| Back | cerca de 80% (bruto) | cerca de 90% |
| Front, agregado (05/11, `333f4c2`) | 92,0% (1110 de 1207) | 94,2% |
| Front, média simples (05/11) | 88,0% | 96,2% |
| Back (05/11, `251da97`; média das 26 regras) | 86,8% | 97,1% |
| Front, agregado (06/11, `387f5e6`) | 93,0% (1153 de 1240) | — |
| Front, média simples (06/11) | 90,4% | — |

Fonte: relatório de 31/10; para 05/11, o §16.3 (mesmo método, com os universos de 31/10 reconstruídos);
para 06/11, a medição do coordenador no `387f5e6`, pelo mesmo método, só na estrita (§16.3).

#### 8.6 Achado de 04/11: spec 049 do back

- A spec 049 ("Tickest — reavaliação arquitetural do projeto inteiro, modelo-alvo e plano de
  refatoração") usa FE-01 a FE-28 para achados do front. Em 04/11 não era versionada; desde 05/11 está
  no `bcf0356` (PR #71, merge `251da97`), "Em implementação" (`spec.md:4`).
- Estado: no começo desta redação, o cabeçalho dizia Em descoberta. Às 16:41 de 04/11 passou a
  Aprovada, "como spec-mãe, pelo modelo por etapa", ainda sem commit naquele dia (`spec.md:4,6` e
  `:2152`).
- A 049 cita os documentos `docs/audit` (§12). A FE-19 é o motivo da reabertura (A-22, DIV-5).
- Observação desta redação: a D-SF1 prevê specs do front em `specs/FE-NNN-slug`. Os IDs FE- da 049
  podem colidir com essa numeração.

### 9. Decisões do responsável

| Data | Decisão | Fonte |
|---|---|---|
| Até 29/10 | "volumeResolved off até validar" (commit `a77394d`, 29/10 19:57). Superada em 31/10 (A-28) | FA:487 |
| Data não registrada nos originais | Monitor fora do escopo da spec 024 do back (DEC-3 da 024) | FA:489 |
| 29/10 | Tirar do front a lógica que é do back e documentar o requisito; a cor da função saiu (BR-001) | FA:118; back `specs/044-cor-do-badge-da-funcao/spec.md:15` |
| 29/10 | Manter o mínimo de 2 caracteres no nome, "por decisão de não mudar o comportamento visível sem pedido" (autoria não registrada) | FA:173-175 |
| 29/10 | Commit `b7f0c37` autorizado (restaura plano e progresso) | FI:13; FI:37 |
| 29–30/10 | No conflito entre a missão e o `CLAUDE.md`, vale o `CLAUDE.md` (regra aplicada pela auditoria) | FA:610-615; FI:98 |
| 29–30/10 | Títulos de teste em português mantidos, como desvio consciente (autoria não registrada). Revertida em 04/11 pelo 6.3 (`9d7e238`) | FI:170 |
| 30/10 | A-37 autorizado | FA:38; FA:246 |
| 30/10 | Segunda etapa do A-42 autorizada | FA:330 |
| 30/10 | A-43 corrigido com autorização | FI:312-313 |
| 30/10 | A-44 registrado como pendência por decisão do responsável; corrigido depois, no saneamento | FI:314-315 |
| 30/10 | A-45 e A-46 corrigidos com autorização própria, depois da aprovação | FA:403-404; FI:387-388 |
| 30/10 | Aprovação formal da conclusão técnica: A-37 a A-43 e R-01 a R-04 aprovados; R-05 a R-07 e A-44 aceitos como pendências baixas; integração no Git só com autorização explícita | FI:383-396 |
| 30/10 | Saneamento de C-01 a C-12 e do A-44 autorizado | FA:574; FI:373 |
| 30/10 | Registrar a exceção do C-01 nas skills fica com o responsável | FA:587 |
| 30/10 | Consolidação dos documentos em dois, com o BR-001 migrado para a spec 044 do back | FI:320-335; back `specs/044-cor-do-badge-da-funcao/spec.md:141` |
| 30/10 | Integração na `fix/frontend-audit-integration` e abertura do PR #3 autorizadas | FI:40-44 |
| 30/10 | Merge do PR #3 autorizado depois da revisão | FI:423 |
| 31/10 | A-27 fica pendente | Conversa de 31/10 |
| 31/10 | A-28: ligar as duas flags | Conversa de 31/10; executado em `f7cdd73` |
| 31/10 | A-33: enxugar o CSS | Conversa de 31/10; executado em `0df5718` |
| 31/10 | C-09, C-07, C-10 e 6.3: resolver por etapas | Conversa de 31/10; executado em `6df64e1`, `0573c20`, `0451269` e `9d7e238` |
| 31/10 | "ok" para registrar no back as specs 046, 047 e 048 | Back: `specs/046-…/spec.md:101`, `specs/047-…/spec.md:98`, `specs/048-…/spec.md:90` |
| 31/10 | SPEC-TICKEST-FRONT.md aprovado para planejamento como especificação viva e fonte oficial dos requisitos do front. Nenhum arquivo foi criado até 04/11 | Conversa de 31/10 |
| 31/10 (23:20) | D-SF1 = opção B: documento vivo + uma spec por mudança em `specs/FE-NNN-slug` | Conversa de 31/10 |
| 31/10 (23:20) | E-00 antes da E-01 (correção da ordem do plano, na mesma mensagem da D-SF1) | Conversa de 31/10 |
| 04/11 | Regra de processo depois da falha da E-00 (§13) | Conversa de 04/11 |
| 04/11 | L-1: manter os 10 commits | Conversa de 04/11 |
| 04/11 | E-05: consolidar os documentos no `AUDITORIA.md`, preservando achados, evidências, históricos e referências; os originais só saem depois de validar o documento e mapear as referências externas | Conversa de 04/11 |
| 04/11 | Mensagens dos commits da E-00 mantidas (alternativa A) | Conversa de 04/11; reflog da `main` às 14:33:46 |
| 04/11 | L-9: integração e limpeza das branches, passo a passo | Conversa de 04/11; `l9/refs-*.txt` |
| 04/11 | L-3: remoção do `@angular/animations` aprovada depois da validação | Conversa de 04/11; `7fe3bec` |
| 04/11 | L-4 a L-8 autorizadas, com escopo de limpeza técnica | Conversa de 04/11 |
| 04/11 | Avaliar o local do `AUDITORIA.md` para manter a raiz enxuta; não regenerar o `design.json`; não mexer no bloco do tsconfig sem justificativa técnica; não alterar documentos nem specs do back | Conversa de 04/11 |
| 04/11 | Revisão das limpezas L-4 a L-8, dadas como concluídas: este documento aprovado em `docs/audit/`; os originais preservados até o back atualizar as referências; as mudanças do `DESIGN.md` aprovadas, sem regenerar o documento; o `design.json` sem regenerar por enquanto | Conversa de 04/11 |
| 04/11 | Remover as supressões NG8102 e NG8107 de todas as configurações, porque o projeto não tem avisos sem elas, e validar de novo em cópia isolada | Conversa de 04/11; §3 |
| 04/11 | Apagar a pasta `.impeccable/live/` se continuasse vazia. Não tinha arquivos, só as subpastas `annotations/` e `sessions/`, vazias, de 27/10 | Conversa de 04/11; `l48/impeccable-live.txt` |
| 04/11 | `cli.analytics`: apresentar o valor, o funcionamento e as alternativas, sem alterar. `server.ts` na raiz até a E-12; `README.md` e `PRODUCT.md` na E-06; nenhuma alteração no back, com as referências quebradas ou pendentes documentadas (§12) | Conversa de 04/11 |
| 04/11 | Integração: branch temporária a partir da `main`, com dois commits independentes (este documento; `DESIGN.md` e tsconfig). Nenhum stage ou commit antes da autorização do plano final; sem push, sem `npm ci` e sem iniciar D-SF5, E-01 ou E-12 | Conversa de 04/11 |
| 04/11 | P0 a P4 autorizados, com três commits independentes em vez de dois (este documento; `DESIGN.md`; tsconfig), na `chore/cleanup-audit-design-tsconfig`. Antes de cada commit, conferir que só os arquivos correspondentes estão no stage; parar se qualquer condição falhar | Conversa de 04/11; §11 |
| 04/11 | Concluir o P4 depois da parada no `git fsck`; registrar a integração neste documento num commit posterior; deixar como está o stash antigo `27e92c8` | Conversa de 04/11 |
| 04/11 | Liberados: fast-forward da `main` para o `d1f5d97`, exclusão da branch, push, `cli.analytics` como `false` em commit separado, `npm ci`, D-SF5, E-01 e E-12 | Conversa de 04/11; §11 |
| 04/11 | Seguir como sênior de Angular e UI/UX até a implementação do SDD: excelência técnica, arquitetura de componentes, design tokens, desempenho e integridade dos fluxos | Conversa de 04/11 |
| 04/11 | D-SF5 = `FE-NNN` espelhando o back: pasta `specs/FE-NNN-slug-em-português/spec.md`; branch `tipo/FE-NNN-slug-em-inglês` (feat, fix, refactor, chore, docs ou test); commit `tipo(escopo): descrição em português [FE-NNN]`, com as tarefas como `[FE-NNN T-n]`. Os achados FE-01 a FE-28 da spec 049 do back passam a ser citados como `049/FE-nn`. As etapas do plano de 31/10 seguem com os IDs da auditoria | Conversa de 04/11 (pergunta direta) |
| 04/11 | E-12: remover o SSR; hospedar as fontes no projeto; adicionar o `angular-eslint` agora | Conversa de 04/11 (pergunta direta) |
| 04/11 | Seguir até o SDD sem parar: o A-42 em commits pequenos, cada item da E-01 no seu commit, a revisão pela skill `ca-review`, a E-12 e o registro da D-SF5. Tudo nas branches isoladas; merge e push na `main` só depois da validação final | Conversa de 04/11 |
| 05/11 | Rebase sequencial da E-01 e depois da E-12 sobre o `5cd3dce` (merge do PR #5), com os conflitos resolvidos pela integridade da arquitetura e build, lint e testes depois de cada rebase; avisar quando estiver pronto para o merge na `main`, que segue dependendo de aprovação | Conversa de 05/11 |
| 05/11 (16:58) | Fast-forward da `main` para o `333f4c2`, push e exclusão das branches da E-01 e da E-12: "Aprovado. Pode seguir com a opção 1: fast-forward, push e exclusão das branches" | Conversa de 05/11; §11 |
| 05/11 (por volta das 17:40) | Plano do registro: esperar a outra sessão commitar a edição dela na `fix/SPEC-049-fe0-front-alignment` e trazer a `main` nova; resolver os 3 conflitos com ela; um único commit corretivo com as menções que davam a E-01 e a E-12 fora da `main`, e o push. Aprovado e pausado | Conversa de 05/11; §11 |
| 05/11 (18:06) | Reauditoria com o roteiro de 31/10, só de leitura, com as entregas para aprovação antes de qualquer execução (§16) | Conversa de 05/11 |
| 05/11 (por volta das 22:15) | Aprovadas a E-16 (a e b) e as decisões da Onda 0, "todas as recomendações técnicas padrão apresentadas no relatório", menos a 12, que fica aberta com a proposta. Pedidos junto: manter a consistência arquitetural, a prioridade 046 → 048 → 047 e o tratamento do DIV-3 e do A-59. Origem de cada decisão: recomendação dos relatórios (1, 2, 5, 7, 8, 9, 10, 11, 13 e 16), decisão anterior (14 e 19), padrão técnico (3, 4, 6, 8a, 15, 17, 20 e 21; e a 12, que fica aberta) e pedido de 05/11 (11 e 18). Escolhas no §16.8 | Conversa de 05/11; `reaudit/entrega/DECISOES-2026-11-05.md` |
| 05/11 e 06/11 | Limpeza aprovada: exclusão, com `git branch -d`, de `docs/E-16-audit-record` (05/11) e de `fix/E-18-login-retry-feedback`, `fix/E-02-front-integration`, `fix/E-17-dashboard-home` e `refactor/E-03-stores-cleanup` (06/11), e remoção das worktrees | Conversa de 05/11 e 06/11, pela sessão coordenadora; §11 |
| 06/11 | Registro do bloco 1 e dos achados da execução neste documento, aprovado por Rafael Santos: uma worktree e uma branch nova a partir da `main` (`387f5e6`), com um commit só, neste documento. Merge e push ficaram fora dessa autorização | Conversa de 06/11, pela sessão coordenadora; §15 |

### 10. Matriz de aceitação

Resumo da matriz de FI:87-245 (Anexo B). Nenhum item FAIL ou BLOCKED.

| Seção | Tema | Linhas | PASS | Não PASS |
|---|---|---|---|---|
| 1 | Leitura das instruções e das skills | FI:91-102 | 8 de 8 | — |
| 2 | Auditoria completa do front | FI:104-124 | 14 de 17 | 2.10, 2.13 e 2.14 PARTIAL (o 2.12 está PASS, com R-05 a R-07 registrados) |
| 3 | Separação front/back | FI:126-140 | 11 de 11 | — |
| 4 | `BACKEND_RECONSTRUCTION.md` | FI:142-151 | 6 de 6 | — |
| 5 | Arquitetura modular e skills | FI:153-162 | 6 de 6 | — |
| 6 | Idioma | FI:164-173 | 5 de 6 | 6.3 PARTIAL |
| 7 | Lotes | FI:175-188 | 10 de 10 | — |
| 8 | Documentação e continuidade | FI:190-196 | 3 de 3 | — |
| 9 | Validação contínua e aceitação | FI:198-211 | 8 de 10 | 9.5 NOT APPLICABLE; 9.7 PARTIAL |
| 10 | Proteção do repositório | FI:213-220 | 4 de 4 | — |
| 11 | Autonomia | FI:222-227 | 2 de 2 | — |
| 12 | Revisão independente final | FI:229-239 | 7 de 7 | — |
| 13 | Relatório final | FI:241-245 | 1 de 1 (13.1–13.12) | — |

Total: 85 PASS em 91 linhas; 5 PARTIAL; 1 NOT APPLICABLE.

**Itens não PASS** (FI:247-256) e situação em 04/11 e em 05/11. "Resolvido" quer dizer corrigido no código; a
nova aceitação não foi feita.

| Item | Status em FI | Situação em 04/11 |
|---|---|---|
| 2.10 / A-23 | PARTIAL | Igual: pendente (spec 046) |
| 2.13 / A-33 | PARTIAL | Resolvido (`0df5718`; builds com 0 avisos) |
| 2.14 e 9.7 / testes de integração | PARTIAL | Igual: o projeto não tem testes de integração nem e2e; a validação com login está bloqueada (E-04) |
| 6.3 / nomes de teste | PARTIAL | Resolvido (`9d7e238`); o N-3 saiu na E-01; resíduos no C-39 |
| 2.12 / R-05 a R-07 | PARTIAL em FI:255 (PASS em FI:119, errata 15) | Resolvido (`f95f587`, `008dfcf`, `be5cd6e`); falta revalidar no navegador (E-04); defeitos do R-07 corrigidos na E-01, na `origin/main` desde 05/11; o R-10 foi corrigido no `62f3a43` (E-17) |
| A-42 / espera da primeira carga | PARTIAL | Resolvido (`00b7252`); defeitos corrigidos na E-01, na `origin/main` desde 05/11; o R-08 e o A-51, na E-18 (`413a447`, `0043cbf`), também desde 05/11 (§16.5) |
| 9.5 / lint | NOT APPLICABLE | Mudou: o lint existe desde a E-12 (`21735f4`, `npm run lint`) e passa sem erros na `main` (por log; `eslint src` sem erros na reauditoria de 05/11). O 9.5 passa a ser aplicável; a nova aceitação não foi feita. As skills ainda citam Prettier (DOC-8) |

### 11. Histórico de integração

Horários de Brasília, salvo indicação.

| Quando | Evento | Commits | Evidência |
|---|---|---|---|
| 29/10 19:57 | A-01 a A-11 e BR-001 commitados por domínio, por outra sessão; o `9354b3e` apagou plano e progresso | `664b73b` (shared), `357f183` (tickets), `fe8a559` (roles), `46cfbb8` (users), `a77394d` (dashboard), `311618d` (documentos) | FI:32-37; `git log` |
| 29/10 19:58 | PR #1 (`fix/tickets-actions-ux`) mergeado: trabalho anterior de UX de tickets, fora desta auditoria | `a62dfc9` | `gh pr view 1` (22:58:45 UTC) |
| 29/10 19:59 | PR #2 (`fix/dashboard-audit`) mergeado, com os commits de 19:57 | `fabeeb1` | FI:36; `gh pr view 2` (22:59:02 UTC) |
| 29/10 21:12 | Plano e progresso restaurados (commit autorizado) | `b7f0c37` | FI:13; FI:37 |
| 29/10 23:13 | Foco visível e correções da revisão de aceitação, commitados e publicados pela sessão b345b068 | `04ca7e1` (A-34), `b885c05` (A-35), `b5aaf70` (A-32), `4bb5792` (A-29), `c44ecc4` (A-36), `7c5b362` (documentos) | FA:225; FI:38-39; FI:218 |
| 30/10 00:02 | Registro da verificação do foco e do A-37 | `a4cedca` | `git log` |
| 30/10 14:26–14:41 | Branch `fix/frontend-audit-integration` criada de `a4cedca`, com 8 commits, publicada; PR #3 aberto | `7947148`, `000b4cc`, `8473d24`, `591bc90`, `838e94f`, `ba6b751`, `2caefb4`, `f449599` | FI:40-58; reflog |
| 30/10 14:58 | PR #3 mergeado por merge commit | `9962947` | FI:421-436; `gh pr view 3` (17:58:35 UTC) |
| 30/10 15:33–15:35 | Registro do merge na branch `docs/frontend-audit-merge-record`; PR #4 mergeado; a `main` local acompanhou por `pull --ff-only`. O merge foi feito no GitHub pela conta de Rafael (autor dos merge commits `9962947` e `e977f64`); a autorização do PR #4 não ficou registrada nos documentos | `523af11`; `e977f64` | `gh pr view 4` (18:35:10 UTC); reflog |
| 04/11 13:51:36–13:51:54 | E-00: branch local `fix/frontend-audit-pending-stages` criada de `e977f64`, com 10 commits (§13) | `f7cdd73`, `00b7252`, `0573c20`, `6df64e1`, `0df5718`, `f95f587`, `008dfcf`, `be5cd6e`, `0451269`, `9d7e238` | Reflog do HEAD; listas de arquivos iguais à simulação (`e00v2/exec/expected-N.txt` = `staged-N.txt` = `committed-N.txt`, N = 1 a 10) |
| 04/11 14:33:46 | L-9, P1: a `main` local avança por fast-forward de `e977f64` para `9d7e238`, com os hashes e as mensagens da E-00 | — | Reflog da `main` ("fetch . fix/frontend-audit-pending-stages:main: fast-forward"); `l9/refs-antes-P1.txt`, `refs-depois-P1.txt` |
| 04/11, até 14:45:47 | L-9, P3: exclusão com `git branch -d` de `docs/frontend-audit-merge-record`, `fix/focus-visible` e `fix/frontend-audit-integration` | — | `l9/refs-depois-P3.txt` |
| 04/11, até 14:58:31 | L-9, P4: exclusão com `git branch -d` de `fix/frontend-audit-pending-stages` | — | `l9/refs-depois-P4.txt` |
| 04/11 15:25 | L-9, P5: conferência final, `git fsck` sem erro, remotas intocadas | — | `l9/remotas-P5.txt`; `l9/fsck-P5.txt` (vazio) |
| 04/11 15:59–16:09 | L-3: branch temporária `chore/remove-angular-animations`; commit às 16:00:33 (`app.config.ts`, `package.json`, `package-lock.json`); validação em cópia isolada (X5-A); fast-forward da `main` às 16:09:02; branch excluída com `git branch -d` | `7fe3bec` ("chore(deps): remove @angular/animations obsoleto [L-3]") | Reflog; `l3/refs-antes-X5B.txt`, `refs-depois-X5B.txt`; `l3/fsck-X5B.txt` (vazio) |
| 04/11 22:35:53–22:36:36 | L-4 a L-6: branch temporária `chore/cleanup-audit-design-tsconfig` criada de `7fe3bec`, com três commits. Antes de cada commit, o stage tinha só os arquivos correspondentes, com os blobs planejados | `2445a2a` (L-4, este documento), `56495bd` (L-5, `DESIGN.md`), `d1f5d97` (L-6, tsconfig) | Reflog da branch; `l48/integ/p0.txt`, `p4.txt`, `refs-antes-P1.txt`, `refs-depois-P3.txt` |
| 04/11, depois de 22:36 | P4: 21 de 22 conferências passaram. O `git fsck` completo listou 15 objetos antigos sem referência (o stash `27e92c8`, de 26/10, e blobs num pack de 29/10), e o P4 parou. O `git fsck --connectivity-only --no-dangling` da L-9 e da L-3 e o `git fsck --no-dangling` saíram vazios | — | `l48/integ/fsck-P4.txt`, `fsck-P4-conectividade.txt`, `fsck-P4-completo-sem-dangling.txt` |
| 04/11 22:48 | P4 concluído com autorização: o `d1f5d97`, extraído por `git archive`, com build sem avisos (382,02 kB) e 1381 testes passando (§3) | — | `l48/v6e/.v6e/` |
| 04/11 22:50:47 | Fast-forward da `main` de `7fe3bec` para `d1f5d97`, sem trocar arquivos no working tree; branch temporária excluída com `git branch -d` | — | Reflog da `main` ("fetch . chore/cleanup-audit-design-tsconfig:main: fast-forward"); `l48/integ/refs-depois-ff.txt` |
| 04/11 22:51:08 | Push da `main`: a `origin/main` foi de `e977f64` para `d1f5d97`, por fast-forward (14 commits: E-00, L-3 e L-4 a L-6) | — | `l48/integ/push-1.txt`; `git ls-remote` antes e depois |
| 04/11 22:51:39 | `cli.analytics` como `false` no `angular.json`, num commit separado | `2ccf5d5` ("chore: desliga a telemetria do Angular CLI no projeto") | `ng analytics info`: configuração local e estado efetivo "disabled" |
| 04/11 22:52 | `npm ci`: o `node_modules` local passa a seguir o lockfile, sem o `@angular/animations`; o lockfile não mudou | — | `l48/integ/npm-ci.log`; `l48/v7a/.v7a/` (§3) |
| 04/11 22:59 | Push do `2ccf5d5` e do registro da integração: a `origin/main` vai a `82c7462` | `82c7462` | `l48/integ/push-2.txt` |
| 04/11 23:16 | Outra sessão começa a mexer no working tree principal (o DIV-1, rota de fechar chamado, no `TicketDetailStore` e no `TicketDataService`). Para não interferir, a E-01 e a E-12 passam a um worktree próprio, criado às 23:19 do `82c7462` | — | `git worktree list` |
| 04/11 23:22–23:55 | E-01 na branch `fix/E-01-audit-known-defects`, sobre o `82c7462`: 11 commits, um por item, cada um validado sozinho (build e testes) e revisado pela skill `ca-review` | Reescritos no rebase de 05/11 | `e01-logs/valida-commits.txt`; `e01-val/` |
| 05/11 00:13–00:57 | E-12 na branch `chore/E-12-structural-decisions`, sobre a E-01: 12 commits (SSR, guardas de plataforma, Angular 22.2, `@ngrx/signals`, fontes, SRI, o lint e as correções que o lint pediu), mais este registro. As dependências foram instaladas em cópias isoladas, com `npm ci` próprio; o npm nunca tocou o `node_modules` compartilhado | Reescritos no rebase de 05/11 | `e12-val/` |
| 05/11 00:46–00:50 | PR #5 (FE-0 da spec 049 do back, branch `fix/SPEC-049-fe0-front-alignment`), de outra sessão, mergeado no GitHub: a `origin/main` vai de `82c7462` a `5cd3dce` | `4b7b0de`; `5cd3dce` | `git log origin/main` |
| 05/11 14:03–14:07 | Rebase da E-01 sobre o `5cd3dce`: 9 commits sem conflito; o do N-2 descartado, porque o PR #5 já tinha tirado as flags e reescrito o comentário; a spec do `SideMenuNavComponent`, criada também pelo PR #5, unida numa só, com os 2 testes do PR #5 e os 11 da E-01. Depois, cada um dos 10 commits validado sozinho (build e testes) | `0ae9ee4` a `79e5129` | `rebase/refs-antes.txt`; `rebase/val/`; `rebase/val-e01/` |
| 05/11 14:11–14:52 | Rebase da E-12 sobre a E-01 rebaseada: 10 commits sem conflito e 3 resolvidos (as specs de departamentos, em que o PR #5 tirou o fluxo do responsável atual; o template do Início, que o PR #5 reorganizou; e este documento). Cada um dos 12 commits validado sozinho, com o `node_modules` exato do seu lockfile, e as mensagens com os números medidos sobre o `5cd3dce` | `06f537b` a `2647ab3` | `rebase/val-e12/`; `rebase/audit/` |
| 05/11, na redação da E-12 (até 14:52) | `main` local em `82c7462`; `origin/main` em `5cd3dce`. As branches da E-01 e da E-12 estavam só no local, rebaseadas, sem merge nem push, à espera da aprovação de Rafael Santos. No GitHub seguiam também `origin/fix/SPEC-049-fe0-front-alignment` (`4b7b0de`), `origin/docs/frontend-audit-merge-record` (`523af11`) e `origin/fix/frontend-audit-integration` (`f449599`) | — | `git branch -a` |
| 05/11 16:58:43 | Fast-forward da `main` local de `82c7462` para `333f4c2`, com `update-ref` conferindo o valor antigo; a `main` não estava aberta em nenhum working tree. Autorização de Rafael Santos: "Aprovado. Pode seguir com a opção 1: fast-forward, push e exclusão das branches" (§9) | `333f4c2` | Reflog da `main` ("merge chore/E-12-structural-decisions: Fast-forward") |
| 05/11 16:58:53 | Push `5cd3dce..333f4c2`: a `origin/main` vai a `333f4c2`, conferida no `git ls-remote` e na API do GitHub. O repositório não tem CI: 0 check-runs e 0 deployments | — | Reflog da `origin/main` ("update by push"); `git ls-remote`; API do GitHub |
| 05/11, logo depois | Exclusão, com `git branch -d`, de `fix/E-01-audit-known-defects` (era `79e5129`) e `chore/E-12-structural-decisions` (era `333f4c2`); remoção do worktree temporário `wt-e01`. Nunca houve branch remota com esses nomes | — | `git branch -a`; pasta do scratchpad |
| 05/11, por volta das 17:10 | Simulação, em cópia, da integração da edição da outra sessão (working tree principal, `fix/SPEC-049-fe0-front-alignment`) com a `main` nova: o `CLAUDE.md` sem conflito; este documento com 3 conflitos (§0; §6, itens 7 e 8; §6, itens 16 e 17) | — | Merge de três vias em cópia |
| 05/11, por volta das 17:40 | Plano do registro aprovado por Rafael Santos e pausado à espera do commit da outra sessão (§9); às 17:46 começa uma vigia só de leitura | — | Conversa de 05/11 |
| 05/11 18:06–19:08 | Reauditoria só de leitura, com o roteiro de 31/10, em seis frentes (relatórios gravados entre 18:55 e 19:05); às 19:08, a base desta redação foi atualizada com a edição da outra sessão, que seguia igual | — | `reaudit/out/`; `reaudit/base-outra-sessao/` (§14) |
| 05/11, por volta das 22:15 | Rafael Santos aprova a E-16 (a e b) e as decisões da Onda 0, menos a 12 (§9; §16.8) | — | Conversa de 05/11 |
| 05/11, às 22:18 | A outra sessão ainda não tinha commitado: a branch dela seguia em `4b7b0de`, local e remota, e a edição dela no `CLAUDE.md` e neste documento continuava igual à cópia das 19:08. A `main` e a `origin/main` seguiam em `333f4c2` | — | Conferência só de leitura da sessão coordenadora |
| 05/11, até 22:53 | E-16: os dois commits deste documento, na branch `docs/E-16-audit-record`, criada do `333f4c2`: a (a), conciliada com a edição da outra sessão, e a (b), com a reauditoria | `455230a` (E-16a), `0e7cc4e` (E-16b) | `git log`; `e16/msg-16a.txt`, `msg-16b.txt` |
| 05/11 23:10:55 | Fast-forward da `main` de `333f4c2` para `0e7cc4e` (E-16), com conferência do valor antigo. A outra sessão ainda não tinha commitado; o documento já trazia o texto dela | `0e7cc4e` | Reflog da `main` ("merge docs/E-16-audit-record: Fast-forward") |
| 05/11 23:11:04 | Push `333f4c2..0e7cc4e`, sem force | — | Reflog da `origin/main` ("update by push") |
| 05/11, depois da integração | Exclusão de `docs/E-16-audit-record` com `git branch -d`, sem recusa, e remoção da worktree. A branch nunca esteve no GitHub | — | `git branch -a` |
| 05/11 23:12–23:13 | E-18 (A-51 e R-08, feitos às 22:39 e 22:43 sobre o `333f4c2`, em `59d3636` e `493b81f`) rebaseada sobre o `0e7cc4e` e revalidada, cada commit numa cópia própria: build sem aviso, 1465 e 1469 testes, lint sem erros | `0043cbf` (A-51), `413a447` (R-08) | `e18/val/3-0043cbf-rebaseado/`, `4-413a447-rebaseado/` |
| 05/11 23:17:42 | Fast-forward da `main` de `0e7cc4e` para `413a447` (E-18), com conferência do valor antigo | `413a447` | Reflog da `main` ("merge fix/E-18-login-retry-feedback: Fast-forward") |
| 05/11 23:17:53 | Push `0e7cc4e..413a447`, sem force | — | Reflog da `origin/main` ("update by push") |
| 05/11 23:03 a 06/11 00:10 | E-02 sobre o `413a447`: 11 commits, um por item, cada um validado sozinho, em cópia isolada (build sem aviso, testes verdes, lint sem erros) | `92b9e93` a `e813444` | `e02/validacao.txt`; `e02/val/` |
| 06/11 00:26–13:38 | E-17 sobre a E-02: 6 commits, cada um validado sozinho, da mesma forma | `5b67103` a `62f3a43` | `e17/validacao.txt`; `e17/val/` |
| 06/11 13:16–14:22 | E-03: 11 commits, os 7 primeiros rebaseados sobre a ponta da E-17 às 13:41; cada um validado sozinho de 14:12 a 14:22, da mesma forma | `85836ef` a `387f5e6` | `e03/refs-antes-rebase.txt`, `refs-depois-rebase.txt`; `e03/val/resultado.txt` |
| 06/11 14:45:36 | Fast-forward da `main` de `413a447` para `387f5e6`, com o bloco E-02, E-17 e E-03 (28 commits) e conferência do valor antigo | `92b9e93` a `387f5e6` | Reflog da `main` ("merge refactor/E-03-stores-cleanup (E-02, E-17, E-03): Fast-forward") |
| 06/11 14:45:45 | Push `413a447..387f5e6`, sem force | — | Reflog da `origin/main` ("update by push"); `git ls-remote` |
| 06/11, depois da integração | Exclusão, com `git branch -d`, sem recusa, de `fix/E-18-login-retry-feedback`, `fix/E-02-front-integration`, `fix/E-17-dashboard-home` e `refactor/E-03-stores-cleanup`, e remoção das worktrees. Nenhuma delas esteve no GitHub | — | `git branch -a`; `git worktree list` |
| 06/11, na redação deste registro | A outra sessão ainda não tinha commitado: o working tree principal seguia em `fix/SPEC-049-fe0-front-alignment` (`4b7b0de`, local e remota), com o `CLAUDE.md` e este documento modificados. A `main` e a `origin/main` seguiam em `387f5e6` | — | `git status`, `git worktree list` e `git ls-remote`, só pelo Git |
| 06/11, na redação deste registro | Este registro: branch `docs/audit-bloco-1`, criada da `main` em `387f5e6`, com um commit só, neste documento (§9; §15) | — | `git log` |

### 12. Rastreabilidade com o back

| Spec | Título | Estado em 31/10 (`ef1c981`) | Estado em 04/11 | Achado do front | O que o front faz depois |
|---|---|---|---|---|---|
| 024 | "Meus Chamados" com o prazo e a situação do ciclo de SLA vigente | Aprovada, não implementada (FA:489; levantamento de 31/10) | Verificada; PR #61 mergeado em 01/11 (`74a8a5f`), depois do levantamento. Em `ef1c981`, a pasta da spec ainda não estava versionada | Ligada ao A-30 (a 024 cobre só Meus Chamados) | Nada novo no código: o front já lê `currentDueAtUtc` e `currentSlaStatus`, com recuo para os campos antigos (`tickets/feature-ticket-list/ticket-list-due.ts:74-76`, desde `1af95df`). Falta validar na aplicação real. Em 05/11, o recuo é código morto, porque a 024 nunca manda nulo (C-41); saiu no `92b9e93` (E-02), e os dois campos passaram a obrigatórios |
| 028 | Volume de resolvidos por período | Verificada (PR #48) | Igual | A-28 | Flag `volumeResolved` ligada (`f7cdd73`) e tirada no `5b67103` (C-33): o Início usa os resolvidos sempre |
| 029 | Chamados aguardando ação | Verificada (PR #49) | Igual | A-04 | Contrato corrigido (PR #2) |
| 030 | Responsáveis elegíveis para atendentes | Verificada (PR #44) | Igual | A-26, A-38 | Em uso (`GET /tickets/assignees`) |
| 031 | Números da empresa para todo usuário | Verificada (PR #50) | Igual | A-28 | Flag `companyStatsForAll` ligada (`f7cdd73`) |
| 038 | Departamento e setor no domínio rico | Verificada (PR #54, `a72e07b`) | Igual | A-22 | Nada: o 500 do nome longo virou 400 pela 042 |
| 042 | Validators e configurações no modelo da skill | Verificada (PR #56) | Igual | A-22, DIV-5 | Decidir o limite do motivo da reabertura (LAC-10) |
| 044 | Cor do badge da função, gravada no servidor | Em descoberta, não versionada | Igual | A-05 (BR-001) | Depois da entrega: FA:136-143 |
| 046 | Sessão sem tokens no JavaScript (cookie `HttpOnly`) | Em descoberta, não versionada; criada em 31/10 | Igual | A-23 | Depois da entrega: tokens fora do `localStorage`, sessão e interceptor ajustados |
| 047 | Ações permitidas do chamado na resposta da API | Em descoberta, não versionada; criada em 31/10 | Igual | A-24 (e A-06 a A-08, A-12) | Depois da entrega: trocar o espelho de `ticket-action-permissions.ts` pelas ações da API |
| 048 | Monitor com o prazo e a situação do ciclo de SLA vigente | Em descoberta, não versionada; criada em 31/10 | Igual | A-30 | Depois da entrega: `TicketMonitorItem` e telas do Monitor pelo ciclo vigente |
| 049 | Reavaliação arquitetural do projeto inteiro | — (não registrada em 31/10) | Aprovada em 04/11 como spec-mãe, ainda sem commit (`spec.md:4,6`, `:2152`), na branch local `refactor/SPEC-049-tickest-architecture-reassessment` do back. Mudou durante esta redação. Em 05/11: versionada no `bcf0356` (PR #71, merge `251da97`), "Em implementação" (`spec.md:4`), com a G1 entregue | FE-01 a FE-28 (FE-19 = A-22, DIV-5) | Conferir cada FE- contra este catálogo; o trabalho segue os portões de cada etapa da 049 (`spec.md:2152`) |

Entraram na `origin/main` do back depois de 31/10 (`git log ef1c981..origin/main`): specs 022 (PR #60),
023 (PR #52), 045 (PR #59), 024 (PR #61) e 035 (PR #62), em 01/11; 051 (PR #64), em 03/11; 050
(PR #65), em 04/11; a G1 da 049 (PR #71, `bcf0356`), em 05/11. O impacto delas no front foi avaliado
em parte em 05/11 (§6, item 22). Outra
sessão edita o back durante o dia: a 049 mudou de estado, e a 052 apareceu e depois saiu do working
tree enquanto este documento era escrito.

**Referências externas aos documentos `docs/audit`.** Conferidas em 04/11. Precisam ser atualizadas
quando os originais forem removidos:

- `docs/audit/FRONTEND_AUDIT.md` passa a ser o Anexo A deste documento, e `FINAL_ACCEPTANCE_AUDIT.md`,
  o Anexo B. Uma linha `n` citada vira `FA:n` ou `FI:n`.
- A spec 049 está versionada desde o `bcf0356` (PR #71); a cópia do working tree segue em edição (em
  05/11, 4 linhas diferentes, nenhuma sobre os documentos de auditoria). Vale o conteúdo citado.
- No front, nenhum arquivo fora de `docs/audit` cita os dois documentos.

| Onde | Linhas | O que cita |
|---|---|---|
| Back, `specs/044-cor-do-badge-da-funcao/spec.md` | 16, 141 | `docs/audit/BACKEND_RECONSTRUCTION.md`, já removido em 30/10 |
| Back, `specs/046-sessao-em-cookie-httponly/spec.md` | 101 | `docs/audit/FRONTEND_AUDIT.md` (A-23) |
| Back, `specs/047-acoes-permitidas-do-chamado/spec.md` | 98 | `docs/audit/FRONTEND_AUDIT.md` (A-24) |
| Back, `specs/048-monitor-ciclo-sla-vigente/spec.md` | 90 | `docs/audit/FRONTEND_AUDIT.md` (A-30) |
| Back, `specs/049-reavaliacao-arquitetural-dominio-chamados/anexo-a-achados.md` | 834, 869 (1022 e 1057 no `251da97`) | `docs/audit/FRONTEND_AUDIT.md` e `FRONTEND_AUDIT.md:476` (A-22) |
| Back, `specs/049-…/anexo-b-inventario.md` | 420, 542 | `docs/audit/*.md`; a T-512 atualizaria a A-22 |
| Back, `specs/049-…/anexo-c-analise-por-area.md` | 1564 (o levantamento citava 1550; o arquivo mudou) | `docs/audit/FRONTEND_AUDIT.md` e `FINAL_ACCEPTANCE_AUDIT.md` |
| GitHub, descrições dos PRs #3 e #4 | — | `docs/audit` consolidado (PR #3) e `docs/audit/FINAL_ACCEPTANCE_AUDIT.md` (PR #4). São remotas e não serão alteradas |

**Estado em 05/11** (back `251da97`; §16.6): as 044, 046, 047 e 048 seguem "Em descoberta" e fora do
Git, sem DEC fechada no texto delas; as DECs das 046 a 048 foram decididas por Rafael Santos em 05/11
(§16.8), e o texto e a implementação no back dependem de autorização (E-09, E-11). A 043 foi aprovada em
05/11 e está em implementação no working tree do back, pela outra sessão. A 049 está versionada, com a
G1 entregue (PR #71). As referências da tabela acima seguem sem troca (DOC-28).

### 13. Falhas de processo

- **O que aconteceu:** em 2026-11-04, às 13:51, a E-00 foi executada a partir da mensagem "faça
  commit": branch local `fix/frontend-audit-pending-stages` e 10 commits (`f7cdd73` a `9d7e238`),
  conforme o reflog.
- **Por que é falha:** a decisão vigente era manter a E-00 sem execução até a definição da
  nomenclatura (D-SF5).
- **Registro e regra:** Rafael Santos registrou o fato como falha de processo e definiu a regra:
  - uma decisão anterior de não executar vale até ser alterada expressamente;
  - mensagem ambígua nunca autoriza operações de Git (branch, stage, commit, merge, rebase, push ou
    exclusão de branch).
- **Desfecho:** os commits foram mantidos por decisão posterior (L-1). A lista de arquivos de cada
  commit bate com a simulação aprovada (§11).

### 14. Artefatos e evidências temporárias

Ficam fora do repositório e podem sumir. Só a localização fica registrada.

| Pasta | O que tem | Período |
|---|---|---|
| `C:\Users\rafae\AppData\Local\Temp\claude\c--dev-tickest-pristine-front\65d7fc55-6391-4e98-8ae7-b7f896419fc4\scratchpad\` | Backup do BR-001 (`backup-br001\`), patch da missão, cópias isoladas e logs (`acc\`, `final2\` a `final8\`), medições de foco (`focus\`), preparação da E-00 (`e00\`, `a33\`) e scripts de 31/10 | 29/10 a 31/10 |
| `C:\Users\rafae\AppData\Local\Temp\claude\cb02df504aad776f\65d7fc55-6391-4e98-8ae7-b7f896419fc4\scratchpad\` | `backup\` (antes da reindentação e da tradução dos títulos); `e00v2\` (simulação e execução da E-00: commits, `manifest.json`, logs de build e de testes por estado); `l9\` (fotos das refs e `git fsck` da L-9); `l3\` (validação da L-3: `original\`, `modificada\`, `x5a\`); `l48\` (rascunho e validação deste documento; diffs e conferências das limpezas L-5 e L-6; `v6b\`, `v6h\`, `v6c\` e `v6d\`, cópias isoladas da revisão de 04/11; `impeccable-live.txt`; `integ\`, conferências P0 a P4, `fsck`, refs, push, `npm ci` e `npm audit` da integração; `v6e\` e `v7a\`, validação do `d1f5d97` e do `2ccf5d5`); `status-*.txt`; `wt-e01\` (worktree da E-01 e da E-12, removido em 05/11); `e01-logs\` (mensagens dos commits, scripts de validação e medidas do R-07 e do A-33); `e01-val\` (validação de cada commit da E-01); `e12-val\` (cópias da E-12, cada uma com `npm ci` próprio, e os logs do `ng update`, das fontes e do lint); `rebase\` (rebase de 05/11: refs, mensagens, a validação de cada commit da E-01 e da E-12 sobre o `5cd3dce` em `val\`, `val-e01\` e `val-e12\`, o `npm audit` de cada lockfile em `audit\`, o `node_modules` próprio do commit do Angular 22.2 e a cópia do validador deste documento) | 04/11 a 05/11 |
| `C:\Users\rafae\AppData\Local\Temp\claude\cb02df504aad776f\65d7fc55-6391-4e98-8ae7-b7f896419fc4\scratchpad\reaudit\` | Reauditoria de 05/11: cópias fixas do front (`front\`, `333f4c2`) e do back (`back\`, `251da97`); specs fora do Git (`back-wt-specs\`) e a lista do working tree do back (`back-wt-status.txt`); o relatório de 31/10 (`relatorio-3110.md`); a base desta redação (`base-outra-sessao\`, merge de três vias com a edição da outra sessão); os seis relatórios das frentes e os scripts deles (`out\`); as entregas (`entrega\`: relatório consolidado, `mapa-ids.md`, plano, decisões, este documento proposto, os scripts de montagem e de conferência e o `validacao.txt`) | 05/11 |
| `C:\Users\rafae\AppData\Local\Temp\claude\cb02df504aad776f\65d7fc55-6391-4e98-8ae7-b7f896419fc4\scratchpad\` | Execução de 05 e 06/11: `e16\` (conferência independente e mensagens da E-16); `e18\`, `e02\`, `e17\` e `e03\` (scripts, mensagens dos commits e a validação de cada commit em `val\`, com os resumos `e02\validacao.txt`, `e17\validacao.txt` e `e03\val\resultado.txt`; na `e03\`, também as refs do rebase); `doc1\` (este registro: a base do `387f5e6`, os dados e o script de montagem, o validador adaptado e as saídas) | 05/11 a 06/11 |

Os caminhos curtos citados neste documento (`e00v2/…`, `l3/…`, `l9/…`, `l48/…`, `e01-logs/…`,
`e01-val/…`, `e12-val/…`, `rebase/…`, `e16/…`, `e18/…`, `e02/…`, `e17/…`, `e03/…` e `doc1/…`)
partem da pasta de 04/11. `focus/compare.md` parte da pasta de 29–31/10. Os caminhos `reaudit/…`
partem da mesma pasta de 04/11.

### 15. Histórico deste documento

- **29–30/10:** a missão gerou quatro documentos (FI:194). Em 30/10, os quatro e o registro de
  aceitação viraram dois (FI:320-335):
  - saíram `BACKEND_RECONSTRUCTION.md`, `FRONTEND_REFACTOR_PLAN.md` e `FRONTEND_REFACTOR_PROGRESS.md`;
  - ficaram `FRONTEND_AUDIT.md` e `FINAL_ACCEPTANCE_AUDIT.md`.
- **04/11:** os dois viram este documento. É a etapa E-05 do plano de 31/10, autorizada em 04/11 e
  feita como L-4 da limpeza.
- **Local:** `docs/audit/AUDITORIA.md`, ao lado dos originais. A raiz fica só com os documentos que
  as ferramentas leem de lá (`CLAUDE.md`, `DESIGN.md`, `PRODUCT.md`) e o `README.md`. Os originais
  ficam até as referências do §12 serem atualizadas (§6, item 20).
- **Revisão de 04/11:** Rafael Santos aprovou o documento e o local. As decisões da revisão estão no
  §9; as pendências que restam, no §6 (itens 13 e 18 a 21).
- **04/11, depois da integração:** este documento entrou no `2445a2a` com o texto da revisão, que
  ainda falava em dois commits. Esta atualização corrige esse texto, registra a integração (§11) e
  dois achados da validação (§6, itens 23 e 24).
- **05/11, depois da E-01 e da E-12:** registra a D-SF5 (§9), a E-01 e a E-12 (§1, §3, §6, §7 e §11)
  e os achados novos (§6, itens 25 a 30). Foi no último commit da branch da E-12 (`333f4c2`), que
  entrou na `origin/main` às 16:58 de 05/11 (§11).
- **05/11, no rebase sobre o PR #5:** junta a atualização do PR #5 (A-21, A-22, DIV-5 e pendência 7)
  com a da E-01 e da E-12; troca os hashes e os números pelos da base nova; corrige o que tinha
  ficado para trás no §0 ("Como ler"), no §3 (SSR e lint) e no item 12; atualiza o item 27 e
  acrescenta o item 31 (§6).
- **05/11, à noite, commit corretivo:** junta a edição da outra sessão (o PR #5 na `origin/main`, DIV-1
  e DIV-4), resolve os 3 conflitos com ela (§0; §6, itens 7, 8, 16 e 17), registra o fast-forward, o
  push e a exclusão das branches (§9; §11) e corrige as menções que davam a E-01 e a E-12 fora da
  `main`. Montado por script sobre a cópia da edição da outra sessão (`reaudit/entrega/monta-auditoria.cjs`) e conferido por outro (`valida-auditoria.cjs`).
- **05/11, à noite, registro da reauditoria:** acrescenta o §16 (números, achados novos com ID final,
  plano e decisões de 05/11), atualiza os estados conferidos no §0 a §12, no §14 e aqui, com as
  erratas 21 a 25, e corrige as linhas citadas que mudaram até o `333f4c2` (R-05, R-06, R-07, C-07,
  C-09 e N-4). Aprovado com a E-16a por Rafael Santos, por volta das 22:15.
- **06/11, registro do bloco 1:** registra a integração da E-16 e da E-18 (05/11) e do bloco E-02, E-17
  e E-03 (06/11), com os números e o histórico (§0 a §3, §8.5 e §11); passa os IDs resolvidos a
  "Corrigido" ou "Resolvido", com o hash e a etapa (§4 a §8, §10, §12 e §16), e o C-31 e o C-34 a "Em
  parte"; atualiza o plano (§16.7) e acrescenta o §16.10, com 7 achados da execução conferidos no
  `387f5e6`. Aprovado por Rafael Santos em 06/11. Montado por script sobre o `387f5e6`
  (`doc1/monta-bloco1.cjs`, com os dados em `doc1/dados-bloco1.txt` e `doc1/secao-16-10.md`) e conferido
  por dois validadores: o da consolidação, adaptado à base nova (`doc1/valida-bloco1.cjs`), e o
  `e16/confere-auditoria.cjs`.
- **Regra:** a Parte I prevalece. Os anexos preservam o texto original, sem alterações.
- **Cópia dos anexos:** texto idêntico aos blobs de `7fe3bec`, conferido por script
  (`l48/l4-validate.cjs`); conferido de novo em 05/11 (`reaudit/out/docs-tmp/check-anexos.cjs` e
  `reaudit/entrega/valida-auditoria.cjs`) e em 06/11 (`doc1/valida-bloco1.cjs` e
  `e16/confere-auditoria.cjs`). No working tree do Windows, este documento e os originais usam CRLF
  (`core.autocrlf=true`); no repositório, LF.

#### 15.1 Erratas

Para cada contradição: o que diz o original e o valor correto. As erratas 21 a 25 são do relatório de
31/10, conferidas em 05/11.

| # | Tema | O que diz o original | Valor correto |
|---|---|---|---|
| 1 | A-42 | FA:43: "Corrigido em duas etapas". FI:256: "A-42 — espera da primeira carga", PARTIAL. FA:371-372 registra o limite | As duas etapas estão na `origin/main` (`591bc90`). A espera sem aviso foi tratada pelo `00b7252` (E-00, publicado no push de 04/11). Estado: corrigido, com defeitos para a E-01 (§6) |
| 2 | A-31 | FA:490 o põe em "Pendências e melhorias não executadas"; FI:186: "mantidos com justificativa" | Mantido (§5); a classificação fica a reavaliar |
| 3 | Número de testes | FI:121, FI:207 e FI:236 dão 1358 como estado final | 1358 é anterior ao saneamento. O estado do PR #3 e da `origin/main` é 1361 (FI:80; FA:607). Hoje, 1381 (§3) |
| 4 | Specs do back | FA:482-483, FA:489 e FI:362-364: A-23, A-24 e A-30 sem spec. FA:489: a 024 "aprovada, ainda não mergeada" | Specs 046, 047 e 048 criadas em 31/10, Em descoberta, não versionadas (`spec.md:101`, `:98` e `:90`). A 024 está Verificada e mergeada desde 01/11 (PR #61) |
| 5 | A-22 | FA:476: limites "iguais aos validadores do servidor", motivo da reabertura 500, nome de departamento acima de 100 "falha no banco com 500". FI:365 repete o 500 | Desde a spec 042: o motivo não tem limite próprio (`ReopenTicketCommandValidator.cs:9`) e vale 4000; texto acima do limite responde 400 (`GlobalExceptionHandler.cs:46-60`). Ver §5 |
| 6 | Listas de pendências | Cinco listas diferentes: FA:478-492; FI:247-256; FI:358-369; FI:398-416; FI:437-453 | Vale a lista única do §6 |
| 7 | Estado do Git | FA:60-61 e FA:575: "sem stage nem commit". FI:379: idem. FI:391-396: "nenhum commit novo" | O trabalho de 30/10 entrou em 8 commits na `fix/frontend-audit-integration`, publicada, e no merge do PR #3 (`9962947`): FI:40-58; FI:421-436 |
| 8 | Base de referência | FA:511: `a4cedca`. FI:12-13 e FI:392: `main` = `origin/main` = `a4cedca`. FI:434: `9962947` | `origin/main` = `e977f64` desde 30/10 15:35 (PR #4). `main` local = `7fe3bec` |
| 9 | Resumo do FA | FA:36 resume "A-12 a A-27" como "Documentado" e omite A-28 a A-33 | Vale o catálogo do §4. A-25 e A-26 foram corrigidos (como A-39 e A-38); A-28 a A-33 têm estado próprio |
| 10 | Tabela de pendências do FA | FA:478-492 traz quatro itens já executados: A-25 (FA:484), A-26 (FA:485), A-29 (FA:488) e A-32 (FA:491) | Os quatro estão corrigidos (§4) |
| 11 | Violação de regra escrita | FA:527: "só uma: C-04". FA:558: 50 de 51 arquivos sem violação | Também violam regra escrita o C-10 (README das skills: recuo de 2 espaços) e o C-11 (`CLAUDE.md`: `/** */` em todo membro), os dois anteriores à missão |
| 12 | C-07 | FA:585: o foco preso "tem um só uso" | Em `e977f64` havia três cópias: `shared/ui/dialog/dialog.component.ts:132-135`, `shared/ui/directives/side-panel.directive.ts:57` e `main-layout.component.ts:172-175`. O `0573c20` as uniu em `focus-trap.util.ts` e `focus-trap.directive.ts` |
| 13 | C-10 | FA:590: "180 de 248 arquivos `.ts` usam 4 espaços" | Minoria. Em `e977f64`, 20 de 253 arquivos `.ts` usavam 4 espaços: 16 só com eles e 4 com trechos em 2 espaços (`dashboard.component.ts`, `login.component.ts`, `auth-layout.component.ts` e `main-layout.component.ts`). O `0451269` reindentou os 20 e o `dashboard.component.css`. Em `7fe3bec`, nenhum `.ts` usa só 4 espaços. O levantamento de 31/10 contou 23 de 245, com outro critério |
| 14 | Escopo e back de referência | FA:62-67 põe "ligar as flags do Início (A-28)" fora do escopo. FA:6, FI:110 e FI:302-303 dão o back conferido em `a72e07b` | As flags estão ligadas (`f7cdd73`; `environment.ts:11-12`). Em `ef1c981` não existem as citações de FA:149, FA:168, FA:466 e FA:468 (N-7); entre `a72e07b` e `ef1c981` entraram as specs 039, 042 e 041 |
| 15 | Status da matriz | FI:119: 2.12 PASS; FI:255: 2.12 PARTIAL. FI:181: Lote 3 PASS com o A-23 fora do escopo; FI:117: 2.10 PARTIAL pelo A-23 | 2.12: vale PARTIAL até a E-00; R-05 a R-07 estão corrigidos na main local, com revalidação no navegador pendente (E-04). A-23: pendente (spec 046); o Lote 3 é PASS só no escopo autorizado |
| 16 | Lacuna de teste | FI:305: "sem lacuna de teste" | Havia lacuna: o C-12 (FA:545), corrigido no saneamento (FA:581) |
| 17 | 3.3.5 | FI:135: "nenhuma referência a `roleColor`, `badge-role-custom` ou `--role-color`" | Não há referência no código de produção. Os testes de ausência citam `tickest.roleColors` e `--role-color` (`role-list.component.spec.ts:366`; `user-list.component.spec.ts:665-672` em `a4cedca`, `:675-682` hoje), como o próprio FI:138 registra |
| 18 | 6.6 | FI:173: "sem comentário desatualizado" | `roles/feature-role-list/role-list.component.css:1` ainda fala em "amostra de cor", removida com o BR-001 (N-1) |
| 19 | Focos medidos | FI:82: 761 focos. FI:267 e FA:230: 734 controles | 761 é o total de focos medidos (`focus/real-auth-antes-auth.json` e `real-auth-depois-auth.json`); 734 são os focos únicos (`focus/compare.md`, linhas 1-2) |
| 20 | Data | FA:1 e FI:3: 2026-10-29 | Os dois cobrem 29 e 30/10 (ex.: FA:37-47; FI:40-44; FI:381-436). Este documento cobre de 29/10 a 06/11 |
| 21 | Seed (relatório de 31/10, seção 2.4) | Dá como correta a estrutura inicial do `PRODUCT.md:43-45` (5 departamentos com 2 setores) | O seed tem 7 departamentos e 21 setores desde o `3387ff9` (04/10; `DefaultOrganizationSeeder.cs:17-57`); o `PRODUCT.md` está errado (DOC-12) |
| 22 | Duas abas na 046 (relatório de 31/10, seção 6) | "Já coberto: o back aceita reutilizar o token anterior por 30 segundos" | Dentro dos 30 s o back só deixa de revogar e recusa (`RefreshTokenCommandHandler.cs:25-30,91-99`; `UsersTests.cs:384-398`); a corrida entre abas pede coordenação (BK-10, A-55) |
| 23 | Espera nos testes (relatório de 31/10, P16) | Recomenda `TestBed.tick()` no lugar do `flushEffects` | O padrão real do código é o `whenStable` (1.009 `fixture.whenStable` e 318 `ApplicationRef).whenStable`, contra 3 `TestBed.tick()`) (DOC-18) |
| 24 | Vocabulário (relatório de 31/10, D6) | Marca "Não" (sem divergência) para português e vocabulário | Diverge: é o P6 (`PRODUCT.md:20` × `DESIGN.md:872-873`; DOC-35) |
| 25 | README das skills (relatório de 31/10, P18) | Hipótese de texto herdado de outro projeto (datas de 23/07, `@nx/angular`) | Não se sustenta: o front teve commits em 23/07 e já estava no Angular 22 desde 13/07; sobra o texto ambíguo (DOC-19) |

### 16. Reauditoria de 05/11

Rafael Santos pediu às 18:06 de 05/11 a reauditoria com o roteiro de 31/10: documentos, arquitetura e
limpeza do front e do back, separação de responsabilidades, etapas recentes e as specs 046, 047 e 048.
Foi só de leitura, em seis frentes, sobre cópias fixas; nada mudou nos repositórios. Esta seção registra
a base, os números, os estados conferidos, os achados novos com ID final, o plano e as decisões de 05/11.
Desde 06/11, os estados das tabelas seguem a `main` (`387f5e6`), e o §16.10 traz os achados da execução
do bloco 1.
O detalhe, com os scripts, fica nos seis relatórios das frentes e no relatório consolidado (§14).

- **Classes de evidência:** COMPROVADO (no código, num teste, no Git ou executado); DECLARADO (só escrito
  em documento ou dito por outra sessão); INFERIDO (dedução sem execução); NÃO VERIFICADO (com o motivo).
- **Gravidade:** a escala do §0 (Crítica, Alta, Média, Baixa). "—" quando a frente não deu gravidade;
  "(31/10)" quando a gravidade vem do relatório de 31/10. Nos DOC, "Prio." é a prioridade documental do
  relatório de documentos: Alta quando o texto é lido por ferramenta ou é o registro oficial e leva a
  código ou decisão errada.
- **IDs:** cada ID novo é definido uma vez, numa tabela desta seção. A coluna Origem traz os IDs
  provisórios das frentes (T-DOC, T-FEA, T-BEA, T-SEP, T-ETP e T-SPC) e os itens de 31/10; a ligação
  completa, com as fusões, está no `reaudit/entrega/mapa-ids.md`. A coluna Etapa aponta o §16.7.

#### 16.1 Base, método e números

| Item | Valor | Classe |
|---|---|---|
| Front | Cópia fixa de `333f4c2` (`main` = `origin/main`), conferida blob a blob: 358 arquivos, 326 em `src/` | COMPROVADO |
| Back | Cópia fixa de `251da97` (`origin/main`, merge do PR #71, G1 da 049, 05/11 às 17:11) | COMPROVADO |
| Specs fora do Git | 032, 033, 034, 036, 037, 040, 043, 044, 046, 047 e 048, copiadas do working tree do back em 05/11; a sessão da 043 segue no working tree do back | COMPROVADO (cópia) |
| Edição pendente do front | `CLAUDE.md` e este documento no working tree principal, copiados às 19:08; iguais às 22:18 | COMPROVADO (cópia) |
| Linha de base | Relatório de 31/10 e este documento no `333f4c2` | — |
| Frentes | Documentos (relatório gravado às 19:02), arquitetura do front (19:01), arquitetura do back (19:05), separação (18:55), etapas recentes (18:59) e specs 046 a 048 (18:56) | COMPROVADO (horário de gravação) |
| Execução | Front: `eslint src` e `tsc --noEmit` com `--noUnusedLocals` e `--noUnusedParameters`, numa cópia; sem build nem testes, que gravariam na cópia. Back: build e testes unitários e de arquitetura numa cópia, sem rede; sem testes de integração, que pedem banco | — |
| Segredos | Nenhum nos documentos do front. No back, só credenciais de desenvolvimento versionadas (SE-12 da 049): a senha de banco local na connection string de `appsettings.Development.json:3` (valor mascarado), e o mesmo tipo em `docker-compose.yml:26`, `docker-compose.override.yml:7`, `launchSettings.json:38` e `README.md:60` | COMPROVADO |

| Indicador | 31/10 | 05/11 | Classe |
|---|---|---|---|
| Testes do front | 1381 | 1456, na ponta `333f4c2` | COMPROVADO por log; não reexecutado |
| Build inicial do front | 386,51 kB | 433,61 kB, 0 aviso de orçamento | Idem |
| Lint do front | Não existia | 0 erro e 0 aviso (`eslint src`) | COMPROVADO |
| Fronteiras do front | 0 violação | 0 violação (414 imports de produção entre pastas e 219 nas specs) | COMPROVADO |
| Conformidade do front, agregado estrito e ajustado | 91,6% e 93,8% | 92,0% e 94,2% | INFERIDO (universos de 31/10 reconstruídos) |
| Conformidade do front, média simples estrita e ajustada | 87,7% e 96,0% | 88,0% e 96,2% | Idem |
| Camadas do back | 0 violação | 0 violação | COMPROVADO |
| Conformidade do back, bruta e ajustada | ≈80% e ≈90% | 86,8% e 97,1% | COMPROVADO (contagem) |
| Testes do back | 1.466, declarados | 940 unitários e 134 de arquitetura passando; 674 de integração, declarados pela 049 | COMPROVADO; DECLARADO |
| Achados novos | — | 128 IDs novos (13 A, 3 R, 29 C, 33 DOC, 5 DIV, 2 LAC, 18 BA e 25 BK), dos 102 IDs provisórios das frentes e dos itens de 31/10 sem registro; nenhum de gravidade Crítica; Alta: A-59 (INFERIDO) e BK-27 (31/10); Média: A-47, A-48, A-50, A-53, A-56, LAC-17, BA-13 e BA-17; o resto, Baixa ou sem gravidade dada pela frente. | — |

#### 16.2 Documentação

**Números.** Dos 22 problemas de 31/10 (P1 a P22), 17 continuam, 4 foram resolvidos (P14, P20, P21 e
P22) e 1 foi reavaliado (P18); além disso, o relatório de 31/10 errou ao dar como correta a estrutura
inicial do seed (DOC-12; errata 21). DOC-1 a DOC-10: 7 abertos, o DOC-8 em parte (o lint existe), o
DOC-9 resolvido e o DOC-10 mantido por decisão e ampliado. Anexos A e B idênticos aos originais e os 69
IDs dos originais presentes na Parte I; as 322 referências `FA:n` e `FI:n` caem no trecho certo. Das 642
citações de caminho em 14 documentos, 3 referências vigentes estavam quebradas (`CLAUDE.md:31`,
`PRODUCT.md:24` e o "Como ler" deste documento), mais o `wt-e01` do §0 e do §14. Do `DESIGN.md`, 118 de
119 símbolos existem no código. O "CLOUD.md" não existe: é o `CLAUDE.md`.

| Tema | 31/10 | 05/11 |
|---|---|---|
| `PRODUCT.md` | P1 a P9 | Igual, sem commit desde 26/10; os P5, P6, P7 e P9, que nunca tiveram registro, viram DOC-34 a DOC-37, e o seed errado, DOC-12 |
| `README.md` | P10 e P11 | Igual; o SSR saiu e falta citar o lint (DOC-6, DOC-38) |
| `CLAUDE.md` | P12 e P13 | Pior: o exemplo do guard quebrou no PR #5 (DOC-11, corrigido na edição pendente da outra sessão); faltam comandos, mapa de documentos e regras de trabalho (DOC-29) |
| Skills | P14 a P18 | O lint existe (P14); seguem Prettier, `flushEffects`, `fakeAsync` e `console.error` (DOC-8); modelos com erro (DOC-16, DOC-17); sem testes de Data Service (DOC-18) |
| `DESIGN.md` | P19 a P22 | P20 a P22 resolvidos na L-5 e no PR #5; o `design.json` ficou 23 commits atrás (DOC-10); "Em breve" obsoleto (DOC-14); padrões globais da E-00 sem registro (DOC-15) |
| Este documento | Criado na L-4 | Anexos íntegros; a Parte I do `333f4c2` ficou defasada às 16:58 (DOC-20 a DOC-24), corrigida na E-16 (`455230a` e `0e7cc4e`) |

As 18 duplicações de 31/10 (D1 a D18) não tinham ID e colidiam com as divergências D-1 a D-10 (DOC-31).
Ficam assim:

| Duplicação de 31/10 | Estado em 05/11 | ID |
|---|---|---|
| D1 Arquitetura em quatro documentos | Diverge igual | DOC-7; DOC-39 |
| D2, D4, D5, D9, D13 e D16 | Sem divergência; podem divergir sem fonte única | DOC-40 |
| D3 Lint, testes e build | Resolvida: o lint existe | — |
| D6 Vocabulário | Diverge (31/10 marcou "Não"; errata 24) | DOC-35 |
| D7 Tenant; D8 Papéis | Divergem | DOC-1; DOC-2 |
| D10 SLA e 75% | Sem divergência; ponteiro impreciso | DOC-26 |
| D11 Primeira resposta; D12 RBAC | Divergem | DOC-34; DOC-36 |
| D14 e D15 Tokens e `design.json` | O botão resolvido; o `design.json` diverge mais | DOC-9; DOC-10 |
| D17 Acessibilidade | Diverge | DOC-5 |
| D18 "Faça e não faça" | O "Don't" ficou obsoleto | DOC-14 |

**Tarefas da FE-0 conferidas contra esta Parte I** (pendência 31; o comportamento contra o back fica
para a E-04):

| Tarefa do PR #5 | O que o código de `333f4c2` mostra | Registro |
|---|---|---|
| T-500 | Fechar por `POST /tickets/{id}/close` (`ticket.data.service.ts:42-45`; `ticket-detail.store.ts:176`) | DIV-1 resolvido |
| T-504 (parte) | Espera `Tickets.AssigneeNotAttendant` (`ticket-detail.store.ts:269`) | DIV-4 resolvido |
| T-512 | Rotas e menu por `tickets:view-own` e `tickets:create`; ações de Usuários pela própria permissão | DIV-10 resolvido; DIV-9 em parte |
| T-517 | Só a flag `volumeResolved`, "até a conferência do A-28" | N-2 resolvido; C-33 |
| T-518 | `TicketHistoryAction` com 12 e 13; sem `responsibleId` | Itens de 31/10 resolvidos |
| T-519 | Edição de departamento com o responsável da listagem | Item de 31/10 resolvido |
| T-514 | Specs dos 9 Data Services | DOC-18 (as skills não os preveem) |

**Destino dos documentos.** Ficam como estão as decisões de 04/11: este documento em `docs/audit/` e os
originais até o back trocar as referências (DOC-28; decisão 19). `PRODUCT.md`, `README.md`, `DESIGN.md`
e `CLAUDE.md` ficam na raiz e são corrigidos na E-06; as skills, na E-07; o `.impeccable/design.json`
fica mantido, sem regenerar (decisão 14).

**Achados novos com ID final (DOC-11 a DOC-43):**

| ID | Grav. | Prio. | Achado | Evidência | Classe | Origem | Estado | Etapa |
|---|---|---|---|---|---|---|---|---|
| DOC-11 | Baixa | Média | O `CLAUDE.md:31` cita `src/app/shared/guards/admin-master.guard.ts`, renomeado para `permission.guard.ts` no PR #5; é a segunda vez que um caminho de exemplo quebra | `git show --stat 4b7b0de`; arquivo ausente em `333f4c2`; `CLAUDE.md.outra-sessao:31` | COMPROVADO | T-DOC-1; T-FEA-10 (CLAUDE.md:31) | Aberto na `main`: o `CLAUDE.md:31` do `387f5e6` ainda cita o `admin-master.guard.ts`. Corrigido só na edição não commitada da outra sessão (cópia de 19:08 de 05/11), que até 06/11 não tinha commitado | E-06, se a edição dela não entrar |
| DOC-12 | Baixa | Alta | O `PRODUCT.md:43-45` descreve uma estrutura inicial (5 departamentos, "Helpdesk"…) que não existe desde o `3387ff9` (04/10): o seed tem 7 departamentos e 21 setores. O relatório de 31/10 a deu como correta | back `DefaultOrganizationSeeder.cs:17-57` (igual em `ef1c981`) | COMPROVADO | T-DOC-2; 31/10 §2.4 (seed dado como correto; errata 21) | Aberto | E-06 |
| DOC-13 | Baixa | Média | "RN-35" citado sem o documento: no `SYSTEM_SPECIFICATION.md:228` são os números da empresa para todo papel; no `SPEC-TICKEST.md:356`, o responsável ativo do departamento (colisão do BK-1). Veio no PR #5 | `DESIGN.md:583`; `ticket-summary.store.ts:67`; `ticket.data.service.ts:213`; `git log -S'RN-35'` só no `4b7b0de` | COMPROVADO | T-DOC-3 | Aberto | E-06 |
| DOC-14 | Baixa | Média | O `DESIGN.md` ainda descreve o "Em breve" que não existe mais: o "Don't" abre exceção para a prévia do Monitorar, removida no PR #5 (`:920-921`); o exemplo de dica "Em breve" (`:260`) e o "Disponível em breve" de flag desligada (`:743-745`) também | `git show 4b7b0de -- …/ticket-monitor.component.html` (−8 linhas); "Em breve" em produção: 0 | COMPROVADO | T-DOC-4; T-ETP-13 ("Disponível em breve", parte); 31/10 §2.3 D18 | Aberto | E-06 |
| DOC-15 | Baixa | Baixa | Padrões globais novos sem registro no `DESIGN.md`: `.tap-target` (24px com qualquer ponteiro, 44px no toque), o alvo de toque do `.dropdown-item` e do `.btn-close`, o diálogo em tela baixa (R-05), `.num`, `.text-wrap-anywhere` e a reserva `--tk-surface` do `.item-new` | `src/styles.css:312-326,1302-1310,1336-1344,1348-1382`; nenhum commit da E-00, da E-01 ou da E-12 tocou o `DESIGN.md` | COMPROVADO | T-DOC-5; T-ETP-13 | Aberto | E-06 |
| DOC-16 | Baixa | Alta | O modelo de tela da `add-feature` lê um `input.required` no construtor: o Angular lança NG0950, porque os inputs chegam depois da construção. Quem seguir a skill gera uma tela que quebra | `.claude/skills/add-feature/references/routed-component.md:22-26`; `@angular/core/fesm2022/core.mjs:29-37` | COMPROVADO | T-DOC-6 | Aberto | E-07 |
| DOC-17 | Baixa | Média | Modelos das skills com erros: o `FlightEditStore` usa `of(undefined)` sem importar `of`; os modelos usam `standalone: true` e `CommonModule`, que o código não usa; os da `add-feature` não têm o `/** */` que o `CLAUDE.md` exige | `store-method.md:83-101`; `add-context/references/routed-component.md:16-21`; `add-feature/references/routed-component.md:13-18,73-88` | COMPROVADO | T-DOC-7 | Aberto | E-07 |
| DOC-18 | Baixa | Média | As skills só preveem testes de Store e de componente; o código tem testes de Data Service com `HttpTestingController` nos 9 Data Services (T-514 do PR #5), e o padrão real de espera é o `whenStable` | `add-tests/SKILL.md:9-11`; `ca-review/SKILL.md:83-88`; 9 `*.data.service.spec.ts` | COMPROVADO | T-DOC-8; 31/10 §2.2 P16 (correção: whenStable) | Aberto | E-07 |
| DOC-19 | Baixa | Baixa | O README das skills justifica não migrar para Nx com o "SSR server", removido na E-12, e fala de "this project's `@nx/angular`" num projeto que nunca teve Nx; a hipótese de 31/10 de texto herdado não se sustenta | `.claude/skills/README.md:29-31`; `06f537b`; commits de 23/07 no próprio front | COMPROVADO | T-DOC-9; T-FEA-10 (README das skills, :30-31); 31/10 §2.2 P18 (resíduo) | Aberto | E-07 |
| DOC-20 | Baixa | Alta | A Parte I do `333f4c2` dizia em 17 lugares que a E-01 e a E-12 estavam "sem merge", "aguardando o merge" ou "em branches locais", e citava linhas que mudaram (A-28, R-05, R-06, R-07, C-07, C-09 e N-4). O documento estava no próprio commit mesclado e não podia registrar o merge | `AUDITORIA-333f4c2.md:11,73,95,311,313,315,320,324,326,349,359,361,363,364,427,583,671`; reflogs da `main` (16:58:43) e da `origin/main` (16:58:53) | COMPROVADO | T-DOC-10; T-ETP-17 | Corrigido (`455230a`, E-16a) | E-16a |
| DOC-21 | Baixa | Média | O §10 dizia "9.5 / lint: NOT APPLICABLE; Igual: sem ESLint", contra o §3 e o DOC-8 | `AUDITORIA-333f4c2.md:546` × `:175-177,427`; `package.json:11`; `angular.json:103-111` | COMPROVADO | T-DOC-11 | Corrigido (`0e7cc4e`, E-16b) | E-16b |
| DOC-22 | Baixa | Alta | O §1 e o §8.1 davam DIV-1, DIV-4, DIV-9 e DIV-10 como abertos, mas o PR #5 mudou o front nos quatro | `AUDITORIA-333f4c2.md:100-101,383,386,391,392`; conferência das tarefas da FE-0 (docs.md §9.2) | COMPROVADO | T-DOC-12; specs-046-048 §2.2 (nota sobre o §8.1) | Corrigido (`455230a` e `0e7cc4e`, E-16): DIV-1 e DIV-4 com o texto da outra sessão, na E-16a; DIV-9 e DIV-10 na E-16b | E-16b |
| DOC-23 | Baixa | Média | A spec 049 aparecia como "não versionada" e "Aprovada… ainda sem commit"; no `251da97` ela está versionada (`bcf0356`, PR #71) e "Em implementação", e as linhas do anexo A da 049 citadas no §12 (834, 869) são hoje 1022 e 1057 | `AUDITORIA-333f4c2.md:27,439,453-456,600,622`; `git log 251da97 -- specs/049-…/spec.md` | COMPROVADO | T-DOC-13 | Corrigido (`0e7cc4e`, E-16b) | E-16b |
| DOC-24 | Baixa | Baixa | O "Como ler" listava o `server.ts` entre os caminhos da raiz (saiu na E-12), e o §0 e o §14 apontavam o worktree `wt-e01`, removido em 05/11 | árvore do `333f4c2`; `ls` do scratchpad | COMPROVADO | T-DOC-16 | Corrigido (`455230a`, E-16a: o `wt-e01`; `0e7cc4e`, E-16b: o `server.ts`) | E-16a; E-16b |
| DOC-25 | Baixa | Alta | Há edição não commitada no `CLAUDE.md` e neste documento, no working tree principal, numa branch (`4b7b0de`) anterior à `main`; qualquer correção destes documentos tem de ser conciliada com ela | `git status` do início da sessão; merge de três vias em cópia (17:10 e 19:08), com 3 conflitos neste documento e nenhum no `CLAUDE.md` | COMPROVADO (base e conflitos, em cópia); conteúdo pela cópia de 19:08 | T-DOC-17 | Em andamento: os 3 conflitos foram resolvidos no `455230a` (E-16a), que já traz o texto dela. Até 06/11, a outra sessão não tinha commitado, e a `main` mudou este documento de novo no `0e7cc4e` e neste registro | E-06 (antes do `CLAUDE.md`) |
| DOC-26 | Baixa | Baixa | O limiar de 75% é atribuído ao `TicketSlaFilters`, mas está no `TicketSlaPlan`; o `PRODUCT.md` lista 6 estados do SLA e o back tem 7 (falta `NotApplicable`) | `DESIGN.md:238`; `PRODUCT.md:61-62`; back `TicketSlaPlan.cs:19-20`, `SlaObjectiveState.cs` | COMPROVADO | T-DOC-18; 31/10 §2.3 D10 | Aberto | E-06 |
| DOC-27 | Baixa | Baixa | Com o ESLint no projeto, o `.vscode/` não recomenda a extensão do ESLint nem tem tarefa de lint | `.vscode/extensions.json`; `.vscode/tasks.json` (sem mudança desde `669e8ec`) | COMPROVADO | T-DOC-19 | Aberto | E-20 |
| DOC-28 | Baixa | Média | A exclusão dos originais depende das 046, 047, 048 e 049 (agora versionada, então a troca exige commit no back); a 044 não cita os originais (cita o `BACKEND_RECONSTRUCTION.md`, já removido) | `046/spec.md:101`; `047/spec.md:98`; `048/spec.md:90`; `049/anexo-a-achados.md:1022,1057`; `anexo-b-inventario.md:420,542`; `anexo-c-analise-por-area.md:1564`; `044/spec.md:16,141` | COMPROVADO | T-DOC-20; 31/10 §2.8 (links das 046 a 048) | Aberto | E-09 |
| DOC-29 | Baixa | Média | Além do DOC-7, o `CLAUDE.md` não diz que `shared/` hospeda as telas de autenticação e sessão nem que um domínio pode ter `ui/`, e não tem os comandos (`npm start`, `npm test`, `npm run build`, `npm run lint`), o mapa de documentos, a D-SF5 nem as regras de trabalho front/back | `CLAUDE.md:19-23`; pastas de `src/app`; `package.json:5-11`; D-SF5 só no §9 deste documento | COMPROVADO | T-DOC-21; 31/10 §2.7 | Aberto | E-06 |
| DOC-30 | Baixa | Média | Supervisor e RH aparecem no `PRODUCT.md` como "direção de produto confirmada", sem registro no back; o único ponteiro é o link morto do DOC-3 | `PRODUCT.md:18-26`; 0 ocorrência de "supervisor" e "onboarding" no `SPEC-TICKEST.md` e no `SYSTEM_SPECIFICATION.md` | COMPROVADO (ausência no back); INFERIDO (origem) | T-DOC-22 | Aberto (decisão de produto) | E-06 |
| DOC-31 | Baixa | Média | As 18 duplicações (D1 a D18) do relatório de 31/10 não tinham registro, e o nome colidia com as divergências D-1 a D-10 (DIV-n) | `relatorio-3110.md:121-142` × `:562-602`; busca por "D1" na Parte I do `333f4c2`: 0 | COMPROVADO | T-DOC-23 | Corrigido (`0e7cc4e`, E-16b): as D1 a D18 foram mapeadas para IDs DOC (§16.2) | E-16b |
| DOC-32 | Baixa | Baixa | A DEC-4 da 046, que liga o A-27 à forma de implantação, não estava na Parte I | `back-wt-specs/046-…/spec.md:61`; "DEC-4" na Parte I do `333f4c2`: 0 | COMPROVADO | T-DOC-24; 31/10 §2.8 (A-27 como dependência da DEC-4) | Corrigido (`0e7cc4e`, E-16b; §6, item 5; §16.6) | E-16b |
| DOC-33 | Baixa | Baixa | Os originais `FRONTEND_AUDIT.md` e `FINAL_ACCEPTANCE_AUDIT.md` não avisam que foram substituídos: quem chega pelos links do back cai em texto vencido (ex.: `FA:476`, motivo da reabertura 500) | leitura dos dois originais em `333f4c2` | COMPROVADO | T-DOC-25 | Aberto: não editar (os anexos têm de seguir idênticos); resolve com a troca dos links no back e a exclusão (§6, item 20) | E-09; E-05 |
| DOC-34 | Baixa | — | O `PRODUCT.md` define a primeira resposta como a "de quem não é o solicitante"; o back exige também que o autor atenda chamados | `PRODUCT.md:66-67`; back `TicketSlaTimer.cs:105-111` (`authorIsAgent`), `PostTicketMessageCommandHandler.cs:45` | COMPROVADO | 31/10 §2.2 P5; 31/10 §2.3 D11 | Aberto | E-06 |
| DOC-35 | Baixa | — | O `PRODUCT.md` usa "Meus Tickets", "Todos os Tickets" e "Monitorar Tickets", contra a regra do `DESIGN.md` ("Chamado", nunca "ticket") | `PRODUCT.md:20` × `DESIGN.md:872-873` | COMPROVADO | 31/10 §2.2 P6; 31/10 §2.3 D6 | Aberto | E-06 |
| DOC-36 | Baixa | — | O `PRODUCT.md` fala em "RBAC dinâmico", mas as funções são fixas, criadas pela migration, e a do Administrador não aceita edição | `PRODUCT.md:53-54,87-88`; back `RoleNames.cs:3-5`, `AssignRolePermissionsCommandHandler.cs:29-31` | COMPROVADO | 31/10 §2.2 P7; 31/10 §2.3 D12 | Aberto | E-06 |
| DOC-37 | Baixa | — | O `PRODUCT.md` diz que o Administrador "não abre nem atende chamados"; o Administrador recebe o catálogo inteiro de permissões, inclusive `tickets:create` e `tickets:manage` | `PRODUCT.md:16-17`; back `RolePermissionConfiguration.cs:39` (`PermissionCatalog.All`) | COMPROVADO (era hipótese em 31/10) | 31/10 §2.2 P9 | Aberto | E-06 |
| DOC-38 | Baixa | — | O `README.md` não cita o back em `localhost:5000` nem o `npm run lint`, e sugere `ng generate … module` num app sem nenhum `@NgModule` | `README.md:11`; `environment.ts:3`; `package.json:11`; 0 `@NgModule` em `src/` | COMPROVADO | 31/10 §2.2 P10 (sem a versão); 31/10 §2.2 P11 (sem o ng e2e) | Aberto | E-06 |
| DOC-39 | Baixa | — | A tabela da `ca-review` põe `core/` no shell, mas não classifica `dashboard/` (34 arquivos); a `add-context` manda o painel para `src/app/core/` | `ca-review/SKILL.md:27`; `add-context/SKILL.md:88-90` | COMPROVADO | 31/10 §2.2 P13 (parte da ca-review); 31/10 §2.3 D1 | Aberto | E-07 |
| DOC-40 | Baixa | — | Temas repetidos em mais de um documento, hoje sem divergência: sem Repository nem `Result<T>` (D2; a exceção do C-01 segue fora das skills), Karma e Jasmine (D4), propósito do produto (D5), ciclo do chamado (D9), convite e ativação (D13) e cor de status (D16); sem fonte única, podem divergir | docs.md §3.3 e §4 | COMPROVADO | 31/10 §2.3 D2, D4, D5, D9, D13 e D16 | Aberto (risco futuro) | E-06 |
| DOC-41 | Baixa | — | O `DESIGN.md` reescreve regras do back sem apontar a fonte (lista de usuários sem filtro de pendentes, sem a 037; responsáveis elegíveis, sem a 030; catálogo fixo de funções; desativação; limite de reenvios) e aponta a spec 044, que não é versionada | `DESIGN.md:560,777-778,813-814,851-853,861-862`; `DESIGN.md:384` | COMPROVADO | 31/10 §2.4 (referência frágil à 044); 31/10 §2.6 (regra só como link, não adotada) | Aberto | E-06 |
| DOC-42 | Baixa | — | O C-09 (`6df64e1`, `refactor`) trouxe regra nova sem registro: a recusa local por quantidade e soma "sai do detalhe", mas o detalhe só conferia tamanho e tipo; o A-25 seguia "texto a reavaliar" | diff de `6df64e1` em `ticket-detail.component.ts`; `ticket-attachments.store.ts:25-31` | COMPROVADO | T-ETP-8; 31/10 §7 (C-09, limites novos) | Corrigido (`0e7cc4e`, E-16b; §4, A-25) | E-16b |
| DOC-43 | Baixa | — | As skills não têm modelo para o "carregar mais" por cursor, para a contagem antes do diálogo de confirmação nem para enums e rótulos em `entities` | `ticket-attachments.store.ts:109`; `users.store.ts:122,140`; `fe-arch-tmp/entities-atual.txt` | COMPROVADO | 31/10 §3.3 (sem modelo na skill) | Aberto | E-07 |

#### 16.3 Arquitetura e limpeza, front e back

**Front.** Fronteiras com 0 violação; nenhum barrel exporta componente ou rota. As peças são as mesmas de
31/10 (12 features, 18 Stores, 9 Data Services, 58 componentes, 38 entities e 5 barrels); as specs
passaram de 95 a 102. A meta de 90% é atingida no agregado e não na média simples estrita (88,0%); ficam
abaixo de 90% no estrito as categorias Signal Store, camadas e convenções. Dos 55 itens de 31/10 no
escopo, 8 foram resolvidos, 6 mudaram em parte e 41 continuam. Em 05/11, a E-03 não tinha sido executada:
tinham saído só o `@angular/animations` (L-3) e a leitura do detalhe do departamento (PR #5); ela foi
feita em 06/11 (§16.7). `eslint src` sem nenhum
problema; o `tsc` com `--noUnusedLocals` e `--noUnusedParameters` acusa só um falso positivo
(`revealNewItem`, um `effect()` guardado em campo) e 4 parâmetros sem uso numa spec (C-32).

- **Resolvidos desde 31/10:** a leitura do detalhe do departamento (PR #5, T-519); o
  `@angular/animations` (L-3); o `@ngrx/signals` estável (E-12); o SSR e o que vinha com ele (E-12); o
  `extendedDiagnostics` duplicado (L-6); os 16 arquivos novos dependentes (E-00).
- **Particularidades que continuam mantidas, sem pendência:** a `LoginStore` no login e no primeiro
  acesso; o barrel de `shared` com serviços e utilitários; `environments` em dois arquivos de `shared`
  e nos Data Services; o `Router` nas Stores de sessão; duas Stores providas por tela; a recarga manual
  ao entrar em 7 telas.
- **Conformidade por categoria (estrita, 31/10 → 05/11):** fronteiras 95,9% → 95,9%; Signal Store
  88,1% → 88,7%; camadas 88,1% → 88,1%; transversais 100%; testes 100%; convenções do `CLAUDE.md` e do
  README 86,6% → 87,1%.
- **Em 06/11, no `387f5e6`** (medição do coordenador, pelo mesmo método, só na estrita): média simples de
  90,4% (88,0% em 05/11) e agregado de 93,0%, 1153 de 1240 (92,0% em 05/11). Com a E-03, a meta de 90%
  foi atingida também na média simples.

**Achados novos com ID final (A-47, A-48, A-56 e C-13 a C-32):**

| ID | Grav. | Achado | Evidência | Classe | Origem | Estado | Etapa |
|---|---|---|---|---|---|---|---|
| A-47 | Média | `/tickets/novo` usa a `TicketsStore` da lista: dispara `GET /tickets/mine` assim que a Store nasce (403 e releitura de `/users/me` para quem só tem `tickets:create`), mostra como erro de envio uma falha de leitura ou um erro antigo e, depois de criar, vai a `/tickets` sem conferir `tickets:view-own` | `tickets/feature-ticket-create/ticket-create.component.ts:24,90-93`; `.html:94-95`; `tickets/application/tickets.store.ts:35-45,97-106`; back `GetOwn.cs:28` | COMPROVADO (código); INFERIDO (o 403 em execução) | T-SEP-5; 31/10 §3.3 R4; 31/10 §1 item 9 | Corrigido (`febabae`, E-03); "Cancelar" e o caminho de navegação ficaram de fora (A-62) | E-03 |
| A-48 | Média | Anexos: reabrir o mesmo chamado ou clicar em "Tentar novamente" não recarrega a lista, porque `loadForTicket` com o mesmo id só faz `patchState` e os parâmetros do `rxResource` não mudam (mensagens e histórico recarregam) | `tickets/application/ticket-attachments.store.ts:104-106`; `ticket-detail.component.html:252`; × `ticket-messages.store.ts:76-81`, `ticket-history.store.ts:69-74` | COMPROVADO (código); a recarga em execução não foi observada | 31/10 §3.5 (Médio); 31/10 §1 item 10 | Corrigido (`30edf02`, E-03) | E-03 |
| A-56 | Média (31/10) | O front não tem Content Security Policy: o `index.html` não declara nenhuma e não há implantação que a envie por cabeçalho (A-27). Junto do A-23, é defesa em profundidade; hoje não há ponto de injeção de HTML no código de produção | `src/index.html:1-16` (busca por `Content-Security-Policy` em `src/`: 0); pendência 29 (Bootstrap no jsDelivr) | COMPROVADO (sem CSP no `index.html` de `333f4c2`); cabeçalho de implantação NÃO VERIFICADO (não há implantação) | 31/10 §1 item 17; 31/10 §9 (E-12, CSP) | Aberto | E-25 |
| C-13 | Baixa | Erro de leitura e erro de mutação no mesmo sinal em 3 Stores (`TicketsStore`, `TicketAttachmentsStore`, `UsersStore`); na de anexos, a falha do "carregar mais" vai para `mutationError` | `tickets.store.ts:97-106`; `ticket-attachments.store.ts:77-87,126`; `users.store.ts:82-90` | COMPROVADO | 31/10 §3.3 R18 | Corrigido (`70bed3f`, E-03); nas Stores de mensagens e de histórico, o `loadMoreError` segue sem limpar ao trocar de chamado (A-63) | E-03 |
| C-14 | Baixa | A busca de candidato a responsável tem 4 implementações sem `rxResource`: nas 3 Stores de chamados, loading e erro à mão e sem cancelar a busca anterior (uma resposta fora de ordem pode aparecer); na `DepartmentsStore`, `Subject` + `switchMap` com o estado à mão | `ticket-detail.store.ts:141-159`; `ticket-monitor.store.ts:275-293`; `ticket-summary.store.ts:198-216`; `departments/application/departments.store.ts:32-42,119-133,228-246` | COMPROVADO (código); a resposta fora de ordem é INFERIDA | 31/10 §3.3 R5 (busca); 31/10 §3.5 (resposta fora de ordem); T-FEA-3 | Corrigido (`1f0e572`, E-03) | E-03 |
| C-15 | Baixa | `InjectionToken` das flags e mapas `*_BADGE_CLASS` (classes CSS) dentro de `entities` | `shared/entities/dashboard-features.ts:14`; `tickets/entities/ticket-priority.ts:18`, `ticket-sla-status.ts:25`, `ticket-sla.ts:36`, `ticket-status.ts:20` | COMPROVADO | 31/10 §3.3 R7 | Corrigido (`387f5e6`, E-03: os mapas de badge; o token das flags saiu no `5b67103`, E-17) | E-03 |
| C-16 | Baixa | Declarações sem o `/** */` em português que o `CLAUDE.md` exige: 258 em 53 arquivos (o mesmo script dá 264 na base de 31/10); os maiores são `ticket-detail.component.ts` (24) e `ticket-monitor.component.ts` (23) | `reaudit/out/fe-arch-tmp/doc-comments-atual.txt`; `doc-comments-base-9d7e238.txt` | COMPROVADO (script calibrado na base de 31/10) | 31/10 §3.3 R13; 31/10 §9 (E-08) | Aberto (decisão: completar ou alinhar o `CLAUDE.md`) | E-08 |
| C-17 | Baixa | Código morto que 31/10 apontou e continua: `slaRefreshing`, `clearPostError()`, `isFiltered` e `permissionsLoadError`; três campos `data` nunca lidos; `TicketSlaStatus` exposto ao template sem uso; o comentário obsoleto da diretiva de dropdown; 25 exports usados só no próprio arquivo (e 22 só em specs) | `ticket-detail.store.ts:35`; `ticket-messages.store.ts:178`; `tickets.store.ts:76,100`; `roles.store.ts:22,41,52,54,92`; `ticket-monitor.component.ts:333`; `dropdown-fixed-position.directive.ts:3,11-12`; `fe-arch-tmp/dead-exports.txt` | COMPROVADO | 31/10 §3.4 (código morto, campos data, TicketSlaStatus, comentário do dropdown, 42 símbolos); 31/10 §3.3 R5 (permissionsLoadError) | Corrigido (`463d123`, E-03); a lista de exports foi revista, e nenhum estava sem uso | E-03 |
| C-18 | Baixa | Duplicações de Store de 31/10: o "carregar mais" por cursor (3 Stores e 2 Data Services), o mapa de erros de atribuição (3) e os 6 `computed` de paginação (3) | `ticket-attachments.store.ts:109`, `ticket-history.store.ts:83`, `ticket-messages.store.ts:85`; `ticket-monitor.store.ts:301` ≡ `ticket-summary.store.ts:232`; `tickets.store.ts:108-121`, `ticket-monitor.store.ts:123-136`, `users.store.ts:98-109` | COMPROVADO | 31/10 §3.4 (duplicações de Store) | Aberto | E-19 |
| C-19 | Baixa | Duplicações de formulário de 31/10: `isFieldInvalid` em 9 métodos de 7 arquivos, a regra de senha em 3 telas e a regra da descrição em 2 | `department-list.component.ts:193,199`; `activate-account.component.ts:45,64`; `first-access.component.ts:24,29`; `profile-edit.component.ts:34,74,80`; `ticket-create.component.ts:36,69`; `ticket-edit-dialog.component.ts:47,59`; `user-list.component.ts:239` | COMPROVADO | 31/10 §3.4 (isFieldInvalid, senha, descrição) | Aberto | E-19 |
| C-20 | Baixa | Desvios menores de convenção de 31/10: o painel apresentacional do Monitor injeta a Store que o pai já injeta (R19); quatro Stores com nome de entidade (R24); um `== null` (R27); o logout engole o erro, agora com comentário que diz que é de propósito (R17); o título fixo "TickestPristine" do CLI | `ticket-monitor-info-panel.component.ts:52`; `tickets.store.ts:15`, `departments.store.ts:18`, `roles.store.ts:16`, `users.store.ts:18`; `ticket-list-due.ts:76`; `login.store.ts:156-162`; `src/index.html:5` | COMPROVADO | 31/10 §3.3 R17, R19, R24 e R27; 31/10 §3.4 (título do CLI) | Aberto | E-19 |
| C-21 | Baixa | Ciclo de vida e DOM: `valueChanges` sem `takeUntilDestroyed` na criação; o `Dropdown` do Bootstrap nunca é descartado; o download cria e clica um `<a>` dentro da Store e revoga a URL logo depois do clique | `ticket-create.component.ts:58`; `dropdown-fixed-position.directive.ts:20-26`; `ticket-attachments.store.ts:163-168` | COMPROVADO | 31/10 §3.5 (valueChanges, Dropdown, revokeObjectURL) | Corrigido (`92e995d`, E-03) | E-03 |
| C-22 | Baixa (31/10: Médio) | Componentes grandes: `user-list` com 868 linhas (eram 853), `dashboard` 771 (795), `ticket-monitor` 611 (619), `ticket-detail` 577 (577) e `department-list` 482 (551) | `.ts` dos cinco componentes em `333f4c2` × `9d7e238` (fe-arch §3.3) | COMPROVADO (`wc -l`) | 31/10 §3.5 (tamanho dos componentes) | Aberto (opcional) | E-19 |
| C-23 | Baixa | Lacunas de teste direto: 4 métodos de Store sem chamada na própria spec (`reloadTrend`, `hydrateFiltersFromUrl`, `resetAssignment`, `loadForCurrentUser`); 9 utilitários (entre eles o `extractErrorMessage`), o helper `ticket-assignee-search.ts`, o `AuthLayoutComponent` e a `DropdownFixedPositionDirective` sem spec própria, além dos 4 do N-5 | `ticket-dashboard.store.ts:252`; `ticket-monitor.store.ts:237`; `ticket-summary.store.ts:219`; `tickets.store.ts:154`; `fe-arch-tmp/tests-report.txt` | COMPROVADO | 31/10 §3.5 (4 métodos sem teste); T-FEA-12 | Aberto; desde 06/11, a `DropdownFixedPositionDirective` (`92e995d`) e o aviso de nova tentativa do N-5 (`413a447`) têm spec própria | E-20 |
| C-24 | Baixa | O recorte do Início vira filtros da API em dois lugares, com igualdades diferentes (campo a campo × `JSON.stringify`); nada garante que os Alertas usem o mesmo recorte do agregado, como o comentário pede | `ticket-dashboard.store.ts:43-46,83-92` × `ticket-summary.store.ts:20-32,262` | COMPROVADO (duplicação); risco de divergir INFERIDO | T-FEA-1 | Corrigido (`90b3cbd`, E-17) | E-17 |
| C-25 | Baixa | A sincronização dos filtros com a URL está copiada entre Monitor e Usuários (os dois `effect`, `filtersToQueryParams` e `matchesCurrentUrl`); Meus Chamados tem a sua variante; `debounceTime(300)` em 5 buscas | `ticket-monitor.component.ts:314-330,484,504` × `user-list.component.ts:283-298,402,413`; `ticket-list.component.ts:178` | COMPROVADO | T-FEA-2 | Aberto | E-19 |
| C-26 | Baixa | Regras de permissão e de cancelamento ficam em `tickets/ui/`, que não entra no barrel: a constante `TICKETS_MANAGE_PERMISSION` não pode ser importada fora dela, e o literal `'tickets:manage'` aparece 17 vezes em 10 arquivos | `tickets/ui/ticket-action-permissions.ts:1-38`; `tickets/ui/ticket-cancel-window.ts`; `fe-arch-tmp/dup-report.txt`, seção 1 | COMPROVADO (local e imports); causa do literal repetido INFERIDA | T-FEA-4; 31/10 §3.4 (literal 'tickets:manage') | Aberto | E-19 |
| C-27 | Baixa | As mensagens de erro da leitura do chamado (403 e 404) estão copiadas entre a Store do detalhe e a do painel rápido do Monitor | `ticket-detail.store.ts:56-67` ≡ `ticket-quick-info.store.ts:35-44` | COMPROVADO | T-FEA-5 | Aberto | E-19 |
| C-28 | Baixa | Sem formatação de data comum: `'dd/MM/yyyy HH:mm'` em 22 linhas de 7 templates; `'HH:mm'` no `DatePipe` e em dois `Intl.DateTimeFormat` iguais no Início; formatadores próprios em Meus Chamados | `dashboard/dashboard-overview.ts:138`; `dashboard.component.ts:550`; `ticket-monitor.component.html:204`; `ticket-list.component.ts:27,30` | COMPROVADO | T-FEA-6 | Aberto | E-19 |
| C-29 | Baixa | CSS repetido entre componentes e com o `styles.css`: `.department-load-error` ≡ `.role-notice`; `.info-list-title` ≡ `.info-list dt`; o mesmo contorno de foco em 3 seletores (a cor é o R-09); 4 regras do global repetidas no `auth-form.css`; o `.min-w-0` inline do diálogo | `department-list.component.css:~96` × `role-list.component.css:~8`; `shared/ui/auth-form.css`; `dialog.component.ts:58` × `styles.css:335-337`; `fe-arch-tmp/css-overlap.txt` | COMPROVADO | T-FEA-7; T-ETP-10 (.min-w-0, parte) | Aberto | E-19 |
| C-30 | Baixa | CSS global sem uso: `.icon-tile-xl`, `.border-primary` e o ramo `.was-validated` | `src/styles.css:713-716,958-960,549-550`; 0 ocorrência em `.html`, `.ts` e `index.html` (`fe-arch-tmp/css-usage.txt`) | COMPROVADO | T-FEA-8 | Corrigido (`85836ef`, E-03) | E-03 |
| C-31 | Baixa | Restos do SSR no `SessionService`: 4 guardas `typeof window !== 'undefined'` num app só de navegador desde a E-12; o item 25 do §6 só citava a do Monitor | `shared/services/session.service.ts:63,87,97,139`; `ticket-monitor.component.ts:2,291` | COMPROVADO | T-FEA-9 | Em parte: o `SessionService` foi corrigido no `857c4d0` (E-03); a guarda do Monitor continua (pendência 25) | E-03 |
| C-32 | Baixa | Resíduos em specs: parâmetros sem uso e um spy com métodos que a Store testada não usa | `tickets.store.spec.ts:272,291`; `ticket-history.store.spec.ts:27` | COMPROVADO (`tsc --noUnusedParameters`) | T-FEA-11 | Aberto | E-20 |

**Back.** 0 violação da regra de dependência; build sem aviso; 940 testes unitários e 134 de arquitetura
passando. A conformidade foi de 79,6% para 86,8% (bruta) e de 89,8% para 97,1% (ajustada), quase toda
pela G1 da 049 e pela 045: `FallbackPolicy`, matriz de autorização por rota, regra de arquitetura que
exige proteção em todo endpoint, snapshot aprovado do OpenAPI, `<summary>` em todas as interfaces e o
único handler de evento no padrão. O bruto fica abaixo de 90% pelo legado declarado (usuários e funções
anêmicos, guards estáticos e classes estáticas de usuário); sem as cinco regras dominadas por ele, as
outras 21 dão 96,0%. Do §5 de 31/10, a maior parte continua e já tem ID na 049 (citado como `049/…`);
o que nunca teve registro virou BA-n, LAC-17 e BK-27 a BK-30. A sessão da 043 mexe agora em arquivos
de vários achados (`Ticket.cs`, consultas de usuários e de chamados, `CLAUDE.md` e a skill de
autorização): a limpeza do back vem depois do merge da parte 1 (E-22), e a decisão 12 antes da T-5 dela.

**Achados novos com ID final (LAC-17, BA-1 a BA-18 e BK-27 a BK-30):**

| ID | Grav. | Achado | Evidência | Classe | Origem | Estado | Etapa |
|---|---|---|---|---|---|---|---|
| LAC-17 | Média (31/10) | As decisões DP-11 e DP-12 do `SPEC-TICKEST.md` seguem sem spec: a DP-11 só tem a 033 em Rascunho e o OR-09 da 049; a DP-12, nada (remover o responsável não muda o status). A DP-02 está coberta pela REQ-211 da 049, delegada à G3-b (LAC-15) | back `SPEC-TICKEST.md:164,173-174,351-356`; `Ticket.cs:161-175`; `specs/049-…/spec.md:279` | COMPROVADO | 31/10 §5.5 (DP-11 e DP-12); 31/10 §1 item 15; 31/10 §9 (E-14) | Aberto | E-14 |
| BA-1 | Baixa | O `TicketSlaPlan.GetDeadlines`, que a spec 045 apresenta como a fórmula única de prazo, só é chamado por testes; a produção chama o `CalculateDeadlines` interno. Ter um ponto de entrada só e corrigir o texto da 045 | `Domain/Tickets/TicketSlaPlan.cs:27,44`; `Ticket.cs:67`; `TicketSlaCycleService.cs:47,155`; `specs/045-…/spec.md:27-28` | COMPROVADO | T-BEA-1 | Aberto | E-22 |
| BA-2 | Baixa | `BusinessCalendar.SubtractBusinessTime` não tem chamador de produção desde a spec 004; só os testes o usam | `Domain/SlaCalendars/BusinessCalendar.cs:73`; `BusinessCalendarTests.cs:61,91,108,140`; `71d52c4` | COMPROVADO | T-BEA-2 | Aberto (decidir numa spec se fica) | E-22 |
| BA-3 | Baixa | Três nomes de exibição de validação sem regra nenhuma (`Reason`, `RequesterId` e `ResponsibleUserId`); o teste só confere o sentido "propriedade validada sem nome" | `Abstractions/Behaviors/ValidationDisplayNames.cs:37,39,40` | COMPROVADO | T-BEA-3 | Aberto | E-22 |
| BA-4 | Baixa | A ordenação paginada de usuários pela data de cadastro não tem índice, contra a regra de paginação da skill | `Users/GetAll/GetUsersQueryHandler.cs:79-84`; `Infrastructure/Users/UserConfiguration.cs:27,31,34,47`; `add-feature/references/pagination.md:150` | COMPROVADO (vem de 31/10) | T-BEA-4; 31/10 §5.2 (índice de usuários) | Aberto (migration própria, com autorização) | E-22 |
| BA-5 | Baixa | Os 33 validators são `internal sealed`, e a skill manda classe pública; o desvio não está declarado no `CLAUDE.md` do back (funciona porque o registro inclui tipos internos) | `Tickets/Close/CloseTicketCommandValidator.cs:5` e os outros 32; `add-feature/references/command-slice.md:44,51`; `Application/DependencyInjection.cs:43` | COMPROVADO (vem de 31/10) | T-BEA-5; 31/10 §5.2 (validators internal) | Aberto | E-15 |
| BA-6 | Baixa | O `CLAUDE.md` do back está defasado depois da G1: diz que `ValueObject`, `ResultExtensions` e `Result.Create` "ainda não existem", e o mapa não lista as abstrações `Notifications`, `Sla` e `Telemetry` | `CLAUDE.md:102,142`; `SharedKernel/ValueObject.cs:8`; `ResultExtensions.cs:3`; `Result.cs:35-38` | COMPROVADO | T-BEA-6 | Aberto | E-15 |
| BA-7 | Baixa (prioridade de governança) | Instruções contraditórias sobre a conferência por recurso: a skill e o `CLAUDE.md` mandam o método privado `HasPermissionTo{Action}`; a DEC-30 da 041 proíbe método separado nos command handlers; a 049 recomenda o `HasPermissionTo{Action}` (DEC-9) sem citar a DEC-30; a 043 põe as conferências das queries num método privado com SQL. Nenhum handler usa o padrão da skill | `add-feature/references/authorization.md:72-104`; `CLAUDE.md:131`; `specs/041-…/spec.md:244`; `specs/049-…/spec.md:230,360,567`; `back-wt-specs/043-…/spec.md:29` | COMPROVADO (vem de 31/10, E-15) | T-BEA-7; 31/10 §5.2 (instruções contraditórias) | Aberto (decisão) | E-15 |
| BA-8 | Baixa | Comentários que citam spec: 42 arquivos de `src` e 16 de `tests`, dois acrescentados pela G1; só os de usuários têm tarefa (US-24 da 049) e não há teste de arquitetura | `IntegrationTests/Departments/DepartmentsTests.cs:514`; `Sectors/SectorsTests.cs:380` (`bcf0356`); `CLAUDE.md:177`; `specs/041-…/spec.md:250` | COMPROVADO | T-BEA-8; 31/10 §5.2 (42 arquivos citando spec) | Aberto | E-22 |
| BA-9 | Baixa | O `ResendUserInvitationCommandValidator` não tem teste de validator; os outros 32 têm | `Users/ResendInvitation/ResendUserInvitationCommandValidator.cs:9` | COMPROVADO | T-BEA-9 | Aberto | E-22 |
| BA-10 | Baixa | O `IApplicationDbContext` expõe `SlaCalendarHolidays`, que a Application não usa; só a Infrastructure lê, pelo `ApplicationDbContext` | `Abstractions/Data/IApplicationDbContext.cs:36`; `Infrastructure/SlaCalendars/SlaCalendarProvider.cs:65` | COMPROVADO | T-BEA-10 | Aberto | E-22 |
| BA-11 | Baixa | Regras sem teste de arquitetura nem plano na 049: pacote de framework proibido no Domain e no SharedKernel; código de erro no padrão; evento como `sealed record`; DTO de resposta por slice; citação de spec em comentário (BA-8) | be-arch §3.3; `ArchitectureTests/Layers/LayerTests.cs:9-167` | COMPROVADO; INFERIDO (risco futuro) | T-BEA-11; 31/10 §5.2 (regras sem teste de arquitetura) | Aberto (parte resolvida pela G1) | E-22 |
| BA-12 | Baixa | O agente `dotnet-architect` manda "construtor privado com guardas" e métodos que devolvem `Result` ou `bool`, contra as skills e o `CLAUDE.md` (um construtor privado sem parâmetros, nenhuma guarda na entidade) | `.claude/agents/dotnet-architect.md:35`; `domain-modeling/SKILL.md:39`; `ca-review/SKILL.md:29`; `CLAUDE.md:176` | COMPROVADO | T-BEA-12 | Aberto | E-15 |
| BA-13 | Média | O mesmo par `createdFrom`/`createdTo` tem duas semânticas: dia UTC em `GET users` e dia de São Paulo em `GET tickets`; quem filtra os usuários cadastrados num dia perde os das 21h à meia-noite de São Paulo e ganha os do dia anterior | `Users/GetAll/GetUsersQueryHandler.cs:17-18`; `SlaCalendars/LocalDatePeriod.cs:11-30`; `specs/025-chamados-filtro-periodo/spec.md:22` | COMPROVADO | T-BEA-13; 31/10 §5.4 (filtro de data de usuários) | Aberto (decisão) | E-23 |
| BA-14 | Baixa | A skill do back não tem modelo para o serviço em segundo plano com trava entre instâncias | `Infrastructure/Tickets/SlaMonitoring/SlaMonitorBackgroundService.cs` | COMPROVADO | 31/10 §5.2 (sem modelo na skill: serviço em segundo plano) | Aberto | E-15 |
| BA-15 | Baixa | `Ticket.Unassign` confia no handler: usa `AssignedToUserId!.Value`, e só o handler confere antes que há responsável | `Domain/Tickets/Ticket.cs:168`; `UnassignTicketCommandHandler.cs:34` | COMPROVADO | 31/10 §5.3 (Unassign confia no handler) | Aberto | E-22 |
| BA-16 | Baixa | O OpenAPI só é publicado em Development; o snapshot aprovado cobre o contrato nos testes, mas não há documento da API fora de Development | `Web.Api/Program.cs:35-38`; `IntegrationTests/Swagger/SwaggerTests.cs:12` | COMPROVADO | 31/10 §5.3 (sem OpenAPI fora de Development); 31/10 §1 item 16 | Em parte (o teste de contrato existe desde a G1) | E-25 |
| BA-17 | Média (31/10) | Os anexos ficam em disco local (`LocalFileStorage`), o que prende a API a uma instância | `Infrastructure/DependencyInjection.cs:89` | COMPROVADO | 31/10 §5.3 (anexos em disco local); 31/10 §5.6 (risco Médio) | Aberto | E-25 |
| BA-18 | Baixa | Faltam testes de envio por SMTP e de exportação de telemetria; a cobertura é coletada e publicada no CI, sem limite mínimo | `.github/workflows/build.yml:79-83`; `Evidence/Ct26/EvidenceFactAttribute.cs:17` | COMPROVADO | 31/10 §5.3 (testes que faltam) | Em parte (cache entre instâncias com evidências da 050; contrato feito) | E-22 |
| BK-27 | Alto (31/10) | As specs 014, 017 e 021 seguem só em branches não mescladas: a 014 está "Verificada" sobre uma base anterior ao domínio rico, com o PR #34; por isso a `main` não devolve chamados à fila ao desativar um usuário | `origin/feat/SPEC-014-first-access-open-tickets` (`4e055ae`); `chore/SPEC-017-activation-url-environments` (`8afa21a`) | COMPROVADO (commits fora da `main`); estado dos PRs NÃO VERIFICADO | 31/10 §5.5 (014, 017 e 021); 31/10 §1 item 8 | Aberto (decisão 21) | E-09 |
| BK-28 | — | A 036 diverge entre a cópia local ("Aprovada") e a branch `feat/SPEC-036-role-stable-identity` (`f7ebf67`); a 049 (7.15.4) manda refazê-la a partir da `main` | `back-wt-specs/036-funcoes-identidade-estavel/spec.md` | COMPROVADO | 31/10 §5.5 (cópia local × branch: 036) | Aberto (023 e 024 resolvidas) | E-09 |
| BK-29 | — | Metadados de PR das specs: a 041 "Verificada" sem `pr:` (o commit que registra o PR #57 está no #58, fora da `main`); a 041 e a 012 com tarefa desmarcada; a 049 "Em implementação" com `pr:` vazio, embora a G1 tenha saído no PR #71 (o modelo guarda um PR só) | `specs/012-…/spec.md:266`; `specs/041-…/spec.md:291`; `e47a3e9` fora da `251da97` | COMPROVADO | 31/10 §5.5 (041 e 012); be-arch §10 (049 sem pr) | Aberto | E-09 |
| BK-30 | — | O script de auditoria SDD dava 100% sem olhar arquivos não rastreados, estado de PR nem divergência entre branches | `scripts/auditoria_sdd.py` (não reexecutado) | NÃO VERIFICADO em 05/11 (a cópia não tem `.git`) | 31/10 §5.5 (auditoria SDD) | A confirmar | E-09 |

#### 16.4 Separação de responsabilidades

**E-02 de 31/10.** Dos 8 itens, o PR #5 fez 4 (DIV-1, DIV-4, DIV-10 e o enum 12 e 13 do histórico) e 1
em parte (DIV-9: sobrou o perfil deduzido no Início); faltam a DIV-2, os espaços antes de validar (A-52)
e a frase de fila (A-53). O aceite da E-02 ("nenhum botão aparece para quem o servidor recusaria") ainda
não valia: DIV-2, DIV-12, DIV-13, DIV-15 e a parte por alvo da LAC-5 mostravam ações que o servidor recusa.
Em 06/11, a E-02 corrigiu a DIV-2, o A-52, as DIV-11 a DIV-13 e a DIV-15, o A-54, o A-57, o A-58 e o
C-41, e a E-17, a frase de fila (A-53) e o resto da DIV-9. Seguem a parte por alvo da LAC-5 e, da
execução, o DIV-16 (§16.10).

**Seção 4 de 31/10.** Os 2 acertos continuam. Das 10 divergências, 4 foram resolvidas (DIV-1, DIV-4,
DIV-5 e DIV-10), 1 em parte (DIV-9) e 5 continuam (DIV-2, DIV-3, DIV-6, DIV-7 e DIV-8), todas com
decisão de 05/11 (§16.8); em 06/11, a DIV-2 e a DIV-9 foram resolvidas, e a DIV-3, mitigada no front
(§8.1). Das 31 constatações do inventário, 1 foi resolvida, 2 mudaram porque o back
entregou (a 024 e o `Retry-After`) e 28 continuam. Das 15 lacunas, a LAC-11 mudou (entregue no back),
e o estado de cada uma está no §8.2. Dos 4 ajustes de spec, o da 024 foi feito; o da regra de reabrir
piorou, porque a RN-06 e o anexo C da 049 também descrevem a regra do front (BK-6). O princípio de 31/10
continua: nada sai do front antes de o back cobrir; a ordem é spec, back e só então a remoção do espelho.

**Mapa de 05/11.** 50 regras: 23 espelhos legítimos de experiência (a), 13 divergências (b), 3 regras
só no front (c), 10 cálculos ou derivações que deveriam vir da API (d) e 1 brecha só do back (LAC-15).
Das que pedem ação, 2 são de gravidade Alta (DIV-3 e A-59, este inferido) e 5 Média (DIV-6, LAC-15,
A-30 com a LAC-2, A-53 e LAC-3). Com as funções do seed, só o DIV-3 acontece; o resto aparece com
funções personalizadas, que a tela de Funções permite criar.

| # | Regra (número do mapa) | Classe | ID | Depende de | Critério de aceite |
|---|---|---|---|---|---|
| 4 | Reabrir | (b) | DIV-2 | Decisão 1 (vale o código do back) | O dono com `tickets:manage` e sem `reopen-own` não vê "Reabrir" |
| 9 | Assumir pelo detalhe e pelos Alertas | (b), esconde | DIV-11 | — | O Atendente do seed assume pelo detalhe |
| 11 | Excluir chamado, sem tela | (b), esconde | 049/Q-65, DEC-69 | Decisão de produto na 049 | Tela ou rota obsoleta |
| 12 | `PUT` com o estado inteiro | (b), contrato | DIV-3 (LAC-1) | 049 T-501 e T-502; Q-83 | Corpo de um campo só (AC-501 a AC-503 e AC-526 da 049) |
| 31 | Perfil deduzido no Início | (b), esconde | DIV-9 | Decisão 5 (pelas permissões) | O Administrador do seed vê "Novo Chamado" |
| 33 | Criar chamado lê "meus chamados" | (b) | A-47 | — | Abrir `/tickets/novo` não chama `GET /tickets/mine` |
| 35 | Ações por usuário-alvo | (b) e (a) | LAC-5 | Q-64 da 049; spec nova | Nenhum item de menu leva a 403 |
| 37 | Espaços antes de validar | (b), borda | A-52 | — | Texto só com espaços não é enviado |
| 38 | Mínimo de 2 no nome | (b) | DIV-8 (LAC-10) | Decisão 4 (regra do back) | O back recusa nome de 1 caractere; depois o front tira o espelho |
| 42 | Contagem sem `tickets:manage` | (b) | A-54 | 034 (definitivo) | Sem a permissão, nenhum `GET /tickets` em Usuários |
| 43 | Funções no cadastro sem `users:assign-roles` | (b) | DIV-12 | 049 REQ-505 (depois) | Sem a permissão, o cadastro faz uma chamada só |
| 45 | Funções: `roles:manage` × `roles:read` | (b) | DIV-13 | — | `roles:read` abre a tela em modo leitura |
| 47 | Escalada ao editar permissões | (b) | DIV-15 | LAC-5, estendida | Nenhum "Salvar" que o back recuse por escalada |
| 8 | Assumir só sem responsável | (c) | DIV-6 (LAC-9) | Decisão 2 (exige `tickets:assign`; spec no back) | O back recusa assumir de outro sem `tickets:assign` |
| 40 | Tirar a própria função de administrador | (c) | DIV-7 (LAC-8) | Decisão 3 (regra do back) | O back recusa; depois o front tira o `removesOwnAdminAccess` |
| 50 | Responsável de departamento | (c) | DIV-14 | Decisão 6; Q-65 da 049 | O back recusa o inelegível; quem só tem `departments:manage` escolhe |
| 17 | Autor da mensagem | (d) | LAC-4 | 049 REQ-506 e T-508 | O nome vem na resposta (AC-511 da 049) |
| 20 | 1º ciclo no Monitor, nos Alertas, no agregado e no detalhe | (d) | A-30 (LAC-2) | 048 (decisão 10) | Um reaberto não aparece como "Cumprido" |
| 21 | Prazo vigente em Meus Chamados | (d), entregue | C-41 | 024, entregue | Campos obrigatórios; sem o recuo |
| 23 | Alertas: total do servidor e vencidos ao vivo | (d) | A-17 | 049 DEC-66, T-509 e T-511 | Uma listagem só, com o relógio da resposta |
| 25 | Taxa de SLA, variação e período anterior | (d) | LAC-13 | Spec nova | O Início não calcula percentual nem variação |
| 26 | Frase de "fila" | (d) | A-53 | 032, depois | Nenhuma frase de fila a partir de criados × resolvidos |
| 30 | Departamento traduzido em setores ativos | (d) | LAC-3 | 049 DEC-67 e T-510 | O front manda `departmentId` (AC-513 da 049) |
| 41 | Lote, contagem e cadastro orquestrados no front | (d) | A-59 (A-20, LAC-6, LAC-7) | 049 REQ-505, T-506 e T-507; 034 | No máximo 2 requisições para 100 selecionados, sem 429 |
| 44 | Convite pendente, expirado e revogado | (d) | spec 037 | 037, aprovada | Os estados do convite vêm da API |
| 49 | Desativar com chamados ativos | (d), dado pronto | A-58 | 022, entregue | "Desativar" avisa com o número da API |
| 13 | Responsável na abertura | só do back | LAC-15 | 049 REQ-211 e DEC-35 (G3-b) | AC-211 da 049 |

**Achados novos com ID final (A-52 a A-54, A-57 a A-59, C-40, C-41, DIV-11 a DIV-15 e LAC-16):**

| ID | Grav. | Achado | Evidência | Classe | Origem | Estado | Etapa |
|---|---|---|---|---|---|---|---|
| A-52 | Baixa | Edição e criação de chamado validam o texto antes de aparar: "abc" com 7 espaços passa no diálogo de edição (mínimo 10) e o banco recusa; a criação aceita título ou descrição só com espaços, que o validator do back recusa | `tickets/ui/ticket-edit-dialog/ticket-edit-dialog.component.ts:46-48,81`; `ticket-create.component.ts:35-36,84-89`; back `TicketConfiguration.cs:30`, `CreateTicketCommandValidator.cs:9-10` | COMPROVADO (código); a recusa do back é INFERIDA da regra | 31/10 §4.4 (E-02, espaços); 31/10 §4.3 (o); separacao §2 (criação, novo) | Corrigido (`159a9db`, E-02) | E-02 |
| A-53 | Média | A frase "Fila estável: tantos chamados resolvidos quanto abertos…" deduz a fila de criados × resolvidos; a spec 032 (Bloqueada) diz que o front não consegue reconstruir a fila | `dashboard/dashboard-overview.ts:283-285`; `back-wt-specs/032-serie-da-fila-por-periodo/spec.md:15` | COMPROVADO | 31/10 §4.3 (s); 31/10 §4.4 (E-02, frase de fila) | Corrigido (`f700aea`, E-17) | E-17 |
| A-54 | Baixa | Antes de desativar, Usuários conta os chamados de cada pessoa por `GET /tickets` (endpoint de outro domínio, com `tickets:manage`) sem conferir a permissão: sem ela, cada 403 relê `/users/me`. O comentário do Data Service justifica a chamada com um import entre `tickets` e `users` que não existe mais, e a nota de FA:496-500 não estava na Parte I | `users/infrastructure/user.data.service.ts:73-87`; `users/application/users.store.ts:122-131`; `shared/interceptors/auth.interceptor.ts:58-72`; back `Tickets/GetAll.cs:53` | COMPROVADO | 31/10 §4.3 (v); T-DOC-15; 31/10 §5.4 (contagem antes de desativar) | Corrigido (`9cf880d`, E-02) | E-02 |
| A-57 | Baixa | A conferência local de anexos ignora a lista `extensions` da política, compara o tipo por igualdade exata e confere o tamanho antes do tipo; o back normaliza o tipo e confere a extensão do nome, então um arquivo com tipo aceito e extensão recusada passa no front e cai no back | `tickets/application/ticket-attachments.store.ts:18-34`; back `TicketAttachment.cs:84-108,161`; `GetTicketAttachmentPolicyQueryHandler.cs:22-28` | COMPROVADO | 31/10 §4.3 (n) | Corrigido (`597b075`, E-02); o arquivo vazio e o nome com ".." ficaram de fora (A-60) | E-02 |
| A-58 | Baixa | `GET /departments` já traz a contagem de chamados ativos (spec 022), mas o front não tem o campo e só explica em texto a recusa de desativar departamento ou setor | `departments/entities/department.ts` (sem `activeTicketCount`); `department-list.component.ts:336,468`; back `GetDepartmentsQueryHandler.cs:15-18,33-34,43` | COMPROVADO | T-SEP-9 | Corrigido (`6a3c88e`, E-02) | E-02 |
| A-59 | Alta (INFERIDO) | Desativação em lote e contagem por pessoa orquestradas no front: com 100 selecionados (página máxima), chegam a cerca de 200 requisições em segundos, contra o limite global de 100 por minuto; o que passar leva 429 | `users/application/users.store.ts:15,364-`; `user-list.component.ts:34`; back `Api/appsettings.json:37-39` | COMPROVADO (código); INFERIDO (o 429) | 31/10 §4.3 (z); separacao §5, regra 41 | A confirmar na E-04 | E-04; E-23 |
| C-40 | Baixa | Meus Chamados faz uma requisição extra ("tem algum chamado?") embora o resumo `GET /tickets/mine/summary` já traga o total | `tickets/application/tickets.store.ts:53-62`; `my-tickets-summary.store.ts:71` | COMPROVADO | 31/10 §4.3 (w) | Corrigido (`3b2857f`, E-03) | E-03 |
| C-41 | Baixa | Recuo morto em Meus Chamados: a 024 sempre manda `currentDueAtUtc` e `currentSlaStatus` (não anuláveis), mas o front os declara opcionais ("ausente enquanto o back-end não manda") e mantém o recuo "Reaberto: prazo novo no chamado" | `tickets/entities/ticket.ts:26-29`; `ticket-list-due.ts:36-43,76-79`; back `OwnTicketResponse.cs:20-21`, `GetOwnTicketsQueryHandler.cs:77-91` | COMPROVADO | 31/10 §4.3 (j) | Corrigido (`92b9e93`, E-02) | E-02 |
| DIV-11 | Baixa | Quem tem `tickets:manage` sem `tickets:assign` (o Atendente do seed) só assume chamado no Monitor: o detalhe e os Alertas do Início não oferecem "Atribuir a mim", que o back aceita | `ticket-detail.component.ts:409-411`; `dashboard.component.html:86`; back `Assign.cs:28`, `RolePermissionConfiguration.cs:41-46` | COMPROVADO | T-SEP-2 | Corrigido (`354ffa8`, E-02) | E-02 |
| DIV-12 | Baixa | O cadastro de usuário mostra a escolha de funções a quem tem `users:create` sem conferir `users:assign-roles`: a segunda chamada recebe 403 e o aviso manda usar "Atribuir funções", que a pessoa não vê; sem `roles:read`, a lista nem carrega | `user-list.component.html:390-412`; `users.store.ts:191-200`; back `AssignRoles.cs:29`, `Roles/GetAll.cs:22` | COMPROVADO | T-SEP-3 | Corrigido (`acb3698`, E-02); a lista vazia sem `roles:read` ficou no DIV-16 | E-02 |
| DIV-13 | Baixa | Tela de Funções: a rota e o menu exigem `roles:manage`, e `GET /roles` exige `roles:read`; quem só lê não vê a tela, e quem só gerencia recebe 403 na lista | `core/routes/app.routes.ts:98-104`; `side-menu-nav.component.html:49`; back `Roles/GetAll.cs:22`, `AssignPermissions.cs:36` | COMPROVADO | T-SEP-4; 31/10 §5.4 (permissão da tela de Funções) | Corrigido (`7bb8b55`, E-02) | E-02 |
| DIV-14 | Baixa | Responsável de departamento: o front só oferece usuários ativos e busca em `GET /users` (`users:read`); o back aceita qualquer usuário existente, inclusive desativado, e não tem rota de candidatos com a permissão da tela | `departments/application/departments.store.ts:231-238`; back `CreateDepartmentCommandHandler.cs:22-31`, `UpdateDepartmentCommandHandler.cs:32-41`, `Department.cs:22-43` | COMPROVADO | T-SEP-6; 31/10 §4.3 (cc); 31/10 §5.4 (Departamentos usa GET /users) | Aberto (decisão; spec no back) | E-23 |
| DIV-15 | Baixa | O diálogo de permissões de função deixa marcar permissões administrativas que quem edita não tem; o back recusa por escalada de privilégio | `roles/feature-role-list/role-list.component.ts:148-177,184-200`; back `AssignRolePermissionsCommandHandler.cs:41-54`, `PrivilegeEscalationGuard.cs:17-32` | COMPROVADO | T-SEP-7 | Corrigido (`10fd8ec`, E-02) | E-02 |
| LAC-16 | Baixa | O `Retry-After` que a G1 passou a mandar no 429 não chega ao JavaScript entre origens: o CORS só expõe `Correlation-Id`. A T-504 e o AC-523 da 049 (o front espera o tempo do cabeçalho) não funcionariam assim; com front e API na mesma origem (DEC-4 da 046), o problema some | back `CorsExtensions.cs:39,46`, `RateLimitingExtensions.cs:60-88`; front `current-user.service.ts:11-15,49-56` | COMPROVADO (configuração); INFERIDO (o navegador esconde o cabeçalho) | T-ETP-4; T-SEP-10 | Aberto | E-21 |

#### 16.5 Etapas recentes

| Etapa | Commits | Veredito | Achados de 05/11 |
|---|---|---|---|
| A-28 | `f7cdd73`; reescrito pelo PR #5 (T-517) | OK com ressalvas | A-50, C-33, C-34 |
| A-42 (aviso) | `00b7252`; E-01 `75413f2`, `39f1982` | OK com ressalvas | LAC-16, R-08, A-51 |
| C-07 | `0573c20` | OK com ressalvas | C-35 |
| C-09 | `6df64e1`; E-01 `0ae9ee4` | OK com ressalvas | DOC-42, A-49 |
| A-33 | `0df5718`; E-01 `887fee5`, `4c5c575` | OK com ressalvas | C-36, R-09, C-37, DOC-15 |
| R-05 | `f95f587` | OK com ressalvas (validação visual nunca feita) | — |
| R-06 | `008dfcf` | OK (visual pendente na E-04) | — |
| R-07 | `be5cd6e`; E-01 `d95b336` | OK com ressalvas | R-10 |
| C-10 | `0451269` | OK com ressalvas | C-38 |
| 6.3 | `9d7e238`; E-01 `855ad11` | OK com ressalvas | C-39 |
| Registro | `333f4c2` (este documento) | — | DOC-20 |

Nenhum achado Crítico ou Alto. O plano da E-01 de 31/10 foi cumprido, menos a duplicação de Meus
Chamados (C-36). Ficaram fora da tabela de defeitos da E-01 o `role="status"` do A-42 (R-08), o chevron
do R-07 (R-10), a margem do orçamento do A-33 (C-37), o formato "should…" dos títulos (C-39) e a mudança
de comportamento do C-09 (DOC-42). As medidas de 44px da E-01 foram feitas numa página de teste só com o
Bootstrap; na aplicação, a E-04.

**Regras globais e telas atingidas** (conferido em `333f4c2`):

| Regra | Telas e elementos | Diferença para 31/10 |
|---|---|---|
| `.tap-target`, 24px com qualquer ponteiro e 44px no toque (R-07; `styles.css:312-326`) | Início ("Limpar", "Ver a fila pelo prazo", "Ver chamados" do gráfico, legenda abaixo de 1200px); Departamentos ("Definir responsável", "Remover"); Detalhe ("Atribuir/Alterar responsável", "Remover"); Meus Chamados ("Cobrar no chamado") | Igual |
| Transição de opacidade em `.table` (A-33; `styles.css:1315-1317`) | As cinco tabelas; só as três com `.is-refreshing` mudam de opacidade | Igual |
| `.table.is-refreshing` a 0,5 (A-33; `styles.css:1319-1322`) | Funções, Meus Chamados e Monitorar | + Monitorar, que tinha cópia própria |
| `.item-new` e `.item-new-row` (A-33; `styles.css:1324-1346`) | Departamentos (card e setor) e Usuários (linha) | Igual |
| `.dropdown-item` com 44px no toque (A-33, R-07; `styles.css:1354-1358`) | Menu do usuário, Usuários, Departamentos, Funções e Monitorar | + Usuários |
| `.btn-close` com 44px no toque (A-33, R-07; `styles.css:1360-1364`) | Todos os diálogos, os toasts e os alertas fecháveis de Usuários, Departamentos, Monitorar e Meus Chamados | 31/10 não citava os alertas de Usuários e de Meus Chamados |
| Diálogo em tela de até 500px de altura (R-05; `styles.css:1367-1382`) | Todos os `app-dialog` (confirmação, guia do Início, Departamentos, Funções, atribuir, editar e reabrir chamado, Usuários) | Igual |
| `.num` e `.text-wrap-anywhere` (A-33; `styles.css:1302-1310`) | `.num` em Meus Chamados; `.text-wrap-anywhere` em Departamentos | Não estavam na lista de 31/10 |

**Achados novos com ID final (A-49 a A-51, R-08 a R-10 e C-33 a C-39):**

| ID | Grav. | Achado | Evidência | Classe | Origem | Estado | Etapa |
|---|---|---|---|---|---|---|---|
| A-49 | Baixa | Um `uploadError` ou `downloadError` de um chamado aparece no próximo chamado aberto: a Store é da raiz e `loadForTicket` só limpa `mutationError` e `validationError` | `ticket-attachments.store.ts:41,104-106`; `ticket-detail.component.html:245-248`; `ticket-detail.component.ts:177` | COMPROVADO (código); efeito INFERIDO; anterior à E-00 | T-ETP-9 | Corrigido (`dbce65b`, E-03) | E-03 |
| A-50 | Média | Com `volumeResolved` ligada, o rodapé do gráfico do Início diz "Resolvidos por período e fila ao longo do tempo: disponível em breve." sempre que não há pontos (primeira carga, troca de agrupamento ou de escopo, falha), embora o back entregue `ResolvedCount` desde a 028 | `dashboard/dashboard-hero-chart.component.html:175-178`; `.ts:177-180`; `dashboard.component.ts:262-290`; back `TicketVolumeResponse.cs:12`; nota criada em `bf45bb2` | COMPROVADO (código); efeito visual INFERIDO | T-ETP-1 | Corrigido (`7af23b7`, E-17); o card "SLA cumprido" segue com o "Disponível em breve" (A-61) | E-17 |
| A-51 | Baixa | No login, as novas tentativas de `GET /users/me` (até ~15 s) acontecem sem aviso e com o botão "Entrar" reativado; um segundo clique faz outro login, e o back cria outro token de renovação sem revogar o anterior | `shared/application/login.store.ts:51-67,71-75`; `app.component.ts:20`; `current-user.service.ts:43-46`; back `UserSessions.cs:31-45` | COMPROVADO (código); efeito INFERIDO | T-ETP-6 | Corrigido (`0043cbf`, E-18) | E-18 |
| R-08 | Baixa | O aviso de nova tentativa do A-42 nasce com `role="status"` e o texto ao mesmo tempo (`@if` no shell), padrão que o próprio projeto registra como não anunciado | `shared/ui/session-retry-notice/session-retry-notice.component.ts:11-17`; `app.component.ts:20-22`; regra em `department-list.component.html:245` | COMPROVADO (padrão); anúncio NÃO VERIFICADO | T-ETP-5; 31/10 §7 (A-42, role="status") | Corrigido (`413a447`, E-18); o anúncio com leitor de tela fica para a E-04 | E-18 |
| R-09 | Baixa | O anel de foco foi unificado só em parte: sete contornos locais seguem em `outline: 2px solid var(--tk-primary)`, cor que o `styles.css` diz cair a 3,6:1 nos fundos tingidos, em vez do `--tk-focus-ring` | `user-menu.component.css:12-15`; `ticket-monitor.component.css:29-33`; `dashboard.component.css:104-107`; `department-insights.component.css:34-37`; `dashboard-hero-chart.component.css:58-62`; `dashboard-insights.component.css:73-76`; `dashboard-kpi-strip.component.ts:127-128`; `styles.css:27-28,621-627` | COMPROVADO (duplicação); contraste NÃO VERIFICADO | T-ETP-11; T-FEA-7 (contorno de foco do Monitor, parte) | Aberto | E-19 |
| R-10 | Baixa | Com o `.tap-target` em `inline-flex` para qualquer ponteiro desde o `be5cd6e`, some o espaço antes do chevron de "Ver a fila pelo prazo" (antes, só no toque) | `dashboard/dashboard-insights.component.html:51`; `src/styles.css:316-320` | COMPROVADO (código); efeito visual INFERIDO | T-ETP-14; 31/10 §7 (R-07, chevron) | Corrigido (`62f3a43`, E-17); a conferência visual fica para a E-04 | E-17 |
| C-33 | Baixa | A flag `volumeResolved` não tem critério de saída: o código a mantém "até a conferência do A-28", que a Parte I não definia nem listava; os ramos de flag desligada e os `@case ('unavailable')` do gráfico seguem no código e nos testes sem uso real | `shared/entities/dashboard-features.ts:4-7`; `environment.ts:4-9`; `environment.prod.ts:5-10`; `dashboard.component.ts:182,237,283,285,300`; `dashboard-hero-chart.component.html:40,65,136` | COMPROVADO | T-ETP-2; T-DOC-14 | Corrigido (`5b67103`, E-17); a nota do A-28 (§4) foi corrigida na E-16b. Sobraram o tipo `'unavailable'` do aviso (C-42) e o texto do `DESIGN.md` (DOC-44) | E-17 |
| C-34 | Baixa | Configurações de teste mortas e padrão invertido: a spec da `TicketSummaryStore` fornece `DASHBOARD_FEATURES`, que a Store não injeta desde o PR #5; a do detalhe mantém `ATTACHMENT_POLICY` e `policy`, que o componente não lê desde o C-09; a do Início usa `volumeResolved: false` por padrão, o contrário de produção | `ticket-summary.store.spec.ts:13,20,64,78`; `ticket-detail.component.spec.ts:27,122`; `dashboard.component.spec.ts:145` | COMPROVADO | T-ETP-3 | Em parte: a flag saiu no `5b67103` (E-17); o `ATTACHMENT_POLICY` fica para a E-20 | E-20 |
| C-35 | Baixa | Restos do C-07: linhas em branco sobrando; a spec do layout calcula o primeiro e o último com o seletor antigo; o utilitário não tem spec própria e o Tab para a frente a partir do título não é testado | `dialog.component.ts:4-5,121`; `side-panel.directive.ts:3-4`; `main-layout.component.spec.ts:188,208`; `focus-trap.directive.spec.ts:46-89` | COMPROVADO | T-ETP-7; 31/10 §7 (C-07, cosméticos) | Aberto | E-20 |
| C-36 | Baixa | Duplicações de CSS que restam depois da E-01 (a varredura ignorava `@media` e padrões equivalentes): a exceção de movimento reduzido de `.table` fora do global (e ausente em Meus Chamados); `.cancel-hint` com `tabular-nums` além de `.num`; `.due-nudge` com 44px além de `.tap-target` | `styles.css:1315-1317`; `role-list.component.css:80-85`; `ticket-monitor.component.css:81-84`; `ticket-list.component.css:164-169`; `ticket-list-due-cell.component.css:50-55` | COMPROVADO | T-ETP-10 (sem o .min-w-0, que ficou no C-29); 31/10 §7 (A-33, Meus Chamados) | Aberto | E-19 |
| C-37 | Baixa | Margem pequena no orçamento de 2 kB por componente: por estimativa, seis CSS ficam entre 1,8 e 1,98 kB minificados (`dashboard-insights` 1983, `dashboard-hero-chart` 1976, `department-list` 1923, `ticket-list` 1917, `user-list` 1891 e `main-layout` 1819 bytes) | `angular.json:46-50`; `reaudit/out/etapas-tmp/scripts/css-size.cjs` | INFERIDO (minificação aproximada, sem build) | T-ETP-12; 31/10 §7 (A-33, orçamento) | Aberto (medir antes) | E-19 |
| C-38 | Baixa | Sem `.git-blame-ignore-revs`: o `git blame` atribui ao `0451269`, só de espaços, 3.251 das 5.030 linhas dos 21 arquivos (64,6%) | `git blame -s 333f4c2` × `git blame -s -w` (3.251 × 0 linhas); `git ls-tree` sem o arquivo | COMPROVADO | T-ETP-15 | Aberto | E-20 |
| C-39 | Baixa | Resíduos de idioma nos testes: 5 de 10 mensagens `withContext` em português e 77 títulos "should…" misturados ao formato descritivo (31/10: 73); as variáveis em português são o N-4 | `ticket-detail.component.spec.ts:257,339`; `main-layout.component.spec.ts:27`; `ticket-monitor.component.spec.ts:613,981`; `etapas-tmp/scripts/test-titles.cjs` | COMPROVADO | T-ETP-16 (sem a parte das variáveis, que é o N-4); 31/10 §7 (6.3, should…) | Aberto | E-20 |

#### 16.6 Specs 046, 047 e 048

As três seguem "Em descoberta" desde 31/10, sem DEC fechada no texto, sem código no back e sem sinal de
revisão. Mudou o entorno: a 045 e a 024 entraram na `main` do back em 01/11, a G1 da 049 em 05/11, a
parte 1 da 043 começou em 05/11, e o front recebeu o PR #5 e a E-12. Das 18 recomendações de 31/10, 9
continuam valendo (3 delas reforçadas), 3 valem com ajuste, 1 foi revista (DEC-3 da 047), 2 foram
superadas por fatos, 2 não valem mais (as duas abas da 046 e a DEC-3 da 048; errata 22) e 1 seguia sem
resposta (a DEC-6 nova da 047, LAC-9). As decisões de 05/11 (§16.8) aprovaram as recomendações abaixo.

| Campo | 046 — sessão sem tokens no JavaScript (A-23) | 047 — ações permitidas na resposta (A-24) | 048 — Monitor no ciclo vigente (A-30) |
|---|---|---|---|
| Contexto | Os dois tokens ficam no `localStorage`, ao alcance de script injetado; o front é o único cliente e, desde a E-12, só navegador | A API só informa `canCancel`; o front repete as regras dos handlers para os outros botões (A-06 a A-08, A-12) | `GET tickets` devolve o prazo e a situação do 1º ciclo mesmo depois de reabrir; a 024 levou o ciclo vigente só a Meus Chamados |
| Problema | `session.service.ts:85-104`; renovação e logout com o token no corpo; logout com o access token vencido não revoga; duas abas renovando podem cair juntas (A-55) | Espelho fiel, menos reabrir (DIV-2) e assumir (DIV-6) | Um reaberto com o novo ciclo vencido não aparece em "Atrasados" e aparece como "Cumprido" no Monitor e no selo do detalhe: ponto cego da operação |
| Comportamento atual | Back: corpo com os dois tokens, renovação recusada com 400, CORS sem credenciais, limite de 10 por minuto por IP para anônimo. Front: `localStorage`, sincronização pelo evento `storage` | Back valida cada ação na execução; só `canCancel` e o prazo do dono nas respostas | Toda leitura de SLA, menos Meus Chamados e o bloco `sla` do detalhe, usa o retrato do 1º ciclo |
| Comportamento esperado | Token de renovação só em cookie `HttpOnly` e `Secure`; renovação e logout pelo cookie; credenciais só para as origens da lista; proteção contra requisição forjada | Detalhe, Meus Chamados e Monitor informam o que a pessoa pode fazer agora, pela mesma regra do servidor | Ciclo vigente em cada item de `GET tickets`, no filtro, na ordenação e nos resumos |
| Alternativas | A: cookie para a renovação e access token em memória; B: os dois em cookie; C: só endurecer | A: booleanos nomeados por ação; B: lista de textos e `nextStatuses`; C: manter o espelho e corrigir só o DIV-2 | A: ciclo vigente em toda leitura, com uma definição; B: só campos novos na lista; C: colunas desnormalizadas |
| Recomendação técnica | A, com DEC-1 (a), DEC-2 (a) com o caminho público configurável, DEC-3 com `SameSite=Strict` e cabeçalho obrigatório, DEC-4 (a), DEC-5 (a) e DEC-6 (a) obrigatória; coordenação entre abas no front | A, com DEC-1 mais `canStartProgress` e `canResolve`, DEC-2 (b), DEC-3 (b) sem `nextStatuses`, DEC-4 depois da fase 2 de chamados da 049 e DEC-5 (a) | A, com DEC-1 (a) mais a LAC-2, DEC-2 como trecho SQL nomeado com teste de concordância, DEC-3 (b) depois da parte 1 da 043 e DEC-4 (b) |
| DECs | DEC-1 a DEC-6; novas DEC-7 (limite da renovação) e DEC-8 (manter o 400); DEC-63 (b) da 049 | DEC-1 a DEC-5; DEC-6 nova (LAC-9: exige `tickets:assign`) | DEC-1 a DEC-4; DEC-66 da 049 (`serverNowUtc`) |
| Impacto no front | `session.service.ts`, `auth.data.service.ts`, `token-refresh.service.ts`, interceptor, `login.store.ts`, guards e uma etapa de inicialização; sai o `localStorage` | Entidades, detalhe, Meus Chamados, Monitor e Alertas pelas flags; saem `ticket-action-permissions.ts` e `TICKET_STATUS_TRANSITIONS` | `TicketMonitorItem`, Monitor, painel e selo do detalhe; sai o recuo de Meus Chamados (C-41) |
| Critério de aceite | `Set-Cookie` com `HttpOnly`, `Secure`, `SameSite=Strict` e o `Path` decidido; renovação recusada com o status da DEC-8; logout só com o cookie responde 204 e revoga; nenhum token no `localStorage`; F5 mantém a sessão; duas abas seguem logadas | AC-1 reescrito; AC-1b do dono sem `reopen-own`; iniciar e resolver; Monitor; AC-7 por ação; AC-517 da 049 sem os imports do espelho | AC-1 a AC-6; o agregado conta o reaberto vencido e o teste de paridade passa com um reaberto na massa; o detalhe traz o ciclo vigente; o trecho SQL concorda com o cronômetro |
| Estado | Decisões aprovadas em 05/11 (decisões 8 e 8a); texto e implementação no back dependem de autorização (E-09, E-11) | Decisões aprovadas (decisão 9); o mecanismo depende da decisão 12, aberta | Decisões aprovadas (decisão 10) |

**Ordem:** 046, depois 048, depois 047 (decisão 11). A 046 e a 048 podem correr em paralelo; a 047 vem
depois da fase 2 de chamados da 049 e mexe nas mesmas respostas da 048. A 049 punha as três no portão G6;
antecipar a 046 e a 048 muda o texto da 049, no back, com autorização (BK-17). Só no front, a
correção do DIV-2 saiu no `b9c614e` (E-02, 06/11).

**Achados novos com ID final (A-55 e BK-6 a BK-26):**

| ID | Grav. | Achado | Evidência | Classe | Origem | Estado | Etapa |
|---|---|---|---|---|---|---|---|
| A-55 | — | Duas abas que renovam a sessão ao mesmo tempo podem encerrar as duas: a que perde recebe 409 ou 400, limpa o `localStorage`, e o evento `storage` limpa a outra | back `UsersTests.cs:384-398`; front `shared/utils/http-error.util.ts:39-41`, `token-refresh.service.ts:44`, `auth.interceptor.ts:41-44`, `session.service.ts:115-121` | INFERIDO, sem reprodução no navegador | T-SPC-25 | Aberto (reproduzir antes de corrigir) | E-04; E-24 |
| BK-6 | Baixa | A regra de reabrir documentada no back é a do front: a RN-06 (que ainda cita o inexistente `TicketAccessGuard.EnsureOwnerOrManagerAsync`), a 047 e o anexo C da 049 dizem "dono com `reopen-own` ou `tickets:manage`"; o código só deixa o dono reabrir com `reopen-own`. Sem decidir antes, a correção do DIV-2 pode ir para o lado errado | back `SYSTEM_SPECIFICATION.md:199`; `047/spec.md:23`; `049/anexo-c-analise-por-area.md:1668` × `ReopenTicketCommandHandler.cs:33-41` | COMPROVADO | T-SEP-8; specs-046-048 §7.1 item 1; T-SPC-16 (a); 31/10 §4.6 (047, regra de reabrir) | Aberto (depende da decisão 1) | E-09 |
| BK-7 | — | Citações de linha desatualizadas nas specs 046, 047 e 048 (a G1, a 045 e a 024 mudaram o código), e a 046 não registra o que a G1 fez (`WithNoStore`, teto de 60 min, CORS validado) | anexo do specs-046-048 (ex.: 047 `Ticket.cs:180-187` → 438-445; 048 `Ticket.cs:145-168` → 403-426; 046 `CorsExtensions.cs:27-41` → 32-48) | COMPROVADO | specs-046-048 §7.1 item 2; T-SPC-2; T-SPC-19; separacao §3.6 (linhas); 31/10 §4.6 (linhas da 047 e da 048) | Aberto | E-09 |
| BK-8 | — | Estado do entorno desatualizado: a 046 cita o SSR e o `core/config/app.routes.server.ts`, removidos na E-12; a 047 e a 048 dão a 045 como não implementada; a 048 dá a 024 como não implementada e mantém o R-2, já resolvido | `046/spec.md:29`; `047/spec.md:34`; `048/spec.md:27-28,69` × `3305fb5` (045) e `74a8a5f` (024) | COMPROVADO | T-SPC-1; T-SPC-15; T-SPC-18 | Aberto | E-09 |
| BK-9 | — | O AC-4 da 046 e o AC-508 da 049 pedem 401 para a renovação recusada; hoje é 400, como fixam os testes, e a seção de contratos não registra a troca | `046/spec.md:49,76`; `UserErrors.cs:51-53`; `CustomResults.cs:38`; `UsersTests.cs:402-411`; `049/spec.md:472` | COMPROVADO | T-SPC-3 | Aberto (DEC-8 proposta) | E-09 |
| BK-10 | — | O R-3 da 046 está incompleto: dentro dos 30 s o back recusa o token anterior (não aceita), e com o cookie compartilhado e a renovação a cada carga a corrida entre abas fica mais provável; falta um AC para abas simultâneas | `046/spec.md:81`; `RefreshTokenCommandHandler.cs:91-99`; `UsersTests.cs:384-398` | COMPROVADO (código); INFERIDO (cenário) | T-SPC-4; 31/10 §6 (duas abas; errata 22) | Aberto | E-09 |
| BK-11 | — | A 046 não trata o `PUT users/me/password`, que a DEC-63 da 049 manda coordenar com ela | `046/spec.md:37` × `049/spec.md:522,329,1697` | COMPROVADO | T-SPC-5 | Aberto | E-09 |
| BK-12 | — | A DEC-2 (a) da 046 diz que só as rotas de sessão recebem o cookie, mas `Path=/users` alcança todas as rotas `/users/*`; atrás de proxy em `/api`, o caminho público é outro e o cookie nem chegaria às rotas de sessão | `046/spec.md:59` | INFERIDO | T-SPC-6; 31/10 §6 (DEC-2 da 046) | Aberto | E-09 |
| BK-13 | — | O AC-7 da 046 não é verificável no servidor para a opção `SameSite`: quem aplica o atributo é o navegador | `046/spec.md:52` | INFERIDO | T-SPC-7 | Aberto | E-09 |
| BK-14 | — | A renovação a cada carga passa pelo limite `Authentication` (10 por minuto), particionado por IP para requisição anônima; atrás de proxy sem `ForwardedHeaders`, todos os usuários dividem a mesma partição | `RateLimitingExtensions.cs:39-43,96-102`; `appsettings.json:41-44`; Q-53 da 049 (`049/spec.md:687`) | COMPROVADO (código); INFERIDO (efeito) | T-SPC-8 | Aberto (DEC-7 proposta) | E-09; E-25 |
| BK-15 | — | O REQ-4 e o AC-6 da 046 pedem lista explícita de origens e não dizem o que acontece com o loopback de Development, que aceita qualquer porta | `046/spec.md:40,51`; `CorsExtensions.cs:34-39`; `appsettings.Development.json:40` | COMPROVADO | T-SPC-9 | Aberto | E-09 |
| BK-16 | — | A 046 não discute a RNF-SEG-05 da fonte de requisitos (tokens fora das respostas de API); a DEC-1 (a) mantém o access token no corpo | `specs/_fontes/gestao-acessos-onboarding.md:294` × `046/spec.md:58` | INFERIDO (leitura literal da fonte) | T-SPC-10 | Aberto | E-09 |
| BK-17 | — | A posição da 046 na 049 se contradiz: "em qualquer ponto" na DEC-29 e na 7.17, e G6 "aprovada antes de implementar" na 7.15.2 | `049/spec.md:603,1535` × `:1351` | COMPROVADO | T-SPC-11 | Aberto (decisão 11) | E-09 |
| BK-18 | — | A lista da DEC-1 (a) da 047 não tem "iniciar atendimento" nem "marcar como resolvido" | `047/spec.md:59` × `ticket-status.ts:38-40`; `ticket-detail.component.ts:437,446` | COMPROVADO | T-SPC-12 | Aberto | E-09 |
| BK-19 | — | O REQ-5 da 047 é absoluto ("aceita quando executada em seguida"), mas há conferências de tempo, de alvo, de calendário, de ciclo aberto e de concorrência | `047/spec.md:43`; `AssignTicketCommandHandler.cs:53-66`; `ReopenTicketCommandHandler.cs:53-58`; `Ticket.cs:314-316,438-445` | COMPROVADO | T-SPC-13 | Aberto | E-09 |
| BK-20 | — | O AC-1 da 047 é ambíguo: "atendente com `tickets:manage`" pode ser o dono sem `reopen-own`, que não pode reabrir | `047/spec.md:48` × `ReopenTicketCommandHandler.cs:33-41` | COMPROVADO | T-SPC-14 | Aberto | E-09 |
| BK-21 | — | Duas contradições da 049 com a 047: o AC-517 inclui o Monitor, o que exige a DEC-2 (b); e o Q-62 entrega mensagens e anexos à 047, cuja DEC-5 (a) os deixa fora (a LAC-14 precisaria de spec própria) | `049/spec.md:481` × `047/spec.md:60`; `049/spec.md:696` × `047/spec.md:63` | COMPROVADO | T-SPC-16 (b) e (c) | Aberto | E-09 |
| BK-22 | — | O mecanismo da 047 diverge da 049: a 047 propõe regras estáticas sobre colunas, usadas pela consulta e pelo handler; a 049 propõe perguntas de instância (DEC-8) e métodos privados no handler (DEC-9), que a consulta não consegue usar (ver BA-7) | `047/spec.md:71` × `049/spec.md:566,567`; precedente do `CanBeCanceled` em `Ticket.cs:287` | COMPROVADO; INFERIDO na conciliação | T-SPC-17 | Aberto (decisão 12) | E-15; E-09 |
| BK-23 | — | O plano da 048 mira o EF e o `TicketSlaFilters`, que a parte 1 da 043 tira do projeto, e a DEC-3 (a) diz "antes da 043 parte 2", quando quem reescreve as consultas é a parte 1; contradiz também a DEC-18 da 049, já decidida | `048/spec.md:53,63` × `043/spec.md:25,64` (cópia); `049/spec.md:602,1250` | COMPROVADO; DECLARADO para a 043 | T-SPC-20; T-SPC-21; 31/10 §6 (DEC-3 da 048) | Aberto | E-09 |
| BK-24 | — | A 048 não menciona a DEC-66 da 049, que põe `serverNowUtc` em `GET tickets` "dentro da 048" | `049/spec.md:537,1701,476` | COMPROVADO | T-SPC-22 | Aberto | E-09 |
| BK-25 | — | A 048 atribui o índice sobre chamado, métrica e ciclo ao REQ-12 da 045; o índice é anterior (migration `20261025201353_Add_Ticket_Sla_Timers`), e o REQ-12 só trata a violação como 409 | `048/spec.md:66`; `045/spec.md:37` | COMPROVADO | T-SPC-23 | Aberto | E-09 |
| BK-26 | — | O REQ-1 da 048 manda usar "a mesma regra da 024", que a 024 escreveu à mão por ser a única consulta; com a 048 serão cinco consumidores, e o REQ-22 da 049 exige uma definição só, com teste de concordância | `048/spec.md:33`; `024/spec.md:66`; `GetOwnTicketsQueryHandler.cs:74-91`; `049/spec.md:243` | COMPROVADO | T-SPC-24; 31/10 §6 (DEC-2 da 048) | Aberto | E-09 |

#### 16.7 Plano

Proposta para Rafael Santos aprovar antes de qualquer execução. O mesmo texto está em `reaudit/entrega/PLANO-2026-11-05.md`. Base: front `333f4c2` (`main` = `origin/main`) e back `251da97`. Os IDs dos
achados estão definidos no §16.2 a §16.6; a ligação com os IDs provisórios das frentes, no `mapa-ids.md`.

Regras do plano: nenhuma etapa cria skill nova; nenhuma muda contrato ou migration sem autorização
explícita; no back, o que muda está descrito em prosa; cada etapa só começa com a autorização dela, e
Git só com autorização expressa. Esforço: P (menos de meio dia), M (até 2 dias), G (mais).

**Atualização de 05/11, depois das 22:15.** Rafael Santos aprovou as decisões da Onda 0, menos a 12, que
segue aberta com a proposta, e aprovou a E-16 (a e b), que é a decisão 18. A escolha e a origem de cada
decisão estão no `DECISOES-2026-11-05.md` (§16.8). Este plano já as
incorpora: as dependências citam a escolha feita, e a E-02 ganha a mitigação opcional do DIV-3. A
execução do que mexe no back, no `CLAUDE.md`, nas skills, em contratos ou em migrations continua
dependendo de autorização específica.

**Atualização de 06/11.** A E-16 e a E-18 entraram na `main` em 05/11, e o bloco E-02, E-17 e E-03, em
06/11 (§11). Desde 06/11, a E-19, a E-20 e a E-08 estão em andamento. Os achados da execução estão no
§16.10, cada um com a etapa sugerida; o que sobrou de uma etapa feita aparece como resto dela.

##### Mudanças em relação à estrutura do coordenador, com o motivo

1. **A frase "Fila estável" (A-53) fica só na E-17.** A estrutura a punha no resto da E-02 e na E-17. A
   tela é o Início, e a correção anda junto com o rodapé (A-50) e com a flag (C-33).
2. **A E-02 recebe as correções só de front que a estrutura não punha em nenhuma etapa:** DIV-11,
   DIV-12, DIV-13, DIV-15, A-54, A-57, A-58 e C-41 (etapa 1 do separacao.md, F-5 a F-13). São
   correções de integração que não dependem do back, que é o objetivo da E-02.
3. **O T-ETP-2 e o T-DOC-14 viraram um ID só (C-33), que fica na E-17.** A estrutura punha o primeiro na
   E-20 e o segundo na E-17.
4. **As guardas de plataforma que sobraram da E-12 (pendência 25 e C-31) e o CSS sem uso (C-30) entram
   na E-03**, junto com o código morto. A estrutura dizia que sobravam da E-12, sem etapa.
5. **Achados sem lugar na estrutura ganharam etapa:** A-49 (E-03), C-35 (E-20), C-37 (E-19, medir antes
   de mexer no CSS), R-10 (E-17), DOC-27 (E-20), DOC-42 (E-16b), A-55 (E-04 para reproduzir, E-24 para
   corrigir com a 046), A-56 (E-25), A-59 (E-04 para verificar, E-23), BA-14 (E-15), BA-16 e BA-17 (E-25),
   LAC-17 (E-14) e os BK (E-09).
6. **A Onda 0 ganha duas decisões** que etapas do plano exigem e que seguem abertas desde antes de
   05/11: a exceção do C-01 nas skills (pendência 6, para a E-07) e o destino das branches e PRs do back
   com specs fora da `main` e de quem versiona as specs soltas (BK-5, BK-27 a BK-29, para a E-09).
7. **E-21:** a exposição do `Retry-After` no CORS não é tarefa da 049. A T-504 e o AC-523 são do front; o
   lado do back é a LAC-16, nova.
8. **E-14:** a DP-02 está coberta pela REQ-211 da 049 (delegada à G3-b; LAC-15). A E-14 fica com a DP-11
   e a DP-12 (LAC-17).
9. **A E-05 ganha o passo final** (excluir os originais), que depende da E-09 e da decisão 19.
10. **Depois das decisões de 05/11:** a E-02 ganha a mitigação opcional do DIV-3 (reler o chamado logo
    antes do `PUT` de cancelar), e o A-59 passa a ser o primeiro item da E-04, como Rafael Santos pediu
    junto com a aprovação.

##### Resumo

| Etapa | Título | Estado ou dependência | Autorização |
|---|---|---|---|
| E-00 | Commit do working tree | Feita em 04/11 | — |
| E-01 | Fechar as etapas sem commit | Feita em 05/11, na `origin/main` | — |
| E-02 | Integração só do front (resto) | Feita em 06/11 (`92b9e93` a `e813444`); sobraram o A-60 e o DIV-16 (§16.10) | — |
| E-03 | Desvios das skills e bugs do front | Feita em 06/11 (`85836ef` a `387f5e6`), menos a guarda do Monitor (pendência 25); sobraram o A-62 e o A-63 (§16.10) | — |
| E-04 | Validação visual e em execução | Bloqueada pela API; o A-59 é o primeiro item | Subir front e API; nenhuma mudança de código |
| E-05 | `AUDITORIA.md` | Feita como L-4; falta excluir os originais, depois da E-09 (decisão 19) | Commit e push |
| E-06 | Documentos da raiz | Pendente; o `design.json` fica mantido (decisão 14); entra o DOC-44 (§16.10) | Documentos; `CLAUDE.md` com autorização expressa |
| E-07 | Skills: só as correções | Pendente; a exceção do C-01 entra (decisão 20) | Skills com autorização expressa |
| E-08 | Doc comments | Em andamento desde 06/11; completar os 258 (decisão 13) | Código |
| E-09 | Back: preservar e corrigir as specs | Em parte; decisões 1, 8 a 11 e 21 tomadas | Back (specs); commit e push no back |
| E-10 | Back: specs novas para as lacunas | Pendente; decisões 2 a 4 e 9 tomadas | Back (specs) |
| E-11 | Back: implementar 046, 048 e 047 | Pendente; decisões 8 a 11 tomadas; 043 parte 1; fase 2 da 049; decisão 12 (aberta) para a 047 | Back; contratos |
| E-12 | Decisões estruturais | Feita, menos A-27, CSP e guardas (passaram à E-25 e à E-03) | — |
| E-13 | Back: proteção estrutural | Feita pela G1 da 049 | — |
| E-14 | Back: specs da DP-11 e da DP-12 | Pendente | Back (specs) |
| E-15 | Back: instruções e conferência de permissão | Pendente; decisão 12 aberta, com proposta | `CLAUDE.md` e skills do back, expressa |
| E-16 | Registro no `AUDITORIA.md` | Feita em 05/11 (`455230a` e `0e7cc4e`) | — |
| E-17 | Início | Feita em 06/11 (`5b67103` a `62f3a43`); sobraram o A-61 e o C-42 (§16.10) | — |
| E-18 | Login e aviso de conexão | Feita em 05/11 (`0043cbf` e `413a447`) | — |
| E-19 | Duplicações e consistência do front | Em andamento desde 06/11, depois da E-03 e da E-17 | Código; commit e push |
| E-20 | Testes e higiene do front | Em andamento desde 06/11 | Código; commit e push |
| E-21 | `Retry-After` de ponta a ponta | Decisão 16 tomada; a E-18, que vinha antes, foi feita | Back (configuração); código |
| E-22 | Limpeza do back | Depois do merge da 043 parte 1 | Back; migration (BA-4) expressa |
| E-23 | Usuários | Decisões 6 e 7 tomadas; A-59 verificado na E-04 | Back (spec, código, contrato); código |
| E-24 | Troca dos espelhos do front | E-11; T-501, T-502, T-509 e T-510 da 049 | Código; commit e push |
| E-25 | Preparação para produção | Decisões 16 e 17 tomadas; a URL de produção segue com Rafael Santos | Código; dependências; back; implantação |

##### Etapas de 31/10

###### E-00 — Commit do working tree

| Campo | Conteúdo |
|---|---|
| Estado | Feita em 04/11: 10 commits, `f7cdd73` a `9d7e238`, mantidos pela L-1 (§11, §13). Nada a fazer |

###### E-01 — Fechar as etapas sem commit

| Campo | Conteúdo |
|---|---|
| Estado | Feita em 05/11: `0ae9ee4` a `79e5129`, rebaseada sobre o `5cd3dce`, validada commit a commit (por log) e na `origin/main` desde 16:58 (§11) |
| O que ficou fora | Os apontamentos de 31/10 que não entraram na tabela da E-01: R-08 (E-18), R-10 (E-17), C-36 e C-37 (E-19), C-39 (E-20) e DOC-42 (E-16b) |

###### E-02 — Correções de integração que dependem só do front (resto)

| Campo | Conteúdo |
|---|---|
| Estado | Feita em 06/11: 11 commits, um por item, `92b9e93` a `e813444` (C-41, A-52, A-57, A-58, A-54, DIV-12, DIV-13, DIV-15, DIV-11, DIV-2 e a mitigação do DIV-3, que vale para todo `PUT` do chamado), na `origin/main` desde 14:45 (§11). Antes, o PR #5 tinha feito DIV-1, DIV-4, DIV-10 e o enum 12 e 13; o resto da DIV-9 e a frase "Fila estável" foram na E-17. Sobraram o A-60 e o DIV-16 (§16.10); a validação contra a API real fica na E-04 |
| Objetivo | Nenhum botão, menu ou campo aparece para quem o servidor recusaria, e nenhuma regra local recusa ou aceita diferente do back, sem depender de entrega do back |
| Problema | DIV-2, A-52, DIV-11, DIV-12, DIV-13, DIV-15, A-54, A-57, A-58 e C-41; opcional, a mitigação do DIV-3 pedida em 05/11 (reler o chamado logo antes do `PUT` de cancelar, na lista e no detalhe; sai quando o back entregar o `PUT` parcial) |
| Arquivos | `tickets/ui/ticket-action-permissions.ts` (DIV-2); `tickets/ui/ticket-edit-dialog/ticket-edit-dialog.component.ts` e `tickets/feature-ticket-create/ticket-create.component.ts` (A-52); `tickets/feature-ticket-detail/ticket-detail.component.ts` e `.html`, `dashboard/dashboard.component.html` (DIV-11); `users/feature-user-list/user-list.component.ts` e `.html`, `users/application/users.store.ts`, `users/infrastructure/user.data.service.ts` (DIV-12, A-54); `core/routes/app.routes.ts`, `shared/ui/layouts/main-layout/side-menu-nav.component.html`, `dashboard/dashboard.component.ts`, `roles/feature-role-list/role-list.component.ts` e `.html` (DIV-13, DIV-15); `tickets/application/ticket-attachments.store.ts` (A-57); `departments/entities/department.ts` e `departments/feature-department-list/department-list.component.ts` e `.html` (A-58); `tickets/entities/ticket.ts` e `tickets/feature-ticket-list/ticket-list-due.ts` (C-41); as specs de cada um |
| Dependências | DIV-2: decisão 1, tomada em 05/11 (vale o código do back; o texto da RN-06, da 047 e do anexo C é corrigido no back, BK-6). As outras não dependem do back |
| Aceite | `npm run build` sem aviso de orçamento; `npm test` verde; `npm run lint` sem erro; `ca-review` sem bloqueio. Specs de componente e de Store provam: o Atendente do seed vê "Atribuir a mim" no detalhe e nos Alertas, e ninguém vê "atribuir a outra pessoa" sem `tickets:assign` (DIV-11); sem `users:assign-roles`, o cadastro faz uma chamada só e não mostra funções (DIV-12); `roles:read` abre Funções em modo leitura, e `roles:manage` sem `roles:read` não abre uma tela que daria 403 (DIV-13); nenhuma permissão administrativa que a sessão não tem fica marcável (DIV-15); "abc" com 7 espaços e título só com espaços não são enviados, e a mensagem de mínimo aparece (A-52); sem `tickets:manage`, nenhum `GET /tickets` na tela de Usuários (A-54, com `HttpTestingController`), e o comentário do Data Service diz o motivo real; arquivo de tipo aceito com extensão fora da política é recusado no front com a regra do back (A-57); "Desativar" avisa com o número de `GET /departments` (A-58); os campos do ciclo vigente são obrigatórios e o recuo saiu (C-41); o dono com `tickets:manage` e sem `tickets:reopen-own` não vê "Reabrir", e quem não é dono e tem `tickets:manage` vê (DIV-2); se a mitigação do DIV-3 entrar, spec com `HttpTestingController` prova que o cancelar relê o chamado logo antes do `PUT` e manda a descrição relida. Validação contra a API real na E-04 |
| Autorização | Código do front; commit e push. Nenhuma mudança no back nem em contrato |
| Risco | Médio: muda a visibilidade de ações para funções personalizadas |
| Esforço | M |

###### E-03 — Desvios das skills e bugs de código do front

| Campo | Conteúdo |
|---|---|
| Estado | Feita em 06/11: 11 commits, `85836ef` a `387f5e6` (C-30, C-31 só no `SessionService`, C-17, C-21, A-49, A-48, C-13, C-40, A-47, C-14 e C-15), rebaseados sobre a E-17 e na `origin/main` desde 14:45 (§11). A guarda do Monitor ficou como estava, de propósito (pendência 25). Conformidade estrita pela média simples de 90,4%, acima da meta de 90% (§16.3). Sobraram o A-62 e o A-63 (§16.10) |
| Objetivo | Stores no padrão da skill (uma por caso de uso, erros separados, leitura por `resource`), sem os bugs de anexos e sem código morto |
| Problema | A-47, A-48, A-49, C-13, C-14, C-15 (opcional), C-17, C-21, C-30, C-31 e a pendência 25, C-40 |
| Arquivos | `tickets/application/tickets.store.ts` e uma Store da criação em `tickets/application/`, `tickets/feature-ticket-create/ticket-create.component.ts` e `.html` (A-47, C-21); `tickets/application/ticket-attachments.store.ts` (A-48, A-49, C-13, C-21); `users/application/users.store.ts` (C-13); `ticket-detail.store.ts`, `ticket-monitor.store.ts`, `ticket-summary.store.ts`, `ticket-assignee-search.ts` e `departments/application/departments.store.ts` (C-14); `tickets/entities/ticket-priority.ts`, `ticket-sla-status.ts`, `ticket-sla.ts`, `ticket-status.ts` e `shared/entities/dashboard-features.ts` (C-15); os arquivos do C-17; `shared/ui/directives/dropdown-fixed-position.directive.ts` (C-21); `src/styles.css` (C-30); `shared/services/session.service.ts` e `tickets/feature-ticket-monitor/ticket-monitor.component.ts` (C-31, pendência 25); as specs |
| Dependências | Nenhuma do back. Antes da E-19, que mexe nas mesmas Stores. Sem decisão nova: o destino depois de criar segue `tickets:view-own` |
| Aceite | Build sem aviso; testes verdes; lint sem erro; `ca-review` sem bloqueio; conformidade estrita pela média simples de pelo menos 90%, pelo método do §16.3 (o fe-arch estima 90,4% só com os itens de 31/10 da E-03). Specs provam: abrir `/tickets/novo` não chama `GET /tickets/mine`, e o erro de envio não mostra falha de leitura (A-47); "Tentar novamente" e reabrir o mesmo chamado refazem o `GET` dos anexos (A-48); `uploadError` e `downloadError` não passam para outro chamado (A-49); duas buscas de responsável seguidas cancelam a primeira (C-14); Meus Chamados sem a requisição "tem algum chamado?" (C-40). Busca em `src/`: 0 `typeof window` e 0 `isPlatformBrowser` (C-31), 0 ocorrência dos membros do C-17 e das classes do C-30 |
| Autorização | Código do front; commit e push |
| Risco | Médio: refatoração de Stores com estado compartilhado |
| Esforço | G |

###### E-04 — Validação visual e em execução

| Campo | Conteúdo |
|---|---|
| Estado | Pendente, bloqueada pela API (em 31/10, o container não respondia; pendência 9) |
| Objetivo | Validar na aplicação real, com login, o que só foi conferido no código |
| Problema | Primeiro, o A-59 (lote e 429), como pedido em 05/11. Depois, A-34 (revalidar), R-05 a R-07 e o aviso do A-42; efeitos visuais do A-33, R-08, R-09, R-10 e A-50; os comportamentos INFERIDOS: A-55 (duas abas), os 403 do A-47 e das DIV-11 a DIV-15, a LAC-16 (`Retry-After` entre origens), o A-48 em execução e o efeito cruzado R-05 × R-07 no cabeçalho do diálogo. Desde 06/11, também as correções da E-18 e do bloco 1 contra a API real (as visibilidades da E-02, a mitigação do DIV-3 e o Início da E-17) e os efeitos dos achados da execução (A-60, A-61, A-63 e DIV-16, §16.10) |
| Arquivos | Nenhum. Evidências no scratchpad; resultado no §6 e no §16 |
| Dependências | API de pé (opção (a) de 31/10: Rafael Santos inicia pelo Visual Studio) e login de administrador; front na 4201 se o watcher falhar |
| Aceite | Capturas em 1366×768, 390×844 e 844×390, claro e escuro; console sem erro; rede sem 403 nem 429 inesperado; cada item com veredito registrado; o A-34 medido pelo mesmo método de captura |
| Autorização | Subir o front e a API; sessão de navegador; nenhuma mudança de código; não aplicar migrations no banco compartilhado |
| Risco | Baixo |
| Esforço | M |

###### E-05 — `AUDITORIA.md`

| Campo | Conteúdo |
|---|---|
| Estado | Feita como L-4 (04/11). O documento fica em `docs/audit/`, por decisão de 04/11. Anexos idênticos aos originais, conferidos de novo em 05/11 |
| Objetivo do passo que falta | Excluir `docs/audit/FRONTEND_AUDIT.md` e `FINAL_ACCEPTANCE_AUDIT.md` |
| Problema | DOC-28, DOC-33; pendência 20 |
| Dependências | E-09 (o back troca as referências das 046, 047, 048 e 049); a decisão 19, tomada em 05/11, confirma a ordem |
| Aceite | Busca nos dois repositórios sem referência aos originais (salvo histórico); `valida-auditoria.cjs` passa |
| Autorização | Commit e push |
| Risco | Baixo |
| Esforço | P |

###### E-06 — Documentos da raiz

| Campo | Conteúdo |
|---|---|
| Estado | Pendente |
| Objetivo | `PRODUCT.md`, `README.md`, `DESIGN.md` e `CLAUDE.md` sem erro e sem regra do back reescrita: a regra do back vira ponteiro |
| Problema | DOC-1 a DOC-7, DOC-11 (se a edição da outra sessão não entrar), DOC-12 a DOC-15, DOC-26, DOC-29, DOC-30, DOC-34 a DOC-38, DOC-40, DOC-41 e DOC-44 (§16.10). O `design.json` (DOC-10) fica mantido, sem regenerar (decisão 14) |
| Arquivos | `PRODUCT.md`, `README.md`, `DESIGN.md`, `CLAUDE.md`; os comentários de `tickets/application/ticket-summary.store.ts:67` e `tickets/infrastructure/ticket.data.service.ts:213` (DOC-13) |
| Dependências | Commit da outra sessão antes de mexer no `CLAUDE.md` (DOC-25); as decisões 13 (completar os doc comments, sem mudar a regra do `CLAUDE.md`) e 14 (manter o `design.json`) foram tomadas em 05/11; a decisão de produto sobre Supervisor e RH (DOC-30) não bloqueia o resto |
| Aceite | Busca por "multi-tenant", "Requester", "Admin Master", "Supervisor", "plano-onboarding-rh", "RBAC dinâmico" e "18.2.6" no `PRODUCT.md` e no `README.md`: 0; o `check-caminhos.cjs` e o `check-simbolos.cjs` do docs.md sem referência vigente quebrada; o `README.md` traz `npm ci`, `npm start` (back em `localhost:5000`), `npm test`, `npm run lint` e `npm run build` (saída `dist/tickest-pristine/browser`), sem `ng e2e` nem `ng generate … module`; o `CLAUDE.md` tem comandos, `core/`, `dashboard/`, as telas de sessão em `shared/`, `ui/`, o mapa de documentos e a D-SF5; o `DESIGN.md` registra os padrões globais (DOC-15) e não tem "Em breve" (DOC-14) nem a flag removida (DOC-44); o `.impeccable/design.json` sem mudança (decisão 14) |
| Autorização | Documentos da raiz; `CLAUDE.md` com autorização expressa; commit e push |
| Risco | Baixo; o Impeccable lê o `PRODUCT.md` e o `DESIGN.md` |
| Esforço | M |

###### E-07 — Skills: só as correções de fato

| Campo | Conteúdo |
|---|---|
| Estado | Pendente |
| Objetivo | Skills sem erro de modelo e alinhadas ao código, sem skill nova |
| Problema | DOC-8 (Prettier, `flushEffects` e `fakeAsync`, `console.error`), DOC-16 a DOC-19, DOC-39 e DOC-43; a exceção do C-01, que entra nas skills (decisão 20) |
| Arquivos | `.claude/skills/README.md`; `add-context/SKILL.md` e `references/routed-component.md`; `add-feature/SKILL.md`, `references/routed-component.md` e `references/store-method.md`; `add-tests/SKILL.md`; `ca-review/SKILL.md` |
| Dependências | Decisão 20, tomada em 05/11; depois da E-03, para os modelos refletirem o padrão corrigido |
| Aceite | O modelo de tela da `add-feature`, gerado numa cópia, compila e não lança NG0950 (spec com `input.required`); o modelo de Store compila com os imports completos; nenhuma menção a Prettier, `flushEffects`, `fakeAsync` ou `console.error`; a `add-tests` e a `ca-review` preveem spec de Data Service; a tabela da `ca-review` classifica `dashboard/`; `ca-review` rodada sobre a `main` sem falso bloqueio |
| Autorização | Skills, com autorização expressa; commit e push |
| Risco | Baixo |
| Esforço | P |

###### E-08 — Doc comments

| Campo | Conteúdo |
|---|---|
| Estado | Em andamento desde 06/11 |
| Objetivo | Completar os `/** */` em português que faltam, como o `CLAUDE.md` exige (decisão 13) |
| Problema | C-16 (258 declarações em 53 arquivos) |
| Arquivos | Os arquivos de `reaudit/out/fe-arch-tmp/doc-comments-atual.txt` (maiores: `ticket-detail.component.ts` e `ticket-monitor.component.ts`) |
| Dependências | Decisão 13, tomada em 05/11; depois da E-03 e da E-19, que mexem nos mesmos arquivos |
| Aceite | `doc-comments.cjs` do fe-arch com 0 falta; build, testes e lint verdes |
| Autorização | Código; commit e push |
| Risco | Baixo |
| Esforço | M |

###### E-09 — Back: preservar e corrigir as specs

| Campo | Conteúdo |
|---|---|
| Estado | Em parte. Entraram 022, 023, 024 e 035; a 049, a 050 e a 051 foram versionadas; 023 e 024 conciliadas, e a 024 entregue. Faltam: versionar 11 pastas (032, 033, 034, 036, 037, 040, 043, 044, 046, 047 e 048) e `specs/_fontes/contratos-central-atendimento.md` (a 043 entra com o PR dela); a 036; o texto das 046, 047 e 048; os links para a auditoria; os PRs #34 e #58; a colisão de IDs e o destino do `SPEC-TICKEST.md` |
| Objetivo | Specs do back versionadas, coerentes com o código e com a 049, antes de aprovar as 046 a 048 |
| Problema | BK-1 a BK-5; BK-6 a BK-26 (texto das 046 a 048 e da 049); BK-27 a BK-30; DOC-28 |
| Arquivos (back, em prosa) | As pastas `specs/` fora do Git; `specs/046-…`, `047-…` e `048-…`; `specs/049-…/spec.md` e os anexos A, B e C; a RN-06 do `SYSTEM_SPECIFICATION.md`; o `SPEC-TICKEST.md`; `specs/044-…/spec.md` |
| Dependências | Decisões tomadas em 05/11: 1 (o texto passa a dizer a regra do código, BK-6), 8 a 11 (o texto segue as escolhas das DECs e o portão G6 antecipado) e 21 (o back versiona as pastas soltas e decide os PRs com a sessão dele); coordenação com a sessão da 043 |
| Aceite | `git status` do back sem spec fora do Git (salvo a 043 em andamento); cada BK fechado com o trecho corrigido; nenhuma citação de linha que não bata com a `main` (conferência por script, como o anexo do specs-046-048); a 049 e as 046 a 048 apontam o `AUDITORIA.md`, não os originais; a auditoria SDD rodada e o resultado registrado (BK-30) |
| Autorização | Back (specs e documentos); commit e push no back |
| Risco | Médio: a outra sessão edita o back e a 049 durante o dia |
| Esforço | M |

###### E-10 — Back: specs novas para as lacunas

| Campo | Conteúdo |
|---|---|
| Estado | Pendente. Oito lacunas viraram tarefas da 049 (L-1 na T-501; L-2 na 048 e na T-509; L-3 na T-510; L-4 na T-508; L-7 na T-506; L-10 na T-503, na T-504 e na T-512; L-11 na T-409; L-15 na T-211). A L-11 foi feita (G1), e a L-3 está em andamento na 043 |
| Objetivo | Spec própria para o que nenhuma spec cobre |
| Problema | LAC-2 (entra na 048, decisão 10), LAC-5 (regra por alvo), LAC-8 (a proteção vira regra do back, decisão 3), LAC-9 (assumir chamado com responsável passa a exigir `tickets:assign`, decisão 2), LAC-10 (o mínimo de 2 no nome vira regra do back, decisão 4), LAC-12, LAC-13 e LAC-14 (spec própria, decisão 9) |
| Arquivos (back) | Specs novas em `specs/`, pelo fluxo de specs do back |
| Dependências | Decisões 2 a 4, 9 e 10, tomadas em 05/11; o front mantém os espelhos até o back entregar |
| Aceite | Cada lacuna com spec aprovada ou registrada como fora do escopo; o §8.2 atualizado |
| Autorização | Back (specs); contratos e migrations só com autorização explícita |
| Risco | Baixo (só texto) |
| Esforço | M |

###### E-11 — Back: implementar 046, 048 e 047

| Campo | Conteúdo |
|---|---|
| Estado | Pendente. As três "Em descoberta" desde 31/10, sem DEC fechada |
| Objetivo | No back, sessão em cookie (046), ciclo vigente em toda leitura de SLA (048 com a LAC-2) e ações permitidas (047), nesta ordem |
| Problema | A-23; A-30 e LAC-2; A-24 (e A-06 a A-08, A-12, DIV-2, DIV-6); BK-9 a BK-26 corrigidos antes no texto (E-09) |
| Arquivos (back, em prosa) | Rotas de sessão, emissão do cookie e CORS com credenciais (046); as consultas da lista, dos dois resumos, do detalhe e de Meus Chamados, com um trecho SQL único do ciclo vigente (048); as respostas da lista, do detalhe e de Meus Chamados, com as ações (047); o snapshot do OpenAPI |
| Dependências | Decisões 8 a 11, tomadas em 05/11 (ordem 046, 048 e 047; portão G6 antecipado); a 046 não depende da 043; a 048 depois da parte 1 da 043; a 047 depois da fase 2 de chamados da 049 (DEC-8, DEC-9, T-6), da spec da LAC-9 (decisão 2) e da decisão 12, que segue aberta; 048 e 047 em sequência, porque mexem nas mesmas respostas |
| Aceite | Os ACs de cada spec com os ajustes do §16.6. 046: `Set-Cookie` com `HttpOnly`, `Secure`, `SameSite=Strict` e o `Path` decidido; renovação recusada com o status da DEC-8; logout só com o cookie responde 204 e revoga; preflight com credenciais de origem fora da lista recusado. 048: AC-1 a AC-6; o agregado conta o reaberto vencido e o teste de paridade passa com um reaberto na massa; o detalhe traz o ciclo vigente; o trecho SQL concorda com o cronômetro em todas as situações. 047: AC-1 reescrito, AC-1b do dono sem `reopen-own`, iniciar e resolver, o Monitor e o AC-7 por ação. Build sem aviso; testes unitários, de arquitetura e de integração verdes; snapshot do OpenAPI só com os campos novos |
| Autorização | Back; contratos (as três mudam a API); commit e push no back |
| Risco | Alto na 046 (sessão); médio nas outras |
| Esforço | G |

###### E-12 — Decisões estruturais

| Campo | Conteúdo |
|---|---|
| Estado | Feita: SSR removido, Angular 22.2, `@ngrx/signals` estável, fontes e Boxicons no build, SRI no Bootstrap e lint. Sobraram o A-27 e a CSP (A-56), que vão para a E-25, e as guardas de plataforma (pendência 25 e C-31), que foram para a E-03: as do `SessionService` saíram no `857c4d0`, e a do Monitor segue (pendência 25) |

###### E-13 — Back: proteção estrutural

| Campo | Conteúdo |
|---|---|
| Estado | Feita pela G1 da 049: `FallbackPolicy`, matriz de autorização por rota, regra de arquitetura que exige proteção em todo endpoint e snapshot aprovado do OpenAPI |

###### E-14 — Back: specs das decisões sem spec

| Campo | Conteúdo |
|---|---|
| Estado | Pendente. A DP-02 está coberta pela REQ-211 da 049, delegada à G3-b (LAC-15) |
| Objetivo | Spec para a DP-11 e a DP-12 |
| Problema | LAC-17 |
| Arquivos (back) | Specs novas; a 033 (Rascunho) |
| Dependências | Nenhuma decisão nova (as DP são de 24/10); coordenar com a G3 da 049 |
| Aceite | DP-11 e DP-12 com spec aprovada; a abertura com responsável segue a REQ-211 quando a G3-b entrar |
| Autorização | Back (specs) |
| Risco | Baixo |
| Esforço | P |

###### E-15 — Back: instruções e padrão de conferência de permissão

| Campo | Conteúdo |
|---|---|
| Estado | Pendente, ampliada pelo BA-7 |
| Objetivo | Uma forma só de conferir permissão por recurso, e o `CLAUDE.md`, as skills e o agente do back coerentes com o código |
| Problema | BA-7 e BK-22; BA-5, BA-6, BA-12 e BA-14; na 049: PL-16 (lista "em migração"), AZ-15 (`CLAUDE.md:121`) e F-38 |
| Arquivos (back, em prosa) | `CLAUDE.md`; `.claude/skills/add-feature/references/authorization.md` e `SKILL.md`; `.claude/agents/dotnet-architect.md`; a DEC-30 da 041 |
| Dependências | Decisão 12, que segue aberta. Proposta: uma peça reutilizável (regra de domínio ou serviço injetado), usada pelo handler e pela consulta das ações permitidas da 047, sem método privado no handler, como já manda a DEC-30 da 041. Decidir antes da T-6 da 049 (G3-a) e da T-5 da 043; juntar com a T-7 da 043, que reescreve o `CLAUDE.md` do back agora |
| Aceite | Busca nas skills, no `CLAUDE.md` e nas specs ativas sem a forma descartada; o teste de instruções do back verde; nenhum handler contra a forma escolhida (busca) |
| Autorização | `CLAUDE.md` e skills do back, com autorização expressa; back |
| Risco | Alto de conflito: a `authorization.md` está modificada no working tree da 043 |
| Esforço | P |

##### Etapas novas

###### E-16 — Registro no `AUDITORIA.md`

| Campo | Conteúdo |
|---|---|
| Estado | Feita em 05/11: `455230a` (a) e `0e7cc4e` (b), na `main` às 23:10 e na `origin/main` às 23:11 (§11). Não esperou o commit da outra sessão: o documento já trazia o texto dela (DOC-25) |
| Objetivo | (a) Commit corretivo, aprovado em 05/11 por volta das 17:40 e pausado: o documento da `main` conciliado com a edição da outra sessão e sem as menções que davam a E-01 e a E-12 fora da `main`. (b) Registro desta reauditoria: o §16 e os ajustes de estado |
| Problema | (a) DOC-20, DOC-25 e a parte do `wt-e01` do DOC-24; os 3 conflitos (§0; §6, itens 7 e 8; §6, itens 16 e 17). (b) DOC-21, DOC-22, DOC-23, a parte do `server.ts` do DOC-24, DOC-31, DOC-32 e DOC-42; os estados do §0 ao §15 |
| Arquivos | `docs/audit/AUDITORIA.md` (proposta em `reaudit/entrega/AUDITORIA.md`; a parte (a) sozinha em `reaudit/entrega/AUDITORIA-16a.md`; lista das mudanças, com a marca [16a] ou [16b], em `AUDITORIA-mudancas.md`) |
| Dependências | (a) a outra sessão commitar a edição dela na `fix/SPEC-049-fe0-front-alignment` e trazer a `main` nova (até as 22:18 de 05/11 não tinha commitado, e a edição seguia igual à cópia das 19:08); se a edição mudar, remontar pelo script. (b) a (a); a decisão 18 foi tomada em 05/11 |
| Aceite | `valida-auditoria.cjs` passa nos dois modos: anexos idênticos aos originais; todo ID do `333f4c2` presente; nenhum marcador de conflito; nenhuma afirmação de estado atual de que a E-01 ou a E-12 estão fora da `main`, salvo as linhas de histórico justificadas; títulos do §0 ao §16 (ou ao §15, na (a)) seguidos dos anexos; em (b), cada ID novo definido uma vez e sem colisão. O `git diff` muda só o `AUDITORIA.md` |
| Autorização | (a) e (b) aprovadas por Rafael Santos em 05/11, por volta das 22:15; o commit, o fast-forward e o push foram em 05/11 (§11) |
| Risco | Baixo |
| Esforço | P |

###### E-17 — Início

| Campo | Conteúdo |
|---|---|
| Estado | Feita em 06/11: `5b67103` (C-33, com a parte da flag do C-34 e o token do C-15), `7af23b7` (A-50), `f700aea` (A-53), `ef7f70e` (DIV-9), `90b3cbd` (C-24) e `62f3a43` (R-10), na `origin/main` desde 14:45 (§11). Sobraram o A-61 e o C-42 (§16.10); a conferência visual fica na E-04 |
| Objetivo | O Início sem texto que promete o que já existe nem frase que deduz a fila, com os atalhos pela permissão e um recorte só |
| Problema | A-50, A-53, C-33 (e a nota do A-28), o resto da DIV-9 (atalhos e links dos números), C-24 e R-10 |
| Arquivos | `dashboard/dashboard-hero-chart.component.html` e `.ts` (A-50); `dashboard/dashboard-overview.ts` (A-53); `src/environments/environment.ts`, `environment.prod.ts`, `shared/entities/dashboard-features.ts`, `dashboard/dashboard.component.ts` e `.html`, `tickets/application/ticket-dashboard.store.ts` e as specs (C-33); `dashboard/dashboard.component.ts:158-167,315-320` e `.html:29,181` (DIV-9); `ticket-dashboard.store.ts:43-46,83-92` e `ticket-summary.store.ts:20-32,262` (C-24); `dashboard/dashboard-insights.component.html:51` ou `src/styles.css:316-320` (R-10) |
| Dependências | Decisões tomadas em 05/11: 5 (os atalhos seguem `tickets:create` e `tickets:view-own`, não o perfil deduzido) e 15 (o critério da flag está cumprido: a flag e os ramos mortos saem aqui, e a validação visual fica na E-04). A frase sobre a fila volta só com a 032 |
| Aceite | Build, testes, lint e `ca-review` verdes. A spec do gráfico confere o rodapé no carregamento, na troca de agrupamento e no erro, sem "em breve" com o fluxo pronto (A-50); nenhuma frase do Início fala de fila a partir de criados × resolvidos (A-53); busca em `src/` sem `volumeResolved`, sem `DASHBOARD_FEATURES` e sem os ramos `'unavailable'` (C-33); o Administrador do seed vê "Novo Chamado" e "Meus Chamados", e quem não tem `tickets:view-own` não recebe link para `/tickets` (DIV-9); uma função só monta o recorte do agregado e dos Alertas, com teste de concordância (C-24); espaço antes do chevron conferido na E-04 (R-10) |
| Autorização | Código do front; commit e push |
| Risco | Baixo |
| Esforço | M |

###### E-18 — Login e aviso de conexão

| Campo | Conteúdo |
|---|---|
| Estado | Feita em 05/11: `0043cbf` (A-51) e `413a447` (R-08), rebaseados sobre o `0e7cc4e`, revalidados e na `origin/main` desde 23:17 (§11). O anúncio com leitor de tela fica para a E-04 |
| Objetivo | O login não fica sem resposta nem aceita segundo clique durante as novas tentativas, e o aviso é anunciado |
| Problema | A-51 e R-08 |
| Arquivos | `shared/application/login.store.ts`; `shared/feature-login/login.component.ts` e `.html`; `app.component.ts`; `shared/ui/session-retry-notice/session-retry-notice.component.ts`; `shared/services/current-user.service.ts`; as specs |
| Dependências | Nenhuma. Antes da E-21, que mexe no mesmo serviço |
| Aceite | Build, testes, lint e `ca-review` verdes. Spec com relógio falso: durante as novas tentativas do login, o botão segue desabilitado e um aviso aparece; um segundo clique não faz outro `POST users/login` (com `HttpTestingController`); a região viva está no DOM desde o início e só o texto muda (spec de DOM); anúncio conferido com leitor de tela na E-04 |
| Autorização | Código do front; commit e push |
| Risco | Baixo |
| Esforço | P |

###### E-19 — Duplicações e consistência do front, sem mudar comportamento

| Campo | Conteúdo |
|---|---|
| Estado | Em andamento desde 06/11; a E-03 e a E-17, de que dependia, foram feitas |
| Objetivo | Uma implementação só para o que hoje está copiado, sem mudar o que a pessoa vê; a exceção é o anel de foco do R-09, que melhora o contraste |
| Problema | C-18, C-19, C-20, C-22 (opcional), C-25, C-26, C-27, C-28, C-29, C-36, C-37 (medir antes) e R-09 |
| Arquivos | As Stores de chamados e de usuários (C-18); os formulários (C-19); `ticket-monitor-info-panel.component.ts`, `ticket-list-due.ts`, `login.store.ts` e `src/index.html` (C-20); `ticket-monitor.component.ts` e `user-list.component.ts` (C-25); `tickets/ui/ticket-action-permissions.ts`, `ticket-cancel-window.ts` e os 10 arquivos com o literal (C-26); `ticket-detail.store.ts` e `ticket-quick-info.store.ts` (C-27); os 7 templates com datas (C-28); o CSS dos componentes e o `src/styles.css` (C-29, C-36, R-09); `angular.json` (orçamento, C-37) |
| Dependências | Depois da E-03 e da E-17. O C-26 pode mudar onde mora a regra de permissão (barrel de `tickets`); renomear as Stores do R24 (C-20) só com aprovação na revisão |
| Aceite | Build sem aviso de orçamento, com o tamanho de cada CSS medido no `stats.json` antes e depois (C-37); testes verdes sem mudar asserção de comportamento; lint sem erro; `ca-review` sem bloqueio; o `dup.cjs` e o `css-overlap.cjs` do fe-arch sem os grupos tratados; o literal `'tickets:manage'` só na constante; nenhum `outline: 2px solid var(--tk-primary)` local (R-09), com a medição do A-34 na E-04 |
| Autorização | Código do front; commit e push |
| Risco | Médio: muitos arquivos e regressão visual |
| Esforço | G |

###### E-20 — Testes e higiene do front

| Campo | Conteúdo |
|---|---|
| Estado | Em andamento desde 06/11. Do C-34, a parte da flag saiu no `5b67103` (E-17); falta o `ATTACHMENT_POLICY` |
| Objetivo | Cobertura direta do que falta e testes sem resíduo |
| Problema | N-4; os quatro arquivos do N-5 que faltam; C-23, C-32, C-34, C-35, C-38, C-39 e DOC-27 |
| Arquivos | Specs novas para `focus-trap.util.ts`, `session-retry-notice.component.ts`, `ticket-list-first-use.component.ts`, `ticket-list-due-cell.component.ts`, os utilitários do C-23 (entre eles `http-error.util.ts`), `auth-layout.component.ts` e `dropdown-fixed-position.directive.ts`; `ticket-detail.component.spec.ts` (N-4, C-39); `tickets.store.spec.ts` e `ticket-history.store.spec.ts` (C-32); `ticket-summary.store.spec.ts`, `ticket-detail.component.spec.ts` e `dashboard.component.spec.ts` (C-34); `dialog.component.ts`, `side-panel.directive.ts` e `main-layout.component.spec.ts` (C-35); `.git-blame-ignore-revs` (C-38); `.vscode/extensions.json` e `tasks.json` (DOC-27) |
| Dependências | A parte da flag do C-34 caiu com a E-17 (`5b67103`). A decisão 17 (runner) não bloqueia |
| Aceite | Build, testes (o número sobe) e lint verdes; `tsc -p tsconfig.spec.json --noEmit --noUnusedLocals --noUnusedParameters` só com o falso positivo do `revealNewItem`; `git blame --ignore-revs-file .git-blame-ignore-revs` sem linha do `0451269`; os títulos no formato decidido e os `withContext` em inglês; nenhuma variável em português nas specs (N-4) |
| Autorização | Código do front; commit e push |
| Risco | Baixo |
| Esforço | M |

###### E-21 — `Retry-After` de ponta a ponta

| Campo | Conteúdo |
|---|---|
| Objetivo | O front espera o tempo que o back manda no 429 |
| Problema | LAC-16; o lado do front da LAC-11 (T-504 e AC-523 da 049) |
| Arquivos | Back (em prosa): a política de CORS passa a expor o cabeçalho `Retry-After`, ou o 429 passa a levar os segundos num campo do Problem Details. Front: `shared/services/current-user.service.ts:11-15,49-56` e a spec |
| Dependências | Decisão 16, tomada em 05/11: em produção, front e API na mesma origem, com proxy em `/api`, e o CORS deixa de importar ali; em desenvolvimento (4200 e 5000) as origens seguem diferentes, e o front ainda precisa ler o cabeçalho. Depois da E-18 |
| Aceite | Back: teste de integração do CORS confere o cabeçalho exposto (ou o campo), como os testes de CORS existentes. Front: spec com relógio falso espera o tempo do cabeçalho e cai nas esperas fixas sem ele. O AC-523 da 049 com front e API em origens diferentes (E-04). A LAC-11 atualizada no §8.2 |
| Autorização | Back (configuração; contrato, se for campo); código do front; commit e push nos dois |
| Risco | Baixo |
| Esforço | P |

###### E-22 — Limpeza do back

| Campo | Conteúdo |
|---|---|
| Objetivo | Tirar código morto e duplicação do back e fechar as regras sem teste de arquitetura |
| Problema | BA-1, BA-2, BA-3, BA-4, BA-8, BA-9, BA-10, BA-11, BA-15 e BA-18 |
| Arquivos (back, em prosa) | O plano de prazos e o serviço de ciclo, com o texto da 045 (BA-1); o calendário útil (BA-2); os nomes de exibição de validação e o teste deles (BA-3); a configuração de usuários e uma migration própria do índice (BA-4); os comentários que citam spec em `src` e `tests`, com uma regra nova nos testes de arquitetura (BA-8, BA-11); os testes de validators de usuários (BA-9); a abstração do contexto de dados (BA-10); o `Unassign` do chamado (BA-15); os testes de SMTP e de telemetria e um limite de cobertura (BA-18) |
| Dependências | Depois do merge da 043 parte 1 (conflitos no `Ticket.cs`, nas consultas de usuários e em `Application/Tickets`), coordenada com a outra sessão; o BA-4 só com autorização de migration |
| Aceite | Build com 0 aviso e 0 erro; 940 ou mais testes unitários e 134 ou mais de arquitetura verdes, com as regras novas do BA-11; integração verde; busca de citação de spec em comentário só nas exceções listadas |
| Autorização | Back; migration (BA-4) com autorização expressa; commit e push no back |
| Risco | Médio: conflito com a 043 |
| Esforço | M |

###### E-23 — Usuários

| Campo | Conteúdo |
|---|---|
| Objetivo | O filtro de período, o lote e o responsável de departamento com a regra do back |
| Problema | BA-13 (decisão 7: o dia de São Paulo, como nos chamados); A-59 (verificar primeiro na E-04; confirmado, REQ-505 e T-506 da 049 e a spec 034); DIV-14 (decisão 6: só usuário ativo, com a recusa no back e a rota de candidatos com `departments:manage`; Q-65 da 049) |
| Arquivos | Back (em prosa): o filtro de período de `GET users` pela peça de período local dos chamados (BA-13); o lote e o cadastro com funções (T-506 da 049) e a contagem agregada (034); a elegibilidade do responsável de departamento e uma rota de candidatos com a permissão da tela (DIV-14). Front: `users/application/users.store.ts`, `user-list.component.ts` e `departments/application/departments.store.ts` |
| Dependências | Decisões 6 e 7, tomadas em 05/11; A-59 confirmado na E-04 (até lá, nada muda no front); a 043 parte 1, que reescreve as consultas de usuários |
| Aceite | Back: teste de integração na virada do dia em São Paulo (BA-13); AC-509 e AC-510 da 049 (no máximo 2 requisições para 100 selecionados, sem 429); o back recusa responsável inelegível. Front: uma chamada por operação; quem só tem `departments:manage` escolhe o responsável |
| Autorização | Back (spec, código e contrato do lote e dos candidatos); código do front; commit e push |
| Risco | Médio |
| Esforço | M |

###### E-24 — Troca dos espelhos do front pelos campos da API

| Campo | Conteúdo |
|---|---|
| Objetivo | Em cada trilha, o back entrega, o front troca e o front remove o espelho |
| Problema | 047: A-24, A-06 a A-08, A-12, DIV-2, DIV-6 e DIV-11. 048 com a LAC-2: A-30, A-14 ("Em risco") e A-17. 046: A-23 e A-55. LAC-3 (departamento). DIV-3 com a LAC-1 (`PUT` sem reenviar o estado) |
| Arquivos | `tickets/ui/ticket-action-permissions.ts` e `TICKET_STATUS_TRANSITIONS` (saem com a 047); `tickets/entities/ticket.ts`, `ticket-monitor-item.ts`, `ticket-monitor.component.ts`, `ticket-monitor-info-panel.component.ts`, `ticket-detail.component.html:20` e `ticket-summary.store.ts:91-96` (048); `shared/services/session.service.ts`, `shared/infrastructure/auth.data.service.ts`, `token-refresh.service.ts`, `auth.interceptor.ts`, `login.store.ts`, os guards e `core/config/app.config.ts` (046); `dashboard/dashboard-filters.ts:106-130` (LAC-3); `ticket-list.component.ts:340,360` e `ticket-detail.store.ts:177,206` (DIV-3) |
| Dependências | E-11; as tarefas T-501 (`PUT` parcial), T-502 (front), T-509 (relógio) e T-510 (departamento) da 049; as decisões 8, 8a, 9 e 10, tomadas em 05/11; para a 047, também a decisão 12, que segue aberta. A trilha do contrato do chamado (DIV-3) vem primeiro |
| Aceite | AC-517 da 049: nenhum import de `ticket-action-permissions` nem de `TICKET_STATUS_TRANSITIONS`, e cada botão vai à sua rota. Um reaberto não aparece como "Cumprido" no Monitor nem nos Alertas, e cards, lista e detalhe contam o mesmo ciclo. Nenhum token no `localStorage`, F5 mantém a sessão, duas abas seguem logadas e o logout com o token vencido revoga no servidor. AC-513 da 049 (o front manda `departmentId`). AC-501 a AC-503 e AC-526 da 049 (corpo de um campo só). Em cada trilha, build, testes, lint e `ca-review` verdes e validação contra a API real |
| Autorização | Código do front; commit e push. As entregas do back são da E-11 e da 049 |
| Risco | Alto na 046 (sessão); médio nas outras |
| Esforço | G |

###### E-25 — Preparação para produção

| Campo | Conteúdo |
|---|---|
| Objetivo | O front e a API prontos para publicar com segurança |
| Problema | A-27 e N-8; pendência 28 (implantação estática); A-56 (CSP); pendências 29 e 30 (Bootstrap e Boxicons locais, ou um subconjunto dos ícones); pendência 27 (vulnerabilidades de desenvolvimento e troca do Karma pelo Vitest, decisão 17); `ForwardedHeaders` no back (DEC-4 da 046; BK-14; SE-07 e SE-08 da 049); BA-16 (OpenAPI fora de Development) e BA-17 (anexos em disco local) |
| Arquivos | `src/environments/environment.prod.ts`; `src/index.html`; `angular.json`; `package.json` e `package-lock.json`; a configuração do servidor estático (a definir, fora do repositório). Back (em prosa): `ForwardedHeaders` na subida da API, as origens permitidas de produção, o armazenamento de anexos e a publicação do OpenAPI |
| Dependências | Decisões tomadas em 05/11: 16 (mesma origem, com proxy em `/api`, DEC-4 (a) da 046; a URL de produção segue com Rafael Santos, para informar na implantação) e 17 (Vitest, pelo builder de testes unitários do Angular CLI). O Bootstrap local, as vulnerabilidades e o runner podem vir antes |
| Aceite | O build de produção aponta a URL real; o servidor estático devolve o `index.html` nas rotas desconhecidas; a página carrega com CSP e sem violação no console; nenhum recurso de outra origem (com o Bootstrap local); `npm audit` sem vulnerabilidade alta; os testes no Vitest, com o mesmo número de casos; no back, teste de integração com `X-Forwarded-For` atrás de proxy e o limite por IP real |
| Autorização | Código do front; dependências; back (configuração); implantação; commit e push |
| Risco | Médio |
| Esforço | G |

##### Onda 0 — decisões de 05/11

Rafael Santos aprovou estas decisões em 05/11, por volta das 22:15, menos a 12, que segue aberta com a
proposta. A escolha e a origem de cada uma estão no §16.8 (`DECISOES-2026-11-05.md`); aqui fica o que
cada uma destrava.

| # | Decisão | Estado em 05/11 | IDs | O que destrava |
|---|---|---|---|---|
| 1 | Regra de reabrir | Decidida: vale o código do back | DIV-2, BK-6 | A correção do DIV-2 na E-02; o texto da RN-06, da 047 e do anexo C (E-09); o AC-1b da 047 |
| 2 | Assumir chamado que já tem responsável | Decidida: exige `tickets:assign`, numa spec própria no back | LAC-9, DIV-6 | A spec no back (E-10), o "atribuir a mim" da 047 (E-11) e a E-24 |
| 3 | Administrador tirar a própria função havendo outro | Decidida: vira regra do back; o front mantém o espelho até lá | DIV-7, LAC-8 | A spec no back (E-10) e a troca na E-24 |
| 4 | Mínimo de 2 caracteres no nome | Decidida: vira regra do back; o front mantém o espelho até lá | DIV-8, LAC-10 | Os validators do back (E-10) e a troca na E-24 |
| 5 | Atalhos do Início | Decidida: seguem as permissões, não o perfil deduzido | DIV-9 (resto) | A E-17 |
| 6 | Responsável de departamento | Decidida: só usuário ativo; o back recusa o inelegível e oferece a rota de candidatos | DIV-14; Q-65 da 049 | A E-23 (back e front) |
| 7 | Datas de filtro | Decidida: dia de São Paulo, como nos chamados | BA-13 | A E-23 (back) |
| 8 | DECs da 046 | Decidida: as recomendações do §16.6, com a DEC-7 e a DEC-8 propostas | A-23; BK-9 a BK-16; A-55 | O texto e a implementação da 046 (E-09, E-11) e a troca na E-24; a DEC-4 destrava também a E-25 |
| 8a | DEC-63 da 049, junto com a 046 | Decidida: (b), a troca da própria senha reemite a sessão pelo cookie | BK-11 | A E-09 e a E-11 (back) e a E-24 |
| 9 | DECs da 047 | Decidida: as recomendações do §16.6 | A-24; BK-18 a BK-22 | A E-09 e a E-11 (back) e a E-24; o mecanismo depende da decisão 12 |
| 10 | DECs da 048, com a DEC-66 da 049 | Decidida: as recomendações do §16.6, com a LAC-2 | A-30; LAC-2; BK-23 a BK-26 | A E-09 e a E-11 (back) e a E-24 |
| 11 | Portão G6 da 049 | Decidida: antecipar a 046 e a 048, na ordem 046, 048 e 047 | BK-17 | O texto da 049 (back, com autorização) e a ordem da E-11 |
| 12 | Conferência de permissão por recurso | **Aberta**, com a proposta do §16.8 | BA-7; BK-22 | A E-15, a T-6 da 049, a T-5 da 043 e o mecanismo da 047 |
| 13 | Doc comments | Decidida: completar os 258 | C-16 | A E-08 |
| 14 | `design.json` | Decidida: manter, sem regenerar | DOC-10; pendência 13 | — |
| 15 | Critério da flag `volumeResolved` | Decidida: cumprido; a flag e os ramos mortos saem na E-17 | C-33; A-28 | A E-17 |
| 16 | A-27 e topologia | Decidida: mesma origem, com proxy em `/api`; a URL segue com Rafael Santos | A-27, N-8, A-56, DOC-32, LAC-16 | A E-25 e a E-21 |
| 17 | Runner de testes no lugar do Karma | Decidida: Vitest, pelo builder de testes unitários do Angular CLI | Pendência 27 | A E-25 |
| 18 | E-16b (registro desta reauditoria) | Decidida: aprovada, com a E-16a | DOC-21 a DOC-24, DOC-31, DOC-32, DOC-42 | A E-16 |
| 19 | Excluir os originais de `docs/audit` | Decidida: só depois de o back trocar as referências | DOC-28, DOC-33; pendência 20 | O passo final da E-05 |
| 20 | Exceção do C-01 nas skills | Decidida: registrar nas skills, com autorização específica | C-01; pendência 6 | A E-07 |
| 21 | Branches, PRs e specs soltas do back | Decidida: fica com o back; o front não altera o back | BK-5, BK-27 a BK-29 | A E-09 (back) |

##### Ordem

1. Onda 0: decidida em 05/11, menos a decisão 12, que segura só a E-15 e o mecanismo da 047.
2. E-16a e E-16b: feitas em 05/11 (`455230a` e `0e7cc4e`), sem esperar o commit da outra sessão.
3. No front, sem o back: a E-18 (05/11) e o resto da E-02, a E-17 e a E-03 (06/11), feitas; a E-19 e a
   E-20, em andamento desde 06/11; depois, os restos do §16.10.
4. Documentos e skills, com autorização: E-06 e E-07; a E-08, em andamento desde 06/11.
5. A E-04 assim que a API estiver disponível.
6. Back: E-21, E-09, E-14, E-15, E-22, E-23 e E-10; depois a E-11, na ordem 046, 048 e 047.
7. A E-24, trilha por trilha, depois de cada entrega da E-11 e da 049.
8. A E-25 antes da produção; o Bootstrap local, as vulnerabilidades e o runner podem vir antes. O passo
   final da E-05 depois da E-09.

##### O que NÃO refazer, porque já funciona

- Fronteiras do front: 0 violação (414 imports de produção entre pastas e 219 nas specs, pela matriz da
  `ca-review`); nenhum barrel exporta componente ou rota.
- Lint: `eslint src` com 0 erro e 0 aviso.
- SSR removido, fontes e Boxicons no build, SRI no Bootstrap e `@ngrx/signals` estável (E-12).
- As correções da E-01 (C-09, A-42, R-07, A-33, N-1, N-3, N-6 e a spec do `SideMenuNavComponent`),
  validadas commit a commit.
- As correções da E-18 e do bloco E-02, E-17 e E-03 (30 commits), validadas commit a commit (§3).
- Camadas do back: 0 violação de dependência (projetos e `using`).
- `FallbackPolicy`, matriz de autorização por rota e snapshot aprovado do OpenAPI (G1 da 049).
- 940 testes unitários e 134 de arquitetura do back passando, com build sem aviso.
- A consolidação do `AUDITORIA.md`: anexos idênticos aos originais e os 69 IDs dos originais presentes na
  Parte I, cada um no catálogo do §4.

#### 16.8 Decisões de 05/11

Rafael Santos aprovou, em 05/11 por volta das 22:15, "todas as recomendações técnicas padrão apresentadas
no relatório". Pediu também que se mantenham a consistência arquitetural, a prioridade 046 → 048 → 047 e
o tratamento do DIV-3 e do A-59.

A coluna **Origem** diz de onde vem cada escolha:
- **Relatório:** recomendação dos relatórios ou do plano de 05/11, agora aprovada.
- **Decisão anterior:** decisão de Rafael Santos já registrada antes, que continua valendo.
- **Padrão técnico:** o relatório não recomendava nada para esse item. Vale o padrão mais coerente com
  a arquitetura, em que a regra fica no back e o front só a espelha. Nenhum desses trava o bloco inicial,
  e cada um pode ser revisto antes da etapa que destrava.

A execução de tudo o que mexe no back, no `CLAUDE.md`, nas skills, em contratos ou em migrations continua
dependendo de autorização específica. Vale também a regra de 04/11: o back não é alterado sem autorização.

| # | Decisão | Escolha | Origem | Destrava |
|---|---|---|---|---|
| 1 | Regra de reabrir | Vale o código do back: o dono reabre só com `tickets:reopen-own`, e os outros com `tickets:manage`. O front corrige o DIV-2. A RN-06, a 047 e o anexo C da 049 são corrigidos no back (BK-6) | Relatório (specs-046-048: "o DIV-2 pode ser corrigido no front já"; princípio de 31/10, §4.7: o servidor é a fonte da regra) | E-02 (DIV-2); E-09 (BK-6, com autorização para o back) |
| 2 | Assumir chamado que já tem responsável | Exige `tickets:assign`, numa spec própria no back (LAC-9). "Atribuir a mim" sem responsável segue com `tickets:manage`. O front de hoje já se comporta assim | Relatório (specs-046-048, DEC-6 da 047) | E-10 e E-11 (back); E-24 |
| 3 | Administrador tirar a própria função havendo outro | A proteção continua e vira regra do back (LAC-8). O front mantém o espelho até o back entregar | Padrão técnico | E-10 (back); E-24 |
| 4 | Mínimo de 2 caracteres no nome | O mínimo atual (2) vira regra do back (LAC-10). O front mantém o espelho até lá | Padrão técnico | E-10 (back); E-24 |
| 5 | Atalhos do Início | Seguem as permissões (`tickets:create` e `tickets:view-own`), não o perfil deduzido | Relatório (aceite da E-17; DIV-9) | E-17 |
| 6 | Responsável de departamento | Só usuário ativo, a regra que o front já aplica. O back recusa responsável inelegível e oferece uma rota de candidatos com a permissão da tela (`departments:manage`; Q-65 da 049) | Padrão técnico (com base no aceite da E-23) | E-23 (back e front) |
| 7 | Datas de filtro | Dia de São Paulo, como já é nos chamados (`LocalDatePeriod`) | Relatório (BA-13; E-23) | E-23 (back) |
| 8 | DECs da 046 | DEC-1 (a). DEC-2 (a), com o caminho público configurável. DEC-3 com `SameSite=Strict` mais um cabeçalho obrigatório nas rotas de sessão. DEC-4 (a), mesma origem com proxy em `/api` e `ForwardedHeaders`. DEC-5 (a), corte direto, se não houver outro consumidor da API e o snapshot do OpenAPI mudar no mesmo PR. DEC-6 (a), obrigatória. DEC-7 (proposta): política própria para `users/refresh-token`, particionada pela sessão, decidida antes da primeira implantação atrás de proxy. DEC-8 (proposta): manter o 400 e corrigir o AC-4 da 046 e o AC-508 da 049. No front: coordenar a renovação entre abas (A-55) | Relatório (specs-046-048, §3.7) | E-09 e E-11 (back); E-24 |
| 8a | DEC-63 da 049, junto com a 046 | (b): a troca da própria senha reemite a sessão pelo cookie, sem token no corpo, como pede a DEC-1 (a) | Padrão técnico | E-09 e E-11 (back); E-24 |
| 9 | DECs da 047 | DEC-1: booleanos por ação, acrescentando `canStartProgress` e `canResolve`. DEC-2 (b), com o Monitor. DEC-3 (b), sem `nextStatuses`. DEC-4: depois da fase 2 de chamados da 049. DEC-5 (a): mensagens e anexos numa spec própria (LAC-14) | Relatório | E-09 e E-11 (back); E-24 |
| 10 | DECs da 048 | DEC-1 (a), com a LAC-2: ciclo vigente na lista, no filtro, na ordenação, nos dois resumos e no detalhe. Os reabertos vencidos passam a contar como atrasados. DEC-2: uma definição nomeada em SQL, com teste de concordância. DEC-3 (b): depois da parte 1 da 043. DEC-4 (b). Inclui a DEC-66 da 049 (`serverNowUtc` em `GET tickets`) | Relatório | E-09 e E-11 (back); E-24 |
| 11 | Portão G6 da 049 | Antecipar a 046 e a 048, na ordem 046 → 048 → 047. A 046 não depende da 043; a 048 vem depois da parte 1 da 043 | Relatório (ordem do specs-046-048) e pedido de 05/11 | Mudança no texto da 049 (back, com autorização) |
| 12 | Conferência de permissão por recurso (BA-7) | **Fica aberta**, com esta proposta: uma peça reutilizável (regra de domínio ou serviço injetado), usada pelo handler e pela consulta das ações permitidas da 047, sem método privado no handler, como já manda a DEC-30 da 041 | Padrão técnico; precisa da confirmação de Rafael Santos, porque muda as instruções do back (E-15) e cruza com a 043 em andamento | E-15 (back), T-6 da 049, T-5 da 043 |
| 13 | Doc comments | Completar os 258 `/** */` em português que faltam, como o `CLAUDE.md` exige | Relatório (o `CLAUDE.md` trata a regra como convenção estabelecida) | E-08 |
| 14 | `design.json` | Manter, sem regenerar | Decisão anterior (04/11: não rodar o `/impeccable document` nem regenerar) | — |
| 15 | Critério da flag `volumeResolved` | Cumprido: a reauditoria comprovou o contrato do A-28 (`ResolvedCount` sempre presente e rotas abertas a todo usuário autenticado). A flag e os ramos mortos saem na E-17, e a validação visual fica na E-04 | Padrão técnico (com base no veredito do A-28 no etapas.md) | E-17 |
| 16 | A-27 e topologia | Mesma origem, com proxy em `/api` (DEC-4 (a)). A URL de produção continua com Rafael Santos, para informar na implantação | Relatório | E-25; E-21 |
| 17 | Runner de testes no lugar do Karma | Vitest, pelo builder de testes unitários do Angular CLI, padrão para projetos novos desde o Angular 21. Executa na E-25, com o mesmo número de casos | Padrão técnico | E-25 |
| 18 | E-16b (registro da reauditoria) | Aprovada | Pedido de 05/11 | E-16 |
| 19 | Excluir os originais de `docs/audit` | Só depois de o back trocar as referências (E-09); então o passo final da E-05 | Decisão anterior (04/11) | E-05 |
| 20 | Exceção do C-01 nas skills | Registrar a exceção nas skills, para documentar o que o código já faz. A edição das skills precisa de autorização específica (E-07) | Padrão técnico | E-07 |
| 21 | Branches e PRs do back com specs fora da `main`; quem versiona as specs soltas | Fica com o back. A sessão do back versiona as 11 pastas, e o destino dos PRs #34 e #58 e da branch da 036 Rafael Santos decide com ela. O front não altera o back | Padrão técnico (regra de 04/11) | E-09 (back) |

##### DIV-3 e A-59

- **DIV-3 (Alta):** o `PUT` do chamado reenvia o estado lido na tela.
  - A correção é do back: `PUT` parcial e versão do chamado (T-501 e T-502 da 049; Q-83).
  - O front troca na E-24, na trilha "contrato do chamado", que vem em primeiro lugar.
  - Mitigação proposta no front, opcional e dentro da E-02: reler o chamado logo antes do `PUT` de cancelar
    na lista e no detalhe. Isso encurta a janela em que a edição de outra pessoa se perde, de "desde a
    carga da tela" para milissegundos. Não elimina a corrida e sai quando o back entregar o `PUT` parcial.
  - Feita em 06/11 (`e813444`), para todo `PUT` do chamado, não só o de cancelar (§8.1).
- **A-59 (Alta, inferido):** o lote de Usuários contra o limite de 100 requisições por minuto.
  - Primeiro item da E-04: reproduzir com a API de pé.
  - Confirmado, a correção é a REQ-505 da 049 com a spec 034 (E-23, back), e o front passa a mandar no
    máximo 2 requisições para 100 selecionados.
  - Até lá, nada muda no front sem a reprodução.

#### 16.9 Limites e o que não foi verificado

**Não verificado, com o motivo:**

- Build, testes e lint da `main` não foram reexecutados: valem os logs da ponta (`rebase/val-e12/13-333f4c2-ponta/`).
- Comportamento em execução: os 403 e o 429 do §16.4, o `GET /tickets/mine` ao abrir `/tickets/novo`, a
  recarga dos anexos, a corrida entre abas, o `Retry-After` entre origens e a resposta fora de ordem da
  busca. Estão comprovados no código e inferidos no efeito; ficam para a E-04, que exige a API e o login.
- Aparência: o realce novo, os anéis de foco, o esmaecido do Monitor, o chevron, a nota "em breve", o
  R-05 em 844×390 e o cabeçalho do diálogo com o X de 44px; o anúncio do aviso do A-42 por leitor de
  tela; o contraste dos contornos locais (R-09) e a revalidação do A-34; o tamanho real dos CSS no build.
- Testes de integração do back (674), a auditoria SDD (BK-30), o CI do PR #71 e o estado dos PRs #34 e
  #58 no GitHub: exigem banco, histórico Git na cópia ou rede.
- Conteúdo do working tree da 043 no back e das edições não commitadas do front: só a lista de arquivos e
  as cópias das 19:08.
- Universos de 31/10 de sete regras do front e os denominadores de 31/10 do back: reconstruídos pela
  aritmética dos totais publicados.
- Origem das decisões de Supervisor, RH e "5S" do `PRODUCT.md` (DOC-30); se o Impeccable depende do
  comportamento de tela no `DESIGN.md`; se o repositório no GitHub é público (o §14 expõe caminhos locais).
- Impacto no front das specs 035, 050 e 051 (§6, item 22).

**Divergências entre frentes e como ficaram:**

| Tema | O que cada frente disse | Como ficou |
|---|---|---|
| Correção do DIV-2 | specs-046-048: corrigir no front já; separacao: decidir antes, porque a documentação do back diz a regra do front | Decidido em 05/11 (decisão 1): vale o código do back; o front corrige na E-02, e o texto do back é corrigido (BK-6) |
| Estado do DIV-9 | docs.md (§9.2) e specs-046-048 (§6.1): corrigido pelo PR #5; separacao: em parte, pelo diff do `4b7b0de` (`dashboard.component.ts:163-167`) | Em parte, pela evidência do código (decidido pelo coordenador) |
| Gravidade do A-47 | fe-arch: Média (erro de outra origem visível a todos); separacao: Baixa (o 403 só com funções personalizadas) | Média, pela evidência do erro visível |
| Classe dos números do front | docs.md: DECLARADO; etapas: COMPROVADO por log | COMPROVADO por log, não reexecutado: as etapas leram os logs |
| Linha da flag em `environment.prod.ts` | separacao: 20-22; docs, fe-arch e etapas: 9-11 | 9-11, conferido na cópia de `333f4c2` |
| Linhas da regra de reabrir | docs.md: `ReopenTicketCommandHandler.cs:34-36`; separacao e specs: `:33-41` | `:33-41`, a faixa que inclui a conferência inteira |

#### 16.10 Achados da execução de 05 e 06/11

O bloco E-02, E-17 e E-03 deixou sete pontos fora do escopo dos commits. Esta redação conferiu cada um no
código do `387f5e6`, só por leitura, sem build nem testes; o back, na cópia fixa de `251da97` (§16.1).
As classes e a gravidade seguem o §16. A coluna Origem diz a etapa e o ID ao lado do qual o ponto
apareceu; a Etapa sugere onde ele entra, e "resto" é o que sobrou de uma etapa já feita.

| ID | Grav. | Achado | Evidência | Classe | Origem | Estado | Etapa |
|---|---|---|---|---|---|---|---|
| A-60 | Baixa | A conferência local de anexos não recusa arquivo vazio nem nome com "..", que o back recusa no validator do comando (com caractere de controle e barra no nome); o front envia, e só a resposta do back avisa. A política (`GET /ticket-attachments/policy`) não traz essas regras, e o A-57 seguiu só o `TicketAttachment.Create` | front `tickets/application/ticket-attachments.store.ts:30-51,174-179,234-239`; back `UploadTicketAttachmentCommandValidator.cs:10-16,18`, `TicketAttachment.cs:84-108` e `TicketAttachmentPolicyResponse.cs:3-9` (cópia `251da97`) | COMPROVADO (código dos dois lados); a mensagem do back na tela é INFERIDA | E-02 (A-57) | Aberto | E-02 (resto) |
| A-61 | Média | Para quem não tem `tickets:manage`, o card "SLA cumprido" do Início é fixo, com `unavailable: true`, e mostra "Disponível em breve" em produção; o Guia promete "O último card vai mostrar quantos chamados resolvidos cumpriram o prazo". A rota aberta a todo usuário só traz contagens por status, e a que traz o SLA exige `tickets:manage`. É a promessa de recurso futuro que o A-50 tirou do gráfico | `dashboard/dashboard.component.ts:144,348-353,364-374`; `dashboard/dashboard-kpi-strip.component.ts:23,67-68`; `dashboard/dashboard-guide.component.html:13`; o teste `dashboard.component.spec.ts:521-524` fixa o texto; back `GetStatusCounts.cs:13-25`, `TicketStatusCountsResponse.cs:6-14` e `GetOverview.cs:47` (cópia `251da97`) | COMPROVADO (código e teste) | E-17 (A-50) | Aberto | E-17 (resto) |
| A-62 | Baixa | Na criação de chamado, "Cancelar" e o caminho de navegação ("Meus Chamados") levam a `/tickets`, que exige `tickets:view-own`; sem ela, o guard manda ao Início. O A-47 corrigiu só o destino depois de criar | `tickets/feature-ticket-create/ticket-create.component.html:2,99`; `core/routes/app.routes.ts:51-53`; `shared/guards/permission.guard.ts:36-37`; × `ticket-create.component.ts:107-120` | COMPROVADO (código) | E-03 (A-47) | Aberto | E-03 (resto) |
| A-63 | Baixa | As Stores de mensagens e de histórico, da raiz, não limpam o `loadMoreError` ao trocar de chamado nem ao voltar à primeira página: a falha do "carregar mais" de um chamado aparece no próximo. A de anexos limpa desde o C-13 | `tickets/application/ticket-messages.store.ts:22,67-70,76-82`; `ticket-history.store.ts:20,60-63,69-75`; `ticket-detail.component.html:231-232,428-429`; × `ticket-attachments.store.ts:117,129` | COMPROVADO (código); o erro no chamado seguinte é INFERIDO, sem teste | E-03 (C-13) | Aberto | E-03 (resto); ou com o C-18 (E-19) |
| DIV-16 | Baixa | Quem tem `users:assign-roles` sem `roles:read` vê as listas de funções vazias, porque `GET /roles` exige `roles:read` e a tela só carrega a lista com ela. O cadastro diz "Nenhuma função cadastrada ainda", cria a pessoa sem funções e não mostra o aviso de "sem nenhuma função"; "Atribuir funções" abre sem opções. Só com funções personalizadas | `users/feature-user-list/user-list.component.ts:334-337,427-428`; `.html:265-268,391-410,485-500`; back `Roles/GetAll.cs:22` e `AssignRoles.cs:29` (cópia `251da97`) | COMPROVADO (código); a tela em execução é INFERIDA | E-02 (DIV-12) | Aberto (decisão: o front esconde a escolha sem `roles:read`, ou o back abre a lista a `users:assign-roles`) | E-02 (resto); E-23, se for no back |
| DOC-44 | Baixa | O `DESIGN.md` ainda descreve a flag tirada no `5b67103` em 3 pontos: a regra de fila "só com a flag dos resolvidos" (a frase de fila também saiu, A-53); o rodapé "o fluxo ainda é o da empresa toda", quando o fluxo segue o escopo e o rodapé diz "Chamados com os filtros"; e o "Disponível em breve" ligado ao `DASHBOARD_FEATURES`, que não existe mais. O terceiro amplia o DOC-14. O rodapé "com o intervalo e o que ainda vem" também ficou para trás (A-50) | `DESIGN.md:621-623,640-643,743-746`, sem commit desde o `333f4c2`; busca por `DASHBOARD_FEATURES` e `volumeResolved` em `src/`: 0; `dashboard/dashboard-hero-chart.component.html:163-169` | COMPROVADO | E-17 (C-33) | Aberto | E-06 |
| C-42 | Baixa | O tipo `'unavailable'` do `DashboardNoticeComponent`, que é o padrão do `kind`, ficou sem uso em produção: os 7 usos passam `kind="error"`, e só specs usam o outro ramo. O comentário ainda o descreve como rota que "o back-end ainda não entrega" | `dashboard/dashboard-notice.component.ts:9-10,33-38,75-76`; usos em `dashboard-hero-chart.component.html:64,93`, `dashboard-insights.component.html:34`, `dashboard-kpi-strip.component.ts:48`, `dashboard-metric-group.component.ts:72`, `dashboard-times.component.ts:49` e `dashboard.component.html:123`; specs `dashboard-notice.component.spec.ts:75-77` e `dashboard-presentation.components.spec.ts:60-62` | COMPROVADO (busca nos templates e nas specs) | E-17 (C-33) | Aberto | E-17 (resto) |

**Não verificado:** o efeito em execução (a mensagem do back no A-60, o card do A-61 no navegador, o erro
que passa de um chamado ao outro no A-63 e as listas vazias do DIV-16), que fica para a E-04; e o back
depois do `251da97`, que esta redação não releu (o A-60, o A-61 e o DIV-16 citam a cópia fixa).

## Anexo A — FRONTEND_AUDIT.md (texto original preservado)

Origem: `docs/audit/FRONTEND_AUDIT.md` no commit `7fe3bec`; texto sem alterações.

<!-- ANEXO-A-INICIO -->
# Auditoria do front-end — 2026-10-29

Escopo: todo o `src/` do `tickest-pristine-front` (Angular 22, NgRx Signal Store, Karma/Jasmine),
confrontado com as skills do projeto (`.claude/skills/`: `ca-review`, `add-feature`, `add-tests`,
`add-context`), com o `CLAUDE.md` e com o back-end na `origin/main` do `tickest-pristine`
(`0eff7b6` na auditoria; conferida de novo em `a72e07b`, PR #54, spec 038, em 2026-10-30). O back-end foi só lido.

**Gravidade:** Crítica (segurança, perda de sessão ou dado), Alta (contrato quebrado ou recurso que
não funciona), Média (divergência de regra visível ao usuário, violação de limite de módulo), Baixa
(duplicação ou risco futuro sem efeito hoje).

**Classe:** Defeito (comprovado), Skill (violação explícita de uma skill), Back-end (responsabilidade
do servidor no cliente), Melhoria (justificada, não obrigatória), Mantido (analisado e considerado
correto).

## Resumo

A base está bem estruturada. Não há `any`, `console.log` nem `HttpClient` fora de
`infrastructure/`. Nenhum componente injeta Data Service, e nenhum barrel exporta componentes ou
rotas. Toda mutação passa pela API e recarrega do servidor, e paginação, filtro e ordenação das
listas são do servidor. Os problemas reais encontrados:

| Id | Gravidade | Classe | Achado | Estado |
|---|---|---|---|---|
| A-01 | Crítica | Defeito | Corrida de renovação entre abas pode revogar todas as sessões do usuário | Corrigido |
| A-02 | Alta | Defeito | Falha de rede ou 5xx na renovação desloga o usuário | Corrigido |
| A-03 | Média | Defeito | 401 de requisição enviada com token já renovado dispara segunda renovação | Corrigido |
| A-04 | Alta | Defeito | Contrato da spec 029 com nomes errados: "Aguardando" nunca aparece e o filtro é ignorado | Corrigido |
| A-05 | Alta | Back-end | Cor de função gravada no `localStorage` (persistência simulada) | Removido (BR-001); o requisito do back-end está na spec 044 do `tickest-pristine` |
| A-06 | Média | Defeito | "Reabrir" visível sem `tickets:reopen-own`/`tickets:manage` | Corrigido |
| A-07 | Média | Defeito | "Editar" visível para dono sem `tickets:update-own` | Corrigido |
| A-08 | Média | Defeito | "Atribuir responsável" visível sem `tickets:assign` | Corrigido |
| A-09 | Média | Defeito | Nome limitado a 50 caracteres; o servidor aceita 100 e o perfil fica impossível de salvar | Corrigido |
| A-10 | Média | Skill | Início (shell) importa componente interno de `tickets/ui` | Corrigido |
| A-11 | Baixa | Defeito | Novo pedido de confirmação deixava o anterior sem resposta | Corrigido |
| A-12 a A-27 | — | Mantido / Melhoria / Pendência | Ver seções abaixo | Documentado |
| A-34 | Alta | Defeito | Foco visível: anéis do Bootstrap entre 1,2:1 e 2,2:1, `.btn-primary` e campos sem indicador no tema escuro, campos com 1,5px | Corrigido no `04ca7e1` (sessão b345b068) e verificado na aplicação real (ver `FINAL_ACCEPTANCE_AUDIT.md`) |
| A-37 | Média | Defeito | Campo inválido sem borda vermelha no tema escuro (área logada) e no login (claro); o erro fica só no texto e no ícone | Corrigido (autorizado em 2026-10-30; sessão 9b) e verificado na aplicação real |
| A-38 | Média | Defeito | Diálogo "Atribuir responsável" oferecia qualquer usuário ativo (GET /users, exige `users:read`); a atribuição só aceita elegíveis (`TicketAssigneeEligibility`) | Corrigido (era A-26) |
| A-39 | Baixa | Defeito | Limites de anexo duplicados no front em vez da política do back-end | Corrigido (era A-25) |
| A-40 | Baixa | Defeito | "Hoje" do limite de pontos do gráfico em UTC: entre 21h e meia-noite contava um dia a mais | Corrigido |
| A-41 | Média | Defeito | Meus Chamados com rolagem horizontal da página inteira (9px no desktop, 347px no tablet de 768px) | Corrigido |
| A-42 | Alta | Defeito | Um 429 (limite global do back-end, 100 requisições/min por usuário) em GET /users/me mandava pro login quem tinha sessão válida; um 429 na renovação também deslogava | Corrigido em duas etapas: novas tentativas e, depois delas, tela recuperável em vez do login (ver abaixo) |
| A-43 | Média | Defeito | Achado na revisão técnica final: com o token de acesso vencido e a renovação falhando de forma passageira (rede, 429, 5xx), o interceptor devolvia o 401 original; o GET /users/me lia isso como sessão recusada, ia pro login e, dentro de `/sessao-indisponivel`, apagava a sessão | Corrigido |
| A-44 | Baixa | Pendência técnica | `admin-master.guard.ts` ignora o resultado `unavailable` de `ensureLoaded()` (trata qualquer resultado como carregado e decide só pela permissão) | Corrigido no saneamento de 2026-10-30 (com o C-06) |
| A-45 | Baixa | Defeito | Achado na revisão final da sessão 9b: escolher um item (ou o logo) da gaveta deixava o foco no link, que some com a gaveta; o Tab recomeçava do topo do documento. O logo navegava sem fechar a gaveta | Corrigido e verificado na aplicação real |
| A-46 | Baixa | Defeito | Achado na revisão final da sessão 9b: com a gaveta aberta, o Tab saía dela para os toasts, montados fora do layout | Corrigido e verificado na aplicação real |
| R-01 a R-04 | Alta (R-01 a R-03), Média (R-04) | Defeito | Menu lateral em gaveta (abaixo de 1200px): controles da gaveta fechada no Tab, foco que não entrava na gaveta aberta, itens fora da tela no celular deitado sem rolagem, Esc que não fechava | Corrigido e verificado na aplicação real (ver abaixo) |
| A-35 | Média | Defeito | Achado na revisão final: login com outra conta em outra aba deixava esta aba com usuário, permissões e dados da conta anterior | Corrigido |
| A-36 | Baixa | Defeito | Achado na revisão final: comentário com nome do template de referência e comentário desatualizado sobre rotas do back-end | Corrigido |

## Método e escopo

- **Contrato real como referência:** cada divergência foi checada no back-end da `origin/main`;
  nenhum endpoint ou campo foi inventado.
- **Visibilidade, não autorização:** as regras de permissão do front só escondem o que a API
  recusaria. A autorização continua no servidor.
- **Remover só o comprovado:** lógica que parece de negócio, mas só apresenta números do servidor
  ou orquestra chamadas que ele valida, ficou e está justificada em "Analisado e mantido".
- **Trabalho paralelo no mesmo working tree:** cada alteração foi um hunk pequeno, aplicado depois
  de reler o arquivo, sem stage nem commit.
- **Fora do escopo:**
  - alterações no back-end;
  - tokens em cookie (A-23);
  - ligar as flags do Início (A-28);
  - URL de produção (A-27);
  - ciclo de SLA na listagem (A-30).

## Achados corrigidos

### A-01 — Corrida de renovação de token entre abas (Crítica)

**Evidência:** `shared/services/session.service.ts` lia os tokens do `localStorage` só ao iniciar e
não ouvia o evento `storage`. Quando a aba A renovava, a aba B continuava com o refresh token antigo
na memória e o reenviava na sua próxima renovação. O back-end
(`Users/Refresh/RefreshTokenCommandHandler.cs`, `RevokeSessionsIfTokenWasReusedAsync`) trata o reuso
de um token já trocado, fora da janela de tolerância, como vazamento e **revoga todas as sessões do
usuário**. Em seguida, a aba B chamava `clearSession()` e apagava também os tokens novos da aba A.

**Correção:** o `SessionService` ouve `storage` e aplica nesta aba os tokens gravados ou removidos
por outra (o listener sai no `DestroyRef`). Testes: três casos em `session.service.spec.ts`.

### A-02 — Falha passageira na renovação desloga (Alta)

**Evidência:** `shared/services/token-refresh.service.ts` fazia `catchError(() => of(null))`, e o
interceptor trata `null` como refresh token recusado: sem rede ou com o servidor em 5xx, o usuário
era deslogado.

**Correção:** só a recusa do back-end vira `null`; status 0 e 5xx saem como erro, e o interceptor
devolve o 401 original sem limpar a sessão. Testes: `token-refresh.service.spec.ts` (novo, 5 casos)
e `auth.interceptor.spec.ts`.

### A-03 — Segunda renovação para requisição com token antigo (Média)

**Evidência:** `shared/interceptors/auth.interceptor.ts` sempre renovava no 401. Uma requisição
enviada antes de outra renovação terminar recebia 401 e trocava o refresh token de novo, sem
necessidade.

**Correção:** se o token atual da sessão é diferente do enviado, repete com o atual, sem renovar.

### A-04 — Contrato da spec 029 com nomes errados (Alta)

**Evidência:** o back-end (spec 029, PR #49, na `origin/main`) devolve
`attention.waitingOnRequesterCount`/`waitingOnAgentCount` em `GET /tickets/stats/overview`
(`TicketOverviewResponse.cs`), `waitingOn` em cada item de `GET /tickets`
(`TicketSummaryResponse.cs`) e aceita o filtro `?waitingOn=` (`Endpoints/Tickets/GetAll.cs`). O front
lia `awaitingRequesterCount`/`awaitingAgentCount`/`awaiting` e enviava `?awaiting=`. Resultado: os
cartões "Aguardando a equipe/o solicitante" do Início nunca apareciam, a linha e o painel do
Monitorar nunca mostravam a espera, e o filtro "Aguardando" do Monitorar era ignorado pelo servidor
(a lista vinha sem filtro).

**Correção:** as entidades (`tickets/entities/ticket-dashboard.ts`, `ticket-monitor-item.ts`) usam
os nomes da API; o Data Service manda `waitingOn`. `awaiting` continua só como nome do filtro na tela
e na URL do Monitorar. O enum é numérico nos dois lados (o back não usa `JsonStringEnumConverter`).

### A-05 — Cor de função no navegador (Alta, Back-end)

Removido em 2026-10-29 (BR-001). O requisito do back-end, para o recurso voltar, está na spec 044 do
back-end (`tickest-pristine/specs/044-cor-do-badge-da-funcao/spec.md`, em descoberta). Ela substitui o documento temporário `BACKEND_RECONSTRUCTION.md`,
removido na consolidação de 2026-10-30.

- **O que existia no front:**
  - `shared/utils/role-colors.util.ts` (excluído, com a spec) guardava no `localStorage`, na chave
    `tickest.roleColors`, um mapa *nome da função → `#rrggbb`* e validava o contraste do badge;
  - a tela Funções tinha o diálogo "Cor do badge…" (`roles/feature-role-list/*`);
  - os badges usavam `.badge-role-custom` (`styles.css`) em Usuários, no painel de informações e no
    diálogo de atribuição.
- **Por que saiu:** a cor é um dado da função que o administrador configura para todos. Gravada no
  navegador:
  - não sincronizava entre usuários nem dispositivos;
  - se perdia ou mudava de função ao renomear;
  - não tinha autorização.
- **Hoje:** todos os badges de função usam `bg-label-primary`, e nenhuma tela lê a chave antiga.
- **Backup** do estado anterior (diff e os arquivos excluídos), local e temporário:
  `C:\Users\rafae\AppData\Local\Temp\claude\c--dev-tickest-pristine-front\65d7fc55-6391-4e98-8ae7-b7f896419fc4\scratchpad\backup-br001\`.
- **No front, depois da entrega da spec 044:**
  - o campo de cor em `roles/entities/role.ts` e `users/entities/user-summary.ts`;
  - a gravação no `RoleDataService` e no `RolesStore`, que recarrega no sucesso;
  - o diálogo de cor na tela Funções;
  - `.badge-role-custom` lendo a cor da API.

  O diálogo de atribuição não volta a ter badge de função: `GET /tickets/assignees` não devolve
  funções (A-38).

### A-06, A-07, A-08 — Ações visíveis para quem a API recusa (Média)

**Evidência no back-end (`origin/main`):**

- Reabrir (`ReopenTicketCommandHandler` + `TicketAccessGuard.EnsureOwnerOrManagerAsync`): dono com
  `tickets:reopen-own`, ou `tickets:manage`.
- Editar descrição (`UpdateTicketCommandHandler`): dono com `tickets:update-own`, ou `tickets:manage`.
- Atribuir (`Endpoints/Tickets/Assign.cs` exige `tickets:manage`; `AssignTicketCommandHandler`
  exige também `tickets:assign` quando o responsável não é quem chama).

**No front:** o detalhe e a lista mostravam "Reabrir" para qualquer chamado inativo e "Editar" para
o dono sem checar `update-own`. Detalhe, Monitorar e Alertas do Início mostravam "Atribuir
responsável" (escolha de qualquer pessoa) só com `tickets:manage`. Resultado: o clique terminava em
403.

**Correção:** `tickets/ui/ticket-action-permissions.ts` (novo) concentra as três regras de
visibilidade, espelhando os handlers, e é usado pelo detalhe, pela lista e pelo Monitorar. Os
Alertas do Início recebem `canAssign` (`tickets:assign`). "Atribuir a mim" no Monitorar continua
só com `tickets:manage`, como no back-end. Isso é só visibilidade: a autorização continua no
servidor.

### A-09 — Limite de nome divergente (Média)

**Evidência:** `UserValidationRules.NameMaxLength = 100` no back; o front usava `maxLength(50)` no
cadastro, na edição de usuário e no perfil. Quem tinha nome entre 51 e 100 caracteres (aceito pela
API) abria o próprio perfil com o formulário inválido e não conseguia salvar.

**Correção:** `USER_NAME_MAX_LENGTH = 100` em `users/entities/user-profile.ts`, usado nos validadores,
no `maxlength` dos campos e nas mensagens. O mínimo de 2 caracteres continua (o servidor só exige não
vazio): é regra de experiência, mais restrita, mantida por decisão de não mudar o comportamento
visível sem pedido.

### A-10 — Limite de módulo do diálogo de atribuição (Média, Skill)

**Evidência:** `dashboard/dashboard.component.ts` importava
`../tickets/ui/ticket-assign-dialog/...`. Pela `ca-review`, o shell só importa barrels e `feature-*`,
e um componente de apresentação reutilizado fora do domínio vai para `shared/ui/`.

**Correção:** o diálogo foi para `shared/ui/ticket-assign-dialog/`. A dependência de domínio
(`UserSummary` de `users`) virou a interface estrutural `AssigneeCandidate`, que o `UserSummary` já
satisfaz. Detalhe, Monitorar e Início importam do novo caminho. `DESIGN.md` atualizado.

### A-11 — Confirmação substituída sem resposta (Baixa)

**Evidência:** `ConfirmDialogService.confirm()` trocava o `Subject` sem completar o anterior; quem
esperava a primeira confirmação nunca recebia resposta.

**Correção:** o pedido anterior responde `false` e completa. Teste novo em
`confirm-dialog.service.spec.ts`.

### A-34 — Foco visível abaixo de WCAG 2.4.7/1.4.11 (Alta)

**Evidência:** a auditoria original não mediu o foco no navegador. Medições posteriores (2026-10-29,
estilos calculados) mostraram:

- o anel translúcido do Bootstrap entre 1,2:1 e 2,2:1 em todos os botões;
- no tema escuro, o `.btn-primary` sem indicador nenhum (`[data-bs-theme="dark"] .btn-primary {
  box-shadow }` apaga o anel);
- no tema escuro, os campos sem troca de borda (`[data-bs-theme="dark"] .form-control { border-color }`
  vence o `:focus`);
- os campos com indicador de 1,5px.

As medições estão no scratchpad desta sessão (`focus/PROPOSTA-TECNICA-FOCO.md`) e no da sessão
b345b068 (`fv-antes.json`: 298 focos, 171 abaixo de 3:1, na aplicação real).

**Verificação independente por pixels** (captura sem foco × com foco, mudança ≥ 3:1; roteiro
`scratchpad/focus/pixeldiff.mjs`, calibrado contra os casos conhecidos):

- **Correção de diagnóstico:** `.btn-outline-secondary` ("Guia da tela", "Com filtros") ganha no
  foco o fundo de hover preenchido (4,7:1 no claro, 8,2:1 no escuro). Já passava na 1.4.11 pela troca
  de fundo; a medição por estilo calculado só olhava o anel e o marcou como reprovado. Reprovam de fato:
  `.btn-primary`, o botão fantasma (`.btn-row-actions`), `.btn-danger`, `.btn-link`, o checkbox, o
  fechar e os campos.
- **Campo com erro no claro:** a borda vermelha já existe sem foco, então a mudança no foco é só o
  anel de 1px (abaixo dos 2px exigidos). Repassado à sessão responsável.
- **Defeito anterior, no tema escuro:** campos inválidos perdem a borda vermelha.
  `[data-bs-theme="dark"] .form-control { border-color }` vem depois do `.is-invalid` do Bootstrap,
  com a mesma especificidade, e o erro fica só na mensagem. Repassado à sessão responsável
  (`styles.css` está no escopo dela).

**Estado:** corrigido no commit `04ca7e1` pela sessão b345b068 (publicado em `origin/main`).

Verificação independente desta sessão, por pixels, na aplicação real com sessão de Administrador,
nos dois temas:

- 734 controles: 305 reprovados antes, 19 depois, 0 regressões;
- os 19 foram conferidos em captura: são artefatos de medição, divisórias internas de grupo ou
  fatias da barra que passam na 1.4.11.

### A-37 — Borda de erro dos campos inválidos (Média)

**Evidência (aplicação real, estilos calculados):**

- Novo chamado no escuro: borda `rgb(58, 63, 68)` em vez de vermelha, porque
  `[data-bs-theme="dark"] .form-control, [data-bs-theme="dark"] .form-select { border-color }` vem
  depois do `.form-control.is-invalid` do Bootstrap, com a mesma especificidade.
- Login (claro): borda `rgb(217, 222, 227)`, porque o `.form-control` do `auth-form.css` é
  encapsulado e vence o `.is-invalid`.

O erro continua no texto e no ícone, então não há quebra de WCAG; o defeito é de consistência visual.

**Correção (autorizada pelo usuário em 2026-10-30, feita pela sessão 9b):**

- `styles.css`: `[data-bs-theme="dark"] .form-control.is-invalid` e `.form-select.is-invalid` com
  `border-color: var(--bs-form-invalid-border-color)`;
- `auth-form.css`: a borda vermelha e o anel vermelho de 2px no foco, também no campo dentro do
  grupo da senha.

**Verificação independente na aplicação real (sessão 92):**

| Tela e tema | Borda do inválido | Foco do inválido |
|---|---|---|
| Login (claro) | `rgb(220, 53, 69)` (era `rgb(217, 222, 227)`) | 2px; a senha dentro do grupo tem 2px nos quatro lados (4,2–4,3:1) |
| Novo chamado (claro) | `rgb(220, 53, 69)` | 2px nos três campos |
| Novo chamado (escuro) | `rgb(234, 134, 143)` (era `rgb(58, 63, 68)`) | 2px nos três campos |


### A-35 — Troca de conta em outra aba (Média)

**Evidência:** a correção A-01 aplicava nesta aba o token gravado por outra, mas mantinha o
`currentUser` carregado. Se outra aba entrava com **outra** conta, esta aba seguia com:

- o menu, as permissões (`hasPermission`) e os botões da conta anterior;
- os dados já carregados nos Stores.

**Correção:** `SessionService.syncFromStorage` compara o `sub` do token anterior com o do novo e,
se a conta mudou, limpa o usuário e recarrega a aplicação (`reloadForAccountSwitch`). A simples
renovação da mesma conta não recarrega. Testes: dois casos novos em `session.service.spec.ts`.

### A-36 — Comentários fora da regra (Baixa)

- `shared/ui/layouts/main-layout/main-layout.component.css` citava o nome do template de
  referência, o que a regra de comentários proíbe.
- `tickets/application/ticket-dashboard.store.ts` dizia que o back-end ainda não entregava
  `/tickets/stats/{overview,times,volume}`, que já estão na `origin/main`.

Os dois foram reescritos.

### A-38, A-39, A-40 — Revisão de conciliação (2026-10-30)

- **A-38:** ver A-26.
  - Arquivos: `tickets/application/ticket-{detail,monitor,summary}.store.ts`,
    `shared/ui/ticket-assign-dialog/*` e as specs.
  - Validado na aplicação real: a busca vai para `/tickets/assignees`; o diálogo lista "Admin Master —
    Sem setor"; a API devolve 56 elegíveis.
- **A-39:** ver A-25.
  - Arquivos: `tickets/entities/ticket-attachment.ts`,
    `tickets/infrastructure/ticket-attachment.data.service.ts` (+spec nova),
    `tickets/application/ticket-attachments.store.ts`, `tickets/feature-ticket-detail/*`.
  - Validado na aplicação real: `GET /ticket-attachments/policy` responde 200 e um `.exe` é barrado
    antes de qualquer envio.
- **A-40:** `ticket-dashboard.store.ts` usava `new Date().toISOString()` como "hoje" no limite de 366
  pontos.
  - `todayInSaoPaulo` foi para `shared/utils/iso-date.util.ts`; o `dashboard-filters.ts` a
    reexporta.
  - Teste de borda: às 23:30 de 31/10 em Brasília, 366 dias ainda cabem dia a dia.

### A-41 e A-42 — Verificação final de responsividade (2026-10-30)

**A-41.** Meus Chamados com rolagem horizontal da página inteira.

- **Causa 1:** o `.layout-container` e o `.layout-page` são itens flex sem `min-width: 0` e cresciam
  até a largura da tabela. Correção no `main-layout.component.css`: `min-width: 0` nos dois.
- **Causa 2:** o `.visually-hidden` (`position: absolute`) das células tinha o bloco de contenção
  fora do `.table-responsive` e ainda alargava a página em 196px. Correção no `styles.css`:
  `.table-responsive { position: relative }`.
- **Resultado:** rolagem horizontal 0 em todas as telas e resoluções.
- **Observação, não é defeito:** entre 768 e 991px, a tabela de Meus Chamados rola dentro do card
  para mostrar Status, Atualizado e Ações. É o comportamento do `.table-responsive`, e tabela de
  dados está dispensada da 1.4.10.

**A-42.** Sessão válida mandada pro login por um 429.

- **Como foi achado:** durante a medição, a aplicação foi pro login com o token válido e sem
  nenhum 401. Uma sonda de rede registrou `GET /users/me` → 429.
- **Causa:** o `CurrentUserService` tratava qualquer falha como "não logado". O
  `TokenRefreshService` só tratava 0 e 5xx como falha passageira, e um 429 na renovação também
  deslogava.
- **Primeira etapa (sessão 92):** `isTransientHttpError` (0, 429, 5xx) em
  `shared/utils/http-error.util.ts`, usada pelos dois serviços. O GET /users/me tenta de novo depois
  de 1, 2, 4 e 8s, e a renovação não desloga num 429.
- **O que a primeira etapa não cobria (revisão da sessão 9b):** as novas tentativas somam cerca de
  15s, mas o limite do back-end é uma janela fixa de 60s. Um 429, um 5xx ou uma queda de rede que
  durasse mais que isso ainda levava ao login, com os tokens salvos e sem mensagem. O
  `startSession` do login também navegava para o Início mesmo quando o carregamento falhava.
- **Segunda etapa (sessão 9b, autorizada em 2026-10-30):**
  - `CurrentUserService.load()` devolve um resultado tipado (`CurrentUserLoadResult`, em
    `shared/entities/current-user.ts`): `loaded`, `unauthenticated` (a API recusou a sessão) ou
    `unavailable` com o motivo (`rate-limited`, `offline`, `server-error`, por
    `transientFailureReason`).
  - O `authGuard` manda `unavailable` para a tela nova `/sessao-indisponivel`
    (`shared/feature-session-unavailable/`, com o `SessionRecoveryStore`), com o motivo e a rota
    pedida na URL. A tela explica o motivo, diz que a sessão continua ativa e oferece "Tentar
    novamente" e "Sair da conta". Se der certo, volta à rota pedida; se a API recusar, limpa a
    sessão e vai pro login; se falhar de novo, fica e anuncia a falha. A rota de volta só aceita
    caminho interno (`safeReturnUrl`).
  - `LoginStore.startSession` só navega para o Início com `loaded`. `unavailable` vai para a tela
    nova e `unauthenticated` limpa a sessão e mostra a mensagem no login.
  - O tempo de espera não aumentou: continuam as 4 tentativas, cerca de 15s.
  - Arquivos:
    - `shared/entities/current-user.ts`, `shared/utils/http-error.util.ts`,
      `shared/services/current-user.service.ts`, `shared/guards/auth.guard.ts`,
      `shared/application/login.store.ts`;
    - novos: `shared/application/session-recovery.store.ts`, `shared/feature-session-unavailable/`,
      `shared/utils/session-unavailable.util.ts`;
    - rota `sessao-indisponivel` em `core/routes/app.routes.ts` e `core/config/app.routes.server.ts`;
    - specs ajustadas ao resultado tipado: `admin-master.guard`, `auth.interceptor`,
      `token-refresh.service`, `profile-edit.store`.
- **Comportamento final por tipo de falha:**
  - 401 em requisição comum: o interceptor renova e repete; renovação recusada limpa a sessão e
    vai pro login.
  - 401 no GET /users/me: login, sem novas tentativas.
  - 429, 5xx ou rede na renovação: o interceptor repassa o erro da renovação, e não o 401 original
    (A-43); a sessão fica. No GET /users/me, isso conta como falha passageira e leva à tela de sessão
    indisponível, sem apagar a sessão.
  - 429, 5xx ou rede no GET /users/me: novas tentativas por cerca de 15s; se continuar, a tela de
    sessão indisponível, com os tokens mantidos.
- **Testes:**
  - primeira etapa: 3 novos no `CurrentUserService` e 1 no `TokenRefreshService`;
  - segunda etapa, 20 novos: 2 no `CurrentUserService` (429 e 5xx persistentes; o de rede
    persistente passou a esperar `unavailable`), 1 no `authGuard`, 2 no `LoginStore`, 6 no
    `SessionRecoveryStore`, 6 no `SessionUnavailableComponent` e 3 no `session-unavailable.util`.
- **Validado na aplicação real:** com o GET /users/me respondendo 429, 503 ou sem rede (simulado no
  navegador), `/tickets` abriu a tela de sessão indisponível em 15,2s, com o motivo certo, o foco no
  título e os tokens mantidos. Com a falha mantida, "Tentar novamente" ficou na tela e anunciou
  "Ainda não foi possível (1ª tentativa)". Com o servidor normal, voltou a `/tickets`.
- **Limite que fica:** a primeira carga com falha mostra a tela vazia por até cerca de 15s antes
  da tela de sessão indisponível.

### R-01 a R-04 — Menu lateral em gaveta (2026-10-30)

Achados no diagnóstico de responsividade da sessão 9b (8 resoluções, de 1920×1080 a 360×740, com
teclado). Valem abaixo de 1200px, onde o menu vira gaveta.

| Id | Gravidade | Achado | Correção |
|---|---|---|---|
| R-01 | Alta | Com a gaveta fechada, os 8 primeiros Tabs caíam em controles invisíveis (logo, "Fechar menu" e os itens), a 248–260px fora da tela; a gaveta só tinha `transform` | A gaveta fechada fica `inert` (o `MainLayoutComponent` acompanha o breakpoint por `matchMedia`) |
| R-02 | Alta | Ao abrir, o foco ficava no ☰ e o Tab ia para o conteúdo atrás da sombra | Ao abrir, o foco vai para "Fechar menu"; com a gaveta aberta, o resto da página fica `inert` |
| R-03 | Alta | No celular deitado (844×390), Usuários, Funções e Departamentos ficavam abaixo da tela (último item em 574px), sem rolagem | A gaveta tem a altura da janela (`100dvh`) e rolagem própria |
| R-04 | Média | Esc não fechava a gaveta | Esc fecha e devolve o foco ao ☰; "Fechar menu" e a sombra também devolvem o foco |

- **Arquivos:** `shared/ui/layouts/main-layout/main-layout.component.{ts,html,css,spec.ts}`.
- **Testes:** 5 novos no `main-layout.component.spec.ts`: `inert` com a gaveta fechada, foco ao
  abrir, Esc, botão e sombra devolvendo o foco, e desktop sem `inert`.
- **Validado na aplicação real** em 1024×768, 768×1024, 844×390, 390×844 e 360×740 (Administrador):
  - com a gaveta fechada, o primeiro Tab vai para "Abrir menu";
  - ao abrir, o foco está em "Fechar menu" e o Tab percorre só a gaveta;
  - no 844×390, a gaveta rola (610px de conteúdo em 390px) e "Departamentos e setores" fica visível;
  - Esc fecha e devolve o foco a "Abrir menu".
  - No desktop (1366×768), o menu continua sem `inert`.
- **Observação:** durante o deslize de 0,3s, o foco já está em "Fechar menu", que ainda entra na
  tela. Aos 500ms está visível.
- **Fora do escopo, registrados:** R-05 (diálogo "Novo usuário" apertado no 844×390), R-06 (e-mails
  quebrados no meio na tabela de Usuários no 844) e R-07 (alvos de 16 a 23px, dentro da exceção de
  espaçamento da 2.5.8 segundo a medição da sessão 92), todos de gravidade baixa.

### A-45 e A-46 — Foco da gaveta depois de navegar e Tab preso nela (2026-10-30)

Achados na revisão final da sessão 9b (eram P-2 e P-3), corrigidos com autorização no
`MainLayoutComponent`, sem mudança de arquitetura.

- **A-45 (foco depois de navegar):** um clique num link da gaveta (item ou logo) fecha a gaveta e,
  quando a navegação termina e a tela é desenhada, põe o foco no `h1` da nova tela (o do
  `page-header`), com `tabindex="-1"`. Sem título, o foco vai para o começo do conteúdo.
  - O item da tela atual foca na hora: o router ignora essa navegação de forma síncrona, antes de
    qualquer escuta.
  - O logo passou a fechar a gaveta, como os itens.
  - Clicar num cabeçalho da lista só fecha a gaveta; uma área vazia ou "Fechar menu" seguem como antes.
- **A-46 (Tab fora da gaveta):** com a gaveta aberta, o Tab no último controle volta ao primeiro, e o
  Shift+Tab no primeiro vai ao último. A página atrás já estava `inert`; os toasts e o diálogo global
  ficam no `AppComponent`, fora do layout. Os toasts continuam anunciados (são `role="status"`) e
  alcançáveis com a gaveta fechada. O diálogo global não abre com a gaveta aberta: a página está
  `inert` e a navegação o cancela (A-32).
- **Testes:** 6 novos no `main-layout.component.spec.ts`:
  - foco no título depois de navegar;
  - o item da tela atual;
  - o logo;
  - o cabeçalho sem mover o foco;
  - Tab e Shift+Tab dando a volta;
  - o Tab no meio da gaveta sem interceptação.
- **Validado na aplicação real** em 390×844, 768×1024 e 844×390 (Administrador, teclado):
  - Enter em "Meus Chamados" leva o foco ao `h1` "Meus Chamados", e o Tab seguinte vai a "Novo
    Chamado";
  - o item da tela atual faz o mesmo;
  - com um toast com botão na tela, 12 Tabs e 3 Shift+Tabs ficaram dentro da gaveta;
  - Esc devolve o foco a "Abrir menu";
  - com a gaveta fechada, o botão do toast continua alcançável.

### A-43 — Renovação com falha passageira lida como sessão recusada (Média, revisão técnica final, 2026-10-30)

**Evidência (código):**

- `shared/interceptors/auth.interceptor.ts`: na falha da renovação, o operador
  `catchError(() => throwError(() => error))` devolvia o 401 original.
- `CurrentUserService.load` classifica 401 como `unauthenticated`.
- **Efeito:** com o token vencido e a renovação sem rede (ou com 429 ou 5xx), a pessoa ia pro login em
  vez da tela de sessão indisponível. Dentro dessa tela, o `SessionRecoveryStore.retry` apagava a
  sessão.
- O teste do A-02 ("devolve o 401 quando a renovação falha por erro passageiro") fixava o
  comportamento errado.

**Correção:**

- Na falha passageira da renovação (`isTransientHttpError`), o interceptor repassa o erro da própria
  renovação. Para qualquer outro erro, mantém o 401 original.
- A recusa da renovação (o `TokenRefreshService` devolve `null`) continua limpando a sessão e indo
  pro login.

**Testes:**

- o caso antigo virou três (0, 429 e 503 repassados, sem limpar a sessão);
- 3 testes de integração com o `CurrentUserService` real passando pelo interceptor:
  - token vencido e renovação sem rede → `unavailable`/`offline`, sem apagar a sessão;
  - com 429 → `unavailable`/`rate-limited`;
  - renovação recusada → `unauthenticated`, com a sessão limpa e indo pro login.
- O mapeamento de `unavailable` para `/sessao-indisponivel` já é coberto pela spec do `authGuard`.

## Analisado e mantido (responsabilidade legítima do front)

| Id | Onde | Por que fica |
|---|---|---|
| A-12 | `tickets/entities/ticket-status.ts` (`TICKET_STATUS_TRANSITIONS`, `TICKET_ACTIVE_STATUSES`) | Só escolhe quais botões mostrar; o servidor valida a transição (`TicketStatusTransitions.CanTransition`). O ideal seria a API devolver as ações permitidas, mas isso não existe; ver A-24. |
| A-13 | `tickets/ui/ticket-cancel-window.ts` | Usa `canCancel` e `ownerCancelDeadlineUtc` do servidor; o relógio só esconde o botão quando a janela vence com a tela aberta. |
| A-14 | `ticket-monitor.component.ts` (`displaySlaStatus`) e `dashboard-insights.component.ts` | Reclassificam "No prazo/Em risco" para "Atrasado" entre recargas, com a mesma fórmula do servidor (`TicketSla.GetStatus` sobre `DueAtUtc`) e o relógio ancorado em `serverNowUtc`, que o back expõe para isso. Não contradiz o servidor. |
| A-15 | `dashboard.component.ts` (taxa de SLA cumprido, variações contra o período anterior, "Na fila") | Aritmética de apresentação sobre contadores do servidor (`metCount`/`missedCount`, duas leituras do `overview`). "Na fila" usa a mesma definição de `BacklogCount` (Aberto + Em andamento), com números idênticos. Não há valor oficial no servidor que estes números possam contradizer. |
| A-16 | `dashboard-overview.ts`, `dashboard-insight-rules.ts` (frases de tendência, limites 10%/10/5%) | Textos de leitura do gráfico, não indicadores oficiais. Os limites são regra de redação da tela. |
| A-17 | `ticket-summary.store.ts` (3 atrasados + 2 em risco nos Alertas) | Seleção de exibição sobre duas páginas do servidor; os totais vêm do servidor. |
| A-18 | `my-tickets-summary.store.ts` (ativos/finalizados) | Somas de contadores do servidor com o mesmo agrupamento do back (`OwnTicketStatusGroup`). |
| A-19 | `departments/feature-department-list/*` (busca, "sem setores", resumo) e `role-insights` | `GET /departments` e `GET /roles` devolvem a lista completa, sem paginação; filtrar e contar a lista inteira já carregada é apresentação. Se o back passar a paginar, isso precisa mudar. |
| A-20 | `users.store.ts` (impacto da desativação em lote e desativar/reativar em lote) | Aviso informativo (soma de `totalCount` por pessoa) e orquestração de chamadas individuais que o servidor valida uma a uma; o resultado parcial é reportado por pessoa. Não é regra autoritativa. |
| A-21 | Guards e menus (`admin-master.guard.ts`, `main-layout`) | Só UX; as permissões vêm de `GET /users/me` e a API aplica `[HasPermission]`. A rota de Funções exige `roles:manage` (o back lê com `roles:read`): a tela só tem modo só leitura para a função Administrador, então abrir para quem só lê levaria a 403 na edição. |
| A-22 | Limites de mensagem (4000), título (200), descrição (10–500), motivo da reabertura (500), política de senha; nome (100) e descrição (500) de departamento e setor | Iguais aos validadores do servidor. Validação de experiência, não substitui a do servidor. Com a spec 038 (`a72e07b`), nome de departamento acima de 100 falha no banco com 500, então o validador do front é a única barreira com mensagem amigável: fica como está. |

## Pendências e melhorias não executadas

| Id | Gravidade | O quê | Por que não foi feito |
|---|---|---|---|
| A-23 | Média | Tokens de acesso e refresh no `localStorage` (expostos a XSS) | A troca para cookie `HttpOnly` exige mudança no back-end (emissão, CSRF, CORS). É decisão de arquitetura, não remoção de lógica. |
| A-24 | Baixa | O back-end não informa ações permitidas (`canReopen`, `canEdit`, transições), só `canCancel` | Exige contrato novo; hoje o front espelha os handlers (A-06 a A-08, A-12). |
| A-25 | Baixa | Limites de anexo fixos em `tickets/entities/ticket-attachment.ts`, embora exista `GET ticket-attachments/policy` | **Corrigido em 2026-10-30 (A-39):** o `TicketAttachmentsStore` lê a política (`rxResource`) e o detalhe valida tamanho e tipo por ela; sem a política, envia e deixa o back-end validar. Os limites por chamado (20 arquivos, 100 MB) continuam só no back-end, porque a lista é paginada e o front não vê todos os anexos. |
| A-26 | Média | Busca de responsável usava `GET /users` (exige `users:read` e lista qualquer ativo), mas a atribuição só aceita elegíveis (`TicketAssigneeEligibility`, ativo com `tickets:manage`) | **Corrigido em 2026-10-30 (A-38):** os três Stores (detalhe, Monitorar e Alertas do Início) buscam em `GET /tickets/assignees?search=` (spec 030, mesma regra da atribuição); o diálogo mostra nome completo e setor (o endpoint não devolve e-mail por decisão da spec). Tirou também a dependência tickets → users nesses Stores. |
| A-27 | Baixa | `environment.prod.ts` aponta `http://localhost:5195` (TODO no arquivo) | A URL de produção não está no repositório; não foi inventada. |
| A-28 | Baixa | Flags `volumeResolved` e `companyStatsForAll` desligadas, embora as specs 028 e 031 estejam na `origin/main` | Estado deixado pelo usuário em outra sessão ("volumeResolved off até validar"); ligar é decisão dele. O comentário desatualizado em `ticket-dashboard.store.ts` foi corrigido na revisão final (A-36). |
| A-29 | Baixa | O 403 de `GET /roles` na tela Usuários (quem tem `users:read` sem `roles:read`) disparava um `GET /users/me` a cada abertura | **Corrigido na revisão final:** a tela só pede as funções com `roles:read` (`user-list.component.ts`, +1 teste). |
| A-30 | Baixa | O `slaStatus` e o `dueAtUtc` de `GET /tickets` são do primeiro ciclo de SLA, inclusive depois de reabrir | Está no back-end (`GetTicketsQueryHandler`). A spec 024 (aprovada, ainda não mergeada) cobre só Meus Chamados e deixa o Monitor fora do escopo por decisão do responsável (DEC-3 dela). Não há spec no back-end para o `GET /tickets`: abrir uma é decisão do responsável. O Monitorar herda o valor do servidor. |
| A-31 | Baixa | Linha "Prazo" do detalhe, quando o painel de SLA não carrega, usa o relógio do navegador e o prazo do primeiro ciclo | Fallback já documentado no template; o painel de SLA, que é o caminho normal, usa o relógio do servidor. |
| A-32 | Média | O diálogo de confirmação global sobrevivia à troca de tela ("voltar" do navegador com ele aberto); confirmar executava a ação destrutiva da tela anterior | **Corrigido na revisão final:** o `ConfirmDialogComponent` cancela o pedido aberto em `NavigationStart` (+1 teste). Não há guard `canDeactivate` que dependa dele. |
| A-33 | Baixa | 4 avisos de orçamento de CSS por componente (anteriores à missão) | Reduzir exige mexer em estilos que outras sessões estão editando. |

## Conformidade com as skills

- **Limites de módulo (`ca-review`):** nenhuma importação de `application/` ou `infrastructure/` de
  outro domínio. O único desvio do shell (A-10) foi corrigido. `users/infrastructure/user.data.service.ts`
  chama `GET /tickets` para contar chamados por responsável: é um endpoint de outro domínio dentro do
  Data Service de Usuários, solução documentada no próprio arquivo para evitar um ciclo de barrels.
  Fica registrado; não viola a tabela de importações.
- **Signal Store:** componentes injetam só Stores; leituras via `rxResource`; mutações recarregam o
  resource; `mutationError` separado do erro de leitura.
- **Camadas:** entidades com interfaces e constantes de exibição (padrão já adotado no projeto, ex.:
  `TICKET_STATUS_LABELS`); Data Services com `HttpClient` direto e `Observable` cru.
- **Comentários:** todo símbolo novo tem `/** ... */` curto em português, como exige o `CLAUDE.md`.
  Identificadores novos estão em inglês.
- **Testes:** toda mudança tem spec ao lado; as contagens por rodada estão em `FINAL_ACCEPTANCE_AUDIT.md`.

### Auditoria de conformidade com as skills (2026-10-30)

Revisão só de leitura, feita depois da aceitação, de todo o working tree sobre o `a4cedca`:

- 51 arquivos de `src` (43 rastreados alterados e 8 novos);
- comparados com o `CLAUDE.md`, o `.claude/skills/README.md`, as quatro skills e as referências
  delas, e com os slices vizinhos (`login.store.ts`, `activate-account.component.ts`,
  `ticket-assignees.store.ts`, `ticket.data.service.ts`, `admin-master.guard.ts`).

O revisor foi independente e não implementou nada. Os achados C-03, C-04, C-07, C-10 e C-12 foram
conferidos de novo no código.

**Resultado:**

- Não há achado crítico nem alto, e nenhuma violação da matriz de limites da `ca-review`:
  - `shared/` só importa `shared/`;
  - o shell importa `shared/feature-session-unavailable` como já faz com `feature-login`;
  - nenhum componente injeta Data Service ou `HttpClient`.
- Violação de regra escrita, só uma: C-04, do `CLAUDE.md` (não de skill).
- Os demais achados são inconsistência, manutenção ou dívida anterior. Na data da auditoria, nenhum
  estava corrigido. O que o saneamento autorizado corrigiu, corrigiu em parte ou manteve está em
  "Saneamento de C-01 a C-12 e do A-44", abaixo.

| Id | Gravidade | Tipo | Onde | Regra ou referência | Recomendação | Origem | Confiança |
|---|---|---|---|---|---|---|---|
| C-01 | Baixa | Inconsistência | `shared/entities/current-user.ts:23-26`, `shared/services/current-user.service.ts:28,56` | README/`ca-review`: "no `Result<T>`/success-failure wrapper", regra que vale para Data Services. Aqui é um serviço de sessão, e o Data Service segue cru | Registrar a exceção dos serviços de sessão, ou nada | Missão, sobre o `Observable<boolean>` anterior | Média |
| C-02 | Baixa | Manutenção | `shared/utils/http-error.util.ts:2,44-48` | Nenhuma regra quebrada: o utilitário genérico depende do tipo da tela de sessão | Mover `transientFailureReason` para `session-unavailable.util.ts` | Missão | Alta |
| C-03 | Média | Dívida + manutenção | `tickets/application/ticket-detail.store.ts:140-160`, `ticket-monitor.store.ts:274-294`, `ticket-summary.store.ts:205-225` | Nenhuma regra proíbe; "One Store per use case" justifica os Stores separados. São três cópias da busca de responsáveis. O A-38 editou as três e **apagou o comentário que registrava a duplicação** (no `a4cedca`: `ticket-monitor.store.ts:275`, `ticket-summary.store.ts:205`) | Extrair a busca para o domínio `tickets`; até lá, este registro substitui o comentário | Duplicação anterior; registro removido pela missão | Alta |
| C-04 | Baixa | Violação do `CLAUDE.md` | `shared/feature-session-unavailable/session-unavailable.component.ts:51` | "Every function, property, and class gets a short `/** ... */` doc comment in Portuguese": o `constructor()` novo, com o `afterNextRender` que foca o título, não tem | Acrescentar o comentário | Missão | Alta |
| C-05 | Baixa | Inconsistência | `shared/application/session-recovery.store.ts:14-58` | `ca-review`: estado em `withComputed` sobre `resource()`. Aqui: estado à mão sobre uma chamada imperativa, Store provido no componente e `LoginStore` injetado. Tem precedente (`LoginStore`, `ActivateAccountStore`, `user-menu.component.ts`) | Nenhuma obrigatória | Missão, seguindo padrão anterior | Média |
| C-06 | Baixa | Inconsistência | `shared/guards/auth.guard.ts:25` × `login.store.ts:61` e `session-recovery.store.ts:55` | No `unauthenticated`, os dois Stores limpam a sessão; o guard só redireciona e deixa os tokens salvos (já era assim no `a4cedca`) | Uma política só nos três | Anterior | Média |
| C-07 | Baixa | Manutenção | `shared/ui/layouts/main-layout/main-layout.component.ts:106,138-174` e `.css:183,193` | Nenhuma regra: breakpoint `1199.98px` repetido no TS e no CSS, foco preso por seletores do DOM em 204 linhas, `100dvh` sem `100vh` de reserva | Diretiva de foco preso em `shared/ui/directives` e `height: 100vh` antes do `100dvh` | Missão | Alta |
| C-08 | Baixa | Melhoria opcional | `dashboard/dashboard-filters.ts:49-50` | Reexporta `todayInSaoPaulo` só para o `dashboard.component.ts` | Importar direto de `../shared` | Missão | Alta |
| C-09 | Baixa | Dívida / melhoria | `tickets/feature-ticket-detail/ticket-detail.component.ts:567-588`; `tickets/entities/ticket-attachment.ts:20-24` | A validação do arquivo pela política fica no componente (598 linhas, 4 Stores), sem ferir "State lives in the Store". `maxAttachmentsPerTicket` e `maxTotalBytesPerTicket` não são usados | `validateFile` no `TicketAttachmentsStore`; decidir sobre os dois campos | Tamanho anterior; campos sem uso da missão | Média |
| C-10 | Baixa | Dívida anterior | `shared/interceptors/auth.interceptor.ts`, `ticket-detail.component.ts` | README: "Single quotes, 2-space indent". Os arquivos usam 4 espaços, e as linhas novas seguiram o arquivo | Normalizar numa mudança própria | Anterior | Alta |
| C-11 | Baixa | Dívida anterior do `CLAUDE.md` | `current-user.service.ts:18-21` (a 21 foi tocada), `token-refresh.service.ts:12-16`, `main-layout.component.ts:34-36,87-88`, `http-error.util.ts:7`, `current-user.ts:2-14`, `login.store.ts:31-35` | Membros sem `/** */` já no `a4cedca` | Completar ao tocar os arquivos | Anterior; a missão não corrigiu os que tocou | Alta |
| C-12 | Baixa | Lacuna de teste | `tickets/feature-ticket-monitor/ticket-monitor.component.spec.ts:22,52` (fora do working tree) | `add-tests`: o stub do Store expõe "the same signal-shaped properties". Ainda tipa `responsibleCandidates` como `UserSummary[]` e importa `../../users`; o Store expõe `TicketAssignee[]` desde o A-38 | Trocar para `TicketAssignee` e tirar o import | Anterior, piorado pela missão | Alta |

**Corrigido pela missão:**

- os três Stores de `tickets` deixaram de importar o barrel de `users`;
- `token-refresh` passou a usar o `isTransientHttpError` compartilhado, a única classificação de
  falha passageira;
- saiu o comentário falso do `dashboard.component.ts`.

**Conformidade por arquivo (51 de `src`):**

- 35 conformes, 15 conformes com ressalva e 1 não conforme (o `session-unavailable.component.ts`,
  pelo C-04);
- sem violação de regra escrita: 50 de 51 (98%); contando só as skills, 51 de 51.

Cada arquivo conta igual, e a verificação foi estática (`tsc` app e spec com exit 0), sem nova
verificação visual. Testes passando não entram como prova de conformidade.

**Ordem recomendada, se autorizada:**

1. C-04 e C-12: um comentário e um stub, sem mudança de comportamento.
2. C-03: um helper de busca no domínio `tickets`.
3. C-06 e A-44: política única no `unauthenticated` e no `unavailable` dos guards.
4. C-02 e C-08: mover e reexportar.
5. C-07 e C-09: extrações maiores, com os specs existentes como rede.
6. C-01, C-05, C-10 e C-11: registro ou limpeza oportunista.

### Saneamento de C-01 a C-12 e do A-44 (2026-10-30)

Autorizado pelo usuário depois da aceitação, com a menor alteração possível em cada caso e sem
abstração nova além da necessária. Mudou código só no front; não houve stage nem commit.

| Id | Resultado | O que mudou |
|---|---|---|
| C-03 | Corrigido | `tickets/application/ticket-assignee-search.ts` (novo): `searchEligibleAssignees` (página 1, 8 itens) e `assigneeSearchErrorMessage`. Os três Stores usam essas funções e cada um mantém o próprio estado ("One Store per use case") |
| C-04 | Corrigido | `/** */` no `constructor()` de `session-unavailable.component.ts` |
| C-12 | Corrigido | O stub de `ticket-monitor.component.spec.ts` tipado com `TicketAssignee`, sem o import de `users` |
| C-06 e A-44 | Corrigidos | Política única nos guards: `redirectWhenUserNotLoaded`, em `shared/guards/auth.guard.ts`. Falha passageira vai para `/sessao-indisponivel` com a rota pedida; recusa apaga a sessão e vai pro login, como o `LoginStore` e o `SessionRecoveryStore`. O `admin-master.guard.ts` passou a respeitar o resultado do carregamento. +2 testes no `admin-master.guard.spec.ts`; o `auth.guard.spec.ts` confere a sessão apagada |
| C-02 | Corrigido | `transientFailureReason` foi de `http-error.util.ts` para `session-unavailable.util.ts`, e o utilitário de HTTP não depende mais do tipo da tela (+1 teste). Saiu do barrel `shared/index.ts`; os únicos usos ficam dentro de `shared/` |
| C-08 | Corrigido | O `dashboard.component.ts` importa `todayInSaoPaulo` do `shared`, e `dashboard-filters.ts` deixou de reexportá-la. A asserção repetida saiu de `dashboard-filters.spec.ts`; o mesmo caso já está em `iso-date.util.spec.ts` |
| C-07 | Corrigido em parte | `height: 100vh` antes do `100dvh`. **Sem a diretiva de foco preso:** o código tem um só uso, e uma diretiva seria abstração sem segundo consumidor. O breakpoint repetido no TS e no CSS fica, com o comentário que liga os dois, porque o CSS não lê constantes do TS |
| C-11 | Corrigido nos membros listados | `/** */` em `current-user.service.ts`, `token-refresh.service.ts`, `main-layout.component.ts`, `http-error.util.ts`, `current-user.ts` e `login.store.ts`. O `load()` passou a dizer que `unauthenticated` é qualquer falha não passageira |
| C-01 | Mantido, justificado | A regra do README e da `ca-review` vale para Data Services, e o `AuthDataService` continua com `Observable` cru. O resultado tipado é do serviço que orquestra a sessão. Registrar a exceção nas skills fica com o usuário: esta missão não altera skills |
| C-05 | Mantido, justificado | Mesmo formato do `LoginStore` e do `ActivateAccountStore`; não há resource cujo estado o Store duplique |
| C-09 | Mantido, justificado | Nenhuma regra quebrada: a validação lê só o sinal `policy()` do Store. Levá-la ao Store moveria a formatação de tamanho e reescreveria 5 testes do componente, sem ganho de regra. `maxAttachmentsPerTicket` e `maxTotalBytesPerTicket` ficam na entidade porque são campos do contrato de `GET /ticket-attachments/policy` |
| C-10 | Mantido, justificado | 180 de 248 arquivos `.ts` usam 4 espaços. Normalizar é reformatação em massa, fora do escopo e com risco para o trabalho de outras sessões; as linhas novas seguem o recuo do próprio arquivo |

**Revisão independente do saneamento** (só leitura, comparando o `src` antes e depois):

- 21 arquivos alterados e 1 novo, todos dentro dos itens acima;
- sem laço de redirecionamento: o login não tem guard, e o `pendingPasswordChangeGuard` não depende dos tokens;
- sem importação circular nem violação de limite de módulo;
- veredito "alcançado" em todos os itens.

Ela apontou dois comentários imprecisos (`redirectWhenUserNotLoaded` e o `loading` do `LoginStore`),
corrigidos em seguida. Também registrou que o guard agora apaga a sessão em todo `unauthenticated`
(qualquer falha não passageira), como os dois Stores já faziam.

**Validação:**

- `tsc` app e spec com exit 0;
- `ng build` com exit 0, 381,03 kB e os mesmos 4 avisos de orçamento;
- `ng test` com 1361 de 1361 (eram 1358; +2 do `admin-master.guard` e +1 do `transientFailureReason`);
- depois dos dois comentários finais, `tsc` app de novo com exit 0.

### Conflito entre instruções

A missão pede comentários que expliquem só a intenção, sem repetir o código. O `CLAUDE.md` do
projeto exige um `/** ... */` em português em **toda** função, propriedade e classe, dizendo o que
ela faz. Prevalece o `CLAUDE.md` (instrução do repositório, mais específica): os comentários novos
seguem a convenção dele, curtos e em uma linha quando possível.
<!-- ANEXO-A-FIM -->

## Anexo B — FINAL_ACCEPTANCE_AUDIT.md (texto original preservado)

Origem: `docs/audit/FINAL_ACCEPTANCE_AUDIT.md` no commit `7fe3bec`; texto sem alterações.

<!-- ANEXO-B-INICIO -->
# Auditoria final de aceitação — missão de auditoria do front-end

Data: 2026-10-29. Confronta o repositório real com cada requisito da missão original (13 seções).
O catálogo de achados (`FRONTEND_AUDIT.md`) serve de evidência auxiliar, não de prova. Desde a
consolidação de 2026-10-30, este documento também guarda o baseline e o histórico de integração, que
estavam no `FRONTEND_REFACTOR_PROGRESS.md`.

## Base verificada

| Item | Valor |
|---|---|
| Branch | `main` (a `fix/focus-visible` local ficou para trás, já mesclada) |
| HEAD | `a4cedca` = `origin/main`. Os commits `04ca7e1`…`a4cedca` foram criados e publicados por outras sessões; esta sessão só commitou o `b7f0c37` (autorizado) |
| Staged | nada |
| Working tree (2026-10-30, sem stage) | 54 entradas. A sessão 92 acrescentou depois o A-43 (`auth.interceptor.ts` e a spec); a sessão 9b fez o A-45 e o A-46 só em arquivos que já estavam na lista (`main-layout.component.{ts,html,spec.ts}`). Antes disso, 53. Até a revisão final, 35 (34 modificados + 1 novo): sessão 9b com o A-37 (`auth-form.css` e o trecho do inválido no escuro do `styles.css`); sessão 92 com A-38 a A-41, a primeira etapa do A-42, uma linha no `DESIGN.md` e `docs/audit/*`. Na última rodada, autorizada em 2026-10-30, a sessão 9b acrescentou 18: a segunda etapa do A-42 (tela de sessão indisponível), R-01 a R-04 (menu lateral) e a atualização destes documentos. A relação completa por correção está no relatório final |
| Patch da missão | `scratchpad/MISSAO-auditoria.patch` se desfaz limpo (`patch -R --dry-run`, exit 0) sobre o HEAD: todos os hunks estão no histórico (commits `664b73b`, `357f183`, `fe8a559`, `46cfbb8`, `a77394d`, `311618d`, via PR #2) |

## Baseline inicial (2026-10-29, antes de qualquer alteração da missão)

- **Git:** branch `fix/dashboard-audit`, HEAD `9deae1c`. O working tree já tinha 80 arquivos
  modificados e 12 não rastreados de outras sessões.
- **Ferramentas:**
  - Angular 22.0.6, TypeScript 6.0, `@ngrx/signals` 22.0.0-beta.0, Karma + Jasmine, Node 24.16;
  - sem ESLint nem Prettier: a verificação de tipos vem do `strict` + `strictTemplates`.
- **`ng build`:** OK, 374,66 kB inicial, com 4 avisos de orçamento de CSS por componente
  (main-layout 2,95 kB, ticket-list 3,09 kB, department-list 2,42 kB, user-list 2,27 kB; o limite
  de aviso é 2 kB).
- **`ng test`:** 1296 de 1296.

## Histórico de integração no Git

- Os hunks de A-01 a A-11 e BR-001 foram commitados por outra sessão, divididos em:
  - `664b73b` (shared), `357f183` (tickets), `fe8a559` (roles), `46cfbb8` (users) e
    `a77394d` (dashboard);
  - `311618d` (documentos).
- Foram mergeados na `main` pelo PR #2 (`fabeeb1`).
- O `9354b3e` apagou o plano e o progresso; o `b7f0c37`, autorizado, os restaurou.
- O foco visível e as correções da revisão de aceitação (`04ca7e1`…`a4cedca`) foram commitados e
  publicados pela sessão b345b068.
- O trabalho de 2026-10-30 (A-37 a A-46, R-01 a R-04 e o saneamento C-01 a C-12 e A-44) foi
  integrado, com autorização do usuário, na branch `fix/frontend-audit-integration`, criada a partir
  da `main` em `a4cedca`, publicada e aberta no PR #3
  (https://github.com/rafaelps15/tickest-pristine-ui/pull/3). Mergeado na `main` em 2026-10-30
  (ver "Integração na `main`").

  | Commit | Conteúdo |
  |---|---|
  | `7947148` | A-37 e A-41 (`styles.css`, `auth-form.css`) |
  | `000b4cc` | A-40 e C-08 ("hoje" em Brasília) |
  | `8473d24` | A-38, A-39, C-03 e C-12 (responsáveis elegíveis e política de anexos) |
  | `591bc90` | A-42, A-43, A-44, C-01, C-02, C-04, C-06 e C-11 (sessão) |
  | `838e94f` | R-01 a R-04, A-41, A-45, A-46, C-07 e C-11 (menu lateral) |
  | `ba6b751` | estes documentos e o `DESIGN.md` |
  | `2caefb4` | registro do PR #3 e do commit dos documentos |
  | `f449599` | lista de pendências alinhada entre os documentos e o PR |

  Os commits agrupam arquivos inteiros. O A-38 e o A-39 ficam juntos porque o spec do detalhe
  cobre os dois; o A-42 e o A-43, porque o spec do interceptor tem os ajustes do resultado tipado.

## Validações executadas (resultados reais)

Cópia isolada do HEAD em
`C:\Users\rafae\AppData\Local\Temp\claude\c--dev-tickest-pristine-front\65d7fc55-6391-4e98-8ae7-b7f896419fc4\scratchpad\acc\`
(`git archive` + `node_modules` por junção), sem o trabalho de foco em andamento.

| Verificação | HEAD `b7f0c37` | HEAD + todas as correções desta revisão |
|---|---|---|
| `tsc -p tsconfig.app.json --noEmit` | exit 0 | exit 0 |
| `tsc -p tsconfig.spec.json --noEmit` | exit 0 | exit 0 |
| `ng build` (produção, SSR + prerender) | exit 0; 375,05 kB; 4 avisos de orçamento de CSS (anteriores à missão) | exit 0; 377,19 kB (+0,9 kB comprimido, do `NavigationStart` no diálogo global); os mesmos 4 avisos |
| `ng test --watch=false --browsers=ChromeHeadless` | 1307 de 1307 | 1311 de 1311 |
| `7c5b362` publicado (tudo integrado) | `tsc` app e spec exit 0; `ng build` exit 0, 379,15 kB, os mesmos 4 avisos; `ng test` 1311 de 1311 | — |
| Working tree de 2026-10-30 (A-37 a A-40) | `tsc` app e spec exit 0; `ng build` exit 0, 379,29 kB, os mesmos 4 avisos; `ng test` 1318 de 1318 (logs em `scratchpad/final2/`) | — |
| Working tree de 2026-10-30, antes da última rodada (A-37 a A-42, primeira etapa) | `tsc` app e spec exit 0; `ng build` exit 0, 379,93 kB, os mesmos 4 avisos; `ng test` 1322 de 1322 (logs em `scratchpad/final3/`) | — |
| Working tree de 2026-10-30 (+ A-42 segunda etapa e R-01 a R-04) | `tsc` app e spec exit 0; `ng build` exit 0, 380,91 kB, os mesmos 4 avisos (o CSS do layout passou de 2,95 para 3,03 kB, abaixo do erro de 4 kB); `ng test` 1347 de 1347 | — |
| Responsividade na aplicação real (sessão 9b) | 8 resoluções (1920×1080, 1366×768, 1280×800, 1024×768, 768×1024, 844×390, 390×844, 360×740), 10 telas, menus, 4 diálogos e o menu lateral com teclado: rolagem horizontal 0; reprovaram R-01 a R-04 (menu lateral), depois corrigidos e verificados de novo em 1024×768, 768×1024, 844×390, 390×844 e 360×740 | — |
| A-42 na aplicação real (sessão 9b) | GET /users/me com 429, 503 e sem rede, simulados no navegador: tela de sessão indisponível em 15,2s com o motivo certo e os tokens mantidos; "Tentar novamente" com falha fica e anuncia; com o servidor normal, volta a `/tickets` | — |
| Working tree final de 2026-10-30 (+ A-43, A-45 e A-46) | `tsc` app e spec exit 0; `ng build` exit 0, 380,94 kB, os mesmos 4 avisos; `ng test` 1358 de 1358 (1347 + 5 do A-43 + 6 do A-45/A-46) | — |
| A-45 e A-46 na aplicação real (sessão 9b) | 390×844, 768×1024 e 844×390, teclado: <br>• depois de navegar pela gaveta (inclusive para a tela atual), foco no `h1` da tela; <br>• com um toast com botão na tela, Tab e Shift+Tab ficaram na gaveta; <br>• com a gaveta fechada, o toast segue alcançável | — |
| Working tree depois do saneamento de C-01 a C-12 e do A-44 | `tsc` app e spec exit 0; `ng build` exit 0, 381,03 kB, os mesmos 4 avisos; `ng test` 1361 de 1361 (logs em `scratchpad/final6/`) | — |
| Lint / análise estática | O projeto não tem ESLint; a análise estática disponível é o `strict` + `strictTemplates` do compilador, coberto acima | idem |
| Aplicação real autenticada (Administrador), foco medido por pixels | Executada: 9 telas + menu ⋮ + diálogo + campos inválidos, claro e escuro, 761 focos (`scratchpad/focus/real-auth-antes-auth.json`) | Executada sobre o código final, mesma sessão e mesmo método: 761 focos (`real-auth-depois-auth.json`, `compare.md`) |
| Aplicação real sem sessão (`/login`, `/ativar-conta`), foco medido por pixels | — | Executada (`ng serve` da cópia isolada, porta 4207). Login reprova: `.btn-primary` sem mudança nenhuma no foco; campos com 1–1,5px; o lado do campo de senha colado ao botão do olho não muda. Isso é o "antes" do A-34 (`scratchpad/focus/real-anon-antes.json`, `real-antes/`) |

Logs: `acc/tsc-app.log`, `acc/tsc-spec.log`, `acc/build.log`, `acc/test.log` (HEAD) e `acc/r3-*.log` (HEAD + correções). A comparação `diff -rq` entre a cópia e o working tree só aponta os 3 arquivos de foco da outra sessão.

## Matriz de conformidade

Status: PASS, PARTIAL, FAIL, BLOCKED, NOT APPLICABLE.

### Seção 1 — Leitura obrigatória das instruções e das skills

| # | Requisito | Esperado | Resultado e evidência | Status |
|---|---|---|---|---|
| 1.1 | Ler `CLAUDE.md` e instruções locais | Convenções conhecidas antes de alterar | `CLAUDE.md` (comentário `/** */` em português em todo símbolo) e `~/.claude/CLAUDE.md` lidos; a convenção foi aplicada em todos os símbolos novos | PASS |
| 1.2 | Identificar skills aplicáveis ao Angular, gerais e de outras tecnologias | Classificação | `.claude/skills/{README,add-context,add-feature,add-tests,ca-review}`; as skills Vercel/Next do ambiente foram tidas como não aplicáveis | PASS |
| 1.3 | Examinar regras e exemplos das skills, não só títulos | Leitura integral | `ca-review`, `add-feature` (+ `store-method.md`) e `add-tests` lidos na íntegra; `add-tests` e `ca-review` invocados formalmente | PASS |
| 1.4 | Hierarquia e contradições | Conflitos identificados | Conflito documentado em `FRONTEND_AUDIT.md`: comentários "só intenção" (missão) × `/** */` em todo símbolo (`CLAUDE.md`), e prevaleceu o `CLAUDE.md` | PASS |
| 1.5 | Estrutura, versões e ferramentas | Inventário | Angular 22.0.6, TS 6.0, `@ngrx/signals` 22 beta, Karma/Jasmine, sem ESLint ("Baseline inicial") | PASS |
| 1.6 | Convenções existentes (módulos, Stores, rotas, testes, erros, API) | Mapeadas | Tabela de limites da `ca-review` conferida por grep (`FRONTEND_AUDIT.md`, "Conformidade com as skills") | PASS |
| 1.7 | Baseline antes das alterações | Registrada | Build OK com 4 avisos e 1296 de 1296 testes ("Baseline inicial") | PASS |
| 1.8 | Não modificar skills nem instruções fundamentais | Intocados | `git log -- .claude CLAUDE.md` sem commit desta sessão; `63d58a3` (CLAUDE.md) é de outra sessão | PASS |

### Seção 2 — Auditoria completa do frontend

| # | Item | Resultado e evidência | Status |
|---|---|---|---|
| 2.1 | Estrutura de diretórios e funcionalidades | Mapeada; barrels conferidos | PASS |
| 2.2 | Componentes, templates, estilos | Revisados por domínio (três varreduras + leitura direta) | PASS |
| 2.3 | Serviços, interfaces, DTOs, contratos HTTP | Contrato da spec 029 corrigido (A-04); a busca de responsável passou para o contrato elegível da spec 030 (A-38); a política de anexos vem de `GET /ticket-attachments/policy` (A-39); demais conferidos contra a `origin/main` do back (`a72e07b`) | PASS |
| 2.4 | Rotas, lazy loading, guards, interceptors | `app.routes.ts`, guards e interceptor revisados; A-01 a A-03 corrigidos | PASS |
| 2.5 | Formulários, validações, mensagens | Limite de nome divergente corrigido (A-09); o mínimo de 2 caracteres foi mantido de propósito | PASS |
| 2.6 | Estado, subscriptions, ciclo de vida | `takeUntilDestroyed` nas buscas; A-11 corrigido; A-32 (diálogo global que sobrevivia à troca de tela) corrigido nesta revisão | PASS |
| 2.7 | Tipagem, `any`, casts, valores mágicos | Nenhum `any`; os códigos de permissão novos ficam em constantes (`ticket-action-permissions.ts`) | PASS |
| 2.8 | Duplicação, dependências circulares, acoplamento | Regras de permissão centralizadas; ciclo users↔tickets documentado (`user.data.service.ts`) | PASS |
| 2.9 | Separação apresentação/integração/aplicação | Ver seção 5 | PASS |
| 2.10 | Autorização, autenticação, exposição de dados | A-01 a A-03, A-35 e A-23 (tokens em `localStorage`, depende do back-end) | PARTIAL: A-23 exige mudança no back-end |
| 2.11 | Carregamento, vazio, falhas, concorrência | Revisados nos Stores (`rxResource`, `mutationError`) | PASS |
| 2.12 | Acessibilidade, responsividade, consistência visual | Foco visível corrigido (A-34) e verificado na aplicação real. Responsividade verificada em 2026-10-30: primeiro pela sessão 92 em 1366×900, 768×1024 e 390×844 (rolagem horizontal 0 depois do A-41; alvos < 24px dentro da exceção de espaçamento da 2.5.8); depois pela sessão 9b em 8 resoluções, com teclado, que achou R-01 a R-04 no menu lateral (3 altos e 1 médio), corrigidos e verificados de novo. Ficam R-05 a R-07, de gravidade baixa | PASS depois de R-01 a R-04; R-05 a R-07 registrados |
| 2.13 | Desempenho, renderização, vazamentos | A-29 corrigido (Usuários só pede `/roles` com `roles:read`); 4 avisos de orçamento (A-33) anteriores à missão; sem vazamento observado | PARTIAL: avisos de orçamento continuam |
| 2.14 | Testes unitários, integração, fluxos críticos | Unitários ampliados (1358 no estado final; 1347 depois da segunda etapa do A-42 e de R-01 a R-04; 1322 antes delas); o projeto não tem testes de integração nem e2e; navegação por teclado exercitada na aplicação real autenticada | PARTIAL: sem testes de integração no projeto |
| 2.15 | Dependências, configuração, código obsoleto | A-27 (URL de produção) e A-28 (flags); comentário obsoleto corrigido (A-36) | PASS |
| 2.16 | Causa raiz, não sintoma | Ex.: A-04 rastreado até o contrato do back; A-34 até a cascata do tema escuro | PASS |
| 2.17 | Diferenciar defeito, violação, melhoria e preferência | Coluna "Classe" em `FRONTEND_AUDIT.md` | PASS |

### Seção 3 — Separação rigorosa entre frontend e backend

| # | Requisito | Resultado e evidência | Status |
|---|---|---|---|
| 3.1 | Preservar o que é do front | Visibilidade por permissão, validações de experiência, apresentação de números do servidor: todos mantidos e justificados (A-12 a A-22) | PASS |
| 3.2 | Remover o que é do back | Persistência simulada da cor de função removida (BR-001). No HEAD, o navegador guarda só tokens e preferência de UI (`session.service.ts:88-99`, `persisted-toggle.util.ts`) | PASS |
| 3.2 (lista) | Investigar cada categoria listada | Regras autoritativas, autorização, persistência simulada, transições, cálculos oficiais, concorrência: cada uma analisada (`FRONTEND_AUDIT.md`, "Analisado e mantido") | PASS |
| 3.3.1–3 | Entender o comportamento, dependências e motivo | BR-001, "O que existia" e "Por que saiu" | PASS |
| 3.3.4 | Registrar requisitos para o back | BR-001, migrado em 2026-10-30 para a spec 044 do back-end (`tickest-pristine/specs/044-cor-do-badge-da-funcao`) | PASS |
| 3.3.5 | Remover do front | `role-colors.util.ts` não existe no HEAD; nenhuma referência a `roleColor`, `badge-role-custom` ou `--role-color` (grep) | PASS |
| 3.3.6 | Corrigir os pontos de integração | Badges voltam a `bg-label-primary` em Usuários, painel e diálogo de atribuição | PASS |
| 3.3.7–8 | Verificar se a API oferece; não inventar | `RoleResponse` sem cor; a operação foi descrita sem rota inventada | PASS |
| 3.3.9 | Testes | Testes do recurso removido trocados por testes de ausência (`role-list.component.spec.ts:366`) | PASS |
| 3.3.10 | Atualizar a documentação | BR-001 e A-05 | PASS |
| 3.x | Não mexer no back-end | Nenhum commit desta sessão em `tickest-pristine`; o back foi só lido | PASS |

### Seção 4 — `BACKEND_RECONSTRUCTION.md` (migrado para a spec 044 do back-end e removido em 2026-10-30)

| # | Requisito | Resultado e evidência | Status |
|---|---|---|---|
| 4.1 | Existir e registrar toda remoção | 1 remoção, 1 registro (BR-001); conferido contra o diff (a única exclusão de lógica de domínio é `role-colors.util.ts`) | PASS |
| 4.2 | Campos exigidos (id, nome, arquivos, comportamento, motivo, responsabilidade, regras, validações e aceitação, autorização, persistência e concorrência, impactos, contratos, dependências, testes, estado) | Todas as seções presentes (linhas 18-115) | PASS |
| 4.3 | Diferenciar removido, a reconstruir, ajuste de consumo e pendente | Seções "O que existia", "O que o back-end precisa oferecer", "Impacto no front" e "Decisões pendentes" | PASS |
| 4.4 | Não inventar contratos; não marcar como implementado no back | Sem rota inventada; o estado diz "pendente" | PASS |
| 4.5 | Confrontar com o diff | Feito na missão e de novo nesta revisão | PASS |
| 4.6 | Fonte única do requisito | Na consolidação de 2026-10-30, o BR-001 virou a spec 044 do back-end (em descoberta, com as decisões pendentes). O histórico do front ficou no A-05 do `FRONTEND_AUDIT.md`, e o documento temporário saiu (ver "Consolidação da documentação") | PASS |

### Seção 5 — Arquitetura modular e skills

| # | Requisito | Resultado e evidência | Status |
|---|---|---|---|
| 5.1 | Limites de módulo (`ca-review`) | `shared/` não importa domínio; nenhum `application/` ou `infrastructure/` alheio; o diálogo de atribuição foi para `shared/ui` (A-10) | PASS |
| 5.2 | Componente injeta só o Store | Nenhum Data Service ou `HttpClient` em componente (grep) | PASS |
| 5.3 | `HttpClient` só em `infrastructure/` | `app.config.ts` só provê | PASS |
| 5.4 | Barrels sem componentes ou rotas | Conferido | PASS |
| 5.5 | Sem abstração desnecessária | Um utilitário de regras (`ticket-action-permissions.ts`) e uma interface estrutural (`AssigneeCandidate`), sem camada nova | PASS |
| 5.6 | Observação | `users/infrastructure/user.data.service.ts` chama `GET /tickets` (contagem por responsável), documentado no arquivo | PASS (registrado) |

### Seção 6 — Idioma

| # | Requisito | Resultado e evidência | Status |
|---|---|---|---|
| 6.1 | Identificadores em inglês | Todos os símbolos novos estão em inglês; o grep por identificadores em português (chamado, usuario, setor…) não acha nada | PASS |
| 6.2 | Contratos externos preservados | Campos da API mantidos (`waitingOn` alinhado ao back, não renomeado no front) | PASS |
| 6.3 | Nomes de testes em inglês "quando compatível" | O projeto inteiro usa nomes de teste em português (mais de 1300 casos); seguir a convenção existente evita mistura. A skill `add-tests` mostra exemplos em inglês | PARTIAL: convenção do repositório mantida, desvio consciente |
| 6.4 | Comentários em português, curtos e úteis | Seguidos | PASS |
| 6.5 | Sem nomes de pessoas ou projetos de referência | Um comentário citava o template de referência; corrigido nesta revisão (A-36). Grep sem ocorrências no HEAD + working tree | PASS (depois da correção) |
| 6.6 | Sem comentário desatualizado | Um comentário errado sobre rotas do back; corrigido (A-36) | PASS (depois da correção) |

### Seção 7 — Lotes

| Lote | Resultado | Status |
|---|---|---|
| 1 Inventário e baseline | Feito ("Baseline inicial") | PASS |
| 2 Auditoria arquitetural | A-10, A-19 a A-21 | PASS |
| 3 Falhas críticas e segurança | A-01 a A-03 e A-35; A-23 depende do back | PASS (A-23 fora do escopo autorizado) |
| 4 Separação front/back | BR-001 | PASS |
| 5 Organização modular | A-10 | PASS |
| 6 Tipagem e integração | A-04, A-38, A-39 e A-40 corrigidos e validados (os dois primeiros também na aplicação real) | PASS |
| 7 Componentes e formulários | A-06 a A-09, A-11 | PASS |
| 8 Navegação e experiência | A-29, A-32, A-34 (foco visível), A-37, A-41, A-42, A-45, A-46 e R-01 a R-04 corrigidos e verificados na aplicação real; A-21 e A-31 mantidos com justificativa; R-05 a R-07 registrados | PASS (depois do A-34) |
| 9 Testes e regressões | Suíte verde; navegação por teclado verificada na aplicação real; comparação antes × depois sem regressão | PASS |
| 10 Revisão final independente | A `ca-review` original não achou A-35 nem A-36; esta revisão achou e corrigiu | PASS (depois desta revisão) |

### Seção 8 — Documentação e continuidade

| # | Requisito | Resultado e evidência | Status |
|---|---|---|---|
| 8.1 | Quatro documentos | Existiram durante a missão (`b7f0c37` restaurou PLAN e PROGRESS). Consolidados em 2026-10-30 em dois ("Consolidação da documentação") | PASS |
| 8.2 | Refletir o estado real | PROGRESS dizia "sem commit"; corrigido nesta revisão com o histórico real. AUDIT ganhou A-34 a A-36 | PASS (depois da correção) |
| 8.3 | Atualização contínua | Feita durante a execução e nesta revisão | PASS |

### Seção 9 — Validação contínua e aceitação

| # | Requisito | Resultado | Status |
|---|---|---|---|
| 9.1 | Baseline registrada | 1296 testes, build OK | PASS |
| 9.2 | Verificação após cada lote | Specs focadas por lote, suíte completa no fim | PASS |
| 9.3 | Build de produção | OK (tabela acima) | PASS |
| 9.4 | Tipos | `tsc` app e spec exit 0 | PASS |
| 9.5 | Lint | Inexistente no projeto; não foi introduzido (a missão proíbe ferramentas novas sem necessidade) | NOT APPLICABLE |
| 9.6 | Unitários | 1358 de 1358 (1347 e 1322 nas rodadas anteriores) | PASS |
| 9.7 | Integração / fluxos críticos | Sem testes de integração no projeto; telas e controles exercitados por teclado na aplicação real com sessão de Administrador (leitura, menus, diálogo, validação do formulário); nenhuma mutação foi enviada | PARTIAL: sem envio de formulário real (evita gravar dados) |
| 9.8 | Rotas, dependências, contratos HTTP | Contratos conferidos contra o back; specs dos Data Services | PASS |
| 9.9 | Revisão do diff | Feita; patch conferido contra o HEAD | PASS |
| 9.10 | Pré-existente × regressão | Os avisos de orçamento são anteriores; nenhuma regressão de teste | PASS |

### Seção 10 — Proteção do repositório

| # | Requisito | Resultado e evidência | Status |
|---|---|---|---|
| 10.1 | Preservar alterações alheias | Hunks separados; backups no scratchpad; nenhum `checkout`, `restore` (exceto o autorizado) ou `stash` desta sessão | PASS |
| 10.2 | Sem stage, commit ou push sem autorização | Esta sessão só commitou o `b7f0c37` (autorizado) e não fez push. Os commits `04ca7e1`…`7c5b362` e o push foram feitos pela sessão b345b068, incluindo hunks desta sessão | PASS para esta sessão (registro: commits e push de outra sessão) |
| 10.3 | Back-end, banco, skills e instruções intocados | Conferido | PASS |
| 10.4 | Sem dependência nova no projeto | `playwright-core` instalado só no scratchpad | PASS |

### Seção 11 — Autonomia

| # | Requisito | Resultado | Status |
|---|---|---|---|
| 11.1 | Executar tudo o que for possível sem pedir aprovação | Correções feitas sem aprovação intermediária; pedidos ao usuário só em decisões de produto e conflitos entre sessões | PASS |
| 11.2 | Continuar o trabalho independente quando algo bloqueia | Correções desta revisão feitas mesmo com o foco atribuído a outra sessão | PASS |

### Seção 12 — Revisão independente final

| # | Requisito | Resultado | Status |
|---|---|---|---|
| 12.1 | Skills seguidas | `ca-review` + esta matriz | PASS |
| 12.2 | Nenhuma lógica de back restante | Reverificado (armazenamento, agregações, regras de permissão) | PASS |
| 12.3 | Remoções documentadas; contratos preservados; nada inventado | Sim | PASS |
| 12.4 | Sem regressão de tipos ou testes | `tsc` + 1358 testes | PASS |
| 12.5 | Comentários e identificadores | Corrigidos dois comentários (A-36) | PASS |
| 12.6 | Revisão com método diferente | Medição de estilos calculados (foco), reaplicação inversa do patch, grep adversarial e revisão de permissão por endpoint; encontrou A-35, A-36, A-29 (rebaixado antes) e A-32 | PASS |
| 12.7 | Comportamento na aplicação real | Executado (foco por pixels, sessão de Administrador, dois temas; responsividade em 8 resoluções com teclado; A-42 com falhas simuladas) | PASS |

### Seção 13 — Relatório final

| # | Requisito | Status |
|---|---|---|
| 13.1–13.12 | Entregues no relatório da missão e atualizados por esta matriz e pelo relatório desta revisão | PASS |

## Itens não PASS

| Item | Status | Causa | Impacto | Intervenção mínima |
|---|---|---|---|---|
| 2.10 / A-23 — tokens em `localStorage` | PARTIAL | Exige cookie `HttpOnly` no back-end | Exposição a XSS | Decisão de arquitetura com o back-end |
| 2.13 / A-33 — orçamento de CSS | PARTIAL | Anterior à missão | Só aviso de build | Opcional |
| 2.14 / 9.7 — testes de integração | PARTIAL | O projeto não tem essa camada | Fluxos verificados à mão e por roteiro, sem suíte automatizada | Fora do escopo (a missão proíbe ferramenta nova sem necessidade) |
| 6.3 — nomes de teste | PARTIAL | Convenção existente em português | Nenhum funcional | Decisão de convenção |
| 2.12 / R-05 a R-07 — responsividade, gravidade baixa | PARTIAL | Diálogo "Novo usuário" apertado no 844×390; e-mails quebrados no meio na tabela de Usuários; alvos de 16 a 23px | Usabilidade em telas pequenas; nenhum bloqueio | Ajustes de estilo, se autorizados |
| A-42 — espera da primeira carga | PARTIAL | Até cerca de 15s de tela vazia antes da tela de sessão indisponível | Espera sem aviso numa falha passageira | Opcional: mostrar um indicador durante as novas tentativas |

## Verificação independente do foco visível (A-34)

- **Método:** diferente do usado na implementação. Para cada controle, captura sem foco × com foco
  (Tab real, escala 2×). De cada lado, conta a faixa de pixels que mudou com contraste ≥ 3:1 entre
  os dois estados. Calibrado contra casos conhecidos numa página de teste
  (`scratchpad/focus/pixeldiff.mjs`).
- **Login, sem sessão:** "Entrar no sistema" passou de 0px para 2px (3,8–4,4:1). E-mail, senha e
  "Mostrar senha" ficaram com 2px nos quatro lados depois do anel no grupo.
- **Área logada, sessão de Administrador, claro e escuro:**
  - 734 controles únicos: 305 reprovados antes e 19 depois; 286 corrigidos e 0 regressões.
  - Dos 19 restantes:
    - campos que validam ao perder o foco (Novo chamado, Meu Perfil, diálogo de usuário). Medidos de
      novo com os campos preenchidos (`real-fields.json`), passam com 2px;
    - título de chamado quebrado em duas linhas (o contorno cobre as duas linhas);
    - o logo no Monitorar (recorte errado com o menu lateral fixo; passa nas outras 20 medições);
    - divisórias internas de grupo (busca com ícone, senha + olho), dentro do anel de ≥ 2px do
      grupo;
    - as 4 fatias da barra, cujo contorno fica entre halos da cor da superfície (4,8:1 contra as
      cores vizinhas, critério da 1.4.11).
- **Testes e build sobre o `7c5b362` publicado:**
  - `tsc` (app e specs) exit 0;
  - `ng build` de produção exit 0, 379,15 kB, os mesmos 4 avisos de orçamento;
  - `ng test` 1311 de 1311.

## Revisão de conciliação (2026-10-30)

A missão original foi relida e conciliada lote a lote com o código. O resultado está em
`FRONTEND_AUDIT.md` (A-37 a A-40).

- **A-37** (borda de erro dos inválidos): autorizado, corrigido pela sessão 9b e verificado na
  aplicação real (login no claro, Novo chamado no claro e no escuro, foco por pixels).
- **A-38** (antes A-26): a busca de responsável usa o contrato elegível da spec 030. Verificado na
  aplicação real.
- **A-39** (antes A-25): a política de anexos vem da API. Verificado na aplicação real.
- **A-40**: "hoje" em Brasília no limite de pontos do gráfico. Tem teste de borda.
- **A-41** (rolagem horizontal de Meus Chamados) e **A-42** (429 mandava pro login): achados e
  corrigidos na verificação de responsividade, com validação na aplicação real.
- **A-42, segunda etapa:** a revisão final mostrou que 15s de novas tentativas não cobriam a
  janela de 60s do limite; falha passageira mais longa ainda levava ao login. Agora vai para a
  tela de sessão indisponível, que deixa tentar de novo ou sair; o login só navega para o Início
  quando o usuário carrega. Verificado na aplicação real com 429, 503 e sem rede.
- **R-01 a R-04** (menu lateral em gaveta: Tab em controles invisíveis, foco fora da gaveta aberta,
  itens fora da tela no celular deitado, Esc): achados no diagnóstico de 8 resoluções e corrigidos
  no `MainLayoutComponent`. Verificados na aplicação real com teclado.
- **Varredura de separação front/back** (sessão 9b, conferida contra a `origin/main` do back em
  `a72e07b`): nenhuma lógica nova de back-end no front além da já registrada; BR-001 continua a única
  remoção.
- **`ca-review` do diff:** nenhum bloqueio, nenhuma violação de convenção, sem lacuna de teste.

## Revisão técnica final (2026-10-30)

Revisão de leitura do fluxo de `/sessao-indisponivel`, do menu lateral (R-01 a R-04), de A-37 a
A-42, dos documentos e da integridade das duas sessões. Não achou bloqueador.

- **A-43 (média):** falha passageira da renovação lida como sessão recusada. Corrigido com
  autorização, com testes de integração.
- **A-44 (baixa):** `admin-master.guard.ts` ignora `unavailable`. Registrado como pendência, por
  decisão do usuário. Corrigido depois, no saneamento autorizado.
- **A-45 e A-46 (baixa), da revisão da sessão 9b:** foco perdido ao navegar pela gaveta e Tab que
  saía dela para os toasts. Corrigidos com autorização no `MainLayoutComponent` e verificados na
  aplicação real (ver `FRONTEND_AUDIT.md`).

## Consolidação da documentação e migração para o back-end (2026-10-30)

Feita depois da aprovação. Mudou só documentação: nenhum código do front nem do back-end.

### Destino de cada documento

| Documento | Papel | Informação própria | Decisão e destino |
|---|---|---|---|
| `BACKEND_RECONSTRUCTION.md` | Requisitos do back-end para a lógica removida do front (só o BR-001) | O requisito da cor da função e o histórico do recurso no front | **Removido.** O requisito foi para a spec 044 do back-end; o histórico do front, para o A-05 do `FRONTEND_AUDIT.md` |
| `FRONTEND_REFACTOR_PLAN.md` | Plano de execução em 10 lotes | Estratégia (contrato real, visibilidade × autorização, remover só o comprovado) e o que ficou fora do escopo | **Removido.** O plano está concluído. A estratégia e o escopo foram para "Método e escopo" do `FRONTEND_AUDIT.md`; os ids por lote, para a seção 7 desta matriz |
| `FRONTEND_REFACTOR_PROGRESS.md` | Diário de continuidade por rodada | Baseline inicial e histórico de integração no Git. As validações por rodada já estavam na tabela acima; a lista de arquivos por correção, nos achados e no histórico do Git | **Removido.** O baseline e o histórico vieram para cá; os arquivos do A-42 e de R-01 a R-04, para os achados do `FRONTEND_AUDIT.md` |
| `FRONTEND_AUDIT.md` | Catálogo de achados, com evidência, correção e pendências | Todo o conteúdo técnico da auditoria | **Mantido** como catálogo único dos achados, inclusive a auditoria de conformidade com as skills |
| `FINAL_ACCEPTANCE_AUDIT.md` | Registro da aceitação | Matriz, validações, aprovação, pendências aceitas e estado do Git | **Mantido** como registro histórico da aceitação |

Referências atualizadas: `DESIGN.md` (dois trechos sobre a cor da função) e este documento. Uma busca
pelos três nomes removidos no repositório só encontra as menções históricas desta seção e do A-05.

### Rastreabilidade do BR-001

| Item do BR-001 | Destino |
|---|---|
| Persistência: cor opcional, nula por padrão, ligada à identidade estável | Spec 044, REQ-1 e AC-1/AC-4; depende da spec 036 (pré-requisito no plano) |
| Leitura em `GET /roles` e nas funções de usuários (listagem e usuário logado) | Spec 044, REQ-2 e AC-2/AC-3 |
| Leitura nos candidatos a responsável | **Não se aplica mais:** `GET /tickets/assignees` não devolve funções (spec 030, DEC-1); fora do escopo da 044 |
| Escrita (definir ou limpar) com `roles:manage` | Spec 044, REQ-3, AC-5 a AC-7 e DEC-5 (forma da rota) |
| Formato `#rrggbb` sem diferenciar maiúsculas | Spec 044, REQ-4 e AC-8 |
| Contraste WCAG AA com as misturas do CSS | Spec 044, REQ-5 e AC-9, marcados `[SUPOSIÇÃO]` até a DEC-2 |
| Concorrência (última gravação vence, sem cache por usuário) | Spec 044, REQ-6, REQ-2 e DEC-7 |
| Critérios de aceitação do BR-001 | Spec 044, AC-1 a AC-9 |
| Testes esperados (validador, handler, integração) | Spec 044, tarefas T-2 a T-5 |
| Dependência da spec 036 | Spec 044, contexto e pré-requisito do plano |
| Decisões pendentes (contraste, paleta, funções fixas) | Spec 044, DEC-2, DEC-3 e DEC-4 (em aberto); a DEC-1 pergunta se o recurso volta |
| Auditoria da alteração (não estava no BR-001) | Spec 044, REQ-7 e DEC-6, pela auditoria da função da spec 036 |
| O que existia no front, por que saiu, backup e ajustes no front depois do back-end | Responsabilidade do front: A-05 do `FRONTEND_AUDIT.md` |

A spec 044 está **em descoberta**: não pode ser aprovada nem implementada antes das respostas da DEC-1
à DEC-7.

### Pendências do front que dependem do back-end (fora do BR-001)

| Id | Situação no back-end | Destino |
|---|---|---|
| A-23 (tokens em cookie `HttpOnly`) | Não existe spec; é decisão de arquitetura (emissão, CSRF, CORS) | Pendência registrada. Exige o `spec-new` no back-end com o responsável |
| A-24 (ações permitidas na resposta) | Não existe; só `canCancel` | Melhoria registrada, sem requisito decidido |
| A-30 (ciclo de SLA vigente em `GET /tickets`) | A spec 024 trata só Meus Chamados e deixa o Monitor fora por decisão do responsável (DEC-3 dela) | Precisa de decisão do responsável antes de virar spec |
| A-22 (nome de departamento acima de 100 responde 500) | Comportamento decidido na spec 038 (DEC-14, verificada) | Não é requisito novo; o front segue barrando antes |

A-27 (URL de produção) e A-28 (flags do Início) também ficam abertos, mas não dependem do back-end:
o primeiro é configuração de implantação, e o segundo é decisão do usuário, com os endpoints já
entregues.

## Saneamento depois da aceitação (2026-10-30)

Autorizado pelo usuário: os achados C-01 a C-12 da auditoria de conformidade e o A-44.

- **Corrigidos:** C-02, C-03, C-04, C-06, C-08, C-11, C-12 e A-44; o C-07 em parte.
- **Mantidos com justificativa:** C-01, C-05, C-09 e C-10. A diretiva do C-07 também não foi criada.
- Detalhes e justificativas em `FRONTEND_AUDIT.md`, "Saneamento de C-01 a C-12 e do A-44".
- Validação na tabela de validações e revisão independente sem achado acima de baixo.
- Sem stage nem commit; a integração depende de autorização do usuário.

## Decisão de aceitação

**Aprovada formalmente pelo usuário em 2026-10-30.** Nas palavras dele, "Aprovo formalmente a conclusão
técnica da missão de auditoria, correção e padronização do frontend":

- A-37 a A-43 e R-01 a R-04 aprovados conforme as evidências e as validações apresentadas.
- A-45 e A-46 foram corrigidos pela sessão 9b com autorização própria, depois dessa aprovação, e
  validados com 1358 testes e na aplicação real.
- **Pendências de baixa prioridade aceitas,** com a condição de ficarem registradas: R-05 a R-07 e
  A-44. O A-44 foi corrigido depois, no saneamento; R-05 a R-07 continuam abertos.
- **Estado do Git na aprovação:**
  - `main` = `origin/main` = `a4cedca`;
  - nada em stage e nenhum commit novo;
  - 54 entradas no working tree;
  - nenhuma alteração no back-end.
- A integração no Git depende de autorização explícita do usuário.

Não ficam abertos problemas altos entre os achados desta auditoria. Ficam abertos, fora do escopo
autorizado ou dependentes de decisão:

- **Média:** A-23 (tokens em cookie, depende do back-end);
- **Baixa:**
  - A-24: o back-end não informa as ações permitidas, só `canCancel`; exige contrato novo;
  - A-27: URL de produção desconhecida (`environment.prod.ts` aponta `localhost`). É configuração
    de implantação, não depende do back-end;
  - A-28: flags `volumeResolved` e `companyStatsForAll` desligadas. Os endpoints das specs 028 e
    031 já estão na `origin/main` do back-end, então ligá-las é decisão do usuário, sem depender
    do back-end;
  - A-30: ciclo de SLA na listagem, é do back-end;
  - A-33: avisos de orçamento de CSS, anteriores à missão, só aviso;
  - R-05 a R-07: responsividade em telas pequenas;
  - a espera de até cerca de 15s do A-42 antes da tela de sessão indisponível;
  - C-07, só em parte: falta a diretiva de foco preso, e o breakpoint segue repetido no TS e no CSS;
  - mantidos por decisão técnica, com justificativa em `FRONTEND_AUDIT.md`: C-01 (exceção do
    resultado tipado, sem alterar as skills), C-05, C-09 e C-10;
- **Convenção:** 6.3, nomes de teste.

As alterações de 2026-10-30 (A-37 a A-46, R-01 a R-04 e o saneamento) foram integradas na `main`
pelo PR #3 (ver "Integração na `main`").

## Integração na `main` (2026-10-30)

Merge autorizado pelo usuário depois da revisão do PR.

| Item | Valor |
|---|---|
| PR | #3 (https://github.com/rafaelps15/tickest-pristine-ui/pull/3) |
| Branch de origem | `fix/frontend-audit-integration`, criada a partir da `main` em `a4cedca`; mantida, local e remota |
| Versão revisada | `f449599`, a cabeça do PR com 8 commits e 61 arquivos |
| Commit de merge | `9962947` (merge commit, que preserva os commits por achado) |
| Data | 2026-10-30, 17:58 UTC (14:58 em Brasília) |
| Antes do merge | PR aberto contra `main`, sem conflito (`MERGEABLE`, `CLEAN`); o repositório não tem checks configurados |
| Conteúdo integrado | `git diff f449599 9962947` vazio: a `main` tem exatamente a versão revisada |
| Estado depois | `main` local = `origin/main` = `9962947`, working tree limpo |
| Fora da integração | Back-end, spec 044, skills e `CLAUDE.md` |

**Pendências que continuam abertas:**

- **Dependem do back-end:**
  - A-23: tokens em cookie `HttpOnly`;
  - A-24: ações permitidas na resposta;
  - A-30: ciclo de SLA vigente em `GET /tickets`.
- **Não dependem do back-end:**
  - A-27: URL de produção desconhecida;
  - A-28: flags `volumeResolved` e `companyStatsForAll`, decisão do usuário.
- **Baixas e aceitas:** R-05 a R-07.
- **Outras baixas:**
  - A-33: avisos de orçamento de CSS;
  - a espera de até cerca de 15s do A-42 antes da tela de sessão indisponível.
- **Em parte:** C-07, sem a diretiva de foco preso, com o breakpoint repetido no TS e no CSS.
- **Mantidos com justificativa:** C-01, C-05, C-09 e C-10.
- **Convenção:** 6.3, nomes de teste.
- **Back-end:** a cor da função (BR-001) está na spec 044, em descoberta.
<!-- ANEXO-B-FIM -->
