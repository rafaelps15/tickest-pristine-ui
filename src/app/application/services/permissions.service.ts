import { computed, inject, Injectable } from "@angular/core";
import { rxResource } from '@angular/core/rxjs-interop';
import { PermissionRepository } from "../../domain/interfaces/permission.repository";

/** Serviço de permissões (códigos de permissão disponíveis no sistema). */
@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private readonly repository = inject(PermissionRepository);

  private readonly listResource = rxResource({
    stream: () => this.repository.getAll()
  });

  state = computed(() => {
    const result = this.listResource.value();
    const error = result && !result.isSuccess
        ? (result.error?.message ?? 'Erro ao carregar permissões')
        : null;

    return {
      data: result?.isSuccess ? result.value : [] as string[],
      loading: this.listResource.isLoading(),
      error
    };
  });

  permissionCodes = computed(() => this.state().data);

  load() {
    this.listResource.reload();
  }
}
