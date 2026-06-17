import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthRepository } from '../../domain/interfaces/auth.repository';
import { LoginRequestDto } from '../dtos/login-request.dto';
import { CreateUserRequestDto } from '../dtos/create-user-request.dto';
import { ApiResultDto } from '../dtos/api-result.dto';

/** Implementação HTTP do repositório de autenticação. */
@Injectable({ providedIn: 'root' })
export class AuthHttpRepository extends AuthRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5195/api/auth';

  login(request: LoginRequestDto): Observable<ApiResultDto<string>> {
    return this.http.post<ApiResultDto<string>>(`${this.apiUrl}/login`, request);
  }

  register(request: CreateUserRequestDto): Observable<ApiResultDto<void>> {
    return this.http.post<ApiResultDto<void>>(`${this.apiUrl}/register`, request);
  }
}
