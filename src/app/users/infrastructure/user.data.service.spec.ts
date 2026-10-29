import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserDataService } from './user.data.service';
import { environment } from '../../../environments/environment';

describe('UserDataService', () => {
  let service: UserDataService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(UserDataService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('busca os totais por situação em GET /users/stats/status', () => {
    const counts = { totalCount: 5, activeCount: 3, pendingActivationCount: 1, inactiveCount: 1 };
    let received: unknown;

    service.getStatusCounts().subscribe(value => received = value);
    const request = http.expectOne(`${environment.apiUrl}/users/stats/status`);
    request.flush(counts);

    expect(request.request.method).toBe('GET');
    expect(received).toEqual(counts);
  });

  it('deixa a falha chegar a quem consome, sem engolir o erro', () => {
    let failed = false;

    service.getStatusCounts().subscribe({ error: () => failed = true });
    http.expectOne(`${environment.apiUrl}/users/stats/status`).flush(null, { status: 403, statusText: 'Forbidden' });

    expect(failed).toBeTrue();
  });
});
