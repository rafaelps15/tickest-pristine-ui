import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';

/** Guard para rotas exclusivas do Admin Master. */
export const adminMasterGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (session.isAuthenticated() && (session.role() === 'adminMaster' || session.role() === 'admin')) {
    return true;
  }

  // Se não for adminMaster, redireciona para o dashboard
  return router.createUrlTree(['/dashboard']);
};