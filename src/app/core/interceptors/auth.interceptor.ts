import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionService } from '../services/session.service';
import { TokenRefreshService } from '../services/token-refresh.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';

const AUTH_ENDPOINTS = ['/users/login', '/users/refresh-token'];

/** Interceptor para injeção do token JWT, renovação automática em 401 e tratamento de erros de autorização. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const session = inject(SessionService);
    const tokenRefresh = inject(TokenRefreshService);
    const router = inject(Router);

    const isAuthEndpoint = AUTH_ENDPOINTS.some(endpoint => req.url.includes(endpoint));

    return next(withToken(req, session.token())).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && !isAuthEndpoint) {
                // Access token expirado: tenta renovar via refresh token e repetir a requisição original.
                return tokenRefresh.refresh().pipe(
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

            if (error.status === 401 || error.status === 403) {
                // Refresh token também inválido/expirado, ou acesso negado: limpa e desloga.
                session.clearSession();
                router.navigate(['/login']);
            }

            return throwError(() => error);
        })
    );
};

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
