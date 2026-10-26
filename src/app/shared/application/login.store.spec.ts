import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginStore } from './login.store';
import { AuthDataService } from '../infrastructure/auth.data.service';
import { SessionService } from '../services/session.service';
import { CurrentUserService } from '../services/current-user.service';
import { AccessTokens } from '../entities/access-tokens';
import { LoginCredentials } from '../entities/login-credentials';

describe('LoginStore', () => {
  const credentials: LoginCredentials = { email: 'admin@empresa.com', password: 'Provisoria@1' };
  const tokens: AccessTokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };

  let store: InstanceType<typeof LoginStore>;
  let dataService: jasmine.SpyObj<AuthDataService>;
  let session: jasmine.SpyObj<SessionService>;
  let currentUserService: jasmine.SpyObj<CurrentUserService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    dataService = jasmine.createSpyObj('AuthDataService', ['login', 'changeRequiredPassword', 'logout']);
    session = jasmine.createSpyObj('SessionService', ['saveSession', 'refreshToken', 'clearSession']);
    currentUserService = jasmine.createSpyObj('CurrentUserService', ['load']);
    currentUserService.load.and.returnValue(of(true));
    router = jasmine.createSpyObj('Router', ['navigate']);

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

  it('deve iniciar a sessão e ir para o dashboard quando o login for bem-sucedido', () => {
    dataService.login.and.returnValue(of(tokens));

    store.login(credentials);

    expect(session.saveSession).toHaveBeenCalledWith(tokens);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(store.error()).toBeNull();
  });

  it('deve guardar as credenciais e ir para o primeiro acesso quando a senha for provisória', () => {
    loginWithProvisionalPassword();

    expect(store.pendingCredentials()).toEqual(credentials);
    expect(store.error()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/primeiro-acesso']);
    expect(session.saveSession).not.toHaveBeenCalled();
  });

  it('deve mostrar mensagem genérica quando as credenciais forem inválidas', () => {
    dataService.login.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400 })));

    store.login(credentials);

    expect(store.error()).toBe('E-mail ou senha incorretos.');
    expect(store.pendingCredentials()).toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('deve mostrar a mensagem da API quando a conta estiver bloqueada por tentativas (403)', () => {
    dataService.login.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 403,
      error: { title: 'Users.LockedOut', detail: 'Muitas tentativas de login sem sucesso. A conta está bloqueada por alguns minutos; tente de novo mais tarde.' }
    })));

    store.login(credentials);

    expect(store.error()).toBe('Muitas tentativas de login sem sucesso. A conta está bloqueada por alguns minutos; tente de novo mais tarde.');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('deve mostrar mensagem própria quando o rate limiter bloquear a requisição (429, sem corpo)', () => {
    dataService.login.and.returnValue(throwError(() => new HttpErrorResponse({ status: 429 })));

    store.login(credentials);

    expect(store.error()).toBe('Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.');
  });

  it('deve trocar a senha provisória, limpar as credenciais e iniciar a sessão', () => {
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

  it('deve mostrar a mensagem da API e manter as credenciais quando a nova senha for recusada', () => {
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

  it('deve voltar ao login quando não houver troca de senha pendente (409)', () => {
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

  it('deve voltar ao login sem chamar a API quando não houver credenciais pendentes', () => {
    store.changeRequiredPassword('NovaSenha#2');

    expect(dataService.changeRequiredPassword).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('deve descartar as credenciais e voltar ao login ao cancelar a troca de senha', () => {
    loginWithProvisionalPassword();

    store.cancelPasswordChange();

    expect(store.pendingCredentials()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('deve revogar o refresh token, limpar a sessão e voltar ao login ao sair', () => {
    session.refreshToken.and.returnValue('refresh-token');
    dataService.logout.and.returnValue(of(undefined));

    store.logout();

    expect(dataService.logout).toHaveBeenCalledWith('refresh-token');
    expect(session.clearSession).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('deve limpar a sessão e voltar ao login mesmo se a revogação falhar no servidor', () => {
    session.refreshToken.and.returnValue('refresh-token');
    dataService.logout.and.returnValue(throwError(() => new Error('offline')));

    store.logout();

    expect(session.clearSession).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('não chama a API de logout quando não há refresh token, mas limpa a sessão e volta ao login igual', () => {
    session.refreshToken.and.returnValue(null);

    store.logout();

    expect(dataService.logout).not.toHaveBeenCalled();
    expect(session.clearSession).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
