import { Routes } from '@angular/router';
import { authGuard } from '../guards/auth.guard';
import { adminMasterGuard } from '../guards/admin-master.guard';

/** Definição de rotas do sistema. */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../../ui/shared/layouts/auth-layout/auth-layout.component')
      .then(m => m.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        loadComponent: () => import('../../ui/features/auth/login/login.component')
          .then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('../../ui/features/user/user-register/user-register.component')
          .then(m => m.UserRegisterComponent)
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('../../ui/shared/layouts/main-layout/main-layout.component')
      .then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('../../ui/features/dashboard/dashboard.component')
          .then(m => m.DashboardComponent)
      },
      {
        path: 'tickets',
        loadComponent: () => import('../../ui/features/tickets/ticket-list/ticket-list.component')
          .then(m => m.TicketListComponent)
      },
      {
        path: 'tickets/novo',
        loadComponent: () => import('../../ui/features/tickets/ticket-create/ticket-create.component')
          .then(m => m.TicketCreateComponent)
      },
      {
        path: 'usuarios',
        canActivate: [adminMasterGuard],
        loadComponent: () => import('../../ui/features/user/user-list/user-list.component')
          .then(m => m.UserListComponent)
      },
      {
        path: 'departamentos',
        canActivate: [adminMasterGuard],
        loadComponent: () => import('../../ui/features/departments/department-list/department-list.component')
          .then(m => m.DepartmentListComponent)
      },
      {
        path: 'setores',
        canActivate: [adminMasterGuard],
        loadComponent: () => import('../../ui/features/sectors/sector-list/sector-list.component')
          .then(m => m.SectorListComponent)
      },
      {
        path: 'roles',
        canActivate: [adminMasterGuard],
        loadComponent: () => import('../../ui/features/roles/role-list/role-list.component')
          .then(m => m.RoleListComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
