import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateTicketData, Ticket, TicketDetail, UpdateTicketData } from '../entities/ticket';
import { TicketMonitorItem } from '../entities/ticket-monitor-item';
import { TicketMonitorFilters } from '../entities/ticket-monitor-filters';
import { TicketSlaSummary } from '../entities/ticket-sla-summary';
import { TicketStatusCounts } from '../entities/ticket-status-counts';
import { TicketVolumeGrouping, TicketVolumePoint } from '../entities/ticket-volume';
import { TicketHistoryEntry } from '../entities/ticket-history';
import { CursorPage, PageCursor, PagedResponse } from '../../shared';
import { environment } from '../../../environments/environment';

/**
 * Acesso HTTP aos tickets: listagem paginada por usuário, listagem de todos os tickets do sistema
 * (para quem administra a fila), detalhe, histórico, resumos (inclusive os da empresa inteira,
 * para o dashboard), criação, atualização, reabertura, atribuição/remoção de responsável e exclusão.
 */
@Injectable({ providedIn: 'root' })
export class TicketDataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/tickets`;

  /** Cria um novo ticket (POST /tickets). */
  create(data: CreateTicketData): Observable<string> {
    return this.http.post<string>(this.apiUrl, data);
  }

  /** Atualiza descrição/status de um ticket (PUT /tickets/{id}). */
  update(ticketId: string, data: UpdateTicketData): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${ticketId}`, data);
  }

  /** Reabre um ticket inativo (POST /tickets/{id}/reopen). */
  reopen(ticketId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${ticketId}/reopen`, null);
  }

  /** Exclui (soft-delete) um ticket (DELETE /tickets/{id}). */
  delete(ticketId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${ticketId}`);
  }

  /**
   * Busca uma página dos tickets abertos pelo usuário logado, do mais novo para o mais antigo (GET /tickets/mine).
   * O back-end identifica o usuário pelo token, por isso nenhum id vai na URL.
   */
  getMine(page: number, pageSize: number): Observable<PagedResponse<Ticket>> {
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    return this.http.get<PagedResponse<Ticket>>(`${this.apiUrl}/mine`, { params });
  }

  /** Busca o detalhe de um ticket (GET /tickets/{id}). */
  getById(ticketId: string): Observable<TicketDetail> {
    return this.http.get<TicketDetail>(`${this.apiUrl}/${ticketId}`);
  }

  /**
   * Busca uma página do histórico de um ticket, do mais recente para o mais antigo
   * (GET /tickets/{ticketId}/history). Sem cursor, devolve a primeira página; com o cursor da
   * página anterior, devolve a seguinte.
   */
  getHistory(ticketId: string, cursor?: PageCursor, pageSize?: number): Observable<CursorPage<TicketHistoryEntry>> {
    let params = new HttpParams();

    if (cursor) {
      params = params
        .set('cursorDate', cursor.cursorDate)
        .set('cursorId', cursor.cursorId);
    }
    if (pageSize) {
      params = params.set('pageSize', pageSize);
    }

    return this.http.get<CursorPage<TicketHistoryEntry>>(`${this.apiUrl}/${ticketId}/history`, { params });
  }

  /**
   * Remove o responsável atual do ticket (DELETE /tickets/{ticketId}/assignee) — exige a permissão
   * `tickets:manage` e que o chamado esteja ativo (Aberto ou Em Andamento).
   */
  removeAssignee(ticketId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${ticketId}/assignee`);
  }

  /**
   * Atribui (ou reatribui) o responsável do ticket (PUT /tickets/{ticketId}/assignee) — exige a
   * permissão `tickets:manage`, tanto de quem atribui quanto do usuário atribuído, e que o chamado
   * esteja ativo (Aberto ou Em Andamento).
   */
  assignTicket(ticketId: string, assignedToUserId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${ticketId}/assignee`, { assignedToUserId });
  }

  /**
   * Busca uma página de todos os tickets do sistema, com filtros (GET /tickets) — exige a
   * permissão `tickets:manage`. Requer a role Administrador ou Atendente.
   */
  getAll(filters: TicketMonitorFilters): Observable<PagedResponse<TicketMonitorItem>> {
    let params = new HttpParams()
      .set('page', filters.page)
      .set('pageSize', filters.pageSize)
      .set('sort', filters.sort);

    if (filters.status !== undefined) {
      params = params.set('status', filters.status);
    }
    if (filters.priority !== undefined) {
      params = params.set('priority', filters.priority);
    }
    if (filters.sectorId) {
      params = params.set('sectorId', filters.sectorId);
    }
    if (filters.slaStatus !== undefined) {
      params = params.set('slaStatus', filters.slaStatus);
    }
    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.unassignedOnly) {
      params = params.set('unassignedOnly', filters.unassignedOnly);
    }

    return this.http.get<PagedResponse<TicketMonitorItem>>(this.apiUrl, { params });
  }

  /** Busca as contagens de SLA dos chamados ativos, opcionalmente de um só setor (GET /tickets/sla-summary). */
  getSlaSummary(sectorId?: string): Observable<TicketSlaSummary> {
    const params = sectorId ? new HttpParams().set('sectorId', sectorId) : undefined;
    return this.http.get<TicketSlaSummary>(`${this.apiUrl}/sla-summary`, { params });
  }

  /** Busca os totais de tickets por status de toda a empresa, para qualquer usuário logado (GET /tickets/stats/status). */
  getStatusCounts(): Observable<TicketStatusCounts> {
    return this.http.get<TicketStatusCounts>(`${this.apiUrl}/stats/status`);
  }

  /** Busca o volume de tickets abertos por período, de toda a empresa (GET /tickets/stats/volume). */
  getVolume(groupBy: TicketVolumeGrouping): Observable<TicketVolumePoint[]> {
    const params = new HttpParams().set('groupBy', groupBy);
    return this.http.get<TicketVolumePoint[]>(`${this.apiUrl}/stats/volume`, { params });
  }
}
