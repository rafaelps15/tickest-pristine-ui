import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { pendingPasswordChangeGuard } from './pending-password-change.guard';
import { LoginStore } from '../application/login.store';
import { LoginCredentials } from '../entities/login-credentials';

describe('pendingPasswordChangeGuard', () => {
  let pendingCredentials: ReturnType<typeof signal<LoginCredentials | null>>;
  let router: jasmine.SpyObj<Router>;
  let urlTree: UrlTree;

  beforeEach(() => {
    pendingCredentials = signal<LoginCredentials | null>(null);
    router = jasmine.createSpyObj('Router', ['createUrlTree']);
    urlTree = {} as UrlTree;
    router.createUrlTree.and.returnValue(urlTree);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: LoginStore, useValue: { pendingCredentials } },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('deve liberar a rota quando houver troca de senha pendente', () => {
    pendingCredentials.set({ email: 'admin@empresa.com', password: 'Provisoria@1' });

    const result = TestBed.runInInjectionContext(() => pendingPasswordChangeGuard({} as never, {} as never));

    expect(result).toBeTrue();
  });

  it('deve redirecionar para o login quando não houver troca de senha pendente', () => {
    const result = TestBed.runInInjectionContext(() => pendingPasswordChangeGuard({} as never, {} as never));

    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});
