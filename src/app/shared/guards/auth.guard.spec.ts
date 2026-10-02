import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { authGuard } from './auth.guard';
import { SessionService } from '../services/session.service';
import { CurrentUserService } from '../services/current-user.service';

describe('authGuard', () => {
  let session: jasmine.SpyObj<SessionService>;
  let currentUserService: jasmine.SpyObj<CurrentUserService>;
  let router: jasmine.SpyObj<Router>;
  let urlTree: UrlTree;

  beforeEach(() => {
    session = jasmine.createSpyObj('SessionService', ['isAuthenticated']);
    currentUserService = jasmine.createSpyObj('CurrentUserService', ['ensureLoaded']);
    router = jasmine.createSpyObj('Router', ['createUrlTree']);
    urlTree = {} as UrlTree;
    router.createUrlTree.and.returnValue(urlTree);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: SessionService, useValue: session },
        { provide: CurrentUserService, useValue: currentUserService },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('deve redirecionar para o login quando não houver sessão', () => {
    session.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(currentUserService.ensureLoaded).not.toHaveBeenCalled();
  });

  it('deve liberar a rota quando o usuário logado for carregado com sucesso', (done) => {
    session.isAuthenticated.and.returnValue(true);
    currentUserService.ensureLoaded.and.returnValue(of(true));

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    (result as Observable<boolean | UrlTree>).subscribe(value => {
      expect(value).toBeTrue();
      done();
    });
  });

  it('deve redirecionar para o login quando GET /users/me falhar (sessão inválida)', (done) => {
    session.isAuthenticated.and.returnValue(true);
    currentUserService.ensureLoaded.and.returnValue(of(false));

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    (result as Observable<boolean | UrlTree>).subscribe(value => {
      expect(value).toBe(urlTree);
      done();
    });
  });
});
