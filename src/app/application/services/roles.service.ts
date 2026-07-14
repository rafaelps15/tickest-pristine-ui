import { computed, inject, Injectable, signal } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { RoleRepository } from "../../domain/interfaces/role.repository";
import { Role } from "../../domain/entities/role.entity";
import { extractErrorMessage } from "../../core/utils/http-error.util";
import { finalize } from "rxjs";

/** Serviço de papéis. */
@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly repository = inject(RoleRepository);

  state = signal({
    data: [] as Role[],
    loading: false,
    error: null as string | null
  });

  roles = computed(() => this.state().data);

  loadRoles() {
    this.state.update(s => ({ ...s, loading: true, error: null }));

    this.repository.getAll()
      .pipe(finalize(() => this.state.update(s => ({ ...s, loading: false }))))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.state.update(s => ({ ...s, data: res.value }));
          } else {
            this.state.update(s => ({ ...s, error: res.error?.message ?? 'Erro ao carregar papéis' }));
          }
        },
        error: (err: HttpErrorResponse) => {
          const message = extractErrorMessage(err, {}, 'Não foi possível carregar os perfis de acesso.');
          this.state.update(s => ({ ...s, error: message }));
        }
      });
  }
}
