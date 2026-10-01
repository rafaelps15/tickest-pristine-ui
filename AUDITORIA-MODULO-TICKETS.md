# Auditoria do módulo de Tickets (Front-end + Back-end) — 30/09/2026

Auditoria do código atual (`tickest-pristine-front` e `C:\dev\tickest-pristine`) frente à
especificação de roles e visões de ticket (Requester, Agent, Supervisor Smoke, Admin Master).

---

## 1. Mapeamento de rotas/endpoints no back-end

| Endpoint | Permissão exigida | Observação |
|---|---|---|
| `POST /tickets` | `tickets:create` | Cria ticket (`title, description, priority, sectorId, requesterId?, responsibleId?`). |
| `GET /tickets/users/{userId}` | dono (`userId == usuário logado`) **ou** `tickets:manage` | Único endpoint de leitura hoje. Filtra só por `CreatedByUserId`, não por setor. |
| `PUT /tickets/{ticketId}` | dono → `tickets:update-own`; não-dono → `tickets:manage` | Só altera `Description`/`Status`. Não altera `AssignedToUserId`. |
| `DELETE /tickets/{ticketId}` | dono → `tickets:delete-own`; não-dono → `tickets:manage` | Soft-delete. |
| `POST /tickets/{ticketId}/reopen` | dono → `tickets:reopen-own`; não-dono → `tickets:manage` | — |

**Não existe hoje:**
- Endpoint de listagem geral (`GET /tickets`) ou por setor/departamento.
- Endpoint para "assumir" um ticket (setar `AssignedToUserId`) — o campo existe na entidade
  `Ticket` (`Domain/Tickets/Ticket.cs:23`), mas nenhum comando/endpoint o altera depois da criação.

**Vínculo Agent ↔ Setor/Departamento:**
- `Ticket` tem `SectorId` (`Domain/Tickets/Ticket.cs:35`), e `Sector` tem `DepartmentId`
  (`Domain/Sectors/Sector.cs:20`) — o ticket já sabe a que setor/departamento pertence.
- **`User` não tem nenhum vínculo com `Sector`/`Department`**
  (`Domain/Users/User.cs:11-15` — só `Id, Email, FirstName, LastName, Code`). Não há tabela
  `UserSector`/`UserDepartment`. Hoje não existe como calcular "o setor do Agent logado" no
  back-end — é o maior gap estrutural para a "Fila de Atendimento".
- `Department` tem `ResponsibleUserId` (`Domain/Departments/Department.cs:20`), mas isso é um
  campo solto (1 responsável por departamento), não uma relação N:N Agent↔Setor.

---

## 2. Auditoria de permissões e roles

Roles hoje são **dados, não código**: `Role` (nome) + `RolePermission` (N:N com código de
permissão) são genéricos, e já existem endpoints administrativos para criar uma role nova e
atribuir permissões (`POST /roles`, `PUT /roles/{roleId}/permissions`, ambos usados pela tela
`roles` do front). Isso importa porque **a role "Supervisor Smoke" pode ser criada hoje sem
nenhuma mudança de código** — é só cadastro via a tela de Roles já existente.

| Role | Permissões atuais (seed) | Onde |
|---|---|---|
| **Admin** (= Admin Master) | `PermissionCodes.All` (todas) | `AdminSeederExtensions.cs:61-64` |
| **Agent** | `tickets:create`, `tickets:view-own`, `tickets:update-own`, `tickets:delete-own`, `tickets:reopen-own`, `tickets:manage`, `users:access` | `AdminSeederExtensions.cs:31-40` |
| **Requester** | `tickets:create`, `tickets:view-own`, `tickets:update-own`, `tickets:delete-own`, `tickets:reopen-own`, `users:access` | `AdminSeederExtensions.cs:18-26` |
| **Supervisor Smoke** | **Não existe ainda.** Precisaria de `tickets:manage` + `users:access` (para editar o próprio perfil), sem `tickets:create`/`view-own`/`update-own`/etc. | — |

Pontos relevantes:
- A diferença entre Agent e Requester hoje é só o `tickets:manage` — é exatamente essa permissão
  que os handlers de Update/Delete/Reopen/GetByUser já usam como "pode agir em ticket de
  qualquer um" (`isOwner ? PermissionCodes.Tickets.XOwn : PermissionCodes.Tickets.Manage`, ver
  `UpdateTicketCommandHandler.cs:32-40` e equivalentes). Esse padrão de fallback já é o mecanismo
  certo para basear a "Fila do Setor" e o "Monitoramento Global" — só falta o endpoint de leitura
  correspondente.
- Nenhuma permissão hoje é escopada por setor/departamento (é tudo global: ou você só vê o seu,
  ou vê tudo). Para o requisito do Agent ("fila do seu setor") é necessário decidir se isso será
  feito por uma permissão nova, por uma query com filtro de setor, ou pelo vínculo Agent↔Setor
  que falta (ver seção 1).

---

## 3. Mapeamento de telas e menus no front-end

