import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TicketListFirstUseComponent } from './ticket-list-first-use.component';

describe('TicketListFirstUseComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketListFirstUseComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])]
    }).compileComponents();
  });

  /** Cria o estado vazio com as entradas informadas. */
  async function render(inputs: { attendingDepartments?: string; canCreateTickets?: boolean } = {}) {
    const fixture = TestBed.createComponent(TicketListFirstUseComponent);
    if (inputs.attendingDepartments !== undefined) fixture.componentRef.setInput('attendingDepartments', inputs.attendingDepartments);
    if (inputs.canCreateTickets !== undefined) fixture.componentRef.setInput('canCreateTickets', inputs.canCreateTickets);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('explains the channel and the three steps of a ticket, with decorative icons hidden from screen readers', async () => {
    const element = await render();

    expect(element.querySelector('h2')?.textContent?.trim()).toBe('Nenhum chamado aberto ainda');
    expect(element.textContent).toContain('Abra um chamado em vez de mandar e-mail ou WhatsApp');
    expect(element.querySelectorAll('ol.first-use-steps li').length).toBe(3);
    element.querySelectorAll('i.bx').forEach(icon => expect(icon.getAttribute('aria-hidden')).toBe('true'));
  });

  it('lists the departments that handle tickets, and hides the line when there are none', async () => {
    const element = await render({ attendingDepartments: 'TI, RH e Financeiro' });
    expect(element.querySelector('.first-use-departments')?.textContent?.trim()).toBe('Atendem chamados: TI, RH e Financeiro.');

    const withoutDepartments = await render({ attendingDepartments: '' });
    expect(withoutDepartments.querySelector('.first-use-departments')).toBeNull();
  });

  it('offers "Abrir o primeiro chamado", leading to Novo Chamado, only to whoever can create tickets', async () => {
    const withoutPermission = await render();
    expect(withoutPermission.querySelector('a')).toBeNull();

    const element = await render({ canCreateTickets: true });
    const link = element.querySelector('a') as HTMLAnchorElement;
    expect(link.textContent?.trim()).toBe('Abrir o primeiro chamado');
    expect(link.getAttribute('href')).toBe('/tickets/novo');
  });
});
