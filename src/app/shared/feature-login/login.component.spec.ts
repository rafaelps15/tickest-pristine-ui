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

  it('renderiza os campos de e-mail e senha', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#email')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#password')).toBeTruthy();
  });

  it('chama store.login() com o e-mail e a senha quando o formulário é válido', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.form.setValue({ email: 'admin@empresa.com', password: 'Senha@123' });
    component.onSubmit();

    expect(storeFake.login).toHaveBeenCalledWith({ email: 'admin@empresa.com', password: 'Senha@123' });
  });

  it('não chama store.login() e marca os campos como tocados quando o formulário está vazio', async () => {
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

  it('o botão de envio não fica desabilitado por formulário inválido, só durante o carregamento', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeFalse();
  });

  it('desabilita o botão de envio e mostra o spinner enquanto o store está carregando', async () => {
    storeFake.loading.set(true);
    const fixture = TestBed.createComponent(LoginComponent);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
    expect(fixture.nativeElement.querySelector('.spinner-border')).toBeTruthy();
  });

  it('mostra a mensagem de erro do store quando presente', async () => {
    storeFake.error.set('E-mail ou senha incorretos.');
    const fixture = TestBed.createComponent(LoginComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('E-mail ou senha incorretos.');
  });

  it('alterna a visibilidade da senha ao clicar no botão de mostrar/ocultar', async () => {
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
