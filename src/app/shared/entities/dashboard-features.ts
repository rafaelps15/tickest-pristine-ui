import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Funcionalidade do Início que ainda depende de uma flag: as rotas já entregues em todos os ambientes não
 * têm flag. Fica só a dos resolvidos por período, até a conferência do item A-28 da auditoria do front.
 */
export interface DashboardFeatures {
  /** Resolvidos por período e filtros no volume (GET /tickets/stats/volume, spec 028). */
  volumeResolved: boolean;
}

/** Flags do Início, lidas do `environment` (os testes trocam o provider). */
export const DASHBOARD_FEATURES = new InjectionToken<DashboardFeatures>('DASHBOARD_FEATURES', {
  providedIn: 'root',
  factory: () => environment.dashboardFeatures
});
