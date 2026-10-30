import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { adminMasterGuard } from './admin-master.guard';
import { SessionService } from '../services/session.service';
import { CurrentUserService } from '../services/current-user.service';

describe('adminMasterGuard', () => {
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

  it('deve redirecionar para o login quando não houver sessão', () => {
    session.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => adminMasterGuard(routeWithPermission('users:read'), {} as never));

    expect(result).toBe(urlTree);
    expect(currentUserService.ensureLoaded).not.toHaveBeenCalled();
  });

  it('deve liberar a rota quando o usuário logado tiver a permissão exigida', (done) => {
    session.isAuthenticated.and.returnValue(true);
    session.hasPermission.and.returnValue(true);
    currentUserService.ensureLoaded.and.returnValue(of({ status: 'loaded' as const }));

    const result = TestBed.runInInjectionContext(() => adminMasterGuard(routeWithPermission('users:read'), {} as never));

    (result as Observable<boolean | UrlTree>).subscribe(value => {
      expect(value).toBeTrue();
      expect(session.hasPermission).toHaveBeenCalledWith('users:read');
      done();
    });
  });

  it('deve redirecionar para o dashboard quando faltar a permissão exigida', (done) => {
    session.isAuthenticated.and.returnValue(true);
    session.hasPermission.and.returnValue(false);
    currentUserService.ensureLoaded.and.returnValue(of({ status: 'loaded' as const }));

    const result = TestBed.runInInjectionContext(() => adminMasterGuard(routeWithPermission('users:delete'), {} as never));

    (result as Observable<boolean | UrlTree>).subscribe(value => {
      expect(value).toBe(urlTree);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
      done();
    });
  });

  it('deve liberar a rota quando o usuário tiver qualquer uma das permissões da lista', (done) => {
    session.isAuthenticated.and.returnValue(true);
    session.hasPermission.and.callFake(code => code === 'sectors:manage');
    currentUserService.ensureLoaded.and.returnValue(of({ status: 'loaded' as const }));

    const result = TestBed.runInInjectionContext(() =>
      adminMasterGuard(routeWithPermission(['departments:manage', 'sectors:manage']), {} as never));

    (result as Observable<boolean | UrlTree>).subscribe(value => {
      expect(value).toBeTrue();
      done();
    });
  });

  it('deve redirecionar para o dashboard quando faltar todas as permissões da lista', (done) => {
    session.isAuthenticated.and.returnValue(true);
    session.hasPermission.and.returnValue(false);
    currentUserService.ensureLoaded.and.returnValue(of({ status: 'loaded' as const }));

    const result = TestBed.runInInjectionContext(() =>
      adminMasterGuard(routeWithPermission(['departments:manage', 'sectors:manage']), {} as never));

    (result as Observable<boolean | UrlTree>).subscribe(value => {
      expect(value).toBe(urlTree);
      done();
    });
  });

  it('deve liberar a rota quando não houver permissão exigida na rota', (done) => {
    session.isAuthenticated.and.returnValue(true);
    currentUserService.ensureLoaded.and.returnValue(of({ status: 'loaded' as const }));

    const result = TestBed.runInInjectionContext(() => adminMasterGuard(routeWithPermission(undefined), {} as never));

    (result as Observable<boolean | UrlTree>).subscribe(value => {
      expect(value).toBeTrue();
      expect(session.hasPermission).not.toHaveBeenCalled();
      done();
    });
  });

  it('numa falha passageira leva à tela de sessão indisponível com a rota pedida, sem checar a permissão', (done) => {
    session.isAuthenticated.and.returnValue(true);
    currentUserService.ensureLoaded.and.returnValue(of({ status: 'unavailable' as const, reason: 'offline' as const }));
    const state = { url: '/usuarios' } as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() => adminMasterGuard(routeWithPermission('users:read'), state));

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

  it('deve apagar a sessão e redirecionar para o login quando a API recusar a sessão', (done) => {
    session.isAuthenticated.and.returnValue(true);
    currentUserService.ensureLoaded.and.returnValue(of({ status: 'unauthenticated' as const }));

    const result = TestBed.runInInjectionContext(() => adminMasterGuard(routeWithPermission('users:read'), {} as never));

    (result as Observable<boolean | UrlTree>).subscribe(value => {
      expect(value).toBe(urlTree);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
      expect(session.clearSession).toHaveBeenCalled();
      expect(session.hasPermission).not.toHaveBeenCalled();
      done();
    });
  });

  it('deve esperar o usuário logado carregar (ensureLoaded) antes de checar a permissão', () => {
    session.isAuthenticated.and.returnValue(true);
    currentUserService.ensureLoaded.and.returnValue(of({ status: 'loaded' as const }));

    TestBed.runInInjectionContext(() => adminMasterGuard(routeWithPermission('users:read'), {} as never));

    expect(currentUserService.ensureLoaded).toHaveBeenCalled();
  });
});
