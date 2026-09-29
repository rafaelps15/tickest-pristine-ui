import { Routes } from '@angular/router';
import { authGuard } from '../../shared/guards/auth.guard';
import { adminMasterGuard } from '../../shared/guards/admin-master.guard';

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
        path: 'usuarios',
        canActivate: [adminMasterGuard],
        data: { requiredPermission: 'users:manage' },
        loadComponent: () => import('../../users/feature-user-list/user-list.component')
          .then(m => m.UserListComponent)
      },
      {
        path: 'departamentos',
        canActivate: [adminMasterGuard],
        data: { requiredPermission: 'departments:manage' },
        loadComponent: () => import('../../departments/feature-department-list/department-list.component')
          .then(m => m.DepartmentListComponent)
      },
      {
        path: 'setores',
        canActivate: [adminMasterGuard],
        data: { requiredPermission: 'sectors:manage' },
        loadComponent: () => import('../../sectors/feature-sector-list/sector-list.component')
          .then(m => m.SectorListComponent)
      },
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
