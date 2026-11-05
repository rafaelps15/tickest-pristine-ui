import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SessionService } from './session.service';
import { CurrentUser } from '../entities/current-user';

/** Monta um JWT sem assinatura com a claim `sub` (o SessionService só decodifica o payload). */
function jwtFor(sub: string, nonce = ''): string {
  const payload = btoa(JSON.stringify({ sub, nonce })).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `header.${payload}.signature`;
}

/** Acesso de teste ao recarregamento da troca de conta, que é protegido no serviço. */
interface AccountSwitchReload {
  reloadForAccountSwitch(): void;
}

describe('SessionService', () => {
  const user: CurrentUser = {
    id: 'user-1',
    email: 'maria@empresa.com',
    firstName: 'Maria',
    lastName: 'Silva',
    roles: [{ name: 'Admin' }],
    permissions: ['users:read', 'users:write']
  };

  let service: SessionService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), SessionService]
    });
    service = TestBed.inject(SessionService);
  });

  afterEach(() => localStorage.clear());

  it('should adopt the tokens renewed by another tab', () => {
    service.saveSession({ accessToken: 'a.b.c', refreshToken: 'antigo' });

    window.dispatchEvent(new StorageEvent('storage', { key: 'refresh_token', newValue: 'novo', storageArea: localStorage }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'auth_token', newValue: 'd.e.f', storageArea: localStorage }));

    expect(service.refreshToken()).toBe('novo');
    expect(service.token()).toBe('d.e.f');
  });

  it('should end the session when another tab removes the access token', () => {
    service.saveSession({ accessToken: 'a.b.c', refreshToken: 'r' });
    service.setCurrentUser(user);

    window.dispatchEvent(new StorageEvent('storage', { key: 'auth_token', newValue: null, storageArea: localStorage }));

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUser()).toBeNull();
  });

  it('should reload the application when another tab signs in with another account', () => {
    const reload = spyOn(service as unknown as AccountSwitchReload, 'reloadForAccountSwitch');
    service.saveSession({ accessToken: jwtFor('user-1'), refreshToken: 'r' });
    service.setCurrentUser(user);

    window.dispatchEvent(new StorageEvent('storage', { key: 'auth_token', newValue: jwtFor('user-2'), storageArea: localStorage }));

    expect(service.userId()).toBe('user-2');
    expect(service.currentUser()).toBeNull();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('should not reload when another tab only renews the token of the same account', () => {
    const reload = spyOn(service as unknown as AccountSwitchReload, 'reloadForAccountSwitch');
    service.saveSession({ accessToken: jwtFor('user-1'), refreshToken: 'r' });
    service.setCurrentUser(user);

    window.dispatchEvent(new StorageEvent('storage', { key: 'auth_token', newValue: jwtFor('user-1', 'renovado'), storageArea: localStorage }));

    expect(service.currentUser()).toEqual(user);
    expect(reload).not.toHaveBeenCalled();
  });

  it('should ignore storage events for other keys', () => {
    service.saveSession({ accessToken: 'a.b.c', refreshToken: 'r' });

    window.dispatchEvent(new StorageEvent('storage', { key: 'tickest.outra', newValue: 'x', storageArea: localStorage }));

    expect(service.token()).toBe('a.b.c');
    expect(service.refreshToken()).toBe('r');
  });

  it('should not have permissions before setCurrentUser is called', () => {
    expect(service.hasPermission('users:read')).toBeFalse();
    expect(service.currentUser()).toBeNull();
  });

  it('should expose the permissions received via setCurrentUser (GET /users/me), not via a JWT claim', () => {
    service.setCurrentUser(user);

    expect(service.currentUser()).toEqual(user);
    expect(service.hasPermission('users:read')).toBeTrue();
    expect(service.hasPermission('users:delete')).toBeFalse();
  });

  it('should clear the logged-in user and the permissions when the session is cleared', () => {
    service.setCurrentUser(user);
    service.clearSession();

    expect(service.currentUser()).toBeNull();
    expect(service.hasPermission('users:read')).toBeFalse();
    expect(service.token()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('should save and clear the tokens in local storage', () => {
    service.saveSession({ accessToken: 'header.eyJzdWIiOiJ1c2VyLTEifQ.sig', refreshToken: 'refresh-token' });

    expect(service.token()).toBe('header.eyJzdWIiOiJ1c2VyLTEifQ.sig');
    expect(service.refreshToken()).toBe('refresh-token');
    expect(localStorage.getItem('auth_token')).toBe('header.eyJzdWIiOiJ1c2VyLTEifQ.sig');

    service.clearSession();

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });
});
