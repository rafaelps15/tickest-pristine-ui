import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../../application/services/auth.service';
import { SessionService } from '../../../../core/services/session.service';

/** Layout da área autenticada (com navegação e logout), usado pelas rotas protegidas. */
@Component({
    selector: 'app-main-layout',
    imports: [RouterModule],
    templateUrl: './main-layout.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly sessionService = inject(SessionService);

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
