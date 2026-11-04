import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { RouterStateSnapshot, Router, UrlTree } from '@angular/router';
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
    session = jasmine.createSpyObj('SessionService', ['isAuthenticated', 'clearSession']);
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

  it('should redirect to the login when there is no session', () => {
    session.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(currentUserService.ensureLoaded).not.toHaveBeenCalled();
  });

  it('should allow the route when the logged-in user is loaded successfully', (done) => {
    session.isAuthenticated.and.returnValue(true);
    currentUserService.ensureLoaded.and.returnValue(of({ status: 'loaded' as const }));

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    (result as Observable<boolean | UrlTree>).subscribe(value => {
      expect(value).toBeTrue();
      done();
    });
  });

  it('should erase the session and redirect to the login when the API refuses the session', (done) => {
    session.isAuthenticated.and.returnValue(true);
    currentUserService.ensureLoaded.and.returnValue(of({ status: 'unauthenticated' as const }));

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    (result as Observable<boolean | UrlTree>).subscribe(value => {
      expect(value).toBe(urlTree);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
      expect(session.clearSession).toHaveBeenCalled();
      done();
    });
  });

  it('on a transient failure leads to the unavailable-session screen with the reason and the requested route, not to the login', (done) => {
    session.isAuthenticated.and.returnValue(true);
    currentUserService.ensureLoaded.and.returnValue(of({ status: 'unavailable' as const, reason: 'rate-limited' as const }));
    const state = { url: '/tickets?status=1' } as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, state));

    (result as Observable<boolean | UrlTree>).subscribe(value => {
      expect(value).toBe(urlTree);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/sessao-indisponivel'], {
        queryParams: { motivo: 'rate-limited', retorno: '/tickets?status=1' }
      });
      expect(router.createUrlTree).not.toHaveBeenCalledWith(['/login']);
      expect(session.clearSession).not.toHaveBeenCalled();
      done();
    });
  });
});
