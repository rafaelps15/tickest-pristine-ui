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
        path: 'usuarios',
        canActivate: [adminMasterGuard],
        loadComponent: () => import('../../ui/features/user/user-register/user-register.component')
          .then(m => m.UserRegisterComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
