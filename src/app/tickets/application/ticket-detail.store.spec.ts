import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { TicketDetailStore } from './ticket-detail.store';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { TicketDetail } from '../entities/ticket';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { TicketSlaStatus } from '../entities/ticket-sla-status';

describe('TicketDetailStore', () => {
  const ticket: TicketDetail = {
    id: 't1', title: 'Impressora não funciona', description: 'Não imprime.',
    priority: TicketPriority.Medium, status: TicketStatus.Open,
    openedByUserId: 'u1', openedByName: 'Maria Souza', assignedToUserId: null, assignedToName: null,
    sectorId: 's1', sectorName: 'Suporte',
    createdAtUtc: '2026-01-01T12:00:00Z', dueAtUtc: '2026-01-02T12:00:00Z', slaWarningAtUtc: '2026-01-02T06:00:00Z',
    resolvedAtUtc: null, slaStatus: TicketSlaStatus.OnTime
  };

  let store: InstanceType<typeof TicketDetailStore>;
  let dataService: jasmine.SpyObj<TicketDataService>;

  beforeEach(() => {
    dataService = jasmine.createSpyObj('TicketDataService', ['getById']);
    dataService.getById.and.returnValue(of(ticket));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TicketDetailStore,
        { provide: TicketDataService, useValue: dataService }
      ]
    });
    store = TestBed.inject(TicketDetailStore);
  });

  it('não chama a API antes de um ticket ser definido', () => {
    expect(dataService.getById).not.toHaveBeenCalled();
  });

  it('carrega o detalhe do ticket informado', async () => {
    store.loadTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getById).toHaveBeenCalledWith('t1');
    expect(store.ticket()).toEqual(ticket);
  });

  it('expõe mensagem própria quando o ticket não existe (404)', async () => {
    dataService.getById.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

    store.loadTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.state().error).toBe('Não encontramos esse ticket — ele pode ter sido removido.');
  });

  it('expõe mensagem própria quando o usuário não tem acesso (403)', async () => {
    dataService.getById.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    store.loadTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.state().error).toBe('Você não tem acesso a este ticket.');
  });
});
