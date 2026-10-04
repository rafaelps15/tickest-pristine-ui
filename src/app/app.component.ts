import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialogComponent } from './shared/ui/confirm-dialog/confirm-dialog.component';

/** Componente host das rotas — também monta o modal de confirmação global (ver ConfirmDialogService). */
@Component({
    selector: 'app-root',
    imports: [RouterOutlet, ConfirmDialogComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <router-outlet />
        <app-confirm-dialog />
    `
})
export class AppComponent { }
