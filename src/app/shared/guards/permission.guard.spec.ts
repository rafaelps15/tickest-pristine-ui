import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { permissionGuard } from './permission.guard';
import { SessionService } from '../services/session.service';
import { CurrentUserService } from '../services/current-user.service';

describe('permissionGuard', () => {
  let session: jasmine.SpyObj<SessionService>;
  let currentUserService: jasmine.SpyObj<CurrentUserService>;
  let router: jasmine.SpyObj<Router>;
  let urlTree: UrlTree;

  function routeWithPermission(requiredPermission?: string | string[]): ActivatedRouteSnapshot {
    return { data: { requiredPermission } } as unknown as ActivatedRouteSnapshot;
  }

  beforeEach(() => {
    session = jasmine.createSpyObj('SessionService', ['isAuthenticated', 'hasPermission', 'clearSession']);
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

  it('redirects to login when there is no session', () => {
    session.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => permissionGuard(routeWithPermission('users:read'), {} as never));

    expect(result).toBe(urlTree);
    expect(currentUserService.ensureLoaded).not.toHaveBeenCalled();
  });

  it('allows the route when the logged-in user has the required permission', (done) => {
    session.isAuthenticated.and.returnValue(true);
    session.hasPermission.and.returnValue(true);
    currentUserService.ensureLoaded.and.returnValue(of({ status: 'loaded' as const }));

    const result = TestBed.runInInjectionContext(() => permissionGuard(routeWithPermission('users:read'), {} as never));

    (result as Observable<boolean | UrlTree>).subscribe(value => {
      expect(value).toBeTrue();
      expect(session.hasPermission).toHaveBeenCalledWith('users:read');
      done();
    });
  });

  it('redirects to the dashboard when the required permission is missing', (done) => {
    session.isAuthenticated.and.returnValue(true);
    session.hasPermission.and.returnValue(false);
    currentUserService.ensureLoaded.and.returnValue(of({ status: 'loaded' as const }));

    const result = TestBed.runInInjectionContext(() => permissionGuard(routeWithPermission('users:delete'), {} as never));

    (result as Observable<boolean | UrlTree>).subscribe(value => {
      expect(value).toBe(urlTree);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
      done();
    });
  });

  it('allows the route when the user has any of the permissions in the list', (done) => {
    session.isAuthenticated.and.returnValue(true);
    session.hasPermission.and.callFake(code => code === 'sectors:manage');
    currentUserService.ensureLoaded.and.returnValue(of({ status: 'loaded' as const }));

    const result = TestBed.runInInjectionContext(() =>
      permissionGuard(routeWithPermission(['departments:manage', 'sectors:manage']), {} as never));

    (result as Observable<boolean | UrlTree>).subscribe(value => {
      expect(value).toBeTrue();
      done();
    });
  });

  it('redirects to the dashboard when all the permissions in the list are missing', (done) => {
    session.isAuthenticated.and.returnValue(true);
    session.hasPermission.and.returnValue(false);
    currentUserService.ensureLoaded.and.returnValue(of({ status: 'loaded' as const }));

    const result = TestBed.runInInjectionContext(() =>
      permissionGuard(routeWithPermission(['departments:manage', 'sectors:manage']), {} as never));

    (result as Observable<boolean | UrlTree>).subscribe(value => {
      expect(value).toBe(urlTree);
      done();
    });
  });

  it('allows the route when the route requires no permission', (done) => {
    session.isAuthenticated.and.returnValue(true);
    currentUserService.ensureLoaded.and.returnValue(of({ status: 'loaded' as const }));

    const result = TestBed.runInInjectionContext(() => permissionGuard(routeWithPermission(undefined), {} as never));

    (result as Observable<boolean | UrlTree>).subscribe(value => {
      expect(value).toBeTrue();
      expect(session.hasPermission).not.toHaveBeenCalled();
      done();
    });
  });

  it('on a transient failure, goes to the session unavailable screen with the requested route, without checking the permission', (done) => {
    session.isAuthenticated.and.returnValue(true);
    currentUserService.ensureLoaded.and.returnValue(of({ status: 'unavailable' as const, reason: 'offline' as const }));
    const state = { url: '/usuarios' } as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() => permissionGuard(routeWithPermission('users:read'), state));

    (result as Observable<boolean | UrlTree>).subscribe(value => {
      expect(value).toBe(urlTree);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/sessao-indisponivel'], {
        queryParams: { motivo: 'offline', retorno: '/usuarios' }
      });
      expect(session.hasPermission).not.toHaveBeenCalled();
      expect(session.clearSession).not.toHaveBeenCalled();
      done();
    });
  });

  it('clears the session and redirects to login when the API rejects the session', (done) => {
    session.isAuthenticated.and.returnValue(true);
    currentUserService.ensureLoaded.and.returnValue(of({ status: 'unauthenticated' as const }));

    const result = TestBed.runInInjectionContext(() => permissionGuard(routeWithPermission('users:read'), {} as never));

    (result as Observable<boolean | UrlTree>).subscribe(value => {
      expect(value).toBe(urlTree);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
      expect(session.clearSession).toHaveBeenCalled();
      expect(session.hasPermission).not.toHaveBeenCalled();
      done();
    });
  });

  it('waits for the logged-in user to load (ensureLoaded) before checking the permission', () => {
    session.isAuthenticated.and.returnValue(true);
    currentUserService.ensureLoaded.and.returnValue(of({ status: 'loaded' as const }));

    TestBed.runInInjectionContext(() => permissionGuard(routeWithPermission('users:read'), {} as never));

    expect(currentUserService.ensureLoaded).toHaveBeenCalled();
  });
});
