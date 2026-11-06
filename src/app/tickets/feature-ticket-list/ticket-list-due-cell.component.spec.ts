import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { formatDate } from '@angular/common';
import { provideRouter } from '@angular/router';
import { TicketListDueCellComponent } from './ticket-list-due-cell.component';
import { TICKET_LIST_DUE_DISPLAY } from './ticket-list-due';
import { TicketSlaStatus } from '../entities/ticket-sla-status';

/** Prazo usado nos cenários (UTC). */
const DUE_AT_UTC = '2026-01-05T18:30:00Z';

describe('TicketListDueCellComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketListDueCellComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])]
    }).compileComponents();
  });

  /** Cria a célula para a situação do prazo informada, no chamado t1. */
  async function render(slaStatus: TicketSlaStatus) {
    const fixture = TestBed.createComponent(TicketListDueCellComponent);
    fixture.componentRef.setInput('display', TICKET_LIST_DUE_DISPLAY[slaStatus]);
    fixture.componentRef.setInput('dueAtUtc', DUE_AT_UTC);
    fixture.componentRef.setInput('ticketId', 't1');
    fixture.componentRef.setInput('ticketTitle', 'Impressora não funciona');
    await fixture.whenStable();
    return fixture.nativeElement.querySelector('.due') as HTMLElement;
  }

  it('leads with the situation, with a decorative icon, and shows the due date below it with what the date is', async () => {
    const due = await render(TicketSlaStatus.OnTime);

    expect(due.querySelector('.due-label')?.textContent?.trim()).toBe('No prazo');
    const icon = due.querySelector('.due-label i') as HTMLElement;
    expect(icon.classList).toContain('bx-time');
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    const date = due.querySelector('.due-date')?.textContent?.replace(/\s+/g, ' ').trim();
    expect(date).toBe(`até ${formatDate(DUE_AT_UTC, 'dd/MM/yyyy HH:mm', 'en-US')}`);
    expect(due.classList).not.toContain('due-warning');
    expect(due.classList).not.toContain('due-danger');
  });

  it('gives "Perto de vencer" the attention tone and "Atrasado" the alert tone, with "venceu em" before the date', async () => {
    const atRisk = await render(TicketSlaStatus.AtRisk);
    expect(atRisk.classList).toContain('due-warning');
    expect(atRisk.classList).not.toContain('due-danger');

    const breached = await render(TicketSlaStatus.Breached);
    expect(breached.classList).toContain('due-danger');
    expect(breached.querySelector('.due-label')?.textContent?.trim()).toBe('Atrasado');
    expect(breached.querySelector('.due-date')?.textContent).toContain('venceu em');
  });

  it('shows no date when the ticket has no due date', async () => {
    const due = await render(TicketSlaStatus.NotApplicable);

    expect(due.querySelector('.due-label')?.textContent?.trim()).toBe('Sem prazo');
    expect(due.querySelector('.due-date')).toBeNull();
  });

  it('offers "Cobrar no chamado" only when overdue, leading to the ticket and named after its title', async () => {
    const breached = await render(TicketSlaStatus.Breached);
    const link = breached.querySelector('a.due-nudge') as HTMLAnchorElement;
    expect(link.textContent?.trim()).toBe('Cobrar no chamado');
    expect(link.getAttribute('href')).toBe('/tickets/t1');
    expect(link.getAttribute('aria-label')).toBe('Cobrar no chamado Impressora não funciona');

    for (const status of [TicketSlaStatus.OnTime, TicketSlaStatus.AtRisk, TicketSlaStatus.Met, TicketSlaStatus.Missed]) {
      expect((await render(status)).querySelector('a')).withContext(TicketSlaStatus[status]).toBeNull();
    }
  });
});
