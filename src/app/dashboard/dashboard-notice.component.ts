import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

/**
 * Aviso compacto de um bloco do Início que não tem números pra mostrar, em tom neutro — vermelho
 * fica pro risco operacional (SLA vencido), nunca pra uma falha técnica:
 * - `unavailable`: o back-end ainda não entrega a rota ("Disponível em breve"), sem esqueleto nem
 *   gráfico fantasma, que pareceriam carga ou dado de verdade;
 * - `error`: a rota existe e falhou — mensagem curta e "Tentar novamente".
 */
@Component({
  selector: 'app-dashboard-notice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (kind() === 'error') {
      <div class="dashboard-notice" role="alert">
        <i class="bx bx-error-circle" aria-hidden="true"></i>
        <span class="flex-grow-1">{{ text() }}</span>
        <button type="button" class="btn btn-sm btn-outline-secondary flex-shrink-0" (click)="retry.emit()">Tentar novamente</button>
      </div>
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
  /** Tipo do aviso. */
  readonly kind = input<'unavailable' | 'error'>('unavailable');
  /** Frase do aviso ("Tempos de atendimento: disponível em breve."). */
  readonly text = input.required<string>();
  /** "Tentar novamente" de um erro. */
  readonly retry = output<void>();
}
