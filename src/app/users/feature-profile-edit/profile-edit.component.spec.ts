import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ProfileEditComponent } from './profile-edit.component';
import { ToastService } from '../../shared';
import { ProfileEditStore } from '../application/profile-edit.store';
import { UserProfile } from '../entities/user-profile';

describe('ProfileEditComponent', () => {
  const profile: UserProfile = { id: 'u1', email: 'maria@empresa.com', firstName: 'Maria', lastName: 'Silva' };

  /** Cria um store falso com signals reais, para o template reagir como no store verdadeiro. */
  function createStoreFake() {
    return {
      profile: signal<UserProfile | undefined>(profile),
      loading: signal(false),
      loadError: signal<string | null>(null),
      saving: signal(false),
      saved: signal(false),
      mutationError: signal<string | null>(null),
      changingPassword: signal(false),
      passwordChanged: signal(false),
      passwordError: signal<string | null>(null),
      loadCurrentUser: jasmine.createSpy('loadCurrentUser'),
      save: jasmine.createSpy('save'),
      changePassword: jasmine.createSpy('changePassword'),
      clearSaved: jasmine.createSpy('clearSaved'),
      clearPasswordChanged: jasmine.createSpy('clearPasswordChanged')
    };
  }

  let storeFake: ReturnType<typeof createStoreFake>;
  let toastServiceFake: { show: jasmine.Spy };

  beforeEach(async () => {
    storeFake = createStoreFake();
    toastServiceFake = { show: jasmine.createSpy('show') };

    await TestBed.configureTestingModule({
      imports: [ProfileEditComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([]), { provide: ToastService, useValue: toastServiceFake }]
    })
      .overrideProvider(ProfileEditStore, { useValue: storeFake })
      .compileComponents();
  });

  it('loads the logged-in user profile and fills in the form', async () => {
    const fixture = TestBed.createComponent(ProfileEditComponent);
    await fixture.whenStable();

    expect(storeFake.loadCurrentUser).toHaveBeenCalled();
    expect(fixture.componentInstance.form.getRawValue()).toEqual({ firstName: 'Maria', lastName: 'Silva' });

    const email = fixture.nativeElement.querySelector('#email') as HTMLInputElement;
    expect(email.value).toBe('maria@empresa.com');
    expect(email.disabled).toBeTrue();
  });

  it('toggles the three password fields between hidden and plain text together', async () => {
    const fixture = TestBed.createComponent(ProfileEditComponent);
    await fixture.whenStable();

    const fieldIds = ['#currentPassword', '#newPassword', '#confirmPassword'];
    const getTypes = () => fieldIds.map(id => (fixture.nativeElement.querySelector(id) as HTMLInputElement).type);

    expect(getTypes()).toEqual(['password', 'password', 'password']);

    fixture.componentInstance.togglePasswordsVisibility();
    fixture.detectChanges();

    expect(getTypes()).toEqual(['text', 'text', 'text']);
  });

  it('saves with the values trimmed of surrounding whitespace', async () => {
    const fixture = TestBed.createComponent(ProfileEditComponent);
    await fixture.whenStable();

    fixture.componentInstance.form.setValue({ firstName: '  Ana ', lastName: ' Costa  ' });
    fixture.componentInstance.onSubmit();

    expect(storeFake.save).toHaveBeenCalledWith({ firstName: 'Ana', lastName: 'Costa' });
  });

  it('accepts a name up to 100 characters, the back-end limit, and rejects anything above it', async () => {
    const fixture = TestBed.createComponent(ProfileEditComponent);
    await fixture.whenStable();

    fixture.componentInstance.form.setValue({ firstName: 'A'.repeat(100), lastName: 'Costa' });
    fixture.componentInstance.onSubmit();
    expect(storeFake.save).toHaveBeenCalledWith({ firstName: 'A'.repeat(100), lastName: 'Costa' });

    storeFake.save.calls.reset();
    fixture.componentInstance.form.setValue({ firstName: 'A'.repeat(101), lastName: 'Costa' });
    fixture.componentInstance.onSubmit();
    expect(storeFake.save).not.toHaveBeenCalled();
  });

  it('does not save when the name is empty', async () => {
    const fixture = TestBed.createComponent(ProfileEditComponent);
    await fixture.whenStable();

    fixture.componentInstance.form.setValue({ firstName: '', lastName: 'Costa' });
    fixture.componentInstance.onSubmit();

    expect(storeFake.save).not.toHaveBeenCalled();
    expect(fixture.componentInstance.isFieldInvalid('firstName')).toBeTrue();
  });

  it('displays the save error message', async () => {
    storeFake.mutationError.set('Você não tem permissão para editar este perfil.');
    const fixture = TestBed.createComponent(ProfileEditComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Você não tem permissão para editar este perfil.');
  });

  it('changes the password when the form is valid', async () => {
    const fixture = TestBed.createComponent(ProfileEditComponent);
    await fixture.whenStable();

    fixture.componentInstance.passwordForm.setValue({
      currentPassword: 'Password123!',
      newPassword: 'NewPassword456#',
      confirmPassword: 'NewPassword456#'
    });
    fixture.componentInstance.onChangePassword();

    expect(storeFake.changePassword).toHaveBeenCalledWith({
      currentPassword: 'Password123!',
      newPassword: 'NewPassword456#'
    });
  });

  it('does not change the password when the confirmation does not match', async () => {
    const fixture = TestBed.createComponent(ProfileEditComponent);
    await fixture.whenStable();

    fixture.componentInstance.passwordForm.setValue({
      currentPassword: 'Password123!',
      newPassword: 'NewPassword456#',
      confirmPassword: 'Outra123#'
    });
    fixture.componentInstance.onChangePassword();

    expect(storeFake.changePassword).not.toHaveBeenCalled();
  });

  it('does not change the password when the new password is the same as the current one', async () => {
    const fixture = TestBed.createComponent(ProfileEditComponent);
    await fixture.whenStable();

    fixture.componentInstance.passwordForm.setValue({
      currentPassword: 'Password123!',
      newPassword: 'Password123!',
      confirmPassword: 'Password123!'
    });
    fixture.componentInstance.onChangePassword();

    expect(storeFake.changePassword).not.toHaveBeenCalled();
  });

  it('does not change the password when the new password is weak', async () => {
    const fixture = TestBed.createComponent(ProfileEditComponent);
    await fixture.whenStable();

    fixture.componentInstance.passwordForm.setValue({
      currentPassword: 'Password123!',
      newPassword: 'semmaiuscula1',
      confirmPassword: 'semmaiuscula1'
    });
    fixture.componentInstance.onChangePassword();

    expect(storeFake.changePassword).not.toHaveBeenCalled();
  });

  it('shows "mínimo de 2 caracteres" when the name is filled in but too short', async () => {
    const fixture = TestBed.createComponent(ProfileEditComponent);
    await fixture.whenStable();
    const firstName = fixture.componentInstance.form.controls.firstName;

    firstName.setValue('A');
    firstName.markAsTouched();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('O nome deve ter no mínimo 2 caracteres.');
  });

  it('links the invalid name field to the error message via aria-describedby', async () => {
    const fixture = TestBed.createComponent(ProfileEditComponent);
    await fixture.whenStable();
    const firstName = fixture.componentInstance.form.controls.firstName;

    firstName.setValue('');
    firstName.markAsTouched();
    fixture.detectChanges();
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('#firstName') as HTMLInputElement;
    expect(input.getAttribute('aria-describedby')).toBe('firstName-error');
  });

  it('shows the password requirements before any error', async () => {
    const fixture = TestBed.createComponent(ProfileEditComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Mínimo de 6 caracteres, com 1 letra maiúscula e 1 caractere especial.');
  });

  it('notifies by toast when the profile is saved, and clears the success state', async () => {
    const fixture = TestBed.createComponent(ProfileEditComponent);
    await fixture.whenStable();

    storeFake.saved.set(true);
    await fixture.whenStable();

    expect(toastServiceFake.show).toHaveBeenCalledWith('Perfil atualizado.');
    expect(storeFake.clearSaved).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.alert-success')).toBeNull();
  });

  it('notifies by toast when the password is changed, clears the password form and the success state', async () => {
    const fixture = TestBed.createComponent(ProfileEditComponent);
    await fixture.whenStable();
    fixture.componentInstance.passwordForm.controls.currentPassword.setValue('Antiga123!');

    storeFake.passwordChanged.set(true);
    await fixture.whenStable();

    expect(toastServiceFake.show).toHaveBeenCalledWith('Senha alterada.');
    expect(storeFake.clearPasswordChanged).toHaveBeenCalled();
    expect(fixture.componentInstance.passwordForm.controls.currentPassword.value).toBe('');
  });

  it('offers "Tentar novamente" when the profile fails to load', async () => {
    storeFake.loadError.set('Erro ao carregar o perfil.');
    const fixture = TestBed.createComponent(ProfileEditComponent);
    await fixture.whenStable();
    storeFake.loadCurrentUser.calls.reset();

    const retry = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(b => b.textContent?.includes('Tentar novamente'));
    retry!.click();

    expect(storeFake.loadCurrentUser).toHaveBeenCalled();
  });
});
