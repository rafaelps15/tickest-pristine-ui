import { DestroyRef, Injectable, inject, signal, computed } from '@angular/core';
import { AccessTokens } from '../entities/access-tokens';
import { CurrentUser } from '../entities/current-user';

/** Payload decodificado de um JWT. */
type JwtPayload = Record<string, unknown>;

/** Decodifica um segmento base64url (formato usado pelo JWT, diferente do base64 padrão que `atob` espera). */
function base64UrlDecode(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/').padEnd(segment.length + (4 - segment.length % 4) % 4, '=');
  const binary = atob(base64);
  const percentEncoded = Array.from(binary, char => '%' + char.charCodeAt(0).toString(16).padStart(2, '0')).join('');
  return decodeURIComponent(percentEncoded);
}

/** Serviço de gestão de sessão. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly ACCESS_TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  private _token = signal<string | null>(this.getStoredValue(this.ACCESS_TOKEN_KEY));
  private _refreshToken = signal<string | null>(this.getStoredValue(this.REFRESH_TOKEN_KEY));
  private _currentUser = signal<CurrentUser | null>(null);

  /** Access token atual (somente leitura). */
  token = this._token.asReadonly();
  /** Refresh token atual (somente leitura). */
  refreshToken = this._refreshToken.asReadonly();
  /** Usuário logado, com roles e permissões atualizadas — carregado via CurrentUserService (GET /users/me). */
  currentUser = this._currentUser.asReadonly();

  /** Indica se há um access token armazenado com formato de JWT válido (3 partes). */
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

  /** Id (Guid) do usuário logado, extraído da claim `sub` emitida pelo back-end. */
  userId = computed(() => {
    const user = this.user();
    if (!user) return null;
    const claim = user['sub'];
    return typeof claim === 'string' ? claim : null;
  });

  constructor() {
    if (typeof window !== 'undefined') {
      // Outra aba renovou ou encerrou a sessão: sem isso, esta aba reenviaria o refresh token já trocado e o
      // back-end trataria como reuso, revogando todas as sessões do usuário.
      const onStorage = (event: StorageEvent) => this.syncFromStorage(event);
      window.addEventListener('storage', onStorage);
      inject(DestroyRef).onDestroy(() => window.removeEventListener('storage', onStorage));
    }
  }

  /** Códigos de permissão do usuário logado, vindos de GET /users/me — mesma fonte que a autorização da API usa. */
  permissions = computed(() => new Set(this.currentUser()?.permissions ?? []));

  /** Indica se o usuário logado possui o código de permissão informado. */
  hasPermission(code: string): boolean {
    return this.permissions().has(code);
  }

  /** Grava o usuário logado (dados, roles e permissões) carregado via GET /users/me. */
  setCurrentUser(user: CurrentUser | null): void {
    this._currentUser.set(user);
  }

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
    this._currentUser.set(null);
  }

  /** Aplica nesta aba os tokens gravados ou removidos por outra aba da mesma origem. */
  private syncFromStorage(event: StorageEvent): void {
    if (event.storageArea !== localStorage) return;
    if (event.key === null) {
      this._token.set(null);
      this._refreshToken.set(null);
      this._currentUser.set(null);
      return;
    }
    if (event.key === this.ACCESS_TOKEN_KEY) {
      this._token.set(event.newValue);
      if (event.newValue === null) this._currentUser.set(null);
    } else if (event.key === this.REFRESH_TOKEN_KEY) {
      this._refreshToken.set(event.newValue);
    }
  }

  private getStoredValue(key: string): string | null {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(key);
      return typeof saved === 'string' ? saved : null;
    }
    return null;
  }

  private decodeToken(token: string): JwtPayload | null {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }
    try {
      return JSON.parse(base64UrlDecode(payload)) as JwtPayload;
    } catch {
      return null;
    }
  }
}
