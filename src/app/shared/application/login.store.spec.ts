import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { LoginStore } from './login.store';
import { AuthDataService } from '../infrastructure/auth.data.service';
import { SessionService } from '../services/session.service';
import { CurrentUserService } from '../services/current-user.service';
import { AccessTokens } from '../entities/access-tokens';
import { LoginCredentials } from '../entities/login-credentials';
import { CurrentUser, CurrentUserLoadResult } from '../entities/current-user';

describe('LoginStore', () => {
  const credentials: LoginCredentials = { email: 'admin@empresa.com', password: 'Provisoria@1' };
  const tokens: AccessTokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };
  /** Primeira carga do usuário em nova tentativa, controlada pelo teste. */
  const retryingFirstLoad = signal(false);

  let store: InstanceType<typeof LoginStore>;
  let dataService: jasmine.SpyObj<AuthDataService>;
  let session: jasmine.SpyObj<SessionService>;
  let currentUserService: jasmine.SpyObj<CurrentUserService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    retryingFirstLoad.set(false);
    dataService = jasmine.createSpyObj('AuthDataService', ['login', 'changeRequiredPassword', 'logout']);
    session = jasmine.createSpyObj('SessionService', ['saveSession', 'refreshToken', 'clearSession']);
    currentUserService = jasmine.createSpyObj('CurrentUserService', ['load'], { retryingFirstLoad });
    currentUserService.load.and.returnValue(of({ status: 'loaded' as const }));
    router = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl', 'createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        LoginStore,
        { provide: AuthDataService, useValue: dataService },
        { provide: SessionService, useValue: session },
        { provide: CurrentUserService, useValue: currentUserService },
        { provide: Router, useValue: router }
      ]
    });
    store = TestBed.inject(LoginStore);
  });

  /** Simula o login barrado por senha provisória, deixando as credenciais pendentes no store. */
  function loginWithProvisionalPassword(): void {
    dataService.login.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 403,
      error: { title: 'Users.PasswordChangeRequired', detail: 'É preciso definir uma nova senha antes de acessar o sistema.' }
    })));
    store.login(credentials);
  }

  it('starts the session and goes to the dashboard when the login succeeds', () => {
    dataService.login.and.returnValue(of(tokens));

    store.login(credentials);

    expect(session.saveSession).toHaveBeenCalledWith(tokens);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(store.error()).toBeNull();
  });

  it('does not go to the dashboard and leads to the session unavailable screen when the user fails to load due to a transient failure', () => {
    const unavailableTree = {} as UrlTree;
    router.createUrlTree.and.returnValue(unavailableTree);
    currentUserService.load.and.returnValue(of({ status: 'unavailable' as const, reason: 'server-error' as const }));
    dataService.login.and.returnValue(of(tokens));

    store.login(credentials);

    expect(router.navigate).not.toHaveBeenCalledWith(['/dashboard']);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/sessao-indisponivel'], {
      queryParams: { motivo: 'server-error', retorno: '/dashboard' }
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith(unavailableTree);
    expect(session.clearSession).not.toHaveBeenCalled();
  });

  it('does not go to the dashboard, clears the session and shows the error when the API rejects the just-logged-in user', () => {
    currentUserService.load.and.returnValue(of({ status: 'unauthenticated' as const }));
    dataService.login.and.returnValue(of(tokens));

    store.login(credentials);

    expect(router.navigate).not.toHaveBeenCalledWith(['/dashboard']);
    expect(session.clearSession).toHaveBeenCalled();
    expect(store.error()).toBe('Não foi possível carregar seus dados de acesso. Entre novamente.');
  });

  it('keeps loading until the logged-in user loads, so the button stays disabled during the retries', () => {
    const load = new Subject<CurrentUserLoadResult>();
    currentUserService.load.and.returnValue(load);
    dataService.login.and.returnValue(of(tokens));

    store.login(credentials);
    expect(store.loading()).toBeTrue();

    load.next({ status: 'loaded' });
    load.complete();
    expect(store.loading()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('ignores a second login while the first one is still starting the session', () => {
    currentUserService.load.and.returnValue(new Subject<CurrentUserLoadResult>());
    dataService.login.and.returnValue(of(tokens));

    store.login(credentials);
    store.login(credentials);

    expect(dataService.login).toHaveBeenCalledTimes(1);
    expect(session.saveSession).toHaveBeenCalledTimes(1);
  });

  it('exposes the retry of the session start only while the login is in progress', () => {
    currentUserService.load.and.returnValue(new Subject<CurrentUserLoadResult>());
    dataService.login.and.returnValue(of(tokens));
    retryingFirstLoad.set(true);
    expect(store.retryingSession()).toBeFalse();

    store.login(credentials);
    expect(store.retryingSession()).toBeTrue();

    retryingFirstLoad.set(false);
    expect(store.retryingSession()).toBeFalse();
  });

  it('releases loading when the login is rejected', () => {
    dataService.login.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400 })));

    store.login(credentials);

    expect(store.loading()).toBeFalse();
    expect(currentUserService.load).not.toHaveBeenCalled();
  });

  it('keeps the credentials and goes to first access when the password is temporary', () => {
    loginWithProvisionalPassword();

    expect(store.pendingCredentials()).toEqual(credentials);
    expect(store.error()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/primeiro-acesso']);
    expect(session.saveSession).not.toHaveBeenCalled();
  });

  it('shows a generic message when the credentials are invalid', () => {
    dataService.login.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400 })));

    store.login(credentials);

    expect(store.error()).toBe('E-mail ou senha incorretos.');
    expect(store.pendingCredentials()).toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('shows the API message when the account is locked due to attempts (403)', () => {
    dataService.login.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 403,
      error: { title: 'Users.LockedOut', detail: 'Muitas tentativas de login sem sucesso. A conta está bloqueada por alguns minutos; tente de novo mais tarde.' }
    })));

    store.login(credentials);

    expect(store.error()).toBe('Muitas tentativas de login sem sucesso. A conta está bloqueada por alguns minutos; tente de novo mais tarde.');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('shows its own message when the rate limiter blocks the request (429, no body)', () => {
    dataService.login.and.returnValue(throwError(() => new HttpErrorResponse({ status: 429 })));

    store.login(credentials);

    expect(store.error()).toBe('Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.');
  });

  it('changes the temporary password, clears the credentials and starts the session', () => {
    loginWithProvisionalPassword();
    dataService.changeRequiredPassword.and.returnValue(of(tokens));

    store.changeRequiredPassword('NovaSenha#2');

    expect(dataService.changeRequiredPassword).toHaveBeenCalledWith({
      email: credentials.email,
      currentPassword: credentials.password,
      newPassword: 'NovaSenha#2'
    });
    expect(store.pendingCredentials()).toBeNull();
    expect(session.saveSession).toHaveBeenCalledWith(tokens);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('keeps loading after changing the temporary password until the user loads, and ignores a second change meanwhile', () => {
    loginWithProvisionalPassword();
    const load = new Subject<CurrentUserLoadResult>();
    currentUserService.load.and.returnValue(load);
    dataService.changeRequiredPassword.and.returnValue(of(tokens));

    store.changeRequiredPassword('NovaSenha#2');
    store.changeRequiredPassword('NovaSenha#2');
    expect(store.loading()).toBeTrue();
    expect(dataService.changeRequiredPassword).toHaveBeenCalledTimes(1);

    load.next({ status: 'loaded' });
    load.complete();
    expect(store.loading()).toBeFalse();
  });

  it('shows the API message and keeps the credentials when the new password is rejected', () => {
    loginWithProvisionalPassword();
    dataService.changeRequiredPassword.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 400,
      error: { errors: [{ description: 'A nova senha precisa ser diferente da atual.' }] }
    })));

    store.changeRequiredPassword('Provisoria@1');

    expect(store.error()).toBe('A nova senha precisa ser diferente da atual.');
    expect(store.pendingCredentials()).toEqual(credentials);
    expect(store.loading()).toBeFalse();
  });

  it('goes back to the login when there is no pending password change (409)', () => {
    loginWithProvisionalPassword();
    dataService.changeRequiredPassword.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 409,
      error: { title: 'Users.PasswordChangeNotRequired' }
    })));

    store.changeRequiredPassword('NovaSenha#2');

    expect(store.pendingCredentials()).toBeNull();
    expect(store.error()).toBe('Sua senha já foi definida. Entre com a nova senha.');
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('goes back to the login without calling the API when there are no pending credentials', () => {
    store.changeRequiredPassword('NovaSenha#2');

    expect(dataService.changeRequiredPassword).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('discards the credentials and goes back to the login when canceling the password change', () => {
    loginWithProvisionalPassword();

    store.cancelPasswordChange();

    expect(store.pendingCredentials()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('revokes the refresh token, clears the session and goes back to the login on logout', () => {
    session.refreshToken.and.returnValue('refresh-token');
    dataService.logout.and.returnValue(of(undefined));

    store.logout();

    expect(dataService.logout).toHaveBeenCalledWith('refresh-token');
    expect(session.clearSession).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('clears the session and goes back to the login even if the revocation fails on the server', () => {
    session.refreshToken.and.returnValue('refresh-token');
    dataService.logout.and.returnValue(throwError(() => new Error('offline')));

    store.logout();

    expect(session.clearSession).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('does not call the logout API when there is no refresh token, but still clears the session and goes back to the login', () => {
    session.refreshToken.and.returnValue(null);

    store.logout();

    expect(dataService.logout).not.toHaveBeenCalled();
    expect(session.clearSession).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});

describe('LoginStore — new click during the retries of GET /users/me', () => {
  const credentials: LoginCredentials = { email: 'admin@empresa.com', password: 'Senha@123' };
  const tokens: AccessTokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };
  /** Usuário da sessão, gravado pelo CurrentUserService de verdade. */
  const currentUser = signal<CurrentUser | null>(null);

  let store: InstanceType<typeof LoginStore>;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    jasmine.clock().install();
    currentUser.set(null);
    router = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl', 'createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        LoginStore,
        {
          provide: SessionService,
          useValue: {
            saveSession: jasmine.createSpy('saveSession'),
            clearSession: jasmine.createSpy('clearSession'),
            currentUser,
            setCurrentUser: (user: CurrentUser) => currentUser.set(user)
          }
        },
        { provide: Router, useValue: router }
      ]
    });
    store = TestBed.inject(LoginStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    jasmine.clock().uninstall();
  });

  it('does not send a second POST users/login when the button is clicked again while GET /users/me is retried', () => {
    store.login(credentials);
    httpMock.expectOne(req => req.method === 'POST' && req.url.endsWith('/users/login')).flush(tokens);
    httpMock.expectOne(req => req.url.endsWith('/users/me')).flush(null, { status: 503, statusText: 'Service Unavailable' });

    expect(store.loading()).toBeTrue();
    expect(store.retryingSession()).toBeTrue();

    store.login(credentials);
    httpMock.expectNone(req => req.url.endsWith('/users/login'));

    jasmine.clock().tick(1000);
    httpMock.expectOne(req => req.url.endsWith('/users/me')).flush({ id: 'user-1' });

    expect(store.loading()).toBeFalse();
    expect(store.retryingSession()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
