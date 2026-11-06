/** Configuração do build de produção, que o `fileReplacements` do angular.json põe no lugar do environment.ts. */
export const environment = {
  production: true,
  // TODO: substituir pela URL real da API .NET em produção antes do deploy.
  apiUrl: 'http://localhost:5195'
};
