import { inject, Injectable, signal, computed } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { UserRepository } from "../../domain/interfaces/user.repository";
import { AuthRepository } from "../../domain/interfaces/auth.repository";
import { CreateUserData } from "../../domain/models/create-user-data.model";
import { UserSummary } from "../../domain/models/user-summary.model";
import { extractErrorMessage } from "../../core/utils/http-error.util";
import { finalize } from "rxjs";

/** Serviço de usuários. */
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly repository = inject(UserRepository);
  private readonly authRepository = inject(AuthRepository);

  state = signal({
    data: [] as UserSummary[],
    loading: false,
    success: false,
    error: null as string | null
  });

  users = computed(() => this.state().data);

  loadUsers() {
    this.state.update(s => ({ ...s, loading: true, error: null }));
    this.repository.getAll()
      .pipe(finalize(() => this.state.update(s => ({ ...s, loading: false }))))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.state.update(s => ({ ...s, data: res.value }));
          } else {
            this.state.update(s => ({ ...s, error: res.error?.message ?? 'Erro ao carregar usuários' }));
          }
        },
        error: (err: HttpErrorResponse) => {
          const message = extractErrorMessage(err, {}, 'Erro de conexão ao carregar usuários');
          this.state.update(s => ({ ...s, error: message }));
        }
      });
  }

  /** Cria ou registra um usuário. Se isPublic for true, usa o endpoint api/auth/register. */
  createUser(data: CreateUserData, isPublic: boolean = false) {
    this.state.update(s => ({ ...s, loading: true, success: false, error: null }));

    const call = isPublic
      ? this.authRepository.register(data)
      : this.repository.createUser(data);

    call.pipe(finalize(() => this.state.update(s => ({ ...s, loading: false }))))
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
    this.state.set({ data: [], loading: false, success: false, error: null });
  }
}
