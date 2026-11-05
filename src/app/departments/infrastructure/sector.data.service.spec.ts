import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SectorDataService } from './sector.data.service';
import { environment } from '../../../environments/environment';

describe('SectorDataService', () => {
  let service: SectorDataService;
  let http: HttpTestingController;
  /** Base da API, como o Data Service monta as URLs. */
  const api = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(SectorDataService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('create posts the name, the description and the department to /sectors and returns the new id', () => {
    let received: string | undefined;

    service.create({ name: 'Helpdesk', description: 'Primeiro atendimento', departmentId: 'd1' }).subscribe(value => received = value);

    const request = http.expectOne({ method: 'POST', url: `${api}/sectors` });
    expect(request.request.body).toEqual({ name: 'Helpdesk', description: 'Primeiro atendimento', departmentId: 'd1' });
    request.flush('s1');
    expect(received).toBe('s1');
  });

  it('update puts the name and the description to /sectors/{sectorId}, without the department', () => {
    service.update('s1', { name: 'Helpdesk', description: 'Atendimento' }).subscribe();

    const request = http.expectOne({ method: 'PUT', url: `${api}/sectors/s1` });
    expect(request.request.body).toEqual({ name: 'Helpdesk', description: 'Atendimento' });
    request.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('deactivate sends DELETE /sectors/{sectorId}, without a body', () => {
    service.deactivate('s1').subscribe();

    const request = http.expectOne({ method: 'DELETE', url: `${api}/sectors/s1` });
    expect(request.request.body).toBeNull();
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
});
