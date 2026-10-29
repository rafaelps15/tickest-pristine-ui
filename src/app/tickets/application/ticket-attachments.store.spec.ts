import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { TicketAttachmentsStore } from './ticket-attachments.store';
import { TicketAttachmentDataService } from '../infrastructure/ticket-attachment.data.service';
import { TicketAttachment } from '../entities/ticket-attachment';
import { CursorPage } from '../../shared';

describe('TicketAttachmentsStore', () => {
  const attachment: TicketAttachment = {
    id: 'a1', ticketId: 't1', uploadedByUserId: 'u1',
    fileName: 'nota-fiscal.pdf', contentType: 'application/pdf', fileSizeBytes: 2048,
    uploadedAtUtc: '2026-01-01T12:00:00Z'
  };

  /** Monta uma página por cursor com os anexos informados; o cursor aponta para o último. */
  function pageOf(items: TicketAttachment[], hasNextPage = false): CursorPage<TicketAttachment> {
    const last = items[items.length - 1];
    return { items, nextCursorDate: last?.uploadedAtUtc ?? null, nextCursorId: last?.id ?? null, hasNextPage };
  }

  let store: InstanceType<typeof TicketAttachmentsStore>;
  let dataService: jasmine.SpyObj<TicketAttachmentDataService>;

  beforeEach(() => {
    dataService = jasmine.createSpyObj('TicketAttachmentDataService', ['getAll', 'upload', 'download', 'delete']);
    dataService.getAll.and.returnValue(of(pageOf([attachment])));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TicketAttachmentsStore,
        { provide: TicketAttachmentDataService, useValue: dataService }
      ]
    });
    store = TestBed.inject(TicketAttachmentsStore);
  });

  it('carrega os anexos do chamado informado', async () => {
    store.loadForTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith('t1');
    expect(store.attachments()).toEqual([attachment]);
  });

  it('não chama a API antes de um chamado ser definido', () => {
    expect(dataService.getAll).not.toHaveBeenCalled();
  });

  it('carrega a próxima página pelo cursor e acrescenta os anexos aos já exibidos', async () => {
    const older: TicketAttachment = { ...attachment, id: 'a0', fileName: 'antigo.pdf', uploadedAtUtc: '2025-12-01T12:00:00Z' };
    dataService.getAll.and.returnValues(of(pageOf([attachment], true)), of(pageOf([older])));

    store.loadForTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();
    expect(store.hasMore()).toBeTrue();

    store.loadMore();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith('t1', { cursorDate: attachment.uploadedAtUtc, cursorId: 'a1' });
    expect(store.attachments()).toEqual([attachment, older]);
    expect(store.hasMore()).toBeFalse();
    expect(store.loadingMore()).toBeFalse();
  });

  it('não chama a API ao carregar mais quando não há próxima página', async () => {
    store.loadForTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    store.loadMore();

    expect(dataService.getAll).toHaveBeenCalledTimes(1);
  });

  it('volta para a primeira página depois de enviar um anexo, descartando as páginas acumuladas', async () => {
    const older: TicketAttachment = { ...attachment, id: 'a0', fileName: 'antigo.pdf' };
    dataService.getAll.and.returnValues(of(pageOf([attachment], true)), of(pageOf([older])), of(pageOf([attachment], true)));
    dataService.upload.and.returnValue(of('new-attachment-id'));

    store.loadForTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();
    store.loadMore();
    await TestBed.inject(ApplicationRef).whenStable();

    store.upload(new File(['x'], 'novo.pdf', { type: 'application/pdf' }));
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.attachments()).toEqual([attachment]);
    expect(store.hasMore()).toBeTrue();
  });

  it('envia um novo anexo e recarrega a listagem em caso de sucesso', async () => {
    store.loadForTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    const file = new File(['conteúdo'], 'arquivo.pdf', { type: 'application/pdf' });
    dataService.upload.and.returnValue(of('new-attachment-id'));
    const onSuccess = jasmine.createSpy('onSuccess');

    store.upload(file, onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.upload).toHaveBeenCalledWith('t1', file);
    expect(onSuccess).toHaveBeenCalled();
    expect(store.uploading()).toBeFalse();
    expect(dataService.getAll).toHaveBeenCalledTimes(2);
  });

  it('expõe a mensagem de erro quando o upload falhar com 403', async () => {
    store.loadForTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    dataService.upload.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    const file = new File(['x'], 'arquivo.pdf', { type: 'application/pdf' });

    store.upload(file);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.uploadError()).toBe('Você não tem permissão para anexar arquivos a este chamado.');
    expect(store.uploading()).toBeFalse();
  });

  it('não envia o upload sem um chamado definido', () => {
    const file = new File(['x'], 'arquivo.pdf', { type: 'application/pdf' });
    store.upload(file);

    expect(dataService.upload).not.toHaveBeenCalled();
  });

  it('baixa o anexo e dispara o download no navegador', async () => {
    const blob = new Blob(['conteúdo'], { type: 'application/pdf' });
    dataService.download.and.returnValue(of(blob));
    spyOn(URL, 'createObjectURL').and.returnValue('blob:fake-url');
    spyOn(URL, 'revokeObjectURL');
    const link = document.createElement('a');
    spyOn(link, 'click');
    spyOn(document, 'createElement').and.returnValue(link);

    store.download(attachment);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.download).toHaveBeenCalledWith('a1');
    expect(link.download).toBe('nota-fiscal.pdf');
    expect(link.click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake-url');
    expect(store.downloading()).toBeFalse();
  });

  it('expõe mensagem de "não encontrado ou sem acesso" quando o download falhar com 404', async () => {
    dataService.download.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

    store.download(attachment);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.downloadError()).toBe('Anexo não encontrado ou sem acesso.');
  });

  it('expõe mensagem genérica quando o download falhar por outro motivo', async () => {
    dataService.download.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.download(attachment);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.downloadError()).toBe('Erro ao baixar o anexo.');
  });

  it('exclui um anexo e recarrega a listagem em caso de sucesso', async () => {
    store.loadForTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    dataService.delete.and.returnValue(of(undefined));
    const onSuccess = jasmine.createSpy('onSuccess');

    store.delete('a1', onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.delete).toHaveBeenCalledWith('a1');
    expect(onSuccess).toHaveBeenCalled();
    expect(store.deleting()).toBeFalse();
  });

  it('expõe a mensagem de erro quando a exclusão falhar com 403', async () => {
    dataService.delete.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    store.delete('a1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.listState().error).toBe('Você não tem permissão para excluir este anexo.');
  });
});
