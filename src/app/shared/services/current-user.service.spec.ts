import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { defer, of, throwError, Subject } from 'rxjs';
import { CurrentUserService } from './current-user.service';
import { SessionService } from './session.service';
import { AuthDataService } from '../infrastructure/auth.data.service';
import { CurrentUser, CurrentUserLoadResult } from '../entities/current-user';

describe('CurrentUserService', () => {
  const user: CurrentUser = {
    id: 'user-1',
    email: 'maria@empresa.com',
    firstName: 'Maria',
    lastName: 'Silva',
    roles: [{ name: 'Admin' }],
    permissions: ['users:read']
  };

  let service: CurrentUserService;
  let authDataService: jasmine.SpyObj<AuthDataService>;
  let session: jasmine.SpyObj<SessionService>;

  beforeEach(() => {
    authDataService = jasmine.createSpyObj('AuthDataService', ['getCurrentUser']);
    session = jasmine.createSpyObj('SessionService', ['setCurrentUser', 'currentUser']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        CurrentUserService,
        { provide: AuthDataService, useValue: authDataService },
        { provide: SessionService, useValue: session }
      ]
    });
    service = TestBed.inject(CurrentUserService);
  });

  it('deve carregar uma vez só quando há chamadas simultâneas', () => {
    const subject = new Subject<CurrentUser>();
    authDataService.getCurrentUser.and.returnValue(subject.asObservable());

    const results: CurrentUserLoadResult[] = [];
    service.load().subscribe(value => results.push(value));
    service.load().subscribe(value => results.push(value));

    expect(authDataService.getCurrentUser).toHaveBeenCalledTimes(1);

    subject.next(user);
    subject.complete();

    expect(results).toEqual([{ status: 'loaded' }, { status: 'loaded' }]);
    expect(session.setCurrentUser).toHaveBeenCalledOnceWith(user);
  });

  it('não deve chamar a API novamente quando já há um usuário carregado (ensureLoaded)', () => {
    session.currentUser.and.returnValue(user);

    const result = service.ensureLoaded();

    result.subscribe(value => expect(value).toEqual({ status: 'loaded' }));
    expect(authDataService.getCurrentUser).not.toHaveBeenCalled();
  });

  it('deve carregar via ensureLoaded quando ainda não há usuário na sessão', () => {
    session.currentUser.and.returnValue(null);
    authDataService.getCurrentUser.and.returnValue(of(user));

    service.ensureLoaded().subscribe(value => expect(value).toEqual({ status: 'loaded' }));

    expect(authDataService.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(session.setCurrentUser).toHaveBeenCalledOnceWith(user);
  });

  describe('falha passageira (rede, 429, 5xx)', () => {
    beforeEach(() => jasmine.clock().install());
    afterEach(() => jasmine.clock().uninstall());

    /** Quantas vezes a requisição foi de fato feita (cada nova assinatura reenvia, como no HttpClient). */
    let attempts = 0;

    /** Responde com os erros na ordem dada e, depois deles, com o usuário. */
    function failThenSucceed(...statuses: number[]): void {
      attempts = 0;
      authDataService.getCurrentUser.and.returnValue(defer(() => {
        const status = statuses[attempts++];
        return status === undefined ? of(user) : throwError(() => new HttpErrorResponse({ status }));
      }));
    }

    it('tenta de novo depois de um 429 e carrega o usuário, sem mandar pro login', () => {
      failThenSucceed(429, 503);
      const results: CurrentUserLoadResult[] = [];

      service.load().subscribe(value => results.push(value));
      expect(results).toEqual([]);
      jasmine.clock().tick(1000);
      jasmine.clock().tick(2000);

      expect(attempts).toBe(3);
      expect(results).toEqual([{ status: 'loaded' }]);
      expect(session.setCurrentUser).toHaveBeenCalledOnceWith(user);
    });

    it('depois de cerca de 15s sem rede devolve "indisponível" (offline), não "sessão recusada"', () => {
      failThenSucceed(0, 0, 0, 0, 0);
      const results: CurrentUserLoadResult[] = [];

      service.load().subscribe(value => results.push(value));
      jasmine.clock().tick(1000 + 2000 + 4000 + 8000);

      expect(attempts).toBe(5);
      expect(results).toEqual([{ status: 'unavailable', reason: 'offline' }]);
      expect(session.setCurrentUser).not.toHaveBeenCalled();
    });

    it('com 429 persistente devolve "indisponível" por limite de requisições', () => {
      failThenSucceed(429, 429, 429, 429, 429);
      const results: CurrentUserLoadResult[] = [];

      service.load().subscribe(value => results.push(value));
      jasmine.clock().tick(1000 + 2000 + 4000 + 8000);

      expect(results).toEqual([{ status: 'unavailable', reason: 'rate-limited' }]);
    });

    it('com 5xx persistente devolve "indisponível" por erro do servidor', () => {
      failThenSucceed(500, 502, 503, 504, 500);
      const results: CurrentUserLoadResult[] = [];

      service.load().subscribe(value => results.push(value));
      jasmine.clock().tick(1000 + 2000 + 4000 + 8000);

      expect(results).toEqual([{ status: 'unavailable', reason: 'server-error' }]);
    });

    it('não tenta de novo num 401: a sessão foi recusada', () => {
      failThenSucceed(401);
      const results: CurrentUserLoadResult[] = [];

      service.load().subscribe(value => results.push(value));

      expect(attempts).toBe(1);
      expect(results).toEqual([{ status: 'unauthenticated' }]);
    });
  });

  it('trata um erro que não é HTTP como sessão recusada, sem gravar usuário na sessão', () => {
    authDataService.getCurrentUser.and.returnValue(throwError(() => new Error('falha inesperada')));

    service.load().subscribe(value => expect(value).toEqual({ status: 'unauthenticated' }));

    expect(session.setCurrentUser).not.toHaveBeenCalled();
  });
});
