import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthDataService } from './auth.data.service';
import { AccessTokens } from '../entities/access-tokens';
import { environment } from '../../../environments/environment';

describe('AuthDataService', () => {
  let service: AuthDataService;
  let http: HttpTestingController;
  /** Base da API, como o Data Service monta as URLs. */
  const api = environment.apiUrl;
  /** Tokens devolvidos pelo back-end no login, na troca de senha e na renovação. */
  const tokens: AccessTokens = { accessToken: 'access', refreshToken: 'refresh' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthDataService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('login posts the e-mail and the password to /users/login and returns the tokens', () => {
    let received: AccessTokens | undefined;

    service.login({ email: 'maria@empresa.com', password: 'Senha@123' }).subscribe(value => received = value);

    const request = http.expectOne({ method: 'POST', url: `${api}/users/login` });
    expect(request.request.body).toEqual({ email: 'maria@empresa.com', password: 'Senha@123' });
    request.flush(tokens);
    expect(received).toEqual(tokens);
  });

  it('changeRequiredPassword posts the e-mail, the temporary password and the new one to /users/login/new-password', () => {
    let received: AccessTokens | undefined;

    service.changeRequiredPassword({ email: 'maria@empresa.com', currentPassword: 'Provisoria@1', newPassword: 'Nova@1234' })
      .subscribe(value => received = value);

    const request = http.expectOne({ method: 'POST', url: `${api}/users/login/new-password` });
    expect(request.request.body).toEqual({ email: 'maria@empresa.com', currentPassword: 'Provisoria@1', newPassword: 'Nova@1234' });
    request.flush(tokens);
    expect(received).toEqual(tokens);
  });

  it('activateAccount posts the invitation token and the chosen password to /users/activation', () => {
    service.activateAccount({ token: 'convite', newPassword: 'Nova@1234' }).subscribe();

    const request = http.expectOne({ method: 'POST', url: `${api}/users/activation` });
    expect(request.request.body).toEqual({ token: 'convite', newPassword: 'Nova@1234' });
    request.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('register posts the e-mail and the name, without a password, to /users/register and returns the new id', () => {
    let received: string | undefined;

    service.register({ email: 'ana@empresa.com', firstName: 'Ana', lastName: 'Souza' }).subscribe(value => received = value);

    const request = http.expectOne({ method: 'POST', url: `${api}/users/register` });
    expect(request.request.body).toEqual({ email: 'ana@empresa.com', firstName: 'Ana', lastName: 'Souza' });
    request.flush('u-ana');
    expect(received).toBe('u-ana');
  });

  it('refresh posts the refresh token to /users/refresh-token and returns the new tokens', () => {
    let received: AccessTokens | undefined;

    service.refresh('refresh-antigo').subscribe(value => received = value);

    const request = http.expectOne({ method: 'POST', url: `${api}/users/refresh-token` });
    expect(request.request.body).toEqual({ refreshToken: 'refresh-antigo' });
    request.flush(tokens);
    expect(received).toEqual(tokens);
  });

  it('getCurrentUser reads the logged-in user from GET /users/me', () => {
    const user = { id: 'u1', email: 'maria@empresa.com', firstName: 'Maria', lastName: 'Silva', roles: [], permissions: ['tickets:view-own'] };
    let received: unknown;

    service.getCurrentUser().subscribe(value => received = value);

    const request = http.expectOne({ method: 'GET', url: `${api}/users/me` });
    expect(request.request.body).toBeNull();
    request.flush(user);
    expect(received).toEqual(user);
  });

  it('logout posts the refresh token to /users/logout', () => {
    service.logout('refresh').subscribe();

    const request = http.expectOne({ method: 'POST', url: `${api}/users/logout` });
    expect(request.request.body).toEqual({ refreshToken: 'refresh' });
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
});
