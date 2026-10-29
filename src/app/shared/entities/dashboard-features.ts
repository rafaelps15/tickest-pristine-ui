import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Funcionalidades do Início que dependem de um endpoint que o back-end ainda não entrega. Com a
 * flag desligada, o widget fica "Disponível em breve" e nenhuma requisição sai; ligada, a
 * requisição sai e um 404 é erro de verdade (URL errada), nunca "em breve".
 */
export interface DashboardFeatures {
  /** Agregado da operação com filtros — volume, SLA e central de atenção (GET /tickets/stats/overview, spec 026). */
  operationOverview: boolean;
  /** Tempos médios de primeira resposta e de resolução (GET /tickets/stats/times, spec 027). */
  averageTimes: boolean;
  /** Resolvidos por período e filtros no volume (GET /tickets/stats/volume, spec 028). */
  volumeResolved: boolean;
  /** Números agregados da empresa (status e volume) para todo colaborador, não só quem tem `tickets:manage`. */
  companyStatsForAll: boolean;
  /** Período de abertura e vários setores na listagem GET /tickets (spec 025): sem ela, o Monitorar avisa que as datas não filtram. */
  listPeriodFilter: boolean;
}

/** Flags do Início, lidas do `environment` (os testes trocam o provider). */
export const DASHBOARD_FEATURES = new InjectionToken<DashboardFeatures>('DASHBOARD_FEATURES', {
  providedIn: 'root',
  factory: () => environment.dashboardFeatures
});
