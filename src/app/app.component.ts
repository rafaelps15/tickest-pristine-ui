import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialogComponent } from './shared/ui/confirm-dialog/confirm-dialog.component';
import { ToastContainerComponent } from './shared/ui/toast-container/toast-container.component';

/** Componente host das rotas — também monta o modal de confirmação e a pilha de toasts globais. */
@Component({
    selector: 'app-root',
    imports: [RouterOutlet, ConfirmDialogComponent, ToastContainerComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <router-outlet />
        <app-confirm-dialog />
        <app-toast-container />
    `
})
export class AppComponent { }
