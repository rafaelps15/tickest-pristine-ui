import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ProfileEditComponent } from './profile-edit.component';
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
      changePassword: jasmine.createSpy('changePassword')
    };
  }

  let storeFake: ReturnType<typeof createStoreFake>;

  beforeEach(async () => {
    storeFake = createStoreFake();

    await TestBed.configureTestingModule({
      imports: [ProfileEditComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])]
    })
      .overrideProvider(ProfileEditStore, { useValue: storeFake })
      .compileComponents();
  });

  it('deve carregar o perfil do usuário logado e preencher o formulário', async () => {
    const fixture = TestBed.createComponent(ProfileEditComponent);
    await fixture.whenStable();

    expect(storeFake.loadCurrentUser).toHaveBeenCalled();
    expect(fixture.componentInstance.form.getRawValue()).toEqual({ firstName: 'Maria', lastName: 'Silva' });

    const email = fixture.nativeElement.querySelector('#email') as HTMLInputElement;
    expect(email.value).toBe('maria@empresa.com');
    expect(email.disabled).toBeTrue();
  });

  it('alterna os três campos de senha entre oculto e texto claro juntos', async () => {
    const fixture = TestBed.createComponent(ProfileEditComponent);
    await fixture.whenStable();

    const fieldIds = ['#currentPassword', '#newPassword', '#confirmPassword'];
    const getTypes = () => fieldIds.map(id => (fixture.nativeElement.querySelector(id) as HTMLInputElement).type);

    expect(getTypes()).toEqual(['password', 'password', 'password']);

    fixture.componentInstance.togglePasswordsVisibility();
    fixture.detectChanges();

    expect(getTypes()).toEqual(['text', 'text', 'text']);
  });

  it('deve salvar com os valores sem espaços nas pontas', async () => {
    const fixture = TestBed.createComponent(ProfileEditComponent);
    await fixture.whenStable();

    fixture.componentInstance.form.setValue({ firstName: '  Ana ', lastName: ' Costa  ' });
    fixture.componentInstance.onSubmit();

    expect(storeFake.save).toHaveBeenCalledWith({ firstName: 'Ana', lastName: 'Costa' });
  });

  it('não deve salvar quando o nome estiver vazio', async () => {
    const fixture = TestBed.createComponent(ProfileEditComponent);
    await fixture.whenStable();

    fixture.componentInstance.form.setValue({ firstName: '', lastName: 'Costa' });
    fixture.componentInstance.onSubmit();

    expect(storeFake.save).not.toHaveBeenCalled();
    expect(fixture.componentInstance.isFieldInvalid('firstName')).toBeTrue();
  });

  it('deve exibir a mensagem de erro do salvamento', async () => {
    storeFake.mutationError.set('Você não tem permissão para editar este perfil.');
    const fixture = TestBed.createComponent(ProfileEditComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Você não tem permissão para editar este perfil.');
  });

  it('deve alterar a senha quando o formulário for válido', async () => {
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

  it('não deve alterar a senha quando a confirmação não coincidir', async () => {
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

  it('não deve alterar a senha quando a nova senha for igual à atual', async () => {
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

  it('não deve alterar a senha quando a nova senha for fraca', async () => {
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
});
