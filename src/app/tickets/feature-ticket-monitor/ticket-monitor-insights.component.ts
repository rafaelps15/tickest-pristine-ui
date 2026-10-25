import { Component, ChangeDetectionStrategy } from '@angular/core';

/**
 * Prévia de "Visão da Equipe" de Monitorar Tickets: só aparece em telas muito largas, no espaço
 * que sobra ao lado da tabela. Conteúdo 100% estático e claramente marcado como "Em breve" — ainda
 * não existe nenhum endpoint de agregação (carga por atendente, setores críticos, atividade da
 * fila inteira) pra alimentar isso com dado real (R-03: nenhum número aqui é inventado). Serve só
 * pra deixar reservado o espaço e a intenção, até o back-end ganhar esses endpoints.
 */
@Component({
  selector: 'app-ticket-monitor-insights',
  templateUrl: './ticket-monitor-insights.component.html',
  styleUrl: './ticket-monitor-insights.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketMonitorInsightsComponent {}
