import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TicketAttachmentDataService } from './ticket-attachment.data.service';
import { TicketAttachmentPolicy } from '../entities/ticket-attachment';
import { environment } from '../../../environments/environment';

describe('TicketAttachmentDataService', () => {
  let service: TicketAttachmentDataService;
  let http: HttpTestingController;
  /** Base da API, como o Data Service monta as URLs. */
  const api = environment.apiUrl;
  /** Página de cursor vazia, como o back-end responde. */
  const emptyPage = { items: [], nextCursorDate: null, nextCursorId: null, hasNextPage: false };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TicketAttachmentDataService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getPolicy reads the attachment policy from the back end', () => {
    const policy: TicketAttachmentPolicy = {
      maxFileSizeBytes: 10_485_760, maxAttachmentsPerTicket: 20, maxTotalBytesPerTicket: 104_857_600,
      allowedTypes: [{ contentType: 'application/pdf', extensions: ['.pdf'] }]
    };
    let result: TicketAttachmentPolicy | undefined;

    service.getPolicy().subscribe(value => result = value);

    const request = http.expectOne(req => req.url.endsWith('/ticket-attachments/policy'));
    expect(request.request.method).toBe('GET');
    request.flush(policy);
    expect(result).toEqual(policy);
  });

  it('getAll reads the first page from GET /tickets/{ticketId}/attachments without a cursor, and the next one with the cursor and the page size', () => {
    service.getAll('t1').subscribe();
    service.getAll('t1', { cursorDate: '2026-10-28T12:00:00Z', cursorId: 'a9' }, 10).subscribe();

    http.expectOne({ method: 'GET', url: `${api}/tickets/t1/attachments` }).flush(emptyPage);
    const next = http.expectOne({ method: 'GET', url: `${api}/tickets/t1/attachments?cursorDate=2026-10-28T12:00:00Z&cursorId=a9&pageSize=10` });
    expect(next.request.body).toBeNull();
    next.flush(emptyPage);
  });

  it('upload posts the file as multipart/form-data, in the "file" field, to /tickets/{ticketId}/attachments and returns the new id', () => {
    const file = new File(['conteúdo'], 'log.txt', { type: 'text/plain' });
    let received: string | undefined;

    service.upload('t1', file).subscribe(value => received = value);

    const request = http.expectOne({ method: 'POST', url: `${api}/tickets/t1/attachments` });
    const body = request.request.body as FormData;
    expect(body instanceof FormData).toBeTrue();
    expect(Array.from(body.keys())).toEqual(['file']);
    expect((body.get('file') as File).name).toBe('log.txt');
    request.flush('a1');
    expect(received).toBe('a1');
  });

  it('download reads the content as a blob from GET /ticket-attachments/{attachmentId}/download', () => {
    const content = new Blob(['conteúdo'], { type: 'text/plain' });
    let received: Blob | undefined;

    service.download('a1').subscribe(value => received = value);

    const request = http.expectOne({ method: 'GET', url: `${api}/ticket-attachments/a1/download` });
    expect(request.request.responseType).toBe('blob');
    request.flush(content);
    expect(received).toEqual(content);
  });

  it('delete sends DELETE /ticket-attachments/{attachmentId}, without a body', () => {
    service.delete('a1').subscribe();

    const request = http.expectOne({ method: 'DELETE', url: `${api}/ticket-attachments/a1` });
    expect(request.request.body).toBeNull();
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
});
