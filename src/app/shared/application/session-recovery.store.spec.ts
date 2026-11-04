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

  it('starts with the received reason and stays on the screen when there is a saved session', () => {
    store.start('rate-limited');

    expect(store.reason()).toBe('rate-limited');
    expect(store.failedAttempts()).toBe(0);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('goes to the login when there is no session at all to recover', () => {
    session.isAuthenticated.and.returnValue(false);

    store.start('offline');

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('goes back to the origin route when the new attempt loads the user', () => {
    currentUserService.load.and.returnValue(of({ status: 'loaded' as const }));

    store.retry('/tickets');

    expect(router.navigateByUrl).toHaveBeenCalledWith('/tickets');
    expect(store.retrying()).toBeFalse();
    expect(session.clearSession).not.toHaveBeenCalled();
  });

  it('stays on the screen, without clearing the session, when the new attempt still fails for a transient reason', () => {
    store.start('rate-limited');
    currentUserService.load.and.returnValue(of({ status: 'unavailable' as const, reason: 'offline' as const }));

    store.retry('/tickets');

    expect(store.reason()).toBe('offline');
    expect(store.failedAttempts()).toBe(1);
    expect(store.retrying()).toBeFalse();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(session.clearSession).not.toHaveBeenCalled();
  });

  it('clears the session and goes to the login when the API refuses the session on the new attempt', () => {
    currentUserService.load.and.returnValue(of({ status: 'unauthenticated' as const }));

    store.retry('/tickets');

    expect(session.clearSession).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('logs out through the same logout as the user menu', () => {
    store.signOut();

    expect(loginStore.logout).toHaveBeenCalled();
  });
});
