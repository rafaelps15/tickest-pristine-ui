import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UserMenuComponent } from './user-menu.component';
import { SessionService } from '../../services/session.service';
import { AuthDataService } from '../../infrastructure/auth.data.service';

describe('UserMenuComponent', () => {
  let sessionServiceFake: {
    email: ReturnType<typeof signal<string | null>>;
    refreshToken: ReturnType<typeof signal<string | null>>;
    clearSession: jasmine.Spy;
  };
  let authDataServiceFake: jasmine.SpyObj<AuthDataService>;
  let router: Router;

  beforeEach(async () => {
    sessionServiceFake = {
      email: signal<string | null>('maria@empresa.com'),
      refreshToken: signal<string | null>('refresh-token-1'),
      clearSession: jasmine.createSpy('clearSession')
    };
    authDataServiceFake = jasmine.createSpyObj('AuthDataService', ['logout']);

    await TestBed.configureTestingModule({
      imports: [UserMenuComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SessionService, useValue: sessionServiceFake },
        { provide: AuthDataService, useValue: authDataServiceFake }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  it('mostra o e-mail do usuário logado no dropdown', async () => {
    const fixture = TestBed.createComponent(UserMenuComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('maria@empresa.com');
  });

  it('revoga o refresh token, limpa a sessão e navega para o login ao sair', async () => {
    authDataServiceFake.logout.and.returnValue(of(undefined));
    const fixture = TestBed.createComponent(UserMenuComponent);
    await fixture.whenStable();

    fixture.componentInstance.logout();
    await fixture.whenStable();

    expect(authDataServiceFake.logout).toHaveBeenCalledWith('refresh-token-1');
    expect(sessionServiceFake.clearSession).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('limpa a sessão e navega para o login mesmo se a revogação falhar no servidor', async () => {
    authDataServiceFake.logout.and.returnValue(throwError(() => new Error('offline')));
    const fixture = TestBed.createComponent(UserMenuComponent);
    await fixture.whenStable();

    fixture.componentInstance.logout();
    await fixture.whenStable();

    expect(sessionServiceFake.clearSession).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('não chama a API de logout quando não há refresh token, mas limpa a sessão igual', async () => {
    sessionServiceFake.refreshToken.set(null);
    const fixture = TestBed.createComponent(UserMenuComponent);
    await fixture.whenStable();

    fixture.componentInstance.logout();

    expect(authDataServiceFake.logout).not.toHaveBeenCalled();
    expect(sessionServiceFake.clearSession).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
