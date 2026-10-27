import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { ActivateAccountComponent } from './activate-account.component';
import { ActivateAccountStore } from '../application/activate-account.store';

describe('ActivateAccountComponent', () => {
  /** Cria um store falso com signals reais, para o template reagir como no store verdadeiro. */
  function createStoreFake() {
    return {
      loading: signal(false),
      activated: signal(false),
      invalidLink: signal(false),
      error: signal<string | null>(null),
      activate: jasmine.createSpy('activate'),
      markInvalidLink: jasmine.createSpy('markInvalidLink')
    };
  }

  let storeFake: ReturnType<typeof createStoreFake>;

  async function setup(fragment: string | null) {
    storeFake = createStoreFake();
    await TestBed.configureTestingModule({
      imports: [ActivateAccountComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { fragment } } }
      ]
    })
      .overrideComponent(ActivateAccountComponent, { set: { providers: [{ provide: ActivateAccountStore, useValue: storeFake }] } })
      .compileComponents();
  }

  it('lê o token do fragmento da URL e o tira da barra de endereço, sem empilhar histórico', async () => {
    await setup('token=abc123');
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(ActivateAccountComponent);
    await fixture.whenStable();

    expect(storeFake.markInvalidLink).not.toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith([], jasmine.objectContaining({ fragment: undefined, replaceUrl: true }));
  });

  it('marca o link como inválido quando a página abre sem token', async () => {
    await setup(null);
    const fixture = TestBed.createComponent(ActivateAccountComponent);
    await fixture.whenStable();

    expect(storeFake.markInvalidLink).toHaveBeenCalled();
  });

  it('envia o token e a senha quando o formulário é válido', async () => {
    await setup('token=abc123');
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(ActivateAccountComponent);
    await fixture.whenStable();

    fixture.componentInstance.form.setValue({ newPassword: 'Senha@123', confirmPassword: 'Senha@123' });
    fixture.componentInstance.onSubmit();

    expect(storeFake.activate).toHaveBeenCalledWith('abc123', 'Senha@123');
  });

  it('não envia quando as senhas não coincidem, e avisa', async () => {
    await setup('token=abc123');
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(ActivateAccountComponent);
    await fixture.whenStable();

    fixture.componentInstance.form.setValue({ newPassword: 'Senha@123', confirmPassword: 'Outra@456' });
    fixture.componentInstance.onSubmit();
    await fixture.whenStable();

    expect(storeFake.activate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('As senhas não coincidem.');
  });

  it('mostra as regras de senha antes de digitar', async () => {
    await setup('token=abc123');
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(ActivateAccountComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#newPassword-requirements')?.textContent).toContain('Mínimo de 6 caracteres');
  });

  it('mostra a confirmação com o atalho pro login depois de ativar', async () => {
    await setup('token=abc123');
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(ActivateAccountComponent);
    storeFake.activated.set(true);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Conta ativada');
    expect(fixture.nativeElement.querySelector('a[href="/login"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('troca o formulário pela orientação de pedir outro convite quando o link é inválido', async () => {
    await setup(null);
    const fixture = TestBed.createComponent(ActivateAccountComponent);
    storeFake.invalidLink.set(true);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Link inválido ou expirado');
    expect(fixture.nativeElement.textContent).toContain('reenviar o convite');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });
});
