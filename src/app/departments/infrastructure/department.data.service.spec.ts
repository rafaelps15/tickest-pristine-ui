import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DepartmentDataService } from './department.data.service';
import { Department } from '../entities/department';
import { environment } from '../../../environments/environment';

describe('DepartmentDataService', () => {
  let service: DepartmentDataService;
  let http: HttpTestingController;
  /** Base da API, como o Data Service monta as URLs. */
  const api = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(DepartmentDataService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getAll reads the departments, with their sectors, from GET /departments', () => {
    const departments: Department[] = [{
      id: 'd1', name: 'TI', description: 'Tecnologia', responsibleUserId: 'u1', responsibleUserName: 'Ana Souza', activeTicketCount: 0,
      sectors: [{ id: 's1', name: 'Helpdesk', description: null, activeTicketCount: 0 }]
    }];
    let received: Department[] | undefined;

    service.getAll().subscribe(value => received = value);

    const request = http.expectOne({ method: 'GET', url: `${api}/departments` });
    expect(request.request.body).toBeNull();
    request.flush(departments);
    expect(received).toEqual(departments);
  });

  it('create posts the name, the description and the responsible to /departments and returns the new id', () => {
    let received: string | undefined;

    service.create({ name: 'TI', description: 'Tecnologia', responsibleUserId: 'u1' }).subscribe(value => received = value);

    const request = http.expectOne({ method: 'POST', url: `${api}/departments` });
    expect(request.request.body).toEqual({ name: 'TI', description: 'Tecnologia', responsibleUserId: 'u1' });
    request.flush('d1');
    expect(received).toBe('d1');
  });

  it('update puts the name, the description and the responsible to /departments/{departmentId}', () => {
    service.update('d1', { name: 'TI', description: 'Tecnologia e suporte', responsibleUserId: 'u2' }).subscribe();

    const request = http.expectOne({ method: 'PUT', url: `${api}/departments/d1` });
    expect(request.request.body).toEqual({ name: 'TI', description: 'Tecnologia e suporte', responsibleUserId: 'u2' });
    request.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('deactivate sends DELETE /departments/{departmentId}, without a body', () => {
    service.deactivate('d1').subscribe();

    const request = http.expectOne({ method: 'DELETE', url: `${api}/departments/d1` });
    expect(request.request.body).toBeNull();
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
});
