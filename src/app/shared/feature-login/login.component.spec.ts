import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { LoginComponent } from './login.component';
import { LoginStore } from '../application/login.store';

describe('LoginComponent', () => {
  /** Cria um store falso com signals reais, para o template reagir como no store verdadeiro. */
  function createStoreFake() {
    return {
      error: signal<string | null>(null),
      loading: signal(false),
      login: jasmine.createSpy('login')
    };
  }

  let storeFake: ReturnType<typeof createStoreFake>;

  beforeEach(async () => {
    storeFake = createStoreFake();

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])]
    })
      .overrideProvider(LoginStore, { useValue: storeFake })
      .compileComponents();
  });

  it('renders the email and password fields', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#email')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#password')).toBeTruthy();
  });

  it('calls store.login() with the email and password when the form is valid', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.form.setValue({ email: 'admin@empresa.com', password: 'Senha@123' });
    component.onSubmit();

    expect(storeFake.login).toHaveBeenCalledWith({ email: 'admin@empresa.com', password: 'Senha@123' });
  });

  it('does not call store.login() and marks the fields as touched when the form is empty', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.onSubmit();
    fixture.detectChanges();

    expect(storeFake.login).not.toHaveBeenCalled();
    expect(component.form.controls.email.touched).toBeTrue();
    expect(component.form.controls.password.touched).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('O e-mail é obrigatório.');
    expect(fixture.nativeElement.textContent).toContain('A senha é necessária.');
  });

  it('the submit button is not disabled because of an invalid form, only while loading', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeFalse();
  });

  it('disables the submit button and shows the spinner while the store is loading', async () => {
    storeFake.loading.set(true);
    const fixture = TestBed.createComponent(LoginComponent);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
    expect(fixture.nativeElement.querySelector('.spinner-border')).toBeTruthy();
  });

  it('shows the store error message when present', async () => {
    storeFake.error.set('E-mail ou senha incorretos.');
    const fixture = TestBed.createComponent(LoginComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('E-mail ou senha incorretos.');
  });

  it('toggles the password visibility when clicking the show/hide button', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    await fixture.whenStable();

    const passwordInput = fixture.nativeElement.querySelector('#password') as HTMLInputElement;
    const toggleButton = fixture.nativeElement.querySelector('.input-group-text') as HTMLButtonElement;

    expect(passwordInput.type).toBe('password');
    expect(toggleButton.getAttribute('aria-pressed')).toBe('false');
    expect(toggleButton.getAttribute('aria-label')).toBe('Mostrar senha');

    toggleButton.click();
    fixture.detectChanges();

    expect(passwordInput.type).toBe('text');
    expect(toggleButton.getAttribute('aria-pressed')).toBe('true');
    expect(toggleButton.getAttribute('aria-label')).toBe('Ocultar senha');
  });
});
