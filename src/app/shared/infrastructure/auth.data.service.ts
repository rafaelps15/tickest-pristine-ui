import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginCredentials } from '../entities/login-credentials';
import { CreateUserData } from '../entities/create-user-data';
import { AccessTokens } from '../entities/access-tokens';
import { CurrentUser } from '../entities/current-user';
import { ChangeRequiredPasswordData } from '../entities/change-required-password-data';
import { environment } from '../../../environments/environment';

/** Acesso HTTP aos endpoints de autenticação/identidade (login, registro, renovação de token). */
@Injectable({ providedIn: 'root' })
export class AuthDataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  /** Autentica com email/senha e retorna os tokens de acesso (POST /users/login). */
  login(credentials: LoginCredentials): Observable<AccessTokens> {
    return this.http.post<AccessTokens>(`${this.apiUrl}/login`, credentials);
  }

  /** Troca a senha provisória e já retorna os tokens de acesso (POST /users/login/new-password). */
  changeRequiredPassword(data: ChangeRequiredPasswordData): Observable<AccessTokens> {
    return this.http.post<AccessTokens>(`${this.apiUrl}/login/new-password`, data);
  }

  /** Registra um novo usuário — único caminho de criação exposto pelo back-end (POST /users/register). */
  register(data: CreateUserData): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/register`, data);
  }

  /** Renova os tokens de acesso a partir do refresh token (POST /users/refresh-token). */
  refresh(refreshToken: string): Observable<AccessTokens> {
    return this.http.post<AccessTokens>(`${this.apiUrl}/refresh-token`, { refreshToken });
  }

  /** Busca o usuário logado, com roles e permissões atualizadas (GET /users/me). */
  getCurrentUser(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${this.apiUrl}/me`);
  }

  /** Revoga o refresh token no servidor (POST /users/logout). Não falha se o token já não existir. */
  logout(refreshToken: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, { refreshToken });
  }
}
