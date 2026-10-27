import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { of } from 'rxjs';
import { TicketEditDialogComponent, TicketEditDialogTicket } from './ticket-edit-dialog.component';
import { ConfirmDialogService } from '../../../shared';

@Component({
  template: `<app-ticket-edit-dialog [ticket]="ticket()" [saving]="saving()" [error]="error()"
                                      (save)="onSave($event)" (closed)="onClosed()" />`,
  imports: [TicketEditDialogComponent]
})
class HostComponent {
  ticket = signal<TicketEditDialogTicket>({ id: 't1', title: 'Impressora não funciona', description: 'A impressora do 3º andar não imprime.' });
  saving = signal(false);
  error = signal<string | null>(null);
  savedDescription: string | null = null;
  closedCalled = false;

  onSave(description: string): void {
    this.savedDescription = description;
  }

  onClosed(): void {
    this.closedCalled = true;
  }
}

describe('TicketEditDialogComponent', () => {
  let confirmDialogServiceFake: { confirm: jasmine.Spy; options: ReturnType<typeof signal<object | null>> };

  beforeEach(async () => {
    confirmDialogServiceFake = { confirm: jasmine.createSpy('confirm').and.returnValue(of(true)), options: signal<object | null>(null) };

    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ConfirmDialogService, useValue: confirmDialogServiceFake }
      ]
    }).compileComponents();
  });

  function textarea(fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>): HTMLTextAreaElement {
    return fixture.nativeElement.querySelector('#ticketEditDescription');
  }

  it('pré-carrega a descrição atual do chamado', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    expect(textarea(fixture).value).toBe('A impressora do 3º andar não imprime.');
  });

  it('não emite save com uma descrição inválida (menor que o mínimo)', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    textarea(fixture).value = 'curta';
    textarea(fixture).dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(fixture.componentInstance.savedDescription).toBeNull();
  });

  it('emite save com a descrição editada e sem espaços nas pontas', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    textarea(fixture).value = '  Descrição corrigida com mais detalhes.  ';
    textarea(fixture).dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(fixture.componentInstance.savedDescription).toBe('Descrição corrigida com mais detalhes.');
  });

  it('fecha direto quando não há alteração', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    fixture.nativeElement.querySelector('.modal').click();
    await fixture.whenStable();

    expect(confirmDialogServiceFake.confirm).not.toHaveBeenCalled();
    expect(fixture.componentInstance.closedCalled).toBeTrue();
  });

  it('pede confirmação antes de fechar com alteração não salva, e fecha se confirmado', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(true));
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    textarea(fixture).value = 'Descrição alterada, mas ainda não salva.';
    textarea(fixture).dispatchEvent(new Event('input'));

    fixture.nativeElement.querySelector('.modal').click();
    await fixture.whenStable();

    expect(confirmDialogServiceFake.confirm).toHaveBeenCalled();
    expect(fixture.componentInstance.closedCalled).toBeTrue();
  });

  it('não fecha quando a confirmação de descartar for cancelada', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(false));
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    textarea(fixture).value = 'Descrição alterada, mas ainda não salva.';
    textarea(fixture).dispatchEvent(new Event('input'));

    fixture.nativeElement.querySelector('.modal').click();
    await fixture.whenStable();

    expect(fixture.componentInstance.closedCalled).toBeFalse();
  });

  it('desabilita "Salvar" enquanto salva, e mostra o erro vindo da API', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    textarea(fixture).value = 'Descrição alterada para salvar.';
    textarea(fixture).dispatchEvent(new Event('input'));
    fixture.componentInstance.saving.set(true);
    fixture.componentInstance.error.set('Você não tem permissão para editar este chamado.');
    await fixture.whenStable();

    const saveButton = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(saveButton.disabled).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Você não tem permissão para editar este chamado.');
  });

  it('ignora o Esc enquanto a confirmação de descarte está aberta', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    confirmDialogServiceFake.options.set({ title: 'Descartar as alterações?' });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();

    expect(fixture.componentInstance.closedCalled).toBeFalse();
  });

  it('prende o Tab dentro do diálogo e trava a rolagem da página enquanto está aberto', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    expect(document.body.classList).toContain('modal-open');

    const box = fixture.nativeElement.querySelector('.modal-content') as HTMLElement;
    const closeButton = fixture.nativeElement.querySelector('.btn-close') as HTMLButtonElement;
    const cancelButton = Array.from(box.querySelectorAll('button')).find(b => b.textContent?.includes('Cancelar')) as HTMLButtonElement;
    cancelButton.focus();

    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    cancelButton.dispatchEvent(tab);

    // "Salvar" está desabilitado sem alteração, então "Cancelar" é o último controle focável.
    expect(tab.defaultPrevented).toBeTrue();
    expect(document.activeElement).toBe(closeButton);

    fixture.destroy();
    expect(document.body.classList).not.toContain('modal-open');
  });
});
