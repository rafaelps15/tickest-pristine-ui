import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../../application/services/auth.service';
import { Router, RouterModule } from '@angular/router';

/** UI de autenticação. */
@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule, RouterModule],
    templateUrl: './login.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  showPassword = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  onSubmit() {
    if (this.form.valid) {
      const raw = this.form.getRawValue();
      this.authService.login({
        email: raw.email!,
        password: raw.password!
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
