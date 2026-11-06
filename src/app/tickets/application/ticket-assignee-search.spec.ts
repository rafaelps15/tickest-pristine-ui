import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { assigneeSearchErrorMessage, eligibleAssigneesResource } from './ticket-assignee-search';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { TicketAssignee } from '../entities/ticket-assignee';
import { PagedResponse } from '../../shared';

describe('ticket-assignee-search', () => {
  /** Responsável elegível que a busca encontra. */
  const candidate: TicketAssignee = { id: 'u2', fullName: 'João Pedro', sectorId: 's1', sectorName: 'Suporte' };
  /** Página de candidatos como o GET /tickets/assignees devolve. */
  const page: PagedResponse<TicketAssignee> = {
    items: [candidate], page: 1, pageSize: 8, totalCount: 1, totalPages: 1, hasPreviousPage: false, hasNextPage: false
  };

  let dataService: jasmine.SpyObj<TicketDataService>;

  beforeEach(() => {
    dataService = jasmine.createSpyObj('TicketDataService', ['getAssignees']);
    dataService.getAssignees.and.returnValue(of(page));
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('searches the eligible assignees by the trimmed term, eight at a time, and exposes only the people found', async () => {
    const resource = TestBed.runInInjectionContext(() => eligibleAssigneesResource(dataService, signal(' joão ')));
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAssignees).toHaveBeenCalledOnceWith('joão', undefined, 1, 8);
    expect(resource.value()).toEqual([candidate]);
  });

  it('does not call the API while the term is empty', async () => {
    const term = signal('   ');
    const resource = TestBed.runInInjectionContext(() => eligibleAssigneesResource(dataService, term));
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAssignees).not.toHaveBeenCalled();
    expect(resource.value()).toBeUndefined();
  });

  it('explains the refusal for lack of permission, shows the message of the API and falls back to its own message', () => {
    const withApiMessage = new HttpErrorResponse({ status: 400, error: { detail: 'O termo é muito curto.' } });

    expect(assigneeSearchErrorMessage(new HttpErrorResponse({ status: 403 }))).toBe('Você não tem permissão para buscar responsáveis.');
    expect(assigneeSearchErrorMessage(withApiMessage)).toBe('O termo é muito curto.');
    expect(assigneeSearchErrorMessage(new HttpErrorResponse({ status: 500 }))).toBe('Erro ao buscar responsáveis.');
  });
});
