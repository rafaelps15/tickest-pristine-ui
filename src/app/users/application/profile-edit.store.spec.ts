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

  it('deve carregar o perfil do usuário logado', async () => {
    store.loadCurrentUser();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getById).toHaveBeenCalledWith(userId);
    expect(store.profile()).toEqual(profile);
  });

  it('deve salvar o perfil, marcar como salvo e recarregar os dados', async () => {
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

  it('deve expor a mensagem de erro quando o salvamento falhar com 403', async () => {
    dataService.updateProfile.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    store.loadCurrentUser();
    await TestBed.inject(ApplicationRef).whenStable();

    store.save({ firstName: 'Ana', lastName: 'Costa' });

    expect(store.saved()).toBeFalse();
    expect(store.saving()).toBeFalse();
    expect(store.mutationError()).toBe('Você não tem permissão para editar este perfil.');
    expect(currentUserService.load).not.toHaveBeenCalled();
  });

  it('deve alterar a senha e marcar como alterada', async () => {
    dataService.changePassword.and.returnValue(of(undefined));

    store.changePassword({ currentPassword: 'Password123!', newPassword: 'NewPassword456#' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.changePassword).toHaveBeenCalledWith({ currentPassword: 'Password123!', newPassword: 'NewPassword456#' });
    expect(store.passwordChanged()).toBeTrue();
    expect(store.changingPassword()).toBeFalse();
    expect(store.passwordError()).toBeNull();
  });

  it('deve expor a mensagem de erro quando a senha atual estiver incorreta', async () => {
    dataService.changePassword.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 400,
      error: { title: 'Users.InvalidCurrentPassword', detail: 'A senha atual informada está incorreta' }
    })));

    store.changePassword({ currentPassword: 'errada', newPassword: 'NewPassword456#' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.passwordChanged()).toBeFalse();
    expect(store.passwordError()).toBe('A senha atual informada está incorreta');
  });

  it('deve expor mensagem própria quando o rate limiter bloquear a troca de senha (429, sem corpo)', async () => {
    dataService.changePassword.and.returnValue(throwError(() => new HttpErrorResponse({ status: 429 })));

    store.changePassword({ currentPassword: 'Password123!', newPassword: 'NewPassword456#' });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.passwordError()).toBe('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
  });

  it('clearSaved() esconde a confirmação de perfil atualizado', () => {
    store.clearSaved();

    expect(store.saved()).toBeFalse();
  });

  it('clearPasswordChanged() esconde a confirmação de senha alterada', () => {
    store.clearPasswordChanged();

    expect(store.passwordChanged()).toBeFalse();
  });
});
