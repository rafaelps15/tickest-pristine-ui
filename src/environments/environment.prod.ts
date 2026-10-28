export const environment = {
  production: true,
  // TODO: substituir pela URL real da API .NET em produção antes do deploy.
  apiUrl: 'http://localhost:5195',
  /**
   * Funcionalidades do Início que esperam um endpoint do back-end (ver `DashboardFeatures`). Cada
   * flag é ligada no mesmo PR que entrega o endpoint; desligada, o front não faz a requisição.
   */
  dashboardFeatures: {
    operationOverview: true,
    averageTimes: false,
    volumeResolved: false,
    companyStatsForAll: false,
    listPeriodFilter: true
  }
};
