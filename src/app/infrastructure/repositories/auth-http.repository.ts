import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthRepository } from '../../domain/interfaces/auth.repository';
import { LoginCredentials } from '../../domain/models/login-credentials.model';
import { CreateUserData } from '../../domain/models/create-user-data.model';
import { AccessTokens } from '../../domain/models/access-tokens.model';
import { Result } from '../../domain/models/result.model';
import { LoginRequestDto } from '../dtos/login-request.dto';
import { CreateUserRequestDto } from '../dtos/create-user-request.dto';
import { AccessTokensResponseDto } from '../dtos/access-tokens-response.dto';
import { toResult } from '../mappers/api-result.mapper';
import { environment } from '../../../environments/environment';

/** Implementação HTTP do repositório de autenticação. */
@Injectable({ providedIn: 'root' })
export class AuthHttpRepository extends AuthRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  login(request: LoginCredentials): Observable<Result<AccessTokens>> {
    const dto: LoginRequestDto = request;
    return this.http
      .post<AccessTokensResponseDto>(`${this.apiUrl}/login`, dto)
      .pipe(toResult());
  }

  register(request: CreateUserData): Observable<Result<string>> {
    const dto: CreateUserRequestDto = request;
    return this.http
      .post<string>(`${this.apiUrl}/register`, dto)
      .pipe(toResult());
  }
}
