import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { SessionService } from '../services/session.service';
import { TokenRefreshService } from '../services/token-refresh.service';
import { CurrentUserService } from '../services/current-user.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let currentUserService: jasmine.SpyObj<CurrentUserService>;

  beforeEach(() => {
    currentUserService = jasmine.createSpyObj('CurrentUserService', ['load']);
    currentUserService.load.and.returnValue(of({ status: 'loaded' as const }));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: SessionService, useValue: { token: () => null, clearSession: jasmine.createSpy('clearSession') } },
        { provide: TokenRefreshService, useValue: jasmine.createSpyObj('TokenRefreshService', ['refresh']) },
        { provide: CurrentUserService, useValue: currentUserService },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('não deve recarregar o usuário logado quando o login responder 403 (troca de senha pendente)', () => {
    http.post('/users/login', {}).subscribe({ error: () => undefined });

    httpTesting.expectOne('/users/login').flush(
      { title: 'Users.PasswordChangeRequired' },
      { status: 403, statusText: 'Forbidden' }
    );

    expect(currentUserService.load).not.toHaveBeenCalled();
  });

  it('deve recarregar o usuário logado quando outra rota responder 403 (permissão alterada)', () => {
    http.get('/tickets').subscribe({ error: () => undefined });

    httpTesting.expectOne('/tickets').flush(
      { title: 'Users.Unauthorized' },
      { status: 403, statusText: 'Forbidden' }
    );

    expect(currentUserService.load).toHaveBeenCalled();
  });
});

describe('authInterceptor — renovação do token', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let currentToken: string | null;
  let session: { token: () => string | null; clearSession: jasmine.Spy };
  let tokenRefresh: jasmine.SpyObj<TokenRefreshService>;

  beforeEach(() => {
    currentToken = 'token-antigo';
    session = { token: () => currentToken, clearSession: jasmine.createSpy('clearSession') };
    tokenRefresh = jasmine.createSpyObj('TokenRefreshService', ['refresh']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: SessionService, useValue: session },
        { provide: TokenRefreshService, useValue: tokenRefresh },
        { provide: CurrentUserService, useValue: jasmine.createSpyObj('CurrentUserService', ['load']) },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) }
      ]
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('deve repetir com o token atual, sem nova renovação, quando a sessão foi renovada durante a requisição', () => {
    http.get('/tickets').subscribe();

    const first = httpTesting.expectOne('/tickets');
    expect(first.request.headers.get('Authorization')).toBe('Bearer token-antigo');
    currentToken = 'token-novo';
    first.flush(null, { status: 401, statusText: 'Unauthorized' });

    const retry = httpTesting.expectOne('/tickets');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer token-novo');
    retry.flush([]);
    expect(tokenRefresh.refresh).not.toHaveBeenCalled();
  });

  it('deve renovar e repetir com o token novo quando o token enviado ainda é o atual', () => {
    tokenRefresh.refresh.and.returnValue(of('token-renovado'));
    http.get('/tickets').subscribe();

    httpTesting.expectOne('/tickets').flush(null, { status: 401, statusText: 'Unauthorized' });

    const retry = httpTesting.expectOne('/tickets');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer token-renovado');
    retry.flush([]);
  });

  for (const status of [0, 429, 503]) {
    it(`deve manter a sessão e repassar o erro da renovação (${status}), não o 401 original, quando ela falha de forma passageira`, () => {
      tokenRefresh.refresh.and.returnValue(throwError(() => new HttpErrorResponse({ status })));
      let received: number | undefined;
      http.get('/tickets').subscribe({ error: (error: HttpErrorResponse) => received = error.status });

      httpTesting.expectOne('/tickets').flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(received).toBe(status);
      expect(session.clearSession).not.toHaveBeenCalled();
    });
  }

  it('deve encerrar a sessão quando o back-end recusa a renovação', () => {
    tokenRefresh.refresh.and.returnValue(of(null));
    http.get('/tickets').subscribe({ error: () => undefined });

    httpTesting.expectOne('/tickets').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(session.clearSession).toHaveBeenCalled();
  });
});

describe('authInterceptor + CurrentUserService — falha na renovação ao carregar o usuário logado', () => {
  let httpTesting: HttpTestingController;
  let currentUserService: CurrentUserService;
  let session: { token: () => string | null; refreshToken: () => string | null; currentUser: () => null; setCurrentUser: jasmine.Spy; clearSession: jasmine.Spy };
  let tokenRefresh: jasmine.SpyObj<TokenRefreshService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    jasmine.clock().install();
    session = {
      token: () => 'token-vencido', refreshToken: () => 'refresh', currentUser: () => null,
      setCurrentUser: jasmine.createSpy('setCurrentUser'), clearSession: jasmine.createSpy('clearSession')
    };
    tokenRefresh = jasmine.createSpyObj('TokenRefreshService', ['refresh']);
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        CurrentUserService,
        { provide: SessionService, useValue: session },
        { provide: TokenRefreshService, useValue: tokenRefresh },
        { provide: Router, useValue: router }
      ]
    });
    httpTesting = TestBed.inject(HttpTestingController);
    currentUserService = TestBed.inject(CurrentUserService);
  });

  afterEach(() => {
    httpTesting.verify();
    jasmine.clock().uninstall();
  });

  /** Responde 401 (token vencido) a cada tentativa de GET /users/me, avançando o relógio entre elas. */
  function answerEveryAttemptWith401(attempts: number, delaysMs: number[]): void {
    for (let i = 0; i < attempts; i++) {
      httpTesting.expectOne(req => req.url.endsWith('/users/me')).flush(null, { status: 401, statusText: 'Unauthorized' });
      if (i < delaysMs.length) jasmine.clock().tick(delaysMs[i]);
    }
  }

  it('token vencido e renovação sem rede: resulta em "unavailable" (tela de sessão indisponível), sem apagar a sessão', () => {
    tokenRefresh.refresh.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    let result: unknown;

    currentUserService.load().subscribe(value => result = value);
    answerEveryAttemptWith401(5, [1000, 2000, 4000, 8000]);

    expect(result).toEqual({ status: 'unavailable', reason: 'offline' });
    expect(session.clearSession).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('token vencido e renovação com 429: resulta em "unavailable" por limite de requisições', () => {
    tokenRefresh.refresh.and.returnValue(throwError(() => new HttpErrorResponse({ status: 429 })));
    let result: unknown;

    currentUserService.load().subscribe(value => result = value);
    answerEveryAttemptWith401(5, [1000, 2000, 4000, 8000]);

    expect(result).toEqual({ status: 'unavailable', reason: 'rate-limited' });
    expect(session.clearSession).not.toHaveBeenCalled();
  });

  it('renovação recusada pelo back-end: continua sendo sessão recusada ("unauthenticated"), sem novas tentativas', () => {
    tokenRefresh.refresh.and.returnValue(of(null));
    let result: unknown;

    currentUserService.load().subscribe(value => result = value);
    answerEveryAttemptWith401(1, []);

    expect(result).toEqual({ status: 'unauthenticated' });
    expect(session.clearSession).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
