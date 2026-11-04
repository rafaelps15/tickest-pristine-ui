import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { RoleDataService } from './role.data.service';
import { environment } from '../../../environments/environment';

describe('RoleDataService', () => {
  let service: RoleDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), RoleDataService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(RoleDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('encodes the role name in the URL when assigning permissions, preventing special characters from breaking the route', () => {
    service.assignPermissions('TI/Suporte', ['tickets:manage']).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/roles/TI%2FSuporte/permissions`);
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });
});
