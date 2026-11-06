import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LoginStore } from '../application/login.store';
import { ACCOUNT_DEACTIVATED_LOGIN_REASON } from '../utils/account-deactivated.util';

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
  /** Construtor do formulário de login. */
  private readonly fb = inject(FormBuilder);
  /** Store da sessão: envio do login, carregamento e mensagem de erro. */
  protected readonly store = inject(LoginStore);
  /** Rota atual, de onde vem o motivo do fim da sessão anterior. */
  private readonly route = inject(ActivatedRoute);

  /** Indica se a sessão anterior acabou porque a conta foi desativada (parâmetro `motivo` do login). */
  protected readonly accountDeactivated =
    this.route.snapshot.queryParamMap.get('motivo') === ACCOUNT_DEACTIVATED_LOGIN_REASON;

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
