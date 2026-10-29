export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000',
  /**
   * Funcionalidades do Início que esperam um endpoint do back-end (ver `DashboardFeatures`). Cada
   * flag é ligada no mesmo PR que entrega o endpoint; desligada, o front não faz a requisição.
   */
  dashboardFeatures: {
    operationOverview: true,
    averageTimes: true,
    volumeResolved: true,
    companyStatsForAll: false,
    listPeriodFilter: true
  }
};
