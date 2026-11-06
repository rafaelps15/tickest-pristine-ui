import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { TicketMessagesStore } from './ticket-messages.store';
import { TicketMessageDataService } from '../infrastructure/ticket-message.data.service';
import { TicketMessage } from '../entities/ticket-message';
import { CursorPage } from '../../shared';

describe('TicketMessagesStore', () => {
  const message: TicketMessage = {
    id: 'm1', ticketId: 't1', authorUserId: 'u1', content: 'Já verifiquei, aguardando peça.',
    createdAtUtc: '2026-01-01T12:00:00Z', editedAtUtc: null
  };

  /** Monta uma página por cursor com as mensagens informadas; o cursor aponta para a última. */
  function pageOf(items: TicketMessage[], hasNextPage = false): CursorPage<TicketMessage> {
    const last = items[items.length - 1];
    return { items, nextCursorDate: last?.createdAtUtc ?? null, nextCursorId: last?.id ?? null, hasNextPage };
  }

  let store: InstanceType<typeof TicketMessagesStore>;
  let dataService: jasmine.SpyObj<TicketMessageDataService>;

  beforeEach(() => {
    dataService = jasmine.createSpyObj('TicketMessageDataService', ['getAll', 'post', 'edit', 'delete']);
    dataService.getAll.and.returnValue(of(pageOf([message])));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TicketMessagesStore,
        { provide: TicketMessageDataService, useValue: dataService }
      ]
    });
    store = TestBed.inject(TicketMessagesStore);
  });

  it('does not call the API before a ticket is set', () => {
    expect(dataService.getAll).not.toHaveBeenCalled();
  });

  it('loads the messages of the given ticket', async () => {
    store.loadForTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith('t1');
    expect(store.messages()).toEqual([message]);
  });

  it('loads the next page by cursor and appends to the messages already shown', async () => {
    const older: TicketMessage = { ...message, id: 'm0', content: 'Mensagem antiga.', createdAtUtc: '2025-12-01T12:00:00Z' };
    dataService.getAll.and.returnValues(of(pageOf([message], true)), of(pageOf([older])));

    store.loadForTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.hasMore()).toBeTrue();

    store.loadMore();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith('t1', { cursorDate: message.createdAtUtc, cursorId: 'm1' });
    expect(store.messages()).toEqual([message, older]);
    expect(store.hasMore()).toBeFalse();
  });

  it('does not call the API when loading more if there is no next page', async () => {
    store.loadForTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    store.loadMore();

    expect(dataService.getAll).toHaveBeenCalledTimes(1);
  });

  describe('post', () => {
    beforeEach(async () => {
      store.loadForTicket('t1');
      await TestBed.inject(ApplicationRef).whenStable();
    });

    it('posts the message, reloads the listing and calls onSuccess', async () => {
      dataService.post.and.returnValue(of('m2'));
      const onSuccess = jasmine.createSpy('onSuccess');

      store.post('t1', 'Resolvido, pode confirmar.', onSuccess);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(dataService.post).toHaveBeenCalledWith('t1', 'Resolvido, pode confirmar.');
      expect(dataService.getAll).toHaveBeenCalledTimes(2);
      expect(onSuccess).toHaveBeenCalled();
      expect(store.posting()).toBeFalse();
      expect(store.postError()).toBeNull();
    });

    it('exposes an error message when posting fails with 403', async () => {
      dataService.post.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

      store.post('t1', 'Resolvido, pode confirmar.');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.postError()).toBe('Você não tem permissão para enviar mensagens neste chamado.');
      expect(store.posting()).toBeFalse();
    });
  });

  describe('editMessage', () => {
    beforeEach(async () => {
      store.loadForTicket('t1');
      await TestBed.inject(ApplicationRef).whenStable();
    });

    it('edits the message, reloads the listing and calls onSuccess', async () => {
      dataService.edit.and.returnValue(of(undefined));
      const onSuccess = jasmine.createSpy('onSuccess');

      store.editMessage('m1', 'Texto corrigido.', onSuccess);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(dataService.edit).toHaveBeenCalledWith('m1', 'Texto corrigido.');
      expect(dataService.getAll).toHaveBeenCalledTimes(2);
      expect(onSuccess).toHaveBeenCalled();
      expect(store.savingEdit()).toBeFalse();
    });

    it('exposes a specific message when permission is missing (403, not the author)', async () => {
      dataService.edit.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

      store.editMessage('m1', 'Texto corrigido.');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.mutationError()).toBe('Você só pode editar as suas próprias mensagens.');
    });
  });

  describe('deleteMessage', () => {
    beforeEach(async () => {
      store.loadForTicket('t1');
      await TestBed.inject(ApplicationRef).whenStable();
    });

    it('marks the message as pending during deletion, and releases it when done', async () => {
      const subject = new Subject<void>();
      dataService.delete.and.returnValue(subject);

      store.deleteMessage('m1');
      expect(store.deletingMessageId()).toBe('m1');

      subject.next();
      subject.complete();
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.deletingMessageId()).toBeNull();
    });

    it('deletes the message, reloads the listing and calls onSuccess', async () => {
      dataService.delete.and.returnValue(of(undefined));
      const onSuccess = jasmine.createSpy('onSuccess');

      store.deleteMessage('m1', onSuccess);
      await TestBed.inject(ApplicationRef).whenStable();

      expect(dataService.delete).toHaveBeenCalledWith('m1');
      expect(dataService.getAll).toHaveBeenCalledTimes(2);
      expect(onSuccess).toHaveBeenCalled();
    });

    it('exposes a specific message when permission is missing (403)', async () => {
      dataService.delete.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

      store.deleteMessage('m1');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.mutationError()).toBe('Você não tem permissão para excluir esta mensagem.');
    });

    it('clearMutationError() clears the error from a previous attempt', async () => {
      dataService.delete.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
      store.deleteMessage('m1');
      await TestBed.inject(ApplicationRef).whenStable();

      store.clearMutationError();

      expect(store.mutationError()).toBeNull();
    });
  });
});
