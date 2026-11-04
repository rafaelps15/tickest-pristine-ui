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

  it('preloads the current ticket description', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    expect(textarea(fixture).value).toBe('A impressora do 3º andar não imprime.');
  });

  it('does not emit save with an invalid description (shorter than the minimum)', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    textarea(fixture).value = 'curta';
    textarea(fixture).dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(fixture.componentInstance.savedDescription).toBeNull();
  });

  it('emits save with the edited description and trimmed of surrounding spaces', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    textarea(fixture).value = '  Descrição corrigida com mais detalhes.  ';
    textarea(fixture).dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(fixture.componentInstance.savedDescription).toBe('Descrição corrigida com mais detalhes.');
  });

  it('closes directly when there is no change', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    fixture.nativeElement.querySelector('.modal').click();
    await fixture.whenStable();

    expect(confirmDialogServiceFake.confirm).not.toHaveBeenCalled();
    expect(fixture.componentInstance.closedCalled).toBeTrue();
  });

  it('asks for confirmation before closing with an unsaved change, and closes if confirmed', async () => {
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

  it('does not close when the discard confirmation is cancelled', async () => {
    confirmDialogServiceFake.confirm.and.returnValue(of(false));
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    textarea(fixture).value = 'Descrição alterada, mas ainda não salva.';
    textarea(fixture).dispatchEvent(new Event('input'));

    fixture.nativeElement.querySelector('.modal').click();
    await fixture.whenStable();

    expect(fixture.componentInstance.closedCalled).toBeFalse();
  });

  it('disables "Salvar" while saving, and shows the error coming from the API', async () => {
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

  it('ignores Esc while the discard confirmation is open', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    confirmDialogServiceFake.options.set({ title: 'Descartar as alterações?' });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();

    expect(fixture.componentInstance.closedCalled).toBeFalse();
  });

  it('traps Tab inside the dialog and locks page scrolling while it is open', async () => {
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
