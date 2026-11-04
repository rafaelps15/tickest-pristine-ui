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

  it('explains where the ticket goes, what the priority means and where it shows up afterwards', async () => {
    const fixture = TestBed.createComponent(TicketCreateGuideComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('departamento e o setor');
    expect(text).toContain('Urgente');
    expect(text).toContain('Meus Chamados');
  });
});
