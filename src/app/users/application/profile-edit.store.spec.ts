import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ProfileEditStore } from './profile-edit.store';
import { UserDataService } from '../infrastructure/user.data.service';
import { SessionService, CurrentUserService } from '../../shared';
import { UserProfile } from '../entities/user-profile';

describe('ProfileEditStore', () => {
  const userId = '0b8a1f5e-1111-4c8e-9f00-000000000001';
  const profile: UserProfile = { id: userId, email: 'maria@empresa.com', firstName: 'Maria', lastName: 'Silva' };

  let store: InstanceType<typeof ProfileEditStore>;
  let dataService: jasmine.SpyObj<UserDataService>;
  let currentUserService: jasmine.SpyObj<CurrentUserService>;

  beforeEach(() => {
    dataService = jasmine.createSpyObj('UserDataService', ['getById', 'updateProfile', 'changePassword']);
    dataService.getById.and.returnValue(of(profile));
    currentUserService = jasmine.createSpyObj('CurrentUserService', ['load']);
    currentUserService.load.and.returnValue(of({ status: 'loaded' as const }));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ProfileEditStore,
        { provide: UserDataService, useValue: dataService },
        { provide: SessionService, useValue: { userId: () => userId } },
        { provide: CurrentUserService, useValue: currentUserService }
      ]
    });
    store = TestBed.inject(ProfileEditStore);
  });

  it('should load the logged-in user profile', async () => {
    store.loadCurrentUser();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getById).toHaveBeenCalledWith(userId);
    expect(store.profile()).toEqual(profile);
  });

  it('should save the profile, mark it as saved and reload the data', async () => {
    dataService.updateProfile.and.returnValue(of(undefined));
    store.loadCurrentUser();
    await TestBed.inject(ApplicationRef).whenStable();

    store.save({ firstName: 'Ana', lastName: 'Costa' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.updateProfile).toHaveBeenCalledWith(userId, { firstName: 'Ana', lastName: 'Costa' });
    expect(store.saved()).toBeTrue();
    expect(store.saving()).toBeFalse();
    expect(store.mutationError()).toBeNull();
    expect(dataService.getById).toHaveBeenCalledTimes(2);
    expect(currentUserService.load).toHaveBeenCalled();
  });

  it('should expose the error message when the save fails with 403', async () => {
    dataService.updateProfile.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    store.loadCurrentUser();
    await TestBed.inject(ApplicationRef).whenStable();

    store.save({ firstName: 'Ana', lastName: 'Costa' });

    expect(store.saved()).toBeFalse();
    expect(store.saving()).toBeFalse();
    expect(store.mutationError()).toBe('Você não tem permissão para editar este perfil.');
    expect(currentUserService.load).not.toHaveBeenCalled();
  });

  it('should change the password and mark it as changed', async () => {
    dataService.changePassword.and.returnValue(of(undefined));

    store.changePassword({ currentPassword: 'Password123!', newPassword: 'NewPassword456#' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.changePassword).toHaveBeenCalledWith({ currentPassword: 'Password123!', newPassword: 'NewPassword456#' });
    expect(store.passwordChanged()).toBeTrue();
    expect(store.changingPassword()).toBeFalse();
    expect(store.passwordError()).toBeNull();
  });

  it('should expose the error message when the current password is incorrect', async () => {
    dataService.changePassword.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 400,
      error: { title: 'Users.InvalidCurrentPassword', detail: 'A senha atual informada está incorreta' }
    })));

    store.changePassword({ currentPassword: 'errada', newPassword: 'NewPassword456#' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.passwordChanged()).toBeFalse();
    expect(store.passwordError()).toBe('A senha atual informada está incorreta');
  });

  it('should expose its own message when the rate limiter blocks the password change (429, no body)', async () => {
    dataService.changePassword.and.returnValue(throwError(() => new HttpErrorResponse({ status: 429 })));

    store.changePassword({ currentPassword: 'Password123!', newPassword: 'NewPassword456#' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.passwordError()).toBe('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
  });

  it('clearSaved() hides the profile-updated confirmation', () => {
    store.clearSaved();

    expect(store.saved()).toBeFalse();
  });

  it('clearPasswordChanged() hides the password-changed confirmation', () => {
    store.clearPasswordChanged();

    expect(store.passwordChanged()).toBeFalse();
  });
});
