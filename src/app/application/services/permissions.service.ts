import { computed, inject, Injectable, signal } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { PermissionRepository } from "../../domain/interfaces/permission.repository";
import { extractErrorMessage } from "../../core/utils/http-error.util";
import { finalize } from "rxjs";

/** Serviço de permissões (códigos de permissão disponíveis no sistema). */
@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private readonly repository = inject(PermissionRepository);

  state = signal({
    data: [] as string[],
    loading: false,
    error: null as string | null
  });

  permissionCodes = computed(() => this.state().data);

  load() {
    this.state.update(s => ({ ...s, loading: true, error: null }));

    this.repository.getAll()
      .pipe(finalize(() => this.state.update(s => ({ ...s, loading: false }))))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.state.update(s => ({ ...s, data: res.value }));
          } else {
            this.state.update(s => ({ ...s, error: res.error?.message ?? 'Erro ao carregar permissões' }));
          }
        },
        error: (err: HttpErrorResponse) => {
          const message = extractErrorMessage(err, {}, 'Não foi possível carregar as permissões.');
          this.state.update(s => ({ ...s, error: message }));
        }
      });
  }
}
