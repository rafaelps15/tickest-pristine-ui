import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Modo de renderização por rota no servidor. A sessão (JWT) só existe no navegador
 * (localStorage) — durante o build/SSR não há nenhuma sessão, então qualquer rota guardada
 * por `authGuard`/`pendingPasswordChangeGuard` seria sempre avaliada como "deslogado" e
 * congelada (prerender) ou respondida (SSR) com o redirect pra `/login`, mesmo pra quem está
 * logado de verdade — foi exatamente isso que causava o F5 "deslogando" o usuário. Toda rota
 * atrás de um guard de sessão usa `RenderMode.Client`: o servidor só entrega o shell da
 * aplicação, e o guard roda de verdade no navegador, depois da hidratação, com o token real.
 */
export const serverRoutes: ServerRoute[] = [
  { path: 'login', renderMode: RenderMode.Prerender },
  // O token do convite vem no fragmento (#token=), que nunca chega ao servidor: só o navegador sabe qual estado mostrar.
  { path: 'ativar-conta', renderMode: RenderMode.Client },
  { path: 'primeiro-acesso', renderMode: RenderMode.Client },
  { path: 'dashboard', renderMode: RenderMode.Client },
  { path: 'tickets', renderMode: RenderMode.Client },
  { path: 'tickets/novo', renderMode: RenderMode.Client },
  { path: 'tickets/monitorar', renderMode: RenderMode.Client },
  { path: 'tickets/:id', renderMode: RenderMode.Client },
  { path: 'perfil', renderMode: RenderMode.Client },
  { path: 'usuarios', renderMode: RenderMode.Client },
  { path: 'departamentos', renderMode: RenderMode.Client },
  { path: 'setores', renderMode: RenderMode.Client },
  { path: 'roles', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Client }
];
