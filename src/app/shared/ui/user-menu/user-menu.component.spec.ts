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

  it('gives the avatar that opens the menu a button role and a name that states the action', async () => {
    const fixture = TestBed.createComponent(UserMenuComponent);
    await fixture.whenStable();

    const toggle = fixture.nativeElement.querySelector('[data-bs-toggle="dropdown"]') as HTMLElement;
    expect(toggle.tagName).toBe('BUTTON');
    expect(toggle.getAttribute('aria-label')).toBe('Menu do usuário');
  });

  it('shows the user initials in the avatar, with no external image', async () => {
    const fixture = TestBed.createComponent(UserMenuComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.user-menu-toggle .avatar-initials').textContent.trim()).toBe('MS');
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });

  it('has a single link to the profile and "Sair" as a button, without href="javascript:"', async () => {
    const fixture = TestBed.createComponent(UserMenuComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('a[href="/perfil"]').length).toBe(1);
    expect(fixture.nativeElement.querySelector('a[href^="javascript"]')).toBeNull();
    const logout = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(button => button.textContent?.includes('Sair'));
    logout!.click();
    expect(loginStoreFake.logout).toHaveBeenCalled();
  });

  it('shows the logged-in user email in the dropdown', async () => {
    const fixture = TestBed.createComponent(UserMenuComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('maria@empresa.com');
  });

  it('shows the logged-in user first and last name in the dropdown', async () => {
    const fixture = TestBed.createComponent(UserMenuComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Maria Silva');
  });

  it('shows a generic label when the profile has not loaded yet', async () => {
    sessionServiceFake.currentUser.set(null);
    const fixture = TestBed.createComponent(UserMenuComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Usuário');
  });

  it('delegates the logout to the LoginStore, owner of the session lifecycle', async () => {
    const fixture = TestBed.createComponent(UserMenuComponent);
    await fixture.whenStable();

    fixture.componentInstance.logout();

    expect(loginStoreFake.logout).toHaveBeenCalled();
  });
});
