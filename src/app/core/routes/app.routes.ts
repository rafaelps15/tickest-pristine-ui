import { Routes } from '@angular/router';
import { authGuard } from '../../shared/guards/auth.guard';
import { adminMasterGuard } from '../../shared/guards/admin-master.guard';
import { pendingPasswordChangeGuard } from '../../shared/guards/pending-password-change.guard';

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
        path: 'register',
        loadComponent: () => import('../../users/feature-register/register.component')
          .then(m => m.RegisterComponent)
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
        loadComponent: () => import('../../tickets/feature-ticket-list/ticket-list.component')
          .then(m => m.TicketListComponent)
      },
      {
        path: 'tickets/novo',
        loadComponent: () => import('../../tickets/feature-ticket-create/ticket-create.component')
          .then(m => m.TicketCreateComponent)
      },
      {
        // Precisa vir antes de 'tickets/:id' — senão o router casaria "monitorar" como se fosse um id.
        path: 'tickets/monitorar',
        canActivate: [adminMasterGuard],
        data: { requiredPermission: 'tickets:manage' },
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
        canActivate: [adminMasterGuard],
        data: { requiredPermission: 'users:read' },
        loadComponent: () => import('../../users/feature-user-list/user-list.component')
          .then(m => m.UserListComponent)
      },
      {
        path: 'departamentos',
        canActivate: [adminMasterGuard],
        data: { requiredPermission: ['departments:manage', 'sectors:manage'] },
        loadComponent: () => import('../../departments/feature-department-list/department-list.component')
          .then(m => m.DepartmentListComponent)
      },
      // Setores ficam dentro da tela de departamentos; mantém o endereço antigo funcionando.
      { path: 'setores', redirectTo: 'departamentos', pathMatch: 'full' },
      {
        path: 'roles',
        canActivate: [adminMasterGuard],
        data: { requiredPermission: 'roles:manage' },
        loadComponent: () => import('../../roles/feature-role-list/role-list.component')
          .then(m => m.RoleListComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
