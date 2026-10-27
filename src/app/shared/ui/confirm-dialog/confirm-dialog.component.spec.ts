import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

/** Instâncias criadas pelo `bootstrap.Modal` falso, para inspecionar a que elemento cada uma ficou ligada. */
let createdModals: FakeModal[] = [];

/** Stand-in do `bootstrap.Modal` (carregado via CDN no app real): `hide()` dispara `hidden.bs.modal` como o Bootstrap. */
class FakeModal {
  /** Quantas vezes `show()` foi chamado nesta instância. */
  showCalls = 0;

  constructor(readonly element: HTMLElement) {
    createdModals.push(this);
  }

  /** Registra a abertura. */
  show(): void {
    this.showCalls++;
  }

  /** Fecha e avisa como o Bootstrap faz ao fim da transição. */
  hide(): void {
    this.element.dispatchEvent(new Event('hidden.bs.modal'));
  }
}

describe('ConfirmDialogComponent', () => {
  let service: ConfirmDialogService;

  beforeEach(async () => {
    createdModals = [];
    (window as unknown as { bootstrap: unknown }).bootstrap = { Modal: FakeModal };

    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    service = TestBed.inject(ConfirmDialogService);
  });

  afterEach(() => {
    delete (window as unknown as { bootstrap?: unknown }).bootstrap;
  });

  it('mantém a .modal-dialog no DOM mesmo sem pedido de confirmação (o Bootstrap guarda a referência dela)', async () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.modal > .modal-dialog > .modal-content')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.modal-header')).toBeNull();
  });

  it('só cria a instância do Bootstrap ao abrir, ligada ao elemento .modal que está no DOM', async () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    await fixture.whenStable();
    expect(createdModals.length).toBe(0);

    service.confirm({ title: 'Excluir o ticket "Teste"?', message: 'Essa ação não pode ser desfeita.' }).subscribe();
    await fixture.whenStable();

    expect(createdModals.length).toBe(1);
    expect(createdModals[0].element).toBe(fixture.nativeElement.querySelector('.modal'));
    expect(createdModals[0].showCalls).toBe(1);
    expect(fixture.nativeElement.querySelector('#confirmDialogTitle').textContent).toContain('Excluir o ticket "Teste"?');
  });

  it('reaproveita a mesma instância em confirmações seguidas', async () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    await fixture.whenStable();

    service.confirm({ title: 'Primeira', message: 'm' }).subscribe();
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('.btn-outline-secondary') as HTMLButtonElement).click();
    await fixture.whenStable();

    service.confirm({ title: 'Segunda', message: 'm' }).subscribe();
    await fixture.whenStable();

    expect(createdModals.length).toBe(1);
    expect(createdModals[0].showCalls).toBe(2);
  });

  it('resolve o pedido com true ao clicar no botão de confirmação', async () => {
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
  });

  it('resolve o pedido com false ao cancelar', async () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    await fixture.whenStable();
    const result = jasmine.createSpy('result');

    service.confirm({ title: 'Excluir?', message: 'm' }).subscribe(result);
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('.btn-close') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(result).toHaveBeenCalledWith(false);
  });
});
