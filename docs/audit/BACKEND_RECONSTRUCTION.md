# Reconstrução no back-end — lógica removida do front

Registro oficial das responsabilidades do back-end que estavam implementadas no Angular e foram
**removidas** na auditoria de 2026-10-29. Cada item descreve o que existia, por que saiu e o que o
back-end (`tickest-pristine`) precisa oferecer para que o front volte a ter o recurso. Nada aqui foi
implementado no back-end: esta missão não alterou o servidor.

Este documento não é uma lista de melhorias desejáveis. Achados que continuam no front por serem
apresentação legítima, ou que dependem de contrato novo mas não foram removidos, estão em
`FRONTEND_AUDIT.md`.

| Id | Recurso | Situação no front | Situação no back-end |
|---|---|---|---|
| BR-001 | Cor do badge por função | Removido | Não existe; precisa ser criado |

---

## BR-001 — Cor do badge por função

**Situação:** removido do front em 2026-10-29. Reconstrução no back-end pendente; nenhuma
decisão de produto nova foi tomada.

### O que existia no front

- `src/app/shared/utils/role-colors.util.ts` (arquivo excluído) guardava no `localStorage`, na
  chave `tickest.roleColors`, um mapa *nome da função → cor hex* (`#rrggbb`). Funções exportadas:
  `getRoleColor`, `getRoleColors`, `setRoleColor`, `clearRoleColor` e
  `hasAccessibleRoleColorContrast` (validação de contraste WCAG AA, 4,5:1, do par fundo/texto do
  badge nos temas claro e escuro). O teste correspondente (`role-colors.util.spec.ts`) também saiu.
- Tela Funções (`src/app/roles/feature-role-list/role-list.component.{ts,html,css,spec.ts}`): item
  "Cor do badge…" no menu de cada função, diálogo com `<input type="color">`, prévia ao vivo, aviso
  de contraste durante a escolha, "Remover cor" com "Desfazer" no toast e uma amostra da cor na
  linha.
- Badges de função coloridos com a classe global `.badge-role-custom` (`src/styles.css`, variável
  `--role-color`) na tabela de Usuários e no painel de informações
  (`src/app/users/feature-user-list/user-list.component.*`, `user-list-info-panel.component.*`) e
  no diálogo de atribuição de responsável (`src/app/tickets/ui/ticket-assign-dialog/*`).
- O Guia da tela Usuários dizia "ou na cor escolhida para cada uma na tela Funções".
- `DESIGN.md` descrevia o recurso; as duas passagens foram trocadas por uma nota de remoção.

O próprio código admitia o problema: "o back-end não tem campo de cor na função ainda, então isso
não é dado real, não sincroniza entre usuários/dispositivos". O comentário do CSS registrava que a
prévia foi um pedido do usuário em 2026-10-25, "pra ver como fica".

**Backup integral** do estado anterior (diff dos arquivos envolvidos e cópia dos dois arquivos
excluídos), caso a prévia precise voltar antes do back-end:
`C:\Users\rafae\AppData\Local\Temp\claude\c--dev-tickest-pristine-front\65d7fc55-6391-4e98-8ae7-b7f896419fc4\scratchpad\backup-br001\`.

### Por que saiu

A cor é um atributo da função, um dado de domínio que o administrador configura para todos. Gravá-la
no navegador simulava uma persistência que não existe:

- cada administrador via cores diferentes, e os demais usuários nunca as viam;
- a cor se perdia ao trocar de navegador ou limpar os dados;
- a chave era o **nome** da função, então renomear uma função perdia a cor ou a passava a outra;
- não havia autorização: qualquer pessoa podia "pintar" funções no próprio navegador.

O back-end não tem campo de cor (`RoleResponse` só tem `name`, `permissionCodes`, `isDefault` e
`isAdministrator`; a busca por `Color` no domínio e na aplicação não encontra nada na `origin/main`
em `0eff7b6`).

### O que o back-end precisa oferecer

1. **Persistência:** um atributo opcional de cor na função, nulo por padrão (nulo = acento padrão
   índigo do sistema). Ligado à identidade estável da função, não ao nome; ver a relação com a spec
   036 (identidade estável das funções) abaixo.
2. **Leitura:** a cor no recurso de função das listagens (`GET /roles`) e em qualquer resposta que
   já devolve as funções de um usuário para exibição (listagem de usuários, usuário logado,
   candidatos a responsável), para que as telas não precisem cruzar com `GET /roles`.
3. **Escrita:** uma operação para definir ou limpar a cor de uma função, exigindo a mesma permissão
   que hoje protege a edição de funções (`roles:manage`).
4. **Validação no servidor:**
   - formato hexadecimal de 6 dígitos (`#rrggbb`), sem diferenciar maiúsculas;
   - contraste mínimo WCAG AA (4,5:1) do badge nos dois temas, com as mesmas misturas que o CSS
     usava: no claro, fundo com 15% da cor sobre branco e texto com 65% da cor sobre preto; no
     escuro, fundo com 25% da cor sobre a superfície escura `#212529` e texto com 45% da cor sobre
     branco. Cor reprovada é recusada com erro de validação, e não trocada em silêncio;
   - a decisão de manter essa regra de contraste no servidor ou só no formulário do front é de
     produto (ver "Decisões pendentes").
5. **Concorrência:** última gravação vence é aceitável, salvo decisão diferente. A alteração deve
   valer para todos na próxima leitura, sem cache por usuário.

### Critérios de aceitação

- Dois administradores em navegadores diferentes veem a mesma cor depois que um deles a define.
- Renomear a função mantém a cor.
- Usuário sem `roles:manage` recebe 403 ao tentar definir ou limpar a cor.
- Cor em formato inválido ou sem contraste suficiente é recusada com erro de validação.
- Limpar a cor devolve nulo nas leituras.

### Testes esperados no back-end

- Validador: formato inválido, cor clara demais (ex.: `#ffffff`), cor média aceita (ex.: `#2e7d14`).
- Handler: definir, trocar e limpar; função inexistente devolve 404; sem permissão devolve 403.
- Integração: a cor aparece em `GET /roles` e nas respostas que listam funções de usuários.

### Impacto no front e ajustes depois do back-end

- **Hoje:** todos os badges de função usam o índigo `bg-label-primary`; a tela Funções só tem
  "Editar permissões"/"Ver permissões". Nenhuma tela lê ou grava a chave `tickest.roleColors`. Valores
  antigos dessa chave ficam esquecidos no navegador de quem usou a prévia, sem efeito.
- **Depois do back-end:** acrescentar o campo de cor às entidades de função
  (`roles/entities/role.ts`, `users/entities/user-summary.ts`), um método no `RoleDataService`
  para gravar, um método no `RolesStore` que recarrega a lista no sucesso, o diálogo de cor na tela
  Funções (o backup tem a versão anterior do diálogo e dos testes) e reintroduzir
  `.badge-role-custom` lendo a cor da resposta da API.

### Dependências

- **Spec 036 (identidade estável das funções), no back-end:** se as funções ganharem um
  identificador estável, a cor deve se ligar a ele. Sem isso, a operação de escrita fica endereçada
  pelo nome, como as demais operações de função hoje.

### Decisões pendentes (sem evidência suficiente para decidir aqui)

- Se o contraste é regra do servidor (recusa a gravação) ou só orientação do formulário.
- Se a cor deve ter uma paleta fechada em vez de qualquer hex.
- Se Administrador e a função padrão podem ter cor própria.
