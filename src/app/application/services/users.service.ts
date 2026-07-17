import { inject, Injectable, signal } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { AuthRepository } from "../../domain/interfaces/auth.repository";
import { CreateUserData } from "../../domain/models/create-user-data.model";
import { extractErrorMessage } from "../../core/utils/http-error.util";
import { finalize } from "rxjs";

/** Serviço de usuários. */
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly authRepository = inject(AuthRepository);

  state = signal({
    loading: false,
    success: false,
    error: null as string | null
  });

  /** Registra um novo usuário (único caminho de criação exposto pelo back-end: POST /users/register). */
  createUser(data: CreateUserData) {
    this.state.update(s => ({ ...s, loading: true, success: false, error: null }));

    this.authRepository.register(data)
      .pipe(finalize(() => this.state.update(s => ({ ...s, loading: false }))))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.state.update(s => ({ ...s, success: true }));
          } else {
            this.state.update(s => ({ ...s, error: res.error?.message ?? 'Erro ao processar solicitação' }));
          }
        },
        error: (err: HttpErrorResponse) => {
          const message = extractErrorMessage(err, {
            0: 'Sem conexão com o servidor.',
            409: 'Este e-mail já está cadastrado.'
          }, 'Ocorreu um erro inesperado.');
          this.state.update(s => ({ ...s, error: message }));
        }
      });
  }

  resetState() {
    this.state.set({ loading: false, success: false, error: null });
  }
}
