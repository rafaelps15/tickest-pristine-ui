import { Pipe, PipeTransform } from '@angular/core';
import { formatTimeOfDay } from '../../utils/date-time.util';

/** Hora do dia ("14:05") pelo {@link formatTimeOfDay}, o mesmo do código do Início; sem valor, `null`. */
@Pipe({ name: 'timeOfDay' })
export class TimeOfDayPipe implements PipeTransform {
  /** Formata o instante (ms ou `Date`) como hora do dia no fuso do navegador. */
  transform(value: number | Date | null | undefined): string | null {
    return value === null || value === undefined ? null : formatTimeOfDay(value);
  }
}
