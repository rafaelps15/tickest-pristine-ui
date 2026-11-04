import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Estado vazio de primeiro uso de Meus Chamados: explica o canal (substitui e-mail/WhatsApp), lista os
 * departamentos que atendem e leva direto ao primeiro chamado. Fica dentro da célula da tabela.
 */
@Component({
  selector: 'app-ticket-list-first-use',
  imports: [RouterLink],
  templateUrl: './ticket-list-first-use.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './ticket-list-first-use.component.css'
})
export class TicketListFirstUseComponent {
  /** Departamentos que atendem chamados, por extenso ("TI, RH e Financeiro"); vazio esconde a linha. */
  readonly attendingDepartments = input('');
}
