import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError, Subject } from 'rxjs';
import { TicketCreateStore } from './ticket-create.store';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { CreateTicketData } from '../entities/ticket';
import { TicketPriority } from '../entities/ticket-priority';
import { SessionService } from '../../shared';

describe('TicketCreateStore', () => {
  const data: CreateTicketData = { title: 'Impressora', description: 'Não liga de jeito nenhum.', priority: TicketPriority.High, sectorId: 's1' };

  let store: InstanceType<typeof TicketCreateStore>;
  let dataService: jasmine.SpyObj<TicketDataService>;

  beforeEach(() => {
    dataService = jasmine.createSpyObj('TicketDataService', ['create', 'getMine']);
    dataService.create.and.returnValue(of('t2'));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TicketCreateStore,
        { provide: TicketDataService, useValue: dataService },
        // Usuário logado: a lista de chamados dele não é lida por esta Store.
        { provide: SessionService, useValue: { userId: signal('u1') } }
      ]
    });
    store = TestBed.inject(TicketCreateStore);
  });

  it('does not read the list of tickets of the logged-in user (GET /tickets/mine) when created', async () => {
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getMine).not.toHaveBeenCalled();
    expect(store.mutationError()).toBeNull();
    expect(store.creating()).toBeFalse();
  });

  it('opens the ticket and calls onSuccess, without reading the list', async () => {
    const onSuccess = jasmine.createSpy('onSuccess');

    store.create(data, onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.create).toHaveBeenCalledOnceWith(data);
    expect(onSuccess).toHaveBeenCalled();
    expect(store.mutationError()).toBeNull();
    expect(dataService.getMine).not.toHaveBeenCalled();
  });

  it('sets creating during the creation, and releases it when done', async () => {
    const subject = new Subject<string>();
    dataService.create.and.returnValue(subject);

    store.create(data);
    expect(store.creating()).toBeTrue();

    subject.next('t2');
    subject.complete();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.creating()).toBeFalse();
  });

  it('releases creating and exposes the error message when the creation fails, without calling onSuccess', async () => {
    dataService.create.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const onSuccess = jasmine.createSpy('onSuccess');

    store.create(data, onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.mutationError()).toBe('Erro ao abrir o chamado');
    expect(store.creating()).toBeFalse();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('shows the back-end reason when the creation is refused', async () => {
    dataService.create.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 400, error: { detail: 'O setor escolhido não atende mais chamados.' }
    })));

    store.create(data);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.mutationError()).toBe('O setor escolhido não atende mais chamados.');
  });

  it('discards the error of a previous attempt on clearMutationError() and when sending again', async () => {
    dataService.create.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    store.create(data);
    await TestBed.inject(ApplicationRef).whenStable();

    store.clearMutationError();
    expect(store.mutationError()).toBeNull();

    store.create(data);
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.mutationError()).toBe('Erro ao abrir o chamado');

    dataService.create.and.returnValue(new Subject<string>());
    store.create(data);
    expect(store.mutationError()).toBeNull();
  });
});
