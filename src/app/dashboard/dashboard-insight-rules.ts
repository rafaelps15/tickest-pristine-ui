/**
 * Limiares da frase de destaque do gráfico principal do Início — o único lugar onde eles moram
 * (decididos pelo produto em 2026-10-28). Abaixo da amostra mínima, a frase não aparece.
 */
export interface DashboardInsightRules {
  /** Variação mínima (em %) da entrada de chamados entre duas janelas pra dizer que subiu ou caiu. */
  readonly changePercent: number;
  /** Mínimo de chamados na base da comparação; abaixo disso, nenhuma frase. */
  readonly minimumSample: number;
  /** Margem (em %) entre criados e resolvidos na mesma janela pra dizer que um superou o outro. */
  readonly balancePercent: number;
}

/** Valores em vigor dos limiares da frase de destaque. */
export const DASHBOARD_INSIGHT_RULES: DashboardInsightRules = {
  changePercent: 10,
  minimumSample: 10,
  balancePercent: 5
};
