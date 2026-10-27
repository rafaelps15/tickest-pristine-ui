import { activeTicketsMenu } from './main-layout.component';

describe('activeTicketsMenu', () => {
  it('ativa "Meus Tickets" na lista, no Novo Ticket e no detalhe', () => {
    expect(activeTicketsMenu('/tickets')).toBe('mine');
    expect(activeTicketsMenu('/tickets?page=2')).toBe('mine');
    expect(activeTicketsMenu('/tickets/novo')).toBe('mine');
    expect(activeTicketsMenu('/tickets/8cc6644c-af6d-4c71-bb70-74d713b42cf0')).toBe('mine');
  });

  it('ativa "Monitorar Tickets" no Monitor e no detalhe aberto a partir dele', () => {
    expect(activeTicketsMenu('/tickets/monitorar')).toBe('monitor');
    expect(activeTicketsMenu('/tickets/monitorar?status=1')).toBe('monitor');
    expect(activeTicketsMenu('/tickets/t1?from=monitor')).toBe('monitor');
  });

  it('não ativa nenhum item de tickets fora de /tickets', () => {
    expect(activeTicketsMenu('/dashboard')).toBeNull();
    expect(activeTicketsMenu('/usuarios')).toBeNull();
  });
});
