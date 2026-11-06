import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { FirstAccessComponent } from './first-access.component';
import { LoginStore } from '../application/login.store';
import { LoginCredentials } from '../entities/login-credentials';

describe('FirstAccessComponent', () => {
  const pending: LoginCredentials = { email: 'admin@empresa.com', password: 'Provisoria@1' };

  /** Cria um store falso com signals reais, para o template reagir como no store verdadeiro. */
  function createStoreFake() {
    return {
      pendingCredentials: signal<LoginCredentials | null>(pending),
      error: signal<string | null>(null),
      loading: signal(false),
      retryingSession: signal(false),
      changeRequiredPassword: jasmine.createSpy('changeRequiredPassword'),
      cancelPasswordChange: jasmine.createSpy('cancelPasswordChange')
    };
  }

  let storeFake: ReturnType<typeof createStoreFake>;

  beforeEach(async () => {
    storeFake = createStoreFake();

    await TestBed.configureTestingModule({
      imports: [FirstAccessComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])]
    })
      .overrideProvider(LoginStore, { useValue: storeFake })
      .compileComponents();
  });

  it('shows the email of the account with the pending change', async () => {
    const fixture = TestBed.createComponent(FirstAccessComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('admin@empresa.com');
  });

  it('does not submit and marks the fields as touched when the password is weak', async () => {
    const fixture = TestBed.createComponent(FirstAccessComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.form.setValue({ newPassword: 'fraca', confirmPassword: 'fraca' });
    component.onSubmit();

    expect(storeFake.changeRequiredPassword).not.toHaveBeenCalled();
    expect(component.form.controls.newPassword.errors?.['uppercase']).toBeTrue();
    expect(component.form.controls.newPassword.errors?.['specialChar']).toBeTrue();
  });

  it('flags passwords that do not match', async () => {
    const fixture = TestBed.createComponent(FirstAccessComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.form.setValue({ newPassword: 'NovaSenha#2', confirmPassword: 'Outra#3' });

    expect(component.form.errors?.['mismatch']).toBeTrue();
  });

  it('flags when the new password is the same as the temporary one', async () => {
    const fixture = TestBed.createComponent(FirstAccessComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.form.setValue({ newPassword: pending.password, confirmPassword: pending.password });

    expect(component.form.errors?.['sameAsCurrent']).toBeTrue();
  });

  it('submits the new password when the form is valid', async () => {
    const fixture = TestBed.createComponent(FirstAccessComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.form.setValue({ newPassword: 'NovaSenha#2', confirmPassword: 'NovaSenha#2' });
    component.onSubmit();

    expect(storeFake.changeRequiredPassword).toHaveBeenCalledWith('NovaSenha#2');
  });

  it('disables the save button while the store is loading', async () => {
    storeFake.loading.set(true);
    const fixture = TestBed.createComponent(FirstAccessComponent);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
  });

  it('announces the retry in a status region that already existed and keeps the button disabled while the session start is retried', async () => {
    const fixture = TestBed.createComponent(FirstAccessComponent);
    await fixture.whenStable();
    const region = fixture.nativeElement.querySelector('.auth-retry-status') as HTMLElement;
    expect(region.getAttribute('role')).toBe('status');
    expect(region.textContent?.trim()).toBe('');

    storeFake.loading.set(true);
    storeFake.retryingSession.set(true);
    fixture.detectChanges();

    expect(region.textContent).toContain('Tentando de novo');
    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
    expect(button.textContent).toContain('Conectando ao servidor');
  });

  it('the save button is not disabled because of an invalid form, only during loading', async () => {
    const fixture = TestBed.createComponent(FirstAccessComponent);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeFalse();
  });

  it('clicking the button with an empty form marks the fields as touched and shows the errors', async () => {
    const fixture = TestBed.createComponent(FirstAccessComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(storeFake.changeRequiredPassword).not.toHaveBeenCalled();
    expect(component.form.controls.newPassword.touched).toBeTrue();
    expect(component.form.controls.confirmPassword.touched).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('A nova senha é obrigatória.');
  });

  it('shows the store error message when present', async () => {
    storeFake.error.set('A nova senha precisa ser diferente da atual.');
    const fixture = TestBed.createComponent(FirstAccessComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('A nova senha precisa ser diferente da atual.');
  });

  it('toggles both password fields between hidden and plain text together', async () => {
    const fixture = TestBed.createComponent(FirstAccessComponent);
    await fixture.whenStable();

    const getTypes = () => ['#newPassword', '#confirmPassword']
      .map(id => (fixture.nativeElement.querySelector(id) as HTMLInputElement).type);

    expect(getTypes()).toEqual(['password', 'password']);

    fixture.componentInstance.togglePasswordsVisibility();
    fixture.detectChanges();

    expect(getTypes()).toEqual(['text', 'text']);
  });

  it('cancels the password change and goes back to the login when clicking "Voltar ao login"', async () => {
    const fixture = TestBed.createComponent(FirstAccessComponent);
    await fixture.whenStable();

    const backButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(button => button.textContent?.includes('Voltar ao login'));
    backButton?.click();

    expect(storeFake.cancelPasswordChange).toHaveBeenCalled();
  });
});
