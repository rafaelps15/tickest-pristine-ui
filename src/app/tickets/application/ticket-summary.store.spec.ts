import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { TicketSummaryStore } from './ticket-summary.store';
import { TicketDataService } from '../infrastructure/ticket.data.service';
import { TicketStatusCounts } from '../entities/ticket-status-counts';
import { TicketSlaStatus } from '../entities/ticket-sla-status';
import { TicketSortOrder } from '../entities/ticket-sort-order';
import { TicketMonitorItem } from '../entities/ticket-monitor-item';
import { TicketPriority } from '../entities/ticket-priority';
import { TicketStatus } from '../entities/ticket-status';
import { SessionService } from '../../shared';

describe('TicketSummaryStore', () => {
  let store: InstanceType<typeof TicketSummaryStore>;
  let dataService: jasmine.SpyObj<TicketDataService>;
  let sessionService: jasmine.SpyObj<SessionService>;

  const statusCounts: TicketStatusCounts = {
    totalCount: 10, openCount: 3, inProgressCount: 2, resolvedCount: 4, closedCount: 1, canceledCount: 0
  };

  const criticalTicket: TicketMonitorItem = {
    id: 't1', title: 'Chamado urgente', priority: TicketPriority.High, status: TicketStatus.InProgress,
    requesterId: 'r1', requesterName: 'Fulano', requesterEmail: 'fulano@empresa.com',
    assignedToUserId: 'u1', assignedToName: 'Atendente', sectorId: 's1', sectorName: 'TI',
    createdAtUtc: '2026-01-01T12:00:00Z', dueAtUtc: '2026-01-02T12:00:00Z', slaWarningAtUtc: '2026-01-02T06:00:00Z',
    resolvedAtUtc: null, slaStatus: TicketSlaStatus.AtRisk
  };

  const breachedTicket: TicketMonitorItem = {
    ...criticalTicket, id: 't0', title: 'Chamado já vencido', dueAtUtc: '2026-01-01T09:00:00Z', slaStatus: TicketSlaStatus.Breached
  };

  /** Injeta o store (disparando a busca inicial com o retorno já configurado no spy) e espera estabilizar. */
  async function createStore(): Promise<InstanceType<typeof TicketSummaryStore>> {
    const created = TestBed.inject(TicketSummaryStore);
    await TestBed.inject(ApplicationRef).whenStable();
    return created;
  }

  beforeEach(async () => {
    dataService = jasmine.createSpyObj('TicketDataService', ['getStatusCounts', 'getVolume', 'getAll', 'getSlaSummary']);
    // Servidor 2 minutos à frente do navegador — o prazo relativo do card deve seguir o servidor.
    dataService.getSlaSummary.and.callFake(() => of({
      activeCount: 0, onTimeCount: 0, atRiskCount: 0, breachedCount: 0,
      serverNowUtc: new Date(Date.now() + 120_000).toISOString()
    }));
    dataService.getStatusCounts.and.returnValue(of(statusCounts));
    dataService.getVolume.and.returnValue(of([
      { periodStart: '2026-01-05', count: 2 },
      { periodStart: '2026-01-06', count: 5 }
    ]));
    // Responde conforme o filtro de SLA pedido: 1 em risco (t1) e 1 vencido (t0, prazo mais antigo), de um total de 7 vencidos.
    dataService.getAll.and.callFake(filters => of(filters.slaStatus === TicketSlaStatus.Breached
      ? { items: [breachedTicket], page: 1, pageSize: 5, totalCount: 7, totalPages: 2, hasPreviousPage: false, hasNextPage: true }
      : { items: [criticalTicket], page: 1, pageSize: 5, totalCount: 1, totalPages: 1, hasPreviousPage: false, hasNextPage: false }));

    sessionService = jasmine.createSpyObj('SessionService', ['hasPermission']);
    sessionService.hasPermission.and.returnValue(true);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TicketSummaryStore,
        { provide: TicketDataService, useValue: dataService },
        { provide: SessionService, useValue: sessionService }
      ]
    });
    store = await createStore();
  });

  it('busca os totais por status e o volume (agrupado por dia, por padrão) de toda a empresa', () => {
    expect(dataService.getStatusCounts).toHaveBeenCalled();
    expect(dataService.getVolume).toHaveBeenCalledWith('Day');
  });

  it('expõe os totais dos cards a partir dos totais por status', () => {
    expect(store.total()).toBe(10);
    expect(store.openCount()).toBe(3);
    expect(store.inProgressCount()).toBe(2);
    expect(store.resolvedCount()).toBe(4);
    expect(store.closedCount()).toBe(1);
    expect(store.canceledCount()).toBe(0);
  });

  it('expõe os pontos de volume retornados pela API', () => {
    expect(store.volume()).toEqual([
      { periodStart: '2026-01-05', count: 2 },
      { periodStart: '2026-01-06', count: 5 }
    ]);
  });

  it('refaz a busca do volume com o novo agrupamento ao mudar o período', async () => {
    store.setGroupBy('Month');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getVolume).toHaveBeenCalledWith('Month');
  });

  it('expõe mensagem de erro quando a busca dos totais por status falhar', async () => {
    dataService.getStatusCounts.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.load();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.summaryError()).toBe('Erro ao carregar o resumo dos tickets');
    expect(store.statusCountsFailed()).toBeTrue();
    expect(store.volumeFailed()).toBeFalse();
    // Os totais em erro não podem lançar — o template os lê sempre, mesmo mostrando "—".
    expect(store.total()).toBe(0);
    expect(store.closedCount()).toBe(0);
  });

  it('não marca nenhuma busca como falha quando as duas respondem', () => {
    expect(store.statusCountsFailed()).toBeFalse();
    expect(store.volumeFailed()).toBeFalse();
  });

  it('expõe mensagem de erro quando a busca do volume falhar', async () => {
    dataService.getVolume.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.load();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.summaryError()).toBe('Erro ao carregar o volume de tickets');
    expect(store.volumeFailed()).toBeTrue();
    expect(store.statusCountsFailed()).toBeFalse();
    expect(store.volume()).toEqual([]);
  });

  it('busca os chamados com SLA vencido e em risco, ordenados por prazo, para quem tem tickets:manage', () => {
    expect(dataService.getAll).toHaveBeenCalledWith({
      slaStatus: TicketSlaStatus.Breached, sort: TicketSortOrder.DueDate, page: 1, pageSize: 5
    });
    expect(dataService.getAll).toHaveBeenCalledWith({
      slaStatus: TicketSlaStatus.AtRisk, sort: TicketSortOrder.DueDate, page: 1, pageSize: 5
    });
    // O vencido (prazo mais antigo) vem primeiro.
    expect(store.criticalTickets()).toEqual([breachedTicket, criticalTicket]);
  });

  it('mede a diferença entre o relógio do servidor e o do navegador, pra ancorar o prazo relativo', () => {
    expect(dataService.getSlaSummary).toHaveBeenCalled();
    // ~120s, com folga pro tempo que o teste leva entre o fake e o recebimento.
    expect(store.clockOffsetMs()).toBeGreaterThan(115_000);
    expect(store.clockOffsetMs()).toBeLessThan(125_000);
  });

  it('expõe o total de vencidos e de em risco da empresa, não só os listados', () => {
    expect(store.breachedCount()).toBe(7);
    expect(store.atRiskCount()).toBe(1);
  });

  describe('vagas da lista (5: até 3 vencidos + até 2 em risco)', () => {
    /** Faz a API devolver `breached` vencidos e `atRisk` em risco, ids b0.. / r0.., já ordenados por prazo. */
    async function respondWith(breached: number, atRisk: number): Promise<string[]> {
      const many = (prefix: string, count: number, status: TicketSlaStatus) => Array.from({ length: count }, (_, i) => ({
        ...criticalTicket, id: `${prefix}${i}`, slaStatus: status, dueAtUtc: `2026-01-0${i + 1}T12:00:00Z`
      }));
      dataService.getAll.and.callFake(filters => {
        const isBreached = filters.slaStatus === TicketSlaStatus.Breached;
        const items = isBreached ? many('b', breached, TicketSlaStatus.Breached) : many('r', atRisk, TicketSlaStatus.AtRisk);
        return of({ items, page: 1, pageSize: 5, totalCount: items.length, totalPages: 1, hasPreviousPage: false, hasNextPage: false });
      });
      store.load();
      await TestBed.inject(ApplicationRef).whenStable();
      return store.criticalTickets().map(t => t.id);
    }

    it('com muitos dos dois, reserva 3 vagas pros vencidos e 2 pros em risco (que ainda dão pra salvar)', async () => {
      expect(await respondWith(5, 5)).toEqual(['b0', 'b1', 'b2', 'r0', 'r1']);
    });

    it('sem em risco, os vencidos ocupam as 5 vagas', async () => {
      expect(await respondWith(5, 0)).toEqual(['b0', 'b1', 'b2', 'b3', 'b4']);
    });

    it('com poucos vencidos, os em risco ocupam a sobra', async () => {
      expect(await respondWith(1, 5)).toEqual(['b0', 'r0', 'r1', 'r2', 'r3']);
    });

    it('com só 1 em risco, a vaga que sobra volta pros vencidos', async () => {
      expect(await respondWith(5, 1)).toEqual(['b0', 'b1', 'b2', 'b3', 'r0']);
    });
  });

  it('recarrega só os alertas de SLA com reloadCritical(), sem refazer totais nem volume', async () => {
    dataService.getStatusCounts.calls.reset();
    dataService.getVolume.calls.reset();
    dataService.getAll.calls.reset();

    store.reloadCritical();
    expect(store.criticalTicketsRefreshing()).toBeTrue();
    expect(store.criticalTicketsLoading()).toBeFalse(); // a lista atual continua na tela
    await TestBed.inject(ApplicationRef).whenStable();

    expect(dataService.getAll).toHaveBeenCalledTimes(2);
    expect(dataService.getStatusCounts).not.toHaveBeenCalled();
    expect(dataService.getVolume).not.toHaveBeenCalled();
    expect(store.criticalTicketsRefreshing()).toBeFalse();
  });

  it('expõe quando os alertas de SLA chegaram, pro "Atualizado às" do card', () => {
    const loadedAt = store.criticalTicketsLoadedAtMs();
    expect(loadedAt).not.toBeNull();
    expect(Math.abs(Date.now() - loadedAt!)).toBeLessThan(5_000);
  });

  it('refaz a busca dos chamados críticos de SLA ao chamar load()', async () => {
    store.load();
    await TestBed.inject(ApplicationRef).whenStable();

    // 2 chamadas na carga inicial (vencidos + em risco) e mais 2 no reload.
    expect(dataService.getAll).toHaveBeenCalledTimes(4);
  });

  it('expõe mensagem de erro quando a busca dos chamados em risco de SLA falhar', async () => {
    dataService.getAll.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.load();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.criticalTicketsError()).toBe('Erro ao carregar os alertas de SLA');
    expect(store.criticalTicketsLoading()).toBeFalse();
    // Ler os derivados em erro não pode lançar (o template os lê sempre, mesmo mostrando o erro).
    expect(store.criticalTickets()).toEqual([]);
    expect(store.breachedCount()).toBe(0);
    expect(store.clockOffsetMs()).toBe(0);
  });

  describe('sem a permissão tickets:manage', () => {
    beforeEach(async () => {
      sessionService.hasPermission.and.returnValue(false);
      dataService.getAll.calls.reset();
      dataService.getSlaSummary.calls.reset();

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          TicketSummaryStore,
          { provide: TicketDataService, useValue: dataService },
          { provide: SessionService, useValue: sessionService }
        ]
      });
      store = await createStore();
    });

    it('não busca os chamados em risco de SLA, e a lista fica vazia', () => {
      expect(dataService.getAll).not.toHaveBeenCalled();
      expect(dataService.getSlaSummary).not.toHaveBeenCalled();
      expect(store.criticalTickets()).toEqual([]);
      expect(store.clockOffsetMs()).toBe(0);
    });
  });
});
