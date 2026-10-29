import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionService } from '../services/session.service';
import { TokenRefreshService } from '../services/token-refresh.service';
import { CurrentUserService } from '../services/current-user.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';

const AUTH_ENDPOINTS = ['/users/login', '/users/login/new-password', '/users/refresh-token', '/users/logout'];

/** Interceptor para injeção do token JWT, renovação automática em 401 e tratamento de erros de autorização. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const session = inject(SessionService);
    const tokenRefresh = inject(TokenRefreshService);
    const currentUserService = inject(CurrentUserService);
    const router = inject(Router);

    const isAuthEndpoint = AUTH_ENDPOINTS.some(endpoint => req.url.includes(endpoint));

    const sentToken = session.token();

    return next(withToken(req, sentToken)).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && !isAuthEndpoint) {
                const currentToken = session.token();
                if (currentToken && currentToken !== sentToken) {
                    // A sessão já foi renovada enquanto esta requisição estava em voo: repete com o token novo,
                    // sem uma segunda troca de refresh token.
                    return next(withToken(req, currentToken));
                }
                // Access token expirado: tenta renovar via refresh token e repetir a requisição original.
                return tokenRefresh.refresh().pipe(
                    // Falha de rede ou do servidor na renovação não invalida a sessão: devolve o 401 original.
                    catchError(() => throwError(() => error)),
                    switchMap(newToken => {
                        if (!newToken) {
                            session.clearSession();
                            router.navigate(['/login']);
                            return throwError(() => error);
                        }

                        return next(withToken(req, newToken));
                    })
                );
            }

            if (error.status === 401) {
                // Refresh token também inválido/expirado (ou 401 na própria chamada de autenticação): desloga.
                session.clearSession();
                router.navigate(['/login']);
            }

            if (error.status === 403 && !isAuthEndpoint) {
                // 403 é falta de permissão, não sessão inválida — mantém a sessão, só atualiza o menu (a permissão pode ter mudado).
                // Num endpoint de autenticação o 403 é regra de negócio (ex.: troca de senha pendente) e ainda não há sessão.
                currentUserService.load().subscribe();
            }

            return throwError(() => error);
        })
    );
};

/** Clona a requisição adicionando o header `Authorization` com o token informado, se houver. */
function withToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
    if (!token) {
        return req;
    }

    return req.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`
        }
    });
}
