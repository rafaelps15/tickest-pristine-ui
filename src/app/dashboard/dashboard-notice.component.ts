import { Component, ChangeDetectionStrategy, input, output, signal, effect, untracked, inject, DestroyRef } from '@angular/core';

/** Atraso entre limpar e escrever o aviso de nova falha, pra a mesma frase ser lida de novo. */
const ANNOUNCE_DELAY_MS = 100;

/**
 * Aviso compacto de um bloco do Início que não tem números pra mostrar, em tom neutro — vermelho
 * fica pro risco operacional (SLA vencido), nunca pra uma falha técnica:
 * - `unavailable`: o back-end ainda não entrega a rota ("Disponível em breve"), sem esqueleto nem
 *   gráfico fantasma, que pareceriam carga ou dado de verdade;
 * - `error`: a rota existe e falhou — mensagem curta e "Tentar novamente". Com {@link busy}, o
 *   botão mostra que a nova tentativa está em curso; se ela falhar de novo depois do clique, o
 *   leitor de tela ouve isso uma vez (o aviso em si fica parado, sem ser lido de novo).
 */
@Component({
  selector: 'app-dashboard-notice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (kind() === 'error') {
      <div class="dashboard-notice" role="alert">
        <i class="bx bx-error-circle" aria-hidden="true"></i>
        <span class="flex-grow-1">{{ text() }}</span>
        <!-- aria-disabled, não disabled: o foco fica no botão enquanto a nova tentativa carrega. -->
        <button type="button" class="btn btn-sm btn-outline-secondary flex-shrink-0" [attr.aria-disabled]="busy() || null" (click)="tryAgain()">
          @if (busy()) {
            <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>Tentando…
          } @else {
            Tentar novamente
          }
        </button>
      </div>
      <span class="visually-hidden" aria-live="polite">{{ retryOutcome() }}</span>
    } @else {
      <p class="dashboard-notice mb-0">
        <i class="bx bx-info-circle" aria-hidden="true"></i>
        <span>{{ text() }}</span>
      </p>
    }
  `,
  styles: `
    :host { display: block; }

    .dashboard-notice {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      min-height: 2.5rem;
      color: var(--tk-text-secondary);
      font-size: 0.875rem;
    }

    .dashboard-notice .bx {
      font-size: 1rem;
      color: var(--tk-text-muted);
    }

    /* Texto longo quebra ao lado do ícone, não embaixo dele. */
    .dashboard-notice > span {
      flex: 1 1 12rem;
      min-width: 0;
    }

    /* Toque: "Tentar novamente" com o alvo mínimo de 44px. */
    @media (pointer: coarse) {
      .dashboard-notice .btn { min-height: 2.75rem; }
    }
  `
})
export class DashboardNoticeComponent {
  /** Limpa o atraso do aviso de nova falha ao sair da tela. */
  private readonly destroyRef = inject(DestroyRef);

  /** Tipo do aviso. */
  readonly kind = input<'unavailable' | 'error'>('unavailable');
  /** Frase do aviso ("Tempos de atendimento: disponível em breve."). */
  readonly text = input.required<string>();
  /** A nova tentativa está carregando (o botão gira e não aceita outro clique). */
  readonly busy = input(false);
  /** "Tentar novamente" de um erro. */
  readonly retry = output<void>();

  /** Aviso pro leitor de tela quando a nova tentativa pedida no botão falha de novo. */
  protected readonly retryOutcome = signal('');

  /** A pessoa clicou em "Tentar novamente" e a resposta ainda não chegou (a atualização automática não conta). */
  private retryRequested = false;
  /** O {@link busy} da última leitura, pra saber quando a tentativa terminou. */
  private wasBusy = false;
  /** Atraso do aviso de nova falha (limpo ao sair da tela). */
  private outcomeTimer: ReturnType<typeof setTimeout> | undefined;

  /** Liga o aviso de nova falha ao fim da tentativa pedida no botão. */
  constructor() {
    // Ainda com o aviso de erro na tela quando a tentativa termina: ela falhou de novo. Se der certo,
    // quem usa tira este aviso da tela e o bloco mostra os dados.
    effect(() => {
      const busy = this.busy();
      untracked(() => {
        if (this.wasBusy && !busy && this.retryRequested) {
          this.retryRequested = false;
          this.retryOutcome.set('');
          clearTimeout(this.outcomeTimer);
          this.outcomeTimer = setTimeout(() => this.retryOutcome.set(`Ainda não foi possível. ${this.text()}`), ANNOUNCE_DELAY_MS);
        }
        this.wasBusy = busy;
      });
    });
    this.destroyRef.onDestroy(() => clearTimeout(this.outcomeTimer));
  }

  /** "Tentar novamente": pede a nova tentativa, a menos que uma já esteja em curso. */
  protected tryAgain(): void {
    if (this.busy()) return;
    this.retryRequested = true;
    this.retry.emit();
  }
}
