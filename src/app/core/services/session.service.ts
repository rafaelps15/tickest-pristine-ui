import { Injectable, signal, computed } from '@angular/core';
import { AccessTokens } from '../../domain/models/access-tokens.model';

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

  /** Access token atual (somente leitura). */
  token = this._token.asReadonly();
  /** Refresh token atual (somente leitura). */
  refreshToken = this._refreshToken.asReadonly();

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

  /**
   * Códigos de permissão do usuário logado, extraídos da claim `permissions`.
   * O emissor de JWT serializa múltiplas claims de mesmo nome como array — mas
   * emite uma string solta (não um array de 1 item) quando há só uma permissão,
   * então os dois formatos precisam ser tratados aqui.
   */
  permissions = computed(() => {
    const claim = this.user()?.['permissions'];
    if (Array.isArray(claim)) return new Set(claim.filter((c): c is string => typeof c === 'string'));
    if (typeof claim === 'string') return new Set([claim]);
    return new Set<string>();
  });

  /** Indica se o usuário logado possui o código de permissão informado. */
  hasPermission(code: string): boolean {
    return this.permissions().has(code);
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
