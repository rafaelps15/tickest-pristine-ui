import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationRef, provideZonelessChangeDetection, signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { TicketPersonalSummaryStore } from './ticket-personal-summary.store';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { TicketCount } from '../entities/ticket';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { SessionService } from '../../shared';

describe('TicketPersonalSummaryStore', () => {
  const counts: TicketCount[] = [
    { priority: TicketPriority.High, status: TicketStatus.Open, count: 2 },
    { priority: TicketPriority.Low, status: TicketStatus.Resolved, count: 3 }
  ];

  let store: InstanceType<typeof TicketPersonalSummaryStore>;
  let dataService: jasmine.SpyObj<TicketDataService>;
  let userId: ReturnType<typeof signal<string | null>>;

  beforeEach(() => {
    dataService = jasmine.createSpyObj('TicketDataService', ['getMySummary']);
    dataService.getMySummary.and.returnValue(of(counts));
    userId = signal<string | null>(null);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TicketPersonalSummaryStore,
        { provide: TicketDataService, useValue: dataService },
        { provide: SessionService, useValue: { userId } }
      ]
    });
    store = TestBed.inject(TicketPersonalSummaryStore);
  });

  it('não busca o resumo antes de haver um usuário logado', () => {
    expect(dataService.getMySummary).not.toHaveBeenCalled();
    expect(store.counts()).toEqual([]);
  });

  it('busca o resumo do usuário logado', async () => {
    userId.set('u1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getMySummary).toHaveBeenCalled();
    expect(store.counts()).toEqual(counts);
  });

  it('expõe mensagem de erro quando a busca falhar', async () => {
    dataService.getMySummary.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    userId.set('u2');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.state().error).toBe('Erro ao carregar seu resumo de tickets');
    expect(store.state().loading).toBeFalse();
  });
});
