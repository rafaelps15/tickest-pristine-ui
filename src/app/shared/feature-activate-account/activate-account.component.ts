import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ActivateAccountStore } from '../application/activate-account.store';
import { passwordChangeValidator, strongPasswordValidator } from '../utils/password.validators';

/**
 * Lê o token do fragmento da URL do convite (`#token=...`). O token vem no fragmento, e não na
 * query, de propósito (spec 008, DEC-8): fragmento não vai pro servidor nem pros logs de acesso.
 */
function readTokenFromFragment(fragment: string | null): string | null {
  if (!fragment) return null;
  const token = new URLSearchParams(fragment).get('token');
  return token && token.trim() ? token.trim() : null;
}

/**
 * Tela pública de ativação da conta (link do convite por e-mail, rota `/ativar-conta`): quem foi
 * cadastrado define a própria senha — nenhuma senha definida por terceiros (spec 008 do back-end).
 * Depois de ativar, a pessoa entra pelo login; a ativação não abre sessão.
 */
@Component({
  selector: 'app-activate-account',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './activate-account.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ActivateAccountStore],
  // Visual compartilhado com login e primeiro acesso (ver shared/ui/auth-form.css).
  styleUrls: ['../ui/auth-form.css']
})
export class ActivateAccountComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly store = inject(ActivateAccountStore);

  /** Token do convite, lido uma vez do fragmento e tirado da barra de endereço. */
  private token: string | null = null;

  /** Controla se os campos de senha são exibidos em texto claro. */
  readonly showPasswords = signal(false);

  /** Mesmas regras da política de senha do back-end (StrongPassword), com confirmação. */
  readonly form = this.fb.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(6), strongPasswordValidator]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: passwordChangeValidator(() => null) });

  /**
   * Guarda o token e o remove da URL (sem empilhar histórico): quem copiar o endereço, ou olhar o
   * histórico do navegador, não leva junto um link de ativação ainda válido.
   */
  ngOnInit(): void {
    this.token = readTokenFromFragment(this.route.snapshot.fragment);
    if (!this.token) {
      this.store.markInvalidLink();
      return;
    }

    this.router.navigate([], { relativeTo: this.route, fragment: undefined, replaceUrl: true });
  }

  /** Verifica se um campo está inválido e já foi tocado. */
  isFieldInvalid(fieldName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[fieldName];
    return control.invalid && (control.dirty || control.touched);
  }

  /** Alterna a exibição em texto claro dos campos de senha. */
  togglePasswordsVisibility(): void {
    this.showPasswords.update(visible => !visible);
  }

  /** Envia a senha escolhida, ou marca os campos inválidos. */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.token) return;

    this.store.activate(this.token, this.form.getRawValue().newPassword);
  }
}
