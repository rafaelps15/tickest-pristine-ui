import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Componente host das rotas. */
@Component({
    selector: 'app-root',
    imports: [RouterOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<router-outlet />`
})
export class AppComponent { }
