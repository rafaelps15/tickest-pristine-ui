/**
 * Carrega o Chart.js sob demanda (import dinâmico) em vez de embutido no chunk de quem usa —
 * a lib + registerables pesam ~450kB, então só valem a pena baixar quando um gráfico for
 * realmente exibido (ver `@defer` no template de quem chama). Cacheado numa Promise módulo-wide
 * para registrar os componentes do Chart.js uma única vez, mesmo com mais de uma tela usando.
 */
let chartModulePromise: Promise<typeof import('chart.js')> | null = null;

/** Devolve o módulo do Chart.js, já com os componentes registrados. */
export function loadChart(): Promise<typeof import('chart.js')> {
  chartModulePromise ??= import('chart.js').then(module => {
    module.Chart.register(...module.registerables);
    return module;
  });
  return chartModulePromise;
}
