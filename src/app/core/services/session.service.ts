import { Injectable, signal, computed } from '@angular/core';
import { AccessTokens } from '../../domain/models/access-tokens.model';

/** Payload decodificado de um JWT. */
type JwtPayload = Record<string, unknown>;

/** Serviço de gestão de sessão. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly ACCESS_TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  // Controle interno dos tokens.
  private _token = signal<string | null>(this.getStoredValue(this.ACCESS_TOKEN_KEY));
  private _refreshToken = signal<string | null>(this.getStoredValue(this.REFRESH_TOKEN_KEY));

  // Exposição para leitura.
  token = this._token.asReadonly();
  refreshToken = this._refreshToken.asReadonly();

  // Estado de autenticação.
  isAuthenticated = computed(() => {
    const token = this._token();
    return typeof token === 'string' && token.split('.').length === 3;
  });

  /** Payload decodificado do token de acesso. */
  user = computed(() => {
    const token = this._token();
    if (!this.isAuthenticated() || typeof token !== 'string') return null;
    return this.decodeToken(token);
  });

  /** E-mail do usuário logado, extraído da claim emitida pelo back-end (não há claim de papel/role hoje). */
  email = computed(() => {
    const user = this.user();
    if (!user) return null;
    const claim = user['email'] ?? user['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
    return typeof claim === 'string' ? claim : null;
  });

  /** Salva os tokens da sessão e no local storage. */
  saveSession(tokens: AccessTokens): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
    this._token.set(tokens.accessToken);
    this._refreshToken.set(tokens.refreshToken);
  }

  /** Limpa a sessão e local storage. */
  clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }
    this._token.set(null);
    this._refreshToken.set(null);
  }

  private getStoredValue(key: string): string | null {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(key);
      return typeof saved === 'string' ? saved : null;
    }
    return null;
  }

  private decodeToken(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length < 2) {
        throw new Error('Token format is invalid');
      }
      return JSON.parse(atob(parts[1])) as JwtPayload;
    } catch {
      return null;
    }
  }
}
