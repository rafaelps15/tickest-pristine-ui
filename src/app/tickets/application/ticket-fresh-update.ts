import { Observable, switchMap } from 'rxjs';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { UpdateTicketData } from '../entities/ticket';

/**
 * PUT /tickets/{id} montado com o chamado relido logo antes (GET /tickets/{id}): vão a descrição e o status
 * relidos, trocando só o que a operação muda. O PUT exige o estado inteiro, e mandar o lido na tela desfazia o que
 * outra pessoa mudou desde a carga (DIV-3). É uma mitigação: encurta a janela da corrida, sem eliminá-la, e sai
 * quando o back-end aceitar o PUT parcial (T-501 e T-502 da spec 049). Se a releitura falhar, o PUT não é enviado
 * e o erro chega a quem assina. Usada pelos Stores de Meus Chamados e do detalhe.
 */
export function updateWithFreshState(dataService: TicketDataService, ticketId: string, changes: Partial<UpdateTicketData>): Observable<void> {
  return dataService.getById(ticketId).pipe(
    switchMap(fresh => dataService.update(ticketId, { description: fresh.description, status: fresh.status, ...changes }))
  );
}