**Menu lateral** (`main-layout.component.html`):
- `Meus Tickets` (linha 31-36) é exibido **incondicionalmente** para qualquer usuário logado —
  não há `@if (sessionService.hasPermission(...))` como já existe para os itens de Administração
  (linhas 46-53, 55-62, etc.). Hoje Admin e qualquer Agent/Requester veem o mesmo item.
- Não existe nenhum item "Fila de Atendimento", "Todos os Tickets" ou "Monitorar Tickets".

**Listagem de tickets** (`TicketsStore`, `src/app/tickets/application/tickets.store.ts`):
- O `_listResource` é fixo: `params: () => store._session.userId()`, `stream: (params) =>
  ticketDataService.getByUser(params)` (linhas 18-23). **Não há nenhum parâmetro de escopo**
  (próprio/setor/todos) — está 100% acoplado a "tickets do usuário logado".
- `TicketDataService` só expõe `getByUser(userId)` — não tem `getBySector`/`getAll`.
- `Ticket` (entidade do front, `entities/ticket.ts`) não tem `sectorId`/`departmentId` — o
  `TicketResponse` do back também não devolve esses campos hoje
  (`Application/Tickets/GetByUser/TicketResponse.cs`), então mesmo se a tela ganhasse um filtro,
  não haveria como exibir/agrupar por setor sem alterar o DTO do back.
- Não há tela/rota de "assumir ticket" (claim) — consistente com a ausência do endpoint no back.

**Resumindo:** a tela de listagem (`TicketListComponent`/`TicketsStore`) é **um único caminho de
dados hardcoded para "meus tickets"**. Ela suporta bem a ideia de reaproveitamento pedida (um
componente, dado diferente por parâmetro), mas hoje não tem o parâmetro nem o método de Data
Service para isso — é código novo, não ajuste de configuração.

---

## 4. Plano de ação (GAP Analysis)

### Back-end

- [OK] CRUD básico de Ticket (Create/Update/Delete/Reopen) com fallback dono→`*Own`,
  não-dono→`tickets:manage` já implementado e testado.
- [OK] Modelo de Role/Permission dinâmico — criar a role "Supervisor Smoke" é cadastro, não
  código.
- [OK] `Ticket.SectorId` e `Ticket.AssignedToUserId` já existem no domínio.
- [AJUSTE] `TicketResponse` (DTO de leitura) não expõe `SectorId`/`DepartmentId` — precisa
  incluir para o front conseguir filtrar/exibir por setor.
- [AJUSTE] Nenhum comando altera `AssignedToUserId` depois da criação — "assumir chamado" não
  tem como ser implementado no front sem isso.
- [FALTANDO] Endpoint de listagem geral/filtrada (ex.: `GET /tickets` com querystring de
  status/setor, gated por `tickets:manage`) para alimentar "Fila do Setor" e "Monitorar Tickets".
- [FALTANDO] Vínculo Agent↔Setor/Departamento no domínio (não existe hoje) — bloqueia calcular
  "o setor do agente logado" no back. Precisa de uma decisão de modelagem antes de codar (nova
  tabela `UserSector`, ou reaproveitar algo existente).
- [FALTANDO] Seed/registro de dados da role "Supervisor Smoke" com o permission set combinando
  `tickets:manage` (+ `users:access`).

### Front-end

- [OK] `SessionService.hasPermission()` já existe e já é usado para esconder itens de menu — o
  mesmo padrão resolve a visibilidade condicional pedida para Tickets.
- [OK] Padrão Store → Data Service já estabelecido em `TicketsStore`/`TicketDataService` — a
  extensão é direta, sem quebrar a convenção do domínio.
- [AJUSTE] Menu: condicionar "Meus Tickets" a `tickets:view-own` (ou `tickets:create`) e remover
  para quem só tem `tickets:manage` sem essas; adicionar "Fila de Atendimento"/"Todos os Tickets"
  condicionada a `tickets:manage`.
- [AJUSTE] `TicketsStore`: hoje só busca por usuário logado — precisa de um parâmetro de escopo
  (`própria` | `setor` | `todas`) alimentando o `_listResource`, reaproveitando o mesmo
  componente de listagem como pedido (não um Store novo, já que é o mesmo caso de uso de
  leitura, só com filtro variável).
- [FALTANDO] `TicketDataService`: método(s) novos para listar por setor/tudo — dependem do
  endpoint do back-end (ver seção anterior).
- [FALTANDO] Rota/entrada de menu "Fila de Atendimento" (Agent) e "Monitorar Tickets"
  (Supervisor/Admin) — podem apontar para o mesmo `TicketListComponent` com um parâmetro de rota
  ou input indicando o escopo.
- [FALTANDO] Ação de "assumir" (claim) na listagem — depende do endpoint de back-end que também
  falta.
- [FALTANDO] Regra específica para Admin Master/Supervisor: esconder "Meus Tickets" e "Abrir
  Ticket" (eles não são requerentes), mostrar só a visão de monitoramento.

---

## Observação

Como combinado nesta etapa, Admin Master e Supervisor Smoke vão compartilhar a mesma
estrutura/tela por ora — a separação fina de permissões entre os dois é explicitamente adiada
para uma etapa futura, então o plano acima trata os dois como um único "perfil de
monitoramento" por enquanto.
