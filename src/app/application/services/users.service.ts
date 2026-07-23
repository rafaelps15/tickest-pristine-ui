import { inject, Injectable, signal, computed } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { AuthRepository } from "../../domain/interfaces/auth.repository";
import { UserRepository } from "../../domain/interfaces/user.repository";
import { CreateUserData } from "../../domain/models/create-user-data.model";
import { UserSummary } from "../../domain/models/user-summary.model";
import { extractErrorMessage } from "../../core/utils/http-error.util";
import { finalize } from "rxjs";

/** Serviço de usuários. */
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly authRepository = inject(AuthRepository);
  private readonly userRepository = inject(UserRepository);

  state = signal({
    loading: false,
    success: false,
    error: null as string | null
  });

  listState = signal({
    data: [] as UserSummary[],
    loading: false,
    error: null as string | null
  });

  users = computed(() => this.listState().data);

  /** Registra um novo usuário (único caminho de criação exposto pelo back-end: POST /users/register). */
  createUser(data: CreateUserData) {
    this.state.update(s => ({ ...s, loading: true, success: false, error: null }));

    this.authRepository.register(data)
      .pipe(finalize(() => this.state.update(s => ({ ...s, loading: false }))))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.state.update(s => ({ ...s, success: true }));
            this.loadAll();
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

  /** Carrega todos os usuários cadastrados (GET /users, requer users:manage). */
  loadAll() {
    this.listState.update(s => ({ ...s, loading: true, error: null }));

    this.userRepository.getAll()
      .pipe(finalize(() => this.listState.update(s => ({ ...s, loading: false }))))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.listState.update(s => ({ ...s, data: res.value }));
          } else {
            this.listState.update(s => ({ ...s, error: res.error?.message ?? 'Erro ao carregar usuários' }));
          }
        },
        error: (err: HttpErrorResponse) => {
          const message = extractErrorMessage(err, {}, 'Não foi possível carregar os usuários.');
          this.listState.update(s => ({ ...s, error: message }));
        }
      });
  }

  /** Atribui um conjunto de roles a um usuário (PUT /users/{userId}/roles). */
  assignRoles(userId: string, roleIds: string[], onSuccess?: () => void) {
    this.userRepository.assignRoles(userId, roleIds).subscribe(res => {
      if (res.isSuccess) {
        this.loadAll();
        onSuccess?.();
      } else {
        this.listState.update(s => ({ ...s, error: res.error?.message ?? 'Erro ao atribuir roles' }));
      }
    });
  }
}
