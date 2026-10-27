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

  it('dá ao avatar que abre o menu um papel de botão e um nome que diz a ação', async () => {
    const fixture = TestBed.createComponent(UserMenuComponent);
    await fixture.whenStable();

    const toggle = fixture.nativeElement.querySelector('[data-bs-toggle="dropdown"]') as HTMLElement;
    expect(toggle.tagName).toBe('BUTTON');
    expect(toggle.getAttribute('aria-label')).toBe('Menu do usuário');
  });

  it('mostra as iniciais do usuário no avatar, sem imagem externa', async () => {
    const fixture = TestBed.createComponent(UserMenuComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.user-menu-toggle .avatar-initials').textContent.trim()).toBe('MS');
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });

  it('tem um único link pro perfil e "Sair" como botão, sem href="javascript:"', async () => {
    const fixture = TestBed.createComponent(UserMenuComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('a[href="/perfil"]').length).toBe(1);
    expect(fixture.nativeElement.querySelector('a[href^="javascript"]')).toBeNull();
    const logout = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(button => button.textContent?.includes('Sair'));
    logout!.click();
    expect(loginStoreFake.logout).toHaveBeenCalled();
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
