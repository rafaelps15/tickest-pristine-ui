import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
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
