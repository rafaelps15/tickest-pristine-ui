import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { DialogComponent } from '../dialog/dialog.component';
import { provideRouter, Router } from '@angular/router';

/** Tela vazia só pra navegar nos testes. */
@Component({ template: '' })
class EmptyPageComponent {}

describe('ConfirmDialogComponent', () => {
  let service: ConfirmDialogService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([{ path: 'outra', component: EmptyPageComponent }])]
    }).compileComponents();

    service = TestBed.inject(ConfirmDialogService);
  });

  afterEach(() => document.body.classList.remove('modal-open'));

  it('cancels the open request when navigation changes screen, without running the action', async () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    let result: boolean | undefined;
    service.confirm({ title: 'Desativar?', message: '...' }).subscribe(value => result = value);
    await fixture.whenStable();

    await TestBed.inject(Router).navigateByUrl('/outra');
    await fixture.whenStable();

    expect(result).toBeFalse();
    expect(service.options()).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders nothing without a confirmation request', async () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('opens as a modal dialog with the title (h2) and the message of the request', async () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    await fixture.whenStable();

    service.confirm({ title: 'Excluir o chamado "Teste"?', message: 'Essa ação não pode ser desfeita.' }).subscribe();
    await fixture.whenStable();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(fixture.nativeElement.querySelector('h2').textContent).toContain('Excluir o chamado "Teste"?');
    expect(fixture.nativeElement.textContent).toContain('Essa ação não pode ser desfeita.');
  });

  it('resolves the request with true when clicking the confirm button, and closes', async () => {
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

  it('resolves the request with false via the X and via Esc', async () => {
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

  it('focuses "Cancelar" on open, the safe side of a destructive action', async () => {
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

describe('ConfirmDialogComponent over another dialog', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StackHostComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  afterEach(() => document.body.classList.remove('modal-open'));

  it('Esc closes only the confirmation (the topmost), not the screen dialog underneath', async () => {
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
