import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { TicketQuickInfoStore } from './ticket-quick-info.store';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { TicketDetail } from '../entities/ticket';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { TicketSlaStatus } from '../entities/ticket-sla-status';

describe('TicketQuickInfoStore', () => {
  const ticket: TicketDetail = {
    id: 't1', title: 'Impressora não funciona', description: 'Não imprime.',
    priority: TicketPriority.Medium, status: TicketStatus.Open,
    openedByUserId: 'u1', openedByName: 'Maria Souza', assignedToUserId: null, assignedToName: null,
    sectorId: 's1', sectorName: 'Suporte',
    createdAtUtc: '2026-01-01T12:00:00Z', dueAtUtc: '2026-01-02T12:00:00Z', slaWarningAtUtc: '2026-01-02T06:00:00Z',
    resolvedAtUtc: null, slaStatus: TicketSlaStatus.OnTime
  };

  let store: InstanceType<typeof TicketQuickInfoStore>;
  let dataService: jasmine.SpyObj<TicketDataService>;

  beforeEach(() => {
    dataService = jasmine.createSpyObj('TicketDataService', ['getById']);
    dataService.getById.and.returnValue(of(ticket));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TicketQuickInfoStore,
        { provide: TicketDataService, useValue: dataService }
      ]
    });
    store = TestBed.inject(TicketQuickInfoStore);
  });

  it('não chama a API antes de um ticket ser selecionado', () => {
    expect(dataService.getById).not.toHaveBeenCalled();
  });

  it('busca o detalhe completo do ticket selecionado', async () => {
    store.select('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getById).toHaveBeenCalledWith('t1');
    expect(store.ticket()).toEqual(ticket);
  });

  it('limpa a seleção sem disparar uma nova busca', async () => {
    store.select('t1');
    await TestBed.inject(ApplicationRef).whenStable();
    dataService.getById.calls.reset();

    store.select(undefined);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getById).not.toHaveBeenCalled();
    expect(store.ticket()).toBeUndefined();
  });

  it('expõe mensagem própria quando o ticket não existe (404)', async () => {
    dataService.getById.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

    store.select('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.state().error).toBe('Não encontramos esse ticket — ele pode ter sido removido.');
  });

  it('expõe mensagem própria quando falta permissão (403)', async () => {
    dataService.getById.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    store.select('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.state().error).toBe('Você não tem acesso a este ticket.');
  });
});
