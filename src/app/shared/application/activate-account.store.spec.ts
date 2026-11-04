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

  it('activates the account with the token and the chosen password', async () => {
    authDataService.activateAccount.and.returnValue(of(undefined));

    store.activate('tok-123', 'Senha@123');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(authDataService.activateAccount).toHaveBeenCalledWith({ token: 'tok-123', newPassword: 'Senha@123' });
    expect(store.activated()).toBeTrue();
    expect(store.loading()).toBeFalse();
  });

  it('swaps the form for new-invitation guidance when the link is invalid or expired', async () => {
    authDataService.activateAccount.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 400, error: { title: 'Users.InvalidActivationToken' }
    })));

    store.activate('tok-velho', 'Senha@123');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.invalidLink()).toBeTrue();
    expect(store.activated()).toBeFalse();
    expect(store.error()).toBeNull();
  });

  it('keeps the form with a message when it is a rate limit', async () => {
    authDataService.activateAccount.and.returnValue(throwError(() => new HttpErrorResponse({ status: 429 })));

    store.activate('tok-123', 'Senha@123');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.invalidLink()).toBeFalse();
    expect(store.error()).toBe('Muitas tentativas seguidas. Espere um minuto e tente de novo.');
  });

  it('keeps the form with a message when there is no connection', async () => {
    authDataService.activateAccount.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));

    store.activate('tok-123', 'Senha@123');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.error()).toBe('Sem conexão com o servidor. Tente de novo em instantes.');
  });

  it('marks the link as invalid without calling the API', () => {
    store.markInvalidLink();

    expect(store.invalidLink()).toBeTrue();
    expect(authDataService.activateAccount).not.toHaveBeenCalled();
  });
});
