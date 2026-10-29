import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SummaryCardComponent } from '../../shared/ui/summary-card/summary-card.component';
import { UserStatusCounts } from '../entities/user-status-counts';

/**
 * Card "Resumo" de Usuários: quantos ativos, com convite pendente e inativos a empresa tem — de
 * toda a base, não da página atual. Componente de apresentação — recebe os totais via `input`, não
 * injeta nenhum Store.
 */
@Component({
  selector: 'app-user-list-insights',
  imports: [SummaryCardComponent],
  templateUrl: './user-list-insights.component.html',
  styleUrl: './user-list-insights.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListInsightsComponent {
  /** Totais da empresa por situação (`null` enquanto não chegaram). */
  readonly counts = input<UserStatusCounts | null>(null);
  /** Os totais ainda estão carregando — o card mostra "—". */
  readonly loading = input(false);
  /** Os totais falharam — o card mostra "—" e o motivo. */
  readonly failed = input(false);
}
