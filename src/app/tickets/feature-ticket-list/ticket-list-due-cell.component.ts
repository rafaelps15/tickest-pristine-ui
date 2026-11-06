import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { DateTimePipe } from '../../shared/ui/pipes/date-time.pipe';
import { RouterLink } from '@angular/router';
import { DueDisplay } from './ticket-list-due';

/**
 * Conteúdo da coluna "Prazo" de Meus Chamados: a situação do SLA lidera (dá pra ler sem decifrar a
 * data), a data vem abaixo e, no atrasado, o atalho "Cobrar no chamado".
 */
@Component({
  selector: 'app-ticket-list-due-cell',
  imports: [DateTimePipe, RouterLink],
  templateUrl: './ticket-list-due-cell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './ticket-list-due-cell.component.css'
})
export class TicketListDueCellComponent {
  /** Como a situação do prazo aparece (texto, ícone, tom e se mostra a data). */
  readonly display = input.required<DueDisplay>();
  /** Prazo do ciclo vigente (UTC). */
  readonly dueAtUtc = input.required<string>();
  /** Chamado da linha, destino do "Cobrar no chamado". */
  readonly ticketId = input.required<string>();
  /** Título do chamado, que dá nome ao link para o leitor de tela. */
  readonly ticketTitle = input.required<string>();
}
