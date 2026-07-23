import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { SectorRepository } from '../../domain/interfaces/sector.repository';
import { CreateSectorData, Sector, UpdateSectorData } from '../../domain/models/sector.model';
import { extractErrorMessage } from '../../core/utils/http-error.util';

/** Serviço de gerenciamento de setores. */
@Injectable({ providedIn: 'root' })
export class SectorsService {
    private readonly repository = inject(SectorRepository);

    state = signal({
        data: [] as Sector[],
        loading: false,
        error: null as string | null
    });

    sectors = computed(() => this.state().data);

    load() {
        this.state.update(s => ({ ...s, loading: true, error: null }));

        this.repository.getAll()
            .pipe(finalize(() => this.state.update(s => ({ ...s, loading: false }))))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        this.state.update(s => ({ ...s, data: res.value }));
                    } else {
                        this.state.update(s => ({ ...s, error: res.error?.message ?? 'Erro ao carregar setores' }));
                    }
                },
                error: (err: HttpErrorResponse) => {
                    const message = extractErrorMessage(err, {}, 'Não foi possível carregar os setores.');
                    this.state.update(s => ({ ...s, error: message }));
                }
            });
    }

    create(data: CreateSectorData, onSuccess?: () => void) {
        this.repository.create(data).subscribe(res => {
            if (res.isSuccess) {
                this.load();
                onSuccess?.();
            } else {
                this.state.update(s => ({ ...s, error: res.error?.message ?? 'Erro ao criar setor' }));
            }
        });
    }

    update(sectorId: string, data: UpdateSectorData, onSuccess?: () => void) {
        this.repository.update(sectorId, data).subscribe(res => {
            if (res.isSuccess) {
                this.load();
                onSuccess?.();
            } else {
                this.state.update(s => ({ ...s, error: res.error?.message ?? 'Erro ao atualizar setor' }));
            }
        });
    }

    delete(sectorId: string) {
        this.repository.delete(sectorId).subscribe(res => {
            if (res.isSuccess) this.load();
        });
    }
}
