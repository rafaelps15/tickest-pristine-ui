import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { SessionRecoveryStore } from './session-recovery.store';
import { LoginStore } from './login.store';
import { SessionService } from '../services/session.service';
import { CurrentUserService } from '../services/current-user.service';

describe('SessionRecoveryStore', () => {
  let store: InstanceType<typeof SessionRecoveryStore>;
  let session: jasmine.SpyObj<SessionService>;
  let currentUserService: jasmine.SpyObj<CurrentUserService>;
  let loginStore: { logout: jasmine.Spy };
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    session = jasmine.createSpyObj('SessionService', ['isAuthenticated', 'clearSession']);
    session.isAuthenticated.and.returnValue(true);
    currentUserService = jasmine.createSpyObj('CurrentUserService', ['load']);
    loginStore = { logout: jasmine.createSpy('logout') };
    router = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        SessionRecoveryStore,
        { provide: SessionService, useValue: session },
        { provide: CurrentUserService, useValue: currentUserService },
        { provide: LoginStore, useValue: loginStore },
        { provide: Router, useValue: router }
      ]
    });
    store = TestBed.inject(SessionRecoveryStore);
  });

  it('começa com o motivo recebido e fica na tela quando há sessão salva', () => {
    store.start('rate-limited');

    expect(store.reason()).toBe('rate-limited');
    expect(store.failedAttempts()).toBe(0);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('vai para o login quando não há sessão nenhuma a recuperar', () => {
    session.isAuthenticated.and.returnValue(false);

    store.start('offline');

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('volta para a rota de origem quando a nova tentativa carrega o usuário', () => {
    currentUserService.load.and.returnValue(of({ status: 'loaded' as const }));

    store.retry('/tickets');

    expect(router.navigateByUrl).toHaveBeenCalledWith('/tickets');
    expect(store.retrying()).toBeFalse();
    expect(session.clearSession).not.toHaveBeenCalled();
  });

  it('continua na tela, sem limpar a sessão, quando a nova tentativa ainda falha por motivo passageiro', () => {
    store.start('rate-limited');
    currentUserService.load.and.returnValue(of({ status: 'unavailable' as const, reason: 'offline' as const }));

    store.retry('/tickets');

    expect(store.reason()).toBe('offline');
    expect(store.failedAttempts()).toBe(1);
    expect(store.retrying()).toBeFalse();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(session.clearSession).not.toHaveBeenCalled();
  });

  it('limpa a sessão e vai para o login quando a API recusa a sessão na nova tentativa', () => {
    currentUserService.load.and.returnValue(of({ status: 'unauthenticated' as const }));

    store.retry('/tickets');

    expect(session.clearSession).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('sai da conta pelo mesmo logout do menu do usuário', () => {
    store.signOut();

    expect(loginStore.logout).toHaveBeenCalled();
  });
});
