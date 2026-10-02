import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { CurrentUserService } from './current-user.service';
import { SessionService } from './session.service';
import { AuthDataService } from '../infrastructure/auth.data.service';
import { CurrentUser } from '../entities/current-user';

describe('CurrentUserService', () => {
  const user: CurrentUser = {
    id: 'user-1',
    email: 'maria@empresa.com',
    firstName: 'Maria',
    lastName: 'Silva',
    roles: [{ id: 'role-1', name: 'Admin' }],
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

    const results: boolean[] = [];
    service.load().subscribe(value => results.push(value));
    service.load().subscribe(value => results.push(value));

    expect(authDataService.getCurrentUser).toHaveBeenCalledTimes(1);

    subject.next(user);
    subject.complete();

    expect(results).toEqual([true, true]);
    expect(session.setCurrentUser).toHaveBeenCalledOnceWith(user);
  });

  it('não deve chamar a API novamente quando já há um usuário carregado (ensureLoaded)', () => {
    session.currentUser.and.returnValue(user);

    const result = service.ensureLoaded();

    result.subscribe(value => expect(value).toBeTrue());
    expect(authDataService.getCurrentUser).not.toHaveBeenCalled();
  });

  it('deve carregar via ensureLoaded quando ainda não há usuário na sessão', () => {
    session.currentUser.and.returnValue(null);
    authDataService.getCurrentUser.and.returnValue(of(user));

    service.ensureLoaded().subscribe(value => expect(value).toBeTrue());

    expect(authDataService.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(session.setCurrentUser).toHaveBeenCalledOnceWith(user);
  });

  it('deve devolver false em caso de erro, sem gravar usuário na sessão', () => {
    authDataService.getCurrentUser.and.returnValue(throwError(() => new Error('falha de rede')));

    service.load().subscribe(value => expect(value).toBeFalse());

    expect(session.setCurrentUser).not.toHaveBeenCalled();
  });
});
