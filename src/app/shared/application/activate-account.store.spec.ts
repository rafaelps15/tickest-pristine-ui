import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ActivateAccountStore } from './activate-account.store';
import { AuthDataService } from '../infrastructure/auth.data.service';

describe('ActivateAccountStore', () => {
  let store: InstanceType<typeof ActivateAccountStore>;
  let authDataService: jasmine.SpyObj<AuthDataService>;

  beforeEach(() => {
    authDataService = jasmine.createSpyObj('AuthDataService', ['activateAccount']);
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), ActivateAccountStore, { provide: AuthDataService, useValue: authDataService }]
    });
    store = TestBed.inject(ActivateAccountStore);
  });

  it('ativa a conta com o token e a senha escolhida', async () => {
    authDataService.activateAccount.and.returnValue(of(undefined));

    store.activate('tok-123', 'Senha@123');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(authDataService.activateAccount).toHaveBeenCalledWith({ token: 'tok-123', newPassword: 'Senha@123' });
    expect(store.activated()).toBeTrue();
    expect(store.loading()).toBeFalse();
  });

  it('troca o formulário pela orientação de novo convite quando o link é inválido ou expirou', async () => {
    authDataService.activateAccount.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 400, error: { title: 'Users.InvalidActivationToken' }
    })));

    store.activate('tok-velho', 'Senha@123');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.invalidLink()).toBeTrue();
    expect(store.activated()).toBeFalse();
    expect(store.error()).toBeNull();
  });

  it('mantém o formulário com uma mensagem quando é limite de tentativas', async () => {
    authDataService.activateAccount.and.returnValue(throwError(() => new HttpErrorResponse({ status: 429 })));

    store.activate('tok-123', 'Senha@123');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.invalidLink()).toBeFalse();
    expect(store.error()).toBe('Muitas tentativas seguidas. Espere um minuto e tente de novo.');
  });

  it('mantém o formulário com uma mensagem quando não há conexão', async () => {
    authDataService.activateAccount.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));

    store.activate('tok-123', 'Senha@123');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.error()).toBe('Sem conexão com o servidor. Tente de novo em instantes.');
  });

  it('marca o link como inválido sem chamar a API', () => {
    store.markInvalidLink();

    expect(store.invalidLink()).toBeTrue();
    expect(authDataService.activateAccount).not.toHaveBeenCalled();
  });
});
