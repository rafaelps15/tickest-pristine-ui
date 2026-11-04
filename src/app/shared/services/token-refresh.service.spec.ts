import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { TokenRefreshService } from './token-refresh.service';
import { AuthDataService } from '../infrastructure/auth.data.service';
import { SessionService } from './session.service';
import { CurrentUserService } from './current-user.service';

describe('TokenRefreshService', () => {
  let service: TokenRefreshService;
  let authDataService: jasmine.SpyObj<AuthDataService>;
  let session: { refreshToken: () => string | null; saveSession: jasmine.Spy };
  let currentUserService: jasmine.SpyObj<CurrentUserService>;

  beforeEach(() => {
    authDataService = jasmine.createSpyObj('AuthDataService', ['refresh']);
    session = { refreshToken: () => 'refresh-1', saveSession: jasmine.createSpy('saveSession') };
    currentUserService = jasmine.createSpyObj('CurrentUserService', ['load']);
    currentUserService.load.and.returnValue(of({ status: 'loaded' as const }));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TokenRefreshService,
        { provide: AuthDataService, useValue: authDataService },
        { provide: SessionService, useValue: session },
        { provide: CurrentUserService, useValue: currentUserService }
      ]
    });
    service = TestBed.inject(TokenRefreshService);
  });

  it('should store the new tokens and return the renewed access token', () => {
    authDataService.refresh.and.returnValue(of({ accessToken: 'a2', refreshToken: 'r2' }));
    let result: string | null | undefined;

    service.refresh().subscribe(token => result = token);

    expect(authDataService.refresh).toHaveBeenCalledWith('refresh-1');
    expect(session.saveSession).toHaveBeenCalledWith({ accessToken: 'a2', refreshToken: 'r2' });
    expect(result).toBe('a2');
  });

  it('should return null when the back end rejects the refresh token', () => {
    authDataService.refresh.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    let result: string | null | undefined;

    service.refresh().subscribe(token => result = token);

    expect(result).toBeNull();
  });

  it('should rethrow the error when the renewal fails with no server response', () => {
    authDataService.refresh.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    let status: number | undefined;

    service.refresh().subscribe({ error: (error: HttpErrorResponse) => status = error.status });

    expect(status).toBe(0);
    expect(session.saveSession).not.toHaveBeenCalled();
  });

  it('should rethrow the error when the server rate limits the requests (429), without ending the session', () => {
    authDataService.refresh.and.returnValue(throwError(() => new HttpErrorResponse({ status: 429 })));
    let status: number | undefined;

    service.refresh().subscribe({ error: (error: HttpErrorResponse) => status = error.status });

    expect(status).toBe(429);
    expect(session.saveSession).not.toHaveBeenCalled();
  });

  it('should rethrow the error when the server responds 5xx', () => {
    authDataService.refresh.and.returnValue(throwError(() => new HttpErrorResponse({ status: 503 })));
    let status: number | undefined;

    service.refresh().subscribe({ error: (error: HttpErrorResponse) => status = error.status });

    expect(status).toBe(503);
  });

  it('should share the same renewal across simultaneous calls', () => {
    const response = new Subject<{ accessToken: string; refreshToken: string }>();
    authDataService.refresh.and.returnValue(response);
    const results: (string | null)[] = [];

    service.refresh().subscribe(token => results.push(token));
    service.refresh().subscribe(token => results.push(token));
    response.next({ accessToken: 'a2', refreshToken: 'r2' });
    response.complete();

    expect(authDataService.refresh).toHaveBeenCalledTimes(1);
    expect(results).toEqual(['a2', 'a2']);
  });
});
