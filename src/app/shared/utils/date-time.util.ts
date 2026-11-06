/** Formato da data com hora nas telas ("31/12/2026 14:05"), sempre no fuso do navegador (ver `DateTimePipe`). */
export const DATE_TIME_FORMAT = 'dd/MM/yyyy HH:mm';

/** Hora do dia em 24 h ("14:05"), no fuso do navegador: o "Atualizado às" do Início e do Monitor. */
export function formatTimeOfDay(value: number | Date): string {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(value);
}
