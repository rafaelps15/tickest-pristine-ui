export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000',
  /**
   * Funcionalidade do Início que ainda depende de flag (ver `DashboardFeatures`): só a dos resolvidos
   * por período, até a conferência do A-28.
   */
  dashboardFeatures: {
    volumeResolved: true
  }
};
