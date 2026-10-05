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

  it('mostra o e-mail da conta com a troca pendente', async () => {
    const fixture = TestBed.createComponent(FirstAccessComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('admin@empresa.com');
  });

  it('não envia e marca os campos tocados quando a senha é fraca', async () => {
    const fixture = TestBed.createComponent(FirstAccessComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.form.setValue({ newPassword: 'fraca', confirmPassword: 'fraca' });
    component.onSubmit();

    expect(storeFake.changeRequiredPassword).not.toHaveBeenCalled();
    expect(component.form.controls.newPassword.errors?.['uppercase']).toBeTrue();
    expect(component.form.controls.newPassword.errors?.['specialChar']).toBeTrue();
  });

  it('acusa senhas que não coincidem', async () => {
    const fixture = TestBed.createComponent(FirstAccessComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.form.setValue({ newPassword: 'NovaSenha#2', confirmPassword: 'Outra#3' });

    expect(component.form.errors?.['mismatch']).toBeTrue();
  });

  it('acusa quando a nova senha é igual à provisória', async () => {
    const fixture = TestBed.createComponent(FirstAccessComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.form.setValue({ newPassword: pending.password, confirmPassword: pending.password });

    expect(component.form.errors?.['sameAsCurrent']).toBeTrue();
  });

  it('envia a nova senha quando o formulário é válido', async () => {
    const fixture = TestBed.createComponent(FirstAccessComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.form.setValue({ newPassword: 'NovaSenha#2', confirmPassword: 'NovaSenha#2' });
    component.onSubmit();

    expect(storeFake.changeRequiredPassword).toHaveBeenCalledWith('NovaSenha#2');
  });

  it('desabilita o botão de salvar enquanto o store está carregando', async () => {
    storeFake.loading.set(true);
    const fixture = TestBed.createComponent(FirstAccessComponent);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
  });

  it('mostra a mensagem de erro do store quando presente', async () => {
    storeFake.error.set('A nova senha precisa ser diferente da atual.');
    const fixture = TestBed.createComponent(FirstAccessComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('A nova senha precisa ser diferente da atual.');
  });

  it('alterna os dois campos de senha entre oculto e texto claro juntos', async () => {
    const fixture = TestBed.createComponent(FirstAccessComponent);
    await fixture.whenStable();

    const getTypes = () => ['#newPassword', '#confirmPassword']
      .map(id => (fixture.nativeElement.querySelector(id) as HTMLInputElement).type);

    expect(getTypes()).toEqual(['password', 'password']);

    fixture.componentInstance.togglePasswordsVisibility();
    fixture.detectChanges();

    expect(getTypes()).toEqual(['text', 'text']);
  });

  it('cancela a troca de senha e volta ao login ao clicar em "Voltar ao login"', async () => {
    const fixture = TestBed.createComponent(FirstAccessComponent);
    await fixture.whenStable();

    const backButton = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(button => button.textContent?.includes('Voltar ao login'));
    backButton?.click();

    expect(storeFake.cancelPasswordChange).toHaveBeenCalled();
  });
});
