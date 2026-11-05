import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TicketMessageDataService } from './ticket-message.data.service';
import { environment } from '../../../environments/environment';

describe('TicketMessageDataService', () => {
  let service: TicketMessageDataService;
  let http: HttpTestingController;
  /** Base da API, como o Data Service monta as URLs. */
  const api = environment.apiUrl;
  /** Página de cursor vazia, como o back-end responde. */
  const emptyPage = { items: [], nextCursorDate: null, nextCursorId: null, hasNextPage: false };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TicketMessageDataService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getAll reads the first page from GET /tickets/{ticketId}/messages without a cursor, and the next one with the cursor and the page size', () => {
    service.getAll('t1').subscribe();
    service.getAll('t1', { cursorDate: '2026-10-28T12:00:00Z', cursorId: 'm9' }, 20).subscribe();

    http.expectOne({ method: 'GET', url: `${api}/tickets/t1/messages` }).flush(emptyPage);
    const next = http.expectOne({ method: 'GET', url: `${api}/tickets/t1/messages?cursorDate=2026-10-28T12:00:00Z&cursorId=m9&pageSize=20` });
    expect(next.request.body).toBeNull();
    next.flush(emptyPage);
  });

  it('post posts the content to /tickets/{ticketId}/messages and returns the new id', () => {
    let received: string | undefined;

    service.post('t1', 'Reiniciei o roteador.').subscribe(value => received = value);

    const request = http.expectOne({ method: 'POST', url: `${api}/tickets/t1/messages` });
    expect(request.request.body).toEqual({ content: 'Reiniciei o roteador.' });
    request.flush('m1');
    expect(received).toBe('m1');
  });

  it('edit puts the new content to /ticket-messages/{messageId}', () => {
    service.edit('m1', 'Reiniciei o roteador e o modem.').subscribe();

    const request = http.expectOne({ method: 'PUT', url: `${api}/ticket-messages/m1` });
    expect(request.request.body).toEqual({ content: 'Reiniciei o roteador e o modem.' });
    request.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('delete sends DELETE /ticket-messages/{messageId}, without a body', () => {
    service.delete('m1').subscribe();

    const request = http.expectOne({ method: 'DELETE', url: `${api}/ticket-messages/m1` });
    expect(request.request.body).toBeNull();
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
});
