import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { TicketAssigneesStore } from './ticket-assignees.store';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { SessionService } from '../../shared';

describe('TicketAssigneesStore', () => {
  let dataService: jasmine.SpyObj<TicketDataService>;
  let permissions: Set<string>;

  /** Cria o Store com o Data Service falso e as permissões do teste. */
  function createStore() {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: TicketDataService, useValue: dataService },
        { provide: SessionService, useValue: { hasPermission: (code: string) => permissions.has(code) } }
      ]
    });
    return TestBed.inject(TicketAssigneesStore);
  }

  beforeEach(() => {
    dataService = jasmine.createSpyObj('TicketDataService', ['getAssignees']);
    dataService.getAssignees.and.returnValue(of({
      items: [{ id: 'u1', fullName: 'Ana Souza', sectorId: 's1', sectorName: 'Helpdesk' }],
      page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false
    }));
    permissions = new Set(['tickets:manage']);
  });

  it('expõe os responsáveis elegíveis devolvidos pela API', async () => {
    const store = createStore();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.assignees()).toEqual([{ id: 'u1', fullName: 'Ana Souza', sectorId: 's1', sectorName: 'Helpdesk' }]);
    expect(store.error()).toBeNull();
  });

  it('sem tickets:manage não pergunta à API', async () => {
    permissions = new Set();
    const store = createStore();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAssignees).not.toHaveBeenCalled();
    expect(store.assignees()).toEqual([]);
  });

  it('mostra o erro e recupera no "Tentar novamente"', async () => {
    dataService.getAssignees.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const store = createStore();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.error()).toBeTruthy();
    expect(store.assignees()).toEqual([]);

    dataService.getAssignees.and.returnValue(of({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false }));
    store.reload();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.error()).toBeNull();
  });
});
