import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TicketReopenDialogComponent } from './ticket-reopen-dialog.component';

@Component({
  template: `<app-ticket-reopen-dialog [ticketTitle]="title()" [saving]="saving()" [error]="error()"
                                        (confirm)="onConfirm($event)" (closed)="onClosed()" />`,
  imports: [TicketReopenDialogComponent]
})
class HostComponent {
  title = signal('Monitor com defeito');
  saving = signal(false);
  error = signal<string | null>(null);
  confirmedReason: string | null | undefined = undefined;
  closedCalled = false;

  onConfirm(reason: string | null): void {
    this.confirmedReason = reason;
  }

  onClosed(): void {
    this.closedCalled = true;
  }
}

describe('TicketReopenDialogComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  function reasonField(fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>): HTMLTextAreaElement {
    return fixture.nativeElement.querySelector('#ticketReopenReason');
  }

  function submit(fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>): void {
    (fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement).click();
  }

  it('mostra o título do chamado e foca o campo do motivo ao abrir', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Monitor com defeito');
    // Promete o que o produto entrega: um novo ciclo de prazo, visto na seção SLA do chamado.
    expect(fixture.nativeElement.textContent).toContain('novo prazo de atendimento começa a contar');
    expect(document.activeElement).toBe(reasonField(fixture));
  });

  it('emite o motivo sem espaços nas pontas', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    reasonField(fixture).value = '  A tela voltou a piscar.  ';
    reasonField(fixture).dispatchEvent(new Event('input'));
    submit(fixture);

    expect(fixture.componentInstance.confirmedReason).toBe('A tela voltou a piscar.');
  });

  it('emite null quando o motivo fica em branco (é opcional)', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    submit(fixture);

    expect(fixture.componentInstance.confirmedReason).toBeNull();
  });

  it('não emite com um motivo acima do limite', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    reasonField(fixture).value = 'x'.repeat(501);
    reasonField(fixture).dispatchEvent(new Event('input'));
    await fixture.whenStable();
    submit(fixture);

    expect(fixture.componentInstance.confirmedReason).toBeUndefined();
    expect(fixture.nativeElement.textContent).toContain('no máximo 500 caracteres');
  });

  it('fecha pelo Esc e pelo clique fora, mas não enquanto reabre', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.saving.set(true);
    await fixture.whenStable();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(fixture.componentInstance.closedCalled).toBeFalse();

    fixture.componentInstance.saving.set(false);
    await fixture.whenStable();
    fixture.nativeElement.querySelector('.modal').click();
    expect(fixture.componentInstance.closedCalled).toBeTrue();
  });

  it('trava a rolagem da página enquanto está aberto', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    expect(document.body.classList).toContain('modal-open');

    fixture.destroy();
    expect(document.body.classList).not.toContain('modal-open');
  });
});
