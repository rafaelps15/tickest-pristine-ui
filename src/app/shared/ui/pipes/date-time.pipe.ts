import { DATE_PIPE_DEFAULT_OPTIONS, DatePipe } from '@angular/common';
import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';
import { DATE_TIME_FORMAT } from '../../utils/date-time.util';

/** Data com hora no formato das telas ("31/12/2026 14:05"), no fuso do navegador; sem data, `null`, como o `DatePipe`. */
@Pipe({ name: 'dateTime' })
export class DateTimePipe implements PipeTransform {
  /** `DatePipe` com o idioma e as opções padrão da aplicação, o mesmo que os templates usavam com o formato escrito à mão. */
  private readonly datePipe = new DatePipe(inject(LOCALE_ID), undefined, inject(DATE_PIPE_DEFAULT_OPTIONS, { optional: true }));

  /** Formata a data (texto ISO, `Date` ou ms) como {@link DATE_TIME_FORMAT}. */
  transform(value: string | number | Date | null | undefined): string | null {
    return this.datePipe.transform(value, DATE_TIME_FORMAT);
  }
}
