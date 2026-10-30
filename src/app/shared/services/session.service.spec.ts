import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SessionService } from './session.service';
import { CurrentUser } from '../entities/current-user';

/** Monta um JWT sem assinatura com a claim `sub` (o SessionService só decodifica o payload). */
function jwtFor(sub: string, nonce = ''): string {
  const payload = btoa(JSON.stringify({ sub, nonce })).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `header.${payload}.signature`;
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

  it('deve adotar os tokens renovados por outra aba', () => {
    service.saveSession({ accessToken: 'a.b.c', refreshToken: 'antigo' });

    window.dispatchEvent(new StorageEvent('storage', { key: 'refresh_token', newValue: 'novo', storageArea: localStorage }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'auth_token', newValue: 'd.e.f', storageArea: localStorage }));

    expect(service.refreshToken()).toBe('novo');
    expect(service.token()).toBe('d.e.f');
  });

  it('deve encerrar a sessão quando outra aba remove o token de acesso', () => {
    service.saveSession({ accessToken: 'a.b.c', refreshToken: 'r' });
    service.setCurrentUser(user);

    window.dispatchEvent(new StorageEvent('storage', { key: 'auth_token', newValue: null, storageArea: localStorage }));

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUser()).toBeNull();
  });

  it('deve recarregar a aplicação quando outra aba entra com outra conta', () => {
    const reload = spyOn<any>(service, 'reloadForAccountSwitch');
    service.saveSession({ accessToken: jwtFor('user-1'), refreshToken: 'r' });
    service.setCurrentUser(user);

    window.dispatchEvent(new StorageEvent('storage', { key: 'auth_token', newValue: jwtFor('user-2'), storageArea: localStorage }));

    expect(service.userId()).toBe('user-2');
    expect(service.currentUser()).toBeNull();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('não deve recarregar quando outra aba só renova o token da mesma conta', () => {
    const reload = spyOn<any>(service, 'reloadForAccountSwitch');
    service.saveSession({ accessToken: jwtFor('user-1'), refreshToken: 'r' });
    service.setCurrentUser(user);

    window.dispatchEvent(new StorageEvent('storage', { key: 'auth_token', newValue: jwtFor('user-1', 'renovado'), storageArea: localStorage }));

    expect(service.currentUser()).toEqual(user);
    expect(reload).not.toHaveBeenCalled();
  });

  it('deve ignorar eventos de storage de outras chaves', () => {
    service.saveSession({ accessToken: 'a.b.c', refreshToken: 'r' });

    window.dispatchEvent(new StorageEvent('storage', { key: 'tickest.outra', newValue: 'x', storageArea: localStorage }));

    expect(service.token()).toBe('a.b.c');
    expect(service.refreshToken()).toBe('r');
  });

  it('não deve ter permissões antes de setCurrentUser ser chamado', () => {
    expect(service.hasPermission('users:read')).toBeFalse();
    expect(service.currentUser()).toBeNull();
  });

  it('deve expor as permissões recebidas via setCurrentUser (GET /users/me), não via claim do JWT', () => {
    service.setCurrentUser(user);

    expect(service.currentUser()).toEqual(user);
    expect(service.hasPermission('users:read')).toBeTrue();
    expect(service.hasPermission('users:delete')).toBeFalse();
  });

  it('deve limpar o usuário logado e as permissões ao limpar a sessão', () => {
    service.setCurrentUser(user);
    service.clearSession();

    expect(service.currentUser()).toBeNull();
    expect(service.hasPermission('users:read')).toBeFalse();
    expect(service.token()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('deve salvar e limpar os tokens no local storage', () => {
    service.saveSession({ accessToken: 'header.eyJzdWIiOiJ1c2VyLTEifQ.sig', refreshToken: 'refresh-token' });

    expect(service.token()).toBe('header.eyJzdWIiOiJ1c2VyLTEifQ.sig');
    expect(service.refreshToken()).toBe('refresh-token');
    expect(localStorage.getItem('auth_token')).toBe('header.eyJzdWIiOiJ1c2VyLTEifQ.sig');

    service.clearSession();

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });
});
