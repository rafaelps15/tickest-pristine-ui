import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthRepository } from '../../domain/interfaces/auth.repository';
import { LoginCredentials } from '../../domain/models/login-credentials.model';
import { CreateUserData } from '../../domain/models/create-user-data.model';
import { Result } from '../../domain/models/result.model';
import { LoginRequestDto } from '../dtos/login-request.dto';
import { CreateUserRequestDto } from '../dtos/create-user-request.dto';
import { ApiResultDto } from '../dtos/api-result.dto';
import { toResult } from '../mappers/api-result.mapper';
import { environment } from '../../../environments/environment';

/** Implementação HTTP do repositório de autenticação. */
@Injectable({ providedIn: 'root' })
export class AuthHttpRepository extends AuthRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  login(request: LoginCredentials): Observable<Result<string>> {
    const dto: LoginRequestDto = request;
    return this.http
    
      .post<ApiResultDto<string>>(`${this.apiUrl}/login`, dto)
      .pipe(map(toResult));
  }

  register(request: CreateUserData): Observable<Result<void>> {
    const dto: CreateUserRequestDto = request;
    return this.http
      .post<ApiResultDto<void>>(`${this.apiUrl}/register`, dto)
      .pipe(map(toResult));
  }
}
