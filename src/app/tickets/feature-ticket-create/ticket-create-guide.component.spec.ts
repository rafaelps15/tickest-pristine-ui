import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TicketCreateGuideComponent } from './ticket-create-guide.component';

describe('TicketCreateGuideComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketCreateGuideComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  it('explica pra onde o chamado vai, o que a prioridade quer dizer e onde ele aparece depois', async () => {
    const fixture = TestBed.createComponent(TicketCreateGuideComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('departamento e o setor');
    expect(text).toContain('Urgente');
    expect(text).toContain('Meus Chamados');
  });
});
