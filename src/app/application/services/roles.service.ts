import { computed, inject, Injectable, signal } from "@angular/core";
import { RoleRepository } from "../../domain/interfaces/role.repository";
import { Role } from "../../domain/entities/role.entity";
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
          console.log('Roles carregadas:', res);
          if (res.isSuccess) {
            this.state.update(s => ({ ...s, data: res.value }));
          } else {
            this.state.update(s => ({ ...s, error: res.errorResult?.message ?? 'Erro ao carregar papéis' }));
          }
        },
        error: (err) => {
          console.error('Erro ao carregar papéis:', err);
          this.state.update(s => ({ ...s, error: 'Não foi possível carregar os perfis de acesso.' }));
        }
      });
  }
}
