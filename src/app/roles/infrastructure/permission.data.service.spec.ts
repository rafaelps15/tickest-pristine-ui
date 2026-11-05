import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PermissionDataService } from './permission.data.service';
import { Permission } from '../entities/permission';
import { environment } from '../../../environments/environment';

describe('PermissionDataService', () => {
  let service: PermissionDataService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(PermissionDataService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getAll reads the permission catalog from GET /permissions', () => {
    const catalog: Permission[] = [{ code: 'tickets:manage', name: 'Gerenciar chamados', description: 'Atende a fila.', group: 'Chamados', isAdministrative: false }];
    let received: Permission[] | undefined;

    service.getAll().subscribe(value => received = value);

    const request = http.expectOne({ method: 'GET', url: `${environment.apiUrl}/permissions` });
    expect(request.request.body).toBeNull();
    request.flush(catalog);
    expect(received).toEqual(catalog);
  });
});
