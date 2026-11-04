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

  it('reads the token from the URL fragment and removes it from the address bar, without stacking history', async () => {
    await setup('token=abc123');
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(ActivateAccountComponent);
    await fixture.whenStable();

    expect(storeFake.markInvalidLink).not.toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith([], jasmine.objectContaining({ fragment: undefined, replaceUrl: true }));
  });

  it('flags the link as invalid when the page opens without a token', async () => {
    await setup(null);
    const fixture = TestBed.createComponent(ActivateAccountComponent);
    await fixture.whenStable();

    expect(storeFake.markInvalidLink).toHaveBeenCalled();
  });

  it('submits the token and the password when the form is valid', async () => {
    await setup('token=abc123');
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(ActivateAccountComponent);
    await fixture.whenStable();

    fixture.componentInstance.form.setValue({ newPassword: 'Senha@123', confirmPassword: 'Senha@123' });
    fixture.componentInstance.onSubmit();

    expect(storeFake.activate).toHaveBeenCalledWith('abc123', 'Senha@123');
  });

  it('does not submit when the passwords do not match, and warns', async () => {
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

  it('shows the password rules before typing', async () => {
    await setup('token=abc123');
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(ActivateAccountComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#newPassword-requirements')?.textContent).toContain('Mínimo de 6 caracteres');
  });

  it('shows the confirmation with the shortcut to login after activating', async () => {
    await setup('token=abc123');
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(ActivateAccountComponent);
    storeFake.activated.set(true);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Conta ativada');
    expect(fixture.nativeElement.querySelector('a[href="/login"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('replaces the form with the guidance to request another invitation when the link is invalid', async () => {
    await setup(null);
    const fixture = TestBed.createComponent(ActivateAccountComponent);
    storeFake.invalidLink.set(true);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Link inválido ou expirado');
    expect(fixture.nativeElement.textContent).toContain('reenviar o convite');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });
});
