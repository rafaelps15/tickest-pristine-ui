/** Média e mediana de um tempo, em minutos úteis, com o tamanho da amostra. */
export interface TicketTimeStat {
  /** Média em minutos úteis; null quando a amostra é menor que o mínimo. */
  averageMinutes: number | null;
  /** Mediana em minutos úteis; null quando a amostra é menor que o mínimo. */
  medianMinutes: number | null;
  /** Quantos chamados entraram na conta. */
  sampleSize: number;
}

/** Tempos médios do recorte (GET /tickets/stats/times, spec 027 do back-end). */
export interface TicketAverageTimes {
  /** Até a primeira resposta de quem atende (só respostas por mensagem). */
  firstResponse: TicketTimeStat;
  /** Da abertura até a primeira resolução. */
  resolution: TicketTimeStat;
  /** Amostra mínima pra calcular média e mediana. */
  minimumSampleSize: number;
}
