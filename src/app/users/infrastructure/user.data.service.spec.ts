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

  it('fetches the totals by status at GET /users/stats/status', () => {
    const counts = { totalCount: 5, activeCount: 3, pendingActivationCount: 1, inactiveCount: 1 };
    let received: unknown;

    service.getStatusCounts().subscribe(value => received = value);
    const request = http.expectOne(`${environment.apiUrl}/users/stats/status`);
    request.flush(counts);

    expect(request.request.method).toBe('GET');
    expect(received).toEqual(counts);
  });

  it('lets the failure reach the consumer, without swallowing the error', () => {
    let failed = false;

    service.getStatusCounts().subscribe({ error: () => failed = true });
    http.expectOne(`${environment.apiUrl}/users/stats/status`).flush(null, { status: 403, statusText: 'Forbidden' });

    expect(failed).toBeTrue();
  });

  describe('reads', () => {
    it('getById reads the profile from GET /users/{userId}', () => {
      const profile = { id: 'u1', email: 'ana@empresa.com', firstName: 'Ana', lastName: 'Souza' };
      let received: unknown;

      service.getById('u1').subscribe(value => received = value);

      http.expectOne({ method: 'GET', url: `${environment.apiUrl}/users/u1` }).flush(profile);
      expect(received).toEqual(profile);
    });

    it('getAll sends the page, the status, the search and the creation period to GET /users; with "All", without the status', () => {
      const page = { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false };
      const received: unknown[] = [];

      service.getAll({ status: 'Active', search: 'ana', createdFrom: '2026-10-01', createdTo: '2026-10-28', page: 2, pageSize: 20 })
        .subscribe(value => received.push(value));
      service.getAll({ status: 'All', page: 1, pageSize: 20 }).subscribe(value => received.push(value));

      http.expectOne({ method: 'GET', url: `${environment.apiUrl}/users?page=2&pageSize=20&status=Active&search=ana&createdFrom=2026-10-01&createdTo=2026-10-28` }).flush(page);
      http.expectOne({ method: 'GET', url: `${environment.apiUrl}/users?page=1&pageSize=20` }).flush(page);
      expect(received).toEqual([page, page]);
    });

    it('countOpenAssignedTickets reads only the totalCount of GET /tickets with the assignee, the two active statuses and pageSize=1', () => {
      let received: number | undefined;

      service.countOpenAssignedTickets('u1').subscribe(value => received = value);

      http.expectOne({ method: 'GET', url: `${environment.apiUrl}/tickets?assignedToUserId=u1&status=1&status=2&page=1&pageSize=1` })
        .flush({ items: [{}], page: 1, pageSize: 1, totalCount: 7, totalPages: 7, hasNextPage: true, hasPreviousPage: false });
      expect(received).toBe(7);
    });
  });

  describe('writes', () => {
    it('updateProfile puts the first name and the last name to /users/{userId}/profile', () => {
      service.updateProfile('u1', { firstName: 'Ana', lastName: 'Souza' }).subscribe();

      const request = http.expectOne({ method: 'PUT', url: `${environment.apiUrl}/users/u1/profile` });
      expect(request.request.body).toEqual({ firstName: 'Ana', lastName: 'Souza' });
      request.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('changePassword puts the current and the new password to /users/me/password', () => {
      service.changePassword({ currentPassword: 'Atual@123', newPassword: 'Nova@1234' }).subscribe();

      const request = http.expectOne({ method: 'PUT', url: `${environment.apiUrl}/users/me/password` });
      expect(request.request.body).toEqual({ currentPassword: 'Atual@123', newPassword: 'Nova@1234' });
      request.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('assignRoles puts the role names to /users/{userId}/roles', () => {
      service.assignRoles('u1', ['Atendente', 'Colaborador']).subscribe();

      const request = http.expectOne({ method: 'PUT', url: `${environment.apiUrl}/users/u1/roles` });
      expect(request.request.body).toEqual({ roleNames: ['Atendente', 'Colaborador'] });
      request.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('deactivate puts to /users/{userId}/deactivate with an empty body', () => {
      service.deactivate('u1').subscribe();

      const request = http.expectOne({ method: 'PUT', url: `${environment.apiUrl}/users/u1/deactivate` });
      expect(request.request.body).toEqual({});
      request.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('activate puts to /users/{userId}/activate with an empty body', () => {
      service.activate('u1').subscribe();

      const request = http.expectOne({ method: 'PUT', url: `${environment.apiUrl}/users/u1/activate` });
      expect(request.request.body).toEqual({});
      request.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('resendInvitation posts to /users/{userId}/invitation with an empty body', () => {
      service.resendInvitation('u1').subscribe();

      const request = http.expectOne({ method: 'POST', url: `${environment.apiUrl}/users/u1/invitation` });
      expect(request.request.body).toEqual({});
      request.flush(null, { status: 204, statusText: 'No Content' });
    });
  });
});
