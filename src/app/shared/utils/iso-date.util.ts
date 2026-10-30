/** Se o texto é uma data real no formato `aaaa-mm-dd` (o formato dos filtros de período da API). */
export function isIsoDate(value: string | null | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Hoje no horário de Brasília (`aaaa-mm-dd`) — as datas da API são de `America/Sao_Paulo`. */
export function todayInSaoPaulo(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/** Data `aaaa-mm-dd` como `dd/mm/aaaa`. */
export function formatIsoDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

/** Soma (ou subtrai) dias de uma data `aaaa-mm-dd`. */
export function shiftIsoDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

/** Quantos dias tem o período `from`–`to`, contando as duas pontas (01/10–30/10 = 30). */
export function isoRangeDays(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000) + 1;
}

/**
 * Período de mesmo tamanho imediatamente antes de `from`–`to` (inclusivo): pra 01/10–30/10, devolve
 * 01/09–30/09 — a base de comparação "vs. período anterior".
 */
export function previousIsoRange(from: string, to: string): { from: string; to: string } {
  const days = isoRangeDays(from, to);
  const previousTo = shiftIsoDate(from, -1);
  return { from: shiftIsoDate(previousTo, 1 - days), to: previousTo };
}
