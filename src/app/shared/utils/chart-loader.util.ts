/**
 * Carrega o Chart.js sob demanda (import dinâmico) em vez de embutido no chunk de quem usa — só
 * vale a pena baixar quando um gráfico for realmente exibido (ver `@defer` no template de quem
 * chama). Carrega `chart-setup`, que registra só as peças usadas (barras, escalas, tooltip e
 * legenda) — o `registerables` inteiro trazia controladores e elementos que nenhuma tela desenha.
 * Cacheado numa Promise módulo-wide pra registrar uma única vez.
 */
let chartModulePromise: Promise<typeof import('./chart-setup')> | null = null;

/** Devolve o módulo com o `Chart` já com as peças registradas. */
export function loadChart(): Promise<typeof import('./chart-setup')> {
  // Se o chunk falhar (rede caiu, deploy novo), a Promise rejeitada não fica no cache: a próxima
  // tentativa ("Tentar novamente") baixa de novo.
  chartModulePromise ??= import('./chart-setup').catch(error => {
    chartModulePromise = null;
    throw error;
  });
  return chartModulePromise;
}
