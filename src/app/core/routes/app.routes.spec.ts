import { Route } from '@angular/router';
import { routes } from './app.routes';
import { permissionGuard } from '../../shared/guards/permission.guard';

/** Procura a rota pelo caminho, entre as filhas das rotas de layout. */
function findRoute(path: string): Route | undefined {
  return routes.flatMap(route => route.children ?? []).find(route => route.path === path);
}

describe('app routes', () => {
  it('"Meus Chamados" (/tickets) requires tickets:view-own', () => {
    const route = findRoute('tickets');

    expect(route?.canActivate).toContain(permissionGuard);
    expect(route?.data?.['requiredPermission']).toBe('tickets:view-own');
  });

  it('"Novo chamado" (/tickets/novo) requires tickets:create', () => {
    const route = findRoute('tickets/novo');

    expect(route?.canActivate).toContain(permissionGuard);
    expect(route?.data?.['requiredPermission']).toBe('tickets:create');
  });
});
