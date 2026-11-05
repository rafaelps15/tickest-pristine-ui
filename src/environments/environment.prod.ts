export const environment = {
  production: true,
  // TODO: substituir pela URL real da API .NET em produção antes do deploy.
  apiUrl: 'http://localhost:5195',
  /**
   * Funcionalidade do Início que ainda depende de flag (ver `DashboardFeatures`): só a dos resolvidos
   * por período, até a conferência do A-28.
   */
  dashboardFeatures: {
    volumeResolved: true
  }
};
