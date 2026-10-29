import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { DialogComponent } from '../dialog/dialog.component';

describe('ConfirmDialogComponent', () => {
  let service: ConfirmDialogService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    service = TestBed.inject(ConfirmDialogService);
  });

  afterEach(() => document.body.classList.remove('modal-open'));

  it('não renderiza nada sem pedido de confirmação', async () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('abre como diálogo modal com o título (h2) e a mensagem do pedido', async () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    await fixture.whenStable();

    service.confirm({ title: 'Excluir o chamado "Teste"?', message: 'Essa ação não pode ser desfeita.' }).subscribe();
    await fixture.whenStable();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(fixture.nativeElement.querySelector('h2').textContent).toContain('Excluir o chamado "Teste"?');
    expect(fixture.nativeElement.textContent).toContain('Essa ação não pode ser desfeita.');
  });

  it('resolve o pedido com true ao clicar no botão de confirmação, e fecha', async () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    await fixture.whenStable();
    const result = jasmine.createSpy('result');

    service.confirm({ title: 'Excluir?', message: 'm', confirmLabel: 'Excluir', variant: 'danger' }).subscribe(result);
    await fixture.whenStable();
    const confirmButton = fixture.nativeElement.querySelector('.btn-danger') as HTMLButtonElement;
    expect(confirmButton.textContent).toContain('Excluir');
    confirmButton.click();
    await fixture.whenStable();

    expect(result).toHaveBeenCalledWith(true);
    expect(service.options()).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('resolve o pedido com false pelo X e pelo Esc', async () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    await fixture.whenStable();
    const results: boolean[] = [];

    service.confirm({ title: 'Excluir?', message: 'm' }).subscribe(r => results.push(r));
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('.btn-close') as HTMLButtonElement).click();
    await fixture.whenStable();

    service.confirm({ title: 'Excluir?', message: 'm' }).subscribe(r => results.push(r));
    await fixture.whenStable();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();

    expect(results).toEqual([false, false]);
  });

  it('foca "Cancelar" ao abrir, o lado seguro de uma ação destrutiva', async () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();

    service.confirm({ title: 'Excluir?', message: 'm', cancelLabel: 'Voltar' }).subscribe();
    await fixture.whenStable();

    expect(document.activeElement?.textContent?.trim()).toBe('Voltar');
    service.resolve(false);
    await fixture.whenStable();
    fixture.nativeElement.remove();
  });
});

/** Tela de teste com um diálogo próprio aberto, como "Editar descrição", e a confirmação global por cima. */
@Component({
  imports: [DialogComponent, ConfirmDialogComponent],
  template: `
    @if (open()) {
      <app-dialog title="Editar descrição" (closed)="screenClosed = screenClosed + 1"><p>Texto</p></app-dialog>
    }
    <app-confirm-dialog />
  `
})
class StackHostComponent {
  /** Se o diálogo da tela está aberto. */
  readonly open = signal(true);
  /** Quantas vezes o diálogo da tela pediu pra fechar. */
  screenClosed = 0;
}

describe('ConfirmDialogComponent sobre outro diálogo', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StackHostComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  afterEach(() => document.body.classList.remove('modal-open'));

  it('o Esc fecha só a confirmação (a do topo), não o diálogo da tela por baixo', async () => {
    const fixture = TestBed.createComponent(StackHostComponent);
    await fixture.whenStable();
    const service = TestBed.inject(ConfirmDialogService);
    const result = jasmine.createSpy('result');

    service.confirm({ title: 'Descartar as alterações?', message: 'm' }).subscribe(result);
    await fixture.whenStable();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();

    expect(result).toHaveBeenCalledWith(false);
    expect(fixture.componentInstance.screenClosed).toBe(0);
    expect(document.body.classList).toContain('modal-open');
  });
});
