import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LoginStore } from '../application/login.store';

/** UI de autenticação. */
@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule],
    templateUrl: './login.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    // Visual compartilhado com a tela de primeiro acesso (ver shared/ui/auth-form.css).
    styleUrls: ['../ui/auth-form.css']
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly store = inject(LoginStore);

  /** Controla a visibilidade do campo de senha. */
  showPassword = signal(false);

  /** Formulário reativo de login (email/senha). */
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  /** Alterna entre exibir e ocultar a senha digitada. */
  togglePassword() {
    this.showPassword.update(v => !v);
  }

  /** Valida o formulário e efetua o login. */
  onSubmit() {
    if (this.form.valid) {
      const raw = this.form.getRawValue();
      this.store.login({
        email: raw.email!,
        password: raw.password!
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
