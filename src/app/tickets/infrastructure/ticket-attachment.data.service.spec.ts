import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TicketAttachmentDataService } from './ticket-attachment.data.service';
import { TicketAttachmentPolicy } from '../entities/ticket-attachment';

describe('TicketAttachmentDataService', () => {
  let service: TicketAttachmentDataService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TicketAttachmentDataService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getPolicy lê a política de anexos do back-end', () => {
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
});
