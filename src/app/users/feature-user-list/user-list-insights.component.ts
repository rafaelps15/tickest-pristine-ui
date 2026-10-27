import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SummaryCardComponent } from '../../shared/ui/summary-card/summary-card.component';

/**
 * Card "Resumo" de Usuários: quantos ativos e inativos a empresa tem — de toda a base, não da
 * página atual. Componente de apresentação — recebe os totais via `input`, não injeta nenhum Store.
 */
@Component({
  selector: 'app-user-list-insights',
  imports: [SummaryCardComponent],
  templateUrl: './user-list-insights.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListInsightsComponent {
  /** Total de usuários ativos. */
  readonly activeCount = input<number | null>(null);
  /** Total de usuários inativos. */
  readonly inactiveCount = input<number | null>(null);
  /** Os totais ainda estão carregando — o card mostra "—". */
  readonly loading = input(false);
  /** Os totais falharam — o card mostra "—" e o motivo. */
  readonly failed = input(false);
}
