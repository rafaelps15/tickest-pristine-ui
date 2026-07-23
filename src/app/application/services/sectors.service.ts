import { inject, Injectable, signal, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { SectorRepository } from '../../domain/interfaces/sector.repository';
import { CreateSectorData, Sector, UpdateSectorData } from '../../domain/models/sector.model';

/** Serviço de gerenciamento de setores. */
@Injectable({ providedIn: 'root' })
export class SectorsService {
    private readonly repository = inject(SectorRepository);

    /** Resource de leitura (GET /sectors) — dispara sozinho na criação e via reload(). */
    private readonly listResource = rxResource({
        stream: () => this.repository.getAll()
    });

    /** Erro de uma mutação (create/update/delete); a leitura tem o próprio erro, vindo do resource. */
    private readonly mutationError = signal<string | null>(null);

    state = computed(() => {
        const result = this.listResource.value();
        const readError = result && !result.isSuccess
            ? (result.error?.message ?? 'Erro ao carregar setores')
            : null;

        return {
            data: result?.isSuccess ? result.value : [] as Sector[],
            loading: this.listResource.isLoading(),
            error: this.mutationError() ?? readError
        };
    });

    sectors = computed(() => this.state().data);

    load() {
        this.mutationError.set(null);
        this.listResource.reload();
    }

    create(data: CreateSectorData, onSuccess?: () => void) {
        this.repository.create(data).subscribe(res => {
            if (res.isSuccess) {
                this.mutationError.set(null);
                this.listResource.reload();
                onSuccess?.();
            } else {
                this.mutationError.set(res.error?.message ?? 'Erro ao criar setor');
            }
        });
    }

    update(sectorId: string, data: UpdateSectorData, onSuccess?: () => void) {
        this.repository.update(sectorId, data).subscribe(res => {
            if (res.isSuccess) {
                this.mutationError.set(null);
                this.listResource.reload();
                onSuccess?.();
            } else {
                this.mutationError.set(res.error?.message ?? 'Erro ao atualizar setor');
            }
        });
    }

    delete(sectorId: string) {
        this.repository.delete(sectorId).subscribe(res => {
            if (res.isSuccess) this.listResource.reload();
        });
    }
}
