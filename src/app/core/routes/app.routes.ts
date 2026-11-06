import { Routes } from '@angular/router';
import { authGuard } from '../../shared/guards/auth.guard';
import { permissionGuard } from '../../shared/guards/permission.guard';
import { pendingPasswordChangeGuard } from '../../shared/guards/pending-password-change.guard';
import { TICKETS_MANAGE_PERMISSION } from '../../shared/entities/permission-codes';

/** Definição de rotas do sistema. */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../../shared/ui/layouts/auth-layout/auth-layout.component')
      .then(m => m.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        loadComponent: () => import('../../shared/feature-login/login.component')
          .then(m => m.LoginComponent)
      },
      {
        path: 'primeiro-acesso',
        canActivate: [pendingPasswordChangeGuard],
        loadComponent: () => import('../../shared/feature-first-access/first-access.component')
          .then(m => m.FirstAccessComponent)
      },
      {
        // Link do convite por e-mail (spec 008 do back-end; caminho combinado na config Invitations:ActivationUrl).
        path: 'ativar-conta',
        loadComponent: () => import('../../shared/feature-activate-account/activate-account.component')
          .then(m => m.ActivateAccountComponent)
      },
      {
        // Sessão salva, mas GET /users/me falhou por 429, 5xx ou rede: deixa tentar de novo em vez de mandar pro login (A-42).
        path: 'sessao-indisponivel',
        loadComponent: () => import('../../shared/feature-session-unavailable/session-unavailable.component')
          .then(m => m.SessionUnavailableComponent)
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('../../shared/ui/layouts/main-layout/main-layout.component')
      .then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('../../dashboard/dashboard.component')
          .then(m => m.DashboardComponent)
      },
      {
        path: 'tickets',
        canActivate: [permissionGuard],
        data: { requiredPermission: 'tickets:view-own' },
        loadComponent: () => import('../../tickets/feature-ticket-list/ticket-list.component')
          .then(m => m.TicketListComponent)
      },
      {
        path: 'tickets/novo',
        canActivate: [permissionGuard],
        data: { requiredPermission: 'tickets:create' },
        loadComponent: () => import('../../tickets/feature-ticket-create/ticket-create.component')
          .then(m => m.TicketCreateComponent)
      },
      {
        // Precisa vir antes de 'tickets/:id' — senão o router casaria "monitorar" como se fosse um id.
        path: 'tickets/monitorar',
        canActivate: [permissionGuard],
        data: { requiredPermission: TICKETS_MANAGE_PERMISSION },
        loadComponent: () => import('../../tickets/feature-ticket-monitor/ticket-monitor.component')
          .then(m => m.TicketMonitorComponent)
      },
      {
        path: 'tickets/:id',
        loadComponent: () => import('../../tickets/feature-ticket-detail/ticket-detail.component')
          .then(m => m.TicketDetailComponent)
      },
      {
        path: 'perfil',
        loadComponent: () => import('../../users/feature-profile-edit/profile-edit.component')
          .then(m => m.ProfileEditComponent)
      },
      {
        path: 'usuarios',
        canActivate: [permissionGuard],
        data: { requiredPermission: 'users:read' },
        loadComponent: () => import('../../users/feature-user-list/user-list.component')
          .then(m => m.UserListComponent)
      },
      {
        path: 'departamentos',
        canActivate: [permissionGuard],
        data: { requiredPermission: ['departments:manage', 'sectors:manage'] },
        loadComponent: () => import('../../departments/feature-department-list/department-list.component')
          .then(m => m.DepartmentListComponent)
      },
      // Setores ficam dentro da tela de departamentos; mantém o endereço antigo funcionando.
      { path: 'setores', redirectTo: 'departamentos', pathMatch: 'full' },
      {
        // GET /roles exige roles:read: quem só tem roles:manage abriria uma tela que daria 403. A edição pede roles:manage.
        path: 'roles',
        canActivate: [permissionGuard],
        data: { requiredPermission: 'roles:read' },
        loadComponent: () => import('../../roles/feature-role-list/role-list.component')
          .then(m => m.RoleListComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
