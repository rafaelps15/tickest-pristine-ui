import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { RegisterComponent } from './register.component';
import { UsersStore } from '../application/users.store';

describe('RegisterComponent', () => {
  /** Cria um store falso com signals reais, para o template reagir como no store verdadeiro. */
  function createStoreFake() {
    return {
      error: signal<string | null>(null),
      success: signal(false),
      loading: signal(false),
      createUser: jasmine.createSpy('createUser'),
      resetState: jasmine.createSpy('resetState')
    };
  }

  let storeFake: ReturnType<typeof createStoreFake>;

  beforeEach(async () => {
    storeFake = createStoreFake();

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])]
    })
      .overrideProvider(UsersStore, { useValue: storeFake })
      .compileComponents();
  });

  /** Preenche todos os campos do formulário com valores válidos e consistentes entre si. */
  function fillValidForm(fixture: ReturnType<typeof TestBed.createComponent<RegisterComponent>>): void {
    fixture.componentInstance.form.setValue({
      firstName: 'Ana',
      lastName: 'Costa',
      email: 'ana@empresa.com',
      password: 'Senha@123',
      confirmPassword: 'Senha@123'
    });
  }

  it('renderiza os cinco campos do formulário', async () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#registerFirstName')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#registerLastName')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#registerEmail')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#registerPassword')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#registerConfirmPassword')).toBeTruthy();
  });

  it('chama store.createUser() com os dados do formulário (sem confirmPassword) quando válido', async () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    await fixture.whenStable();
    fillValidForm(fixture);

    fixture.componentInstance.onSubmit();

    expect(storeFake.createUser).toHaveBeenCalledWith({
      firstName: 'Ana',
      lastName: 'Costa',
      email: 'ana@empresa.com',
      password: 'Senha@123'
    });
  });

  it('não chama store.createUser() e marca os campos como tocados quando o formulário está vazio', async () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.onSubmit();
    fixture.detectChanges();

    expect(storeFake.createUser).not.toHaveBeenCalled();
    expect(component.form.controls.firstName.touched).toBeTrue();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('O nome é obrigatório.');
    expect(text).toContain('O sobrenome é obrigatório.');
    expect(text).toContain('O e-mail é obrigatório.');
    expect(text).toContain('Informe a senha.');
    expect(text).toContain('Confirme a senha.');
  });

  it('mostra "nome é obrigatório" quando o campo está vazio e tocado', async () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    await fixture.whenStable();
    const firstName = fixture.componentInstance.form.controls.firstName;

    firstName.setValue('');
    firstName.markAsTouched();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('O nome é obrigatório.');
  });

  it('mostra "mínimo de 2 caracteres" quando o nome é preenchido mas curto demais', async () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    await fixture.whenStable();
    const firstName = fixture.componentInstance.form.controls.firstName;

    firstName.setValue('A');
    firstName.markAsTouched();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('O nome deve ter no mínimo 2 caracteres.');
  });

  it('mostra "As senhas não coincidem" quando os campos de senha divergem', async () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    await fixture.whenStable();
    const form = fixture.componentInstance.form;

    form.controls.password.setValue('Senha@123');
    form.controls.confirmPassword.setValue('Outra@456');
    form.controls.confirmPassword.markAsTouched();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('As senhas não coincidem.');
  });

  it('mostra a mensagem de erro do store quando presente', async () => {
    storeFake.error.set('Este e-mail já está cadastrado.');
    const fixture = TestBed.createComponent(RegisterComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Este e-mail já está cadastrado.');
  });

  it('mostra a mensagem de sucesso do store quando presente', async () => {
    storeFake.success.set(true);
    const fixture = TestBed.createComponent(RegisterComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Cadastro realizado.');
  });

  it('alterna a visibilidade dos dois campos de senha juntos', async () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    await fixture.whenStable();

    const password = fixture.nativeElement.querySelector('#registerPassword') as HTMLInputElement;
    const confirmPassword = fixture.nativeElement.querySelector('#registerConfirmPassword') as HTMLInputElement;

    expect(password.type).toBe('password');
    expect(confirmPassword.type).toBe('password');

    fixture.componentInstance.togglePasswordsVisibility();
    fixture.detectChanges();

    expect(password.type).toBe('text');
    expect(confirmPassword.type).toBe('text');
  });

  it('o botão de envio não fica desabilitado por formulário inválido, só durante o carregamento', async () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeFalse();

    storeFake.loading.set(true);
    fixture.detectChanges();
    expect(button.disabled).toBeTrue();
  });
});
