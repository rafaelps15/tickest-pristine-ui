# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Funcionários das empresas clientes que usam o Tickest para abrir, atender e acompanhar chamados
internos (TI, RH, Financeiro, Comercial, Facilities etc.). Papéis confirmados hoje no código:

- **Requester** — abre chamados e acompanha o status das próprias solicitações.
- **Agent** — atende chamados do seu setor/departamento; pode também abrir chamados próprios.
- **Admin** (Admin Master) — administra o sistema globalmente (usuários, roles, departamentos,
  setores); não abre nem atende chamados operacionalmente.
- **Supervisor** — monitora e supervisiona todos os chamados em aberto no sistema, sem
  abrir chamados próprios. Numa primeira etapa, compartilha estrutura/dashboard com o Admin
  Master (sem "Meus Tickets", com uma visão "Todos os Tickets"/"Monitorar Tickets"); a separação
  fina de permissões entre os dois é etapa futura.

Uma role de RH (cadastrar funcionários com setor/departamento) está planejada mas ainda não
implementada (ver `docs/plano-onboarding-rh.md` no back-end). Nenhuma das duas — RH e
Supervisor — existe hoje no código (`RoleNames` só tem `Admin`, `Agent`, `Requester`); são
direção de produto confirmada, não implementação.

## Product Purpose

Substituir canais informais (e-mail, WhatsApp, ligação) por um canal único e rastreável para
solicitações internas entre departamentos de uma empresa, com cumprimento de SLA de atendimento.

## Positioning

Helpdesk corporativo interno entregue como **produto multi-tenant**: cada empresa cliente opera
seus próprios departamentos, setores, funcionários e chamados de forma isolada das demais.

Mecanismo diferenciador frente a concorrentes (Zendesk, Jira Service Desk, etc.) ainda não
confirmado — não inventar um agora; registrar quando decidido.

## Operating Context

Departamentos e setores típicos, criados pela estrutura inicial do back-end: TI (Helpdesk,
Infraestrutura), RH (Recrutamento, Departamento Pessoal), Financeiro (Contas a Pagar,
Contabilidade), Comercial (Vendas, Atendimento ao Cliente), Facilities (Manutenção, Logística).
Setor sempre pertence a um departamento; na interface, os setores são cadastrados dentro do
departamento, na tela "Departamentos e setores".

Fluxo do chamado: Aberto → Em Andamento → Resolvido → Fechado, com Cancelamento e Reabertura.

## Capabilities and Constraints

- Autenticação por e-mail/senha com JWT + refresh token; RBAC dinâmico (Role → Permission,
  atribuível por N:N a usuários — uma pessoa pode ter mais de uma role).
- **Gap confirmado nesta sessão**: o modelo de dados atual é **single-tenant** —
  `Department`/`Sector`/`Role`/`User` não têm nenhum conceito de empresa/tenant. Tornar-se
  multi-tenant é a direção de produto confirmada, mas a modelagem (isolamento por `TenantId`,
  schema por cliente, etc.) ainda está indefinida — decisão futura, não assumir nada até ser
  decidido.
- SLA de atendimento é objetivo confirmado, mas métricas/prazos/dashboards de SLA ainda não
  existem no sistema.
- Expansão futura mencionada pelo usuário: incorporar a ideia de "5S" — significado e escopo
  exatos ainda não confirmados; não assumir definição (ex.: metodologia 5S de organização) sem
  perguntar antes de desenhar algo em torno disso.
- Idioma confirmado da interface: português (pt-BR).

## Evidence on Hand

- Estrutura inicial (seed do back-end, todos os ambientes, só num banco sem departamentos):
  departamentos/setores acima. Chamados fictícios só em desenvolvimento (`Seeding:SampleData`),
  distribuídos pelos setores existentes.
- Logo existente em `public/img/logo/logo.png` e `public/img/logo/logo_letra.png`.
- Nenhum case, depoimento ou dado de cliente real documentado — não inventar.

## Product Principles

- Um canal único e rastreável substitui pedidos informais entre departamentos.
- Isolamento de dados entre empresas clientes é inegociável (direção multi-tenant confirmada).
- Conformidade rigorosa com a LGPD no tratamento de dados de funcionários (nome, e-mail,
  histórico de chamados).
- Papéis e permissões são dados, não código — qualquer evolução de RBAC deve continuar usando o
  catálogo de permissões já existente (`PermissionCodes`/`Role`/`RolePermission`).

## Accessibility & Inclusion

Nenhum requisito de acessibilidade específico confirmado além de boas práticas já aplicadas (ex.:
tabela acessível que espelha o gráfico do dashboard). A LGPD é a exigência de conformidade
confirmada — ver Capabilities and Constraints.
