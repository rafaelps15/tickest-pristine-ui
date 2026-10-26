import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { UserMenuComponent } from './user-menu.component';
import { SessionService } from '../../services/session.service';
import { LoginStore } from '../../application/login.store';
import { CurrentUser } from '../../entities/current-user';

describe('UserMenuComponent', () => {
  let sessionServiceFake: { email: ReturnType<typeof signal<string | null>>; currentUser: ReturnType<typeof signal<CurrentUser | null>> };
  let loginStoreFake: { logout: jasmine.Spy };

  beforeEach(async () => {
    sessionServiceFake = {
      email: signal<string | null>('maria@empresa.com'),
      currentUser: signal<CurrentUser | null>({
        id: 'u1', email: 'maria@empresa.com', firstName: 'Maria', lastName: 'Silva', roles: [], permissions: []
      })
    };
    loginStoreFake = { logout: jasmine.createSpy('logout') };

    await TestBed.configureTestingModule({
      imports: [UserMenuComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SessionService, useValue: sessionServiceFake },
        { provide: LoginStore, useValue: loginStoreFake }
      ]
    }).compileComponents();
  });

  it('mostra o e-mail do usuário logado no dropdown', async () => {
    const fixture = TestBed.createComponent(UserMenuComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('maria@empresa.com');
  });

  it('mostra o nome e sobrenome do usuário logado no dropdown', async () => {
    const fixture = TestBed.createComponent(UserMenuComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Maria Silva');
  });

  it('mostra um rótulo genérico quando o perfil ainda não carregou', async () => {
    sessionServiceFake.currentUser.set(null);
    const fixture = TestBed.createComponent(UserMenuComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Usuário');
  });

  it('delega o logout ao LoginStore, dono do ciclo de vida da sessão', async () => {
    const fixture = TestBed.createComponent(UserMenuComponent);
    await fixture.whenStable();

    fixture.componentInstance.logout();

    expect(loginStoreFake.logout).toHaveBeenCalled();
  });
});
