/** Se o texto é uma data real no formato `aaaa-mm-dd` (o formato dos filtros de período da API). */
export function isIsoDate(value: string | null | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Data `aaaa-mm-dd` como `dd/mm/aaaa`. */
export function formatIsoDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}
