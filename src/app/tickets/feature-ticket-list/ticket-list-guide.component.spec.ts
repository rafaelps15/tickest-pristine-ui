import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TicketListGuideComponent } from './ticket-list-guide.component';

const STORAGE_KEY = 'tickest.ticketListGuide.open';

describe('TicketListGuideComponent', () => {
  beforeEach(async () => {
    localStorage.removeItem(STORAGE_KEY);

    await TestBed.configureTestingModule({
      imports: [TicketListGuideComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  it('explica cada status do ponto de vista de quem abriu o chamado, com a mesma badge da lista', async () => {
    const fixture = TestBed.createComponent(TicketListGuideComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Aguardando alguém do setor assumir.');
    expect(text).toContain('confira e reabra se não ficou certo');
    // Pílulas só pros 5 status; o prazo vem em texto com ícone, os mesmos da coluna Prazo.
    expect(fixture.nativeElement.querySelectorAll('.badge').length).toBe(5);
    expect(text).toContain('Perto de vencer');
    expect(text).toContain('Sem prazo');
    expect(text).toContain('dá pra reabrir se o problema voltar');
  });

  it('diz o que dá pra fazer em cada fase (editar/cancelar enquanto ativo, reabrir depois)', async () => {
    const fixture = TestBed.createComponent(TicketListGuideComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('editar a descrição');
    expect(text).toContain('15 primeiros minutos');
    expect(text).toContain('reabrir');
    expect(text).toContain('Para solicitar o cancelamento, entre em contato com quem administra os chamados.');
  });
});
