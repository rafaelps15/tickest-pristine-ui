import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { TicketAttachmentsStore } from './ticket-attachments.store';
import { TicketAttachmentDataService } from '../infrastructure/ticket-attachment.data.service';
import { TicketAttachment, TicketAttachmentPolicy } from '../entities/ticket-attachment';
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

  const policy: TicketAttachmentPolicy = {
    maxFileSizeBytes: 10_485_760, maxAttachmentsPerTicket: 20, maxTotalBytesPerTicket: 104_857_600,
    allowedTypes: [{ contentType: 'application/pdf', extensions: ['.pdf'] }, { contentType: 'image/png', extensions: ['.png'] }]
  };

  let store: InstanceType<typeof TicketAttachmentsStore>;
  let dataService: jasmine.SpyObj<TicketAttachmentDataService>;

  beforeEach(() => {
    dataService = jasmine.createSpyObj('TicketAttachmentDataService', ['getAll', 'upload', 'download', 'delete', 'getPolicy']);
    dataService.getAll.and.returnValue(of(pageOf([attachment])));
    dataService.getPolicy.and.returnValue(of(policy));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TicketAttachmentsStore,
        { provide: TicketAttachmentDataService, useValue: dataService }
      ]
    });
    store = TestBed.inject(TicketAttachmentsStore);
  });

  it('exposes the attachment policy read from the back end', async () => {
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getPolicy).toHaveBeenCalledTimes(1);
    expect(store.policy()).toEqual(policy);
  });

  it('leaves the policy null when the read fails, without affecting the attachment list', async () => {
    dataService.getPolicy.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), TicketAttachmentsStore, { provide: TicketAttachmentDataService, useValue: dataService }]
    });
    const failing = TestBed.inject(TicketAttachmentsStore);
    failing.loadForTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(failing.policy()).toBeNull();
    expect(failing.attachments()).toEqual([attachment]);
    expect(failing.listState().error).toBeNull();
  });

  it('loads the attachments of the given ticket', async () => {
    store.loadForTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledWith('t1');
    expect(store.attachments()).toEqual([attachment]);
  });

  it('does not call the API before a ticket is set', () => {
    expect(dataService.getAll).not.toHaveBeenCalled();
  });

  it('loads the next page by cursor and appends the attachments to those already shown', async () => {
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

  it('does not call the API when loading more if there is no next page', async () => {
    store.loadForTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    store.loadMore();

    expect(dataService.getAll).toHaveBeenCalledTimes(1);
  });

  it('goes back to the first page after uploading an attachment, discarding the accumulated pages', async () => {
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

  it('uploads a new attachment and reloads the listing on success', async () => {
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

  it('exposes the error message when the upload fails with 403', async () => {
    store.loadForTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    dataService.upload.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    const file = new File(['x'], 'arquivo.pdf', { type: 'application/pdf' });

    store.upload(file);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.uploadError()).toBe('Você não tem permissão para anexar arquivos a este chamado.');
    expect(store.uploading()).toBeFalse();
  });

  it('does not send the upload without a ticket set', () => {
    const file = new File(['x'], 'arquivo.pdf', { type: 'application/pdf' });
    store.upload(file);

    expect(dataService.upload).not.toHaveBeenCalled();
  });

  describe('uploadIfValid (back end policy)', () => {
    /** Arquivo com o tamanho e o tipo pedidos (o conteúdo não importa). */
    function fileOf(sizeBytes: number, type = 'application/pdf', name = 'arquivo.pdf'): File {
      return new File([new Uint8Array(sizeBytes)], name, { type });
    }

    beforeEach(async () => {
      dataService.upload.and.returnValue(of('new-attachment-id'));
      store.loadForTicket('t1');
      await TestBed.inject(ApplicationRef).whenStable();
    });

    it('uploads the file that passes the policy', () => {
      const file = fileOf(1024);
      store.uploadIfValid(file);

      expect(dataService.upload).toHaveBeenCalledOnceWith('t1', file);
      expect(store.validationError()).toBeNull();
    });

    it('refuses a file larger than the limit, without uploading, with the limit in the message', () => {
      store.uploadIfValid(fileOf(policy.maxFileSizeBytes + 1));

      expect(dataService.upload).not.toHaveBeenCalled();
      expect(store.validationError()).toBe('O arquivo excede o tamanho máximo permitido de 10.0 MB.');
    });

    it('refuses a file type that the policy does not accept', () => {
      store.uploadIfValid(fileOf(10, 'application/x-msdownload', 'script.exe'));

      expect(dataService.upload).not.toHaveBeenCalled();
      expect(store.validationError()).toBe('O tipo de arquivo "application/x-msdownload" não é suportado.');
    });

    it('refuses a file of an accepted type whose name lacks one of the extensions of that type in the policy, like the back end', () => {
      store.uploadIfValid(fileOf(10, 'application/pdf', 'nota.pdf.exe'));
      store.uploadIfValid(fileOf(10, 'application/pdf', 'nota'));

      expect(dataService.upload).not.toHaveBeenCalled();
      expect(store.validationError()).toBe('A extensão do arquivo não corresponde ao tipo "application/pdf". Para esse tipo, use .pdf.');
    });

    it('compares the type without its parameters and the extension without case, as the back end normalizes them', () => {
      const withParameters = fileOf(10, 'Application/PDF; charset=binary', 'nota.pdf');
      const upperCaseExtension = fileOf(10, 'image/png', 'FOTO.PNG');
      store.uploadIfValid(withParameters);
      store.uploadIfValid(upperCaseExtension);

      expect(dataService.upload.calls.allArgs()).toEqual([['t1', withParameters], ['t1', upperCaseExtension]]);
      expect(store.validationError()).toBeNull();
    });

    it('checks the type and the extension before the size, in the order of the back end', () => {
      store.uploadIfValid(fileOf(policy.maxFileSizeBytes + 1, 'image/png', 'foto.pdf'));

      expect(dataService.upload).not.toHaveBeenCalled();
      expect(store.validationError()).toBe('A extensão do arquivo não corresponde ao tipo "image/png". Para esse tipo, use .png.');
    });

    it('refuses when the ticket already has the maximum number of attachments', async () => {
      const full = Array.from({ length: policy.maxAttachmentsPerTicket }, (_, index) => ({ ...attachment, id: `a${index}` }));
      dataService.getAll.and.returnValue(of(pageOf(full)));
      store.loadForTicket('t2');
      await TestBed.inject(ApplicationRef).whenStable();

      store.uploadIfValid(fileOf(10));

      expect(dataService.upload).not.toHaveBeenCalled();
      expect(store.validationError()).toContain('máximo de 20 anexos');
    });

    it('refuses when the sum of the attachments would exceed the ticket limit', async () => {
      dataService.getAll.and.returnValue(of(pageOf([{ ...attachment, fileSizeBytes: policy.maxTotalBytesPerTicket - 100 }])));
      store.loadForTicket('t2');
      await TestBed.inject(ApplicationRef).whenStable();

      store.uploadIfValid(fileOf(200));

      expect(dataService.upload).not.toHaveBeenCalled();
      expect(store.validationError()).toBe('Com este arquivo, os anexos do chamado passariam do limite de 100.0 MB.');
    });

    it('with pages still to load, checks neither count nor sum and leaves it to the back end', async () => {
      const full = Array.from({ length: policy.maxAttachmentsPerTicket }, (_, index) => ({ ...attachment, id: `a${index}` }));
      dataService.getAll.and.returnValue(of(pageOf(full, true)));
      store.loadForTicket('t2');
      await TestBed.inject(ApplicationRef).whenStable();

      store.uploadIfValid(fileOf(10));

      expect(dataService.upload).toHaveBeenCalledTimes(1);
      expect(store.validationError()).toBeNull();
    });

    it('clears the previous refusal when the next file passes', () => {
      store.uploadIfValid(fileOf(policy.maxFileSizeBytes + 1));
      store.uploadIfValid(fileOf(10));

      expect(store.validationError()).toBeNull();
      expect(dataService.upload).toHaveBeenCalledTimes(1);
    });
  });

  it('without the policy (read failed), uploads directly and leaves the validation to the back end', async () => {
    dataService.getPolicy.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    dataService.upload.and.returnValue(of('new-attachment-id'));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), TicketAttachmentsStore, { provide: TicketAttachmentDataService, useValue: dataService }]
    });
    const withoutPolicy = TestBed.inject(TicketAttachmentsStore);
    withoutPolicy.loadForTicket('t1');
    await TestBed.inject(ApplicationRef).whenStable();

    const file = new File(['x'], 'script.exe', { type: 'application/x-msdownload' });
    withoutPolicy.uploadIfValid(file);

    expect(dataService.upload).toHaveBeenCalledOnceWith('t1', file);
    expect(withoutPolicy.validationError()).toBeNull();
  });

  it('downloads the attachment and hands the file to the caller, without touching the DOM', async () => {
    const blob = new Blob(['conteúdo'], { type: 'application/pdf' });
    dataService.download.and.returnValue(of(blob));
    spyOn(URL, 'createObjectURL');
    spyOn(document, 'createElement').and.callThrough();
    const onDownloaded = jasmine.createSpy('onDownloaded');

    store.download('a1', onDownloaded);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.download).toHaveBeenCalledWith('a1');
    expect(onDownloaded).toHaveBeenCalledOnceWith(blob);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(document.createElement).not.toHaveBeenCalledWith('a');
    expect(store.downloading()).toBeFalse();
  });

  it('exposes a "não encontrado ou sem acesso" message when the download fails with 404, without handing a file', async () => {
    dataService.download.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    const onDownloaded = jasmine.createSpy('onDownloaded');

    store.download('a1', onDownloaded);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.downloadError()).toBe('Anexo não encontrado ou sem acesso.');
    expect(onDownloaded).not.toHaveBeenCalled();
  });

  it('exposes a generic message when the download fails for another reason', async () => {
    dataService.download.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.download('a1', jasmine.createSpy('onDownloaded'));
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.downloadError()).toBe('Erro ao baixar o anexo.');
  });

  it('deletes an attachment and reloads the listing on success', async () => {
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

  it('exposes the error message when the deletion fails with 403', async () => {
    dataService.delete.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    store.delete('a1');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.listState().error).toBe('Você não tem permissão para excluir este anexo.');
  });

  describe('delete after a refused upload', () => {
    /** Arquivo PDF pequeno, aceito pelo tipo e pelo tamanho. */
    const smallPdf = () => new File([new Uint8Array(10)], 'arquivo.pdf', { type: 'application/pdf' });

    beforeEach(async () => {
      const full = Array.from({ length: policy.maxAttachmentsPerTicket }, (_, index) => ({ ...attachment, id: `a${index}` }));
      dataService.getAll.and.returnValue(of(pageOf(full)));
      store.loadForTicket('t1');
      await TestBed.inject(ApplicationRef).whenStable();
    });

    it('clears the refusal of the chosen file after a successful deletion, which may undo its reason', async () => {
      store.uploadIfValid(smallPdf());
      expect(store.validationError()).toContain('máximo de 20 anexos');

      dataService.delete.and.returnValue(of(undefined));
      store.delete('a0');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.validationError()).toBeNull();
    });

    it('clears the error of the last upload refused by the back end after a successful deletion', async () => {
      dataService.upload.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400 })));
      store.upload(smallPdf());
      expect(store.uploadError()).toBeTruthy();

      dataService.delete.and.returnValue(of(undefined));
      store.delete('a0');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.uploadError()).toBeNull();
    });

    it('keeps the refusal of the chosen file when the deletion fails', async () => {
      store.uploadIfValid(smallPdf());
      dataService.delete.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

      store.delete('a0');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(store.validationError()).toContain('máximo de 20 anexos');
      expect(store.listState().error).toBe('Você não tem permissão para excluir este anexo.');
    });
  });
});
