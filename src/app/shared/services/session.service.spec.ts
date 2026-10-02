import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SessionService } from './session.service';
import { CurrentUser } from '../entities/current-user';

describe('SessionService', () => {
  const user: CurrentUser = {
    id: 'user-1',
    email: 'maria@empresa.com',
    firstName: 'Maria',
    lastName: 'Silva',
    roles: [{ id: 'role-1', name: 'Admin' }],
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
