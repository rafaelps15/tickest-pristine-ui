/**
 * Formata uma duração (ms) em pt-BR curto pro prazo relativo do card: "menos de 1 min", "35 min",
 * "2h 14min", "3 dias". É hora de relógio (o prazo do SLA já vem calculado em data absoluta pela API).
 */
export function formatSlaDuration(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return 'menos de 1 min';
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 24 * 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest === 0 ? `${hours}h` : `${hours}h ${rest}min`;
  }
  const days = Math.floor(minutes / (24 * 60));
  return days === 1 ? '1 dia' : `${days} dias`;
}
