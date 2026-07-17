import { inject, Injectable, signal } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { AuthRepository } from "../../domain/interfaces/auth.repository";
import { LoginCredentials } from "../../domain/models/login-credentials.model";
import { SessionService } from "../../core/services/session.service";
import { extractErrorMessage } from "../../core/utils/http-error.util";
import { finalize } from "rxjs";
import { Router } from "@angular/router";

/** Serviço de autenticação. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly repository = inject(AuthRepository);
  private readonly session = inject(SessionService);

  private readonly router = inject(Router);

  state = signal({
    loading: false,
    error: null as string | null
  });

  login(credentials: LoginCredentials) {
    this.state.update(s => ({ ...s, loading: true, error: null }));

    this.repository.login(credentials)
      .pipe(finalize(() => this.state.update(s => ({ ...s, loading: false }))))
      .subscribe({
        next: (res) => {
          if (!res.isSuccess) {
            this.state.update(s => ({ ...s, error: res.error?.message ?? 'E-mail ou senha incorretos' }));
            return;
          }

          this.session.saveSession(res.value);
          this.router.navigate(['/dashboard']);
        },
        error: (err: HttpErrorResponse) => {
          // Login e registro respondem 404 (UserErrors.NotFoundByEmail) tanto para
          // usuário inexistente quanto para senha incorreta, para não vazar qual dos dois é o caso.
          const message = extractErrorMessage(err, {
            404: 'E-mail ou senha incorretos.',
            500: 'Erro interno no servidor.'
          });
          this.state.update(s => ({ ...s, error: message }));
        }
      });
  }

  logout() {
    this.session.clearSession();
    this.state.update(s => ({ ...s, error: null }));
  }
}
