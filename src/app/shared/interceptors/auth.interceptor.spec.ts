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
    currentUserService.load.and.returnValue(of(true));

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

  it('deve manter a sessão e devolver o 401 quando a renovação falha por erro passageiro', () => {
    tokenRefresh.refresh.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    let status: number | undefined;
    http.get('/tickets').subscribe({ error: (error: HttpErrorResponse) => status = error.status });

    httpTesting.expectOne('/tickets').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(status).toBe(401);
    expect(session.clearSession).not.toHaveBeenCalled();
  });

  it('deve encerrar a sessão quando o back-end recusa a renovação', () => {
    tokenRefresh.refresh.and.returnValue(of(null));
    http.get('/tickets').subscribe({ error: () => undefined });

    httpTesting.expectOne('/tickets').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(session.clearSession).toHaveBeenCalled();
  });
});
