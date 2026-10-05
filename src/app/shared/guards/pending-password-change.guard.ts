import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginStore } from '../application/login.store';

/** Só permite a tela de primeiro acesso logo após um login barrado por senha provisória. */
export const pendingPasswordChangeGuard: CanActivateFn = () => {
  const loginStore = inject(LoginStore);
  const router = inject(Router);

  return loginStore.pendingCredentials() ? true : router.createUrlTree(['/login']);
};
