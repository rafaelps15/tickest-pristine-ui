import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    jasmine.clock().install();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    service = TestBed.inject(ToastService);
  });

  afterEach(() => jasmine.clock().uninstall());

  it('mostra um toast e o fecha sozinho depois de 4s', () => {
    service.show('Salvo.');
    expect(service.toasts().length).toBe(1);

    jasmine.clock().tick(4001);
    expect(service.toasts().length).toBe(0);
  });

  it('dá o dobro do tempo a um toast com ação, pra dar tempo de alcançar o botão', () => {
    service.show('Desativado.', 'success', { label: 'Desfazer', run: () => undefined });

    jasmine.clock().tick(4001);
    expect(service.toasts().length).toBe(1);

    jasmine.clock().tick(4000);
    expect(service.toasts().length).toBe(0);
  });

  it('roda a ação e fecha o toast', () => {
    const run = jasmine.createSpy('run');
    service.show('Desativado.', 'success', { label: 'Desfazer', run });
    const id = service.toasts()[0].id;

    service.runAction(id);

    expect(run).toHaveBeenCalled();
    expect(service.toasts().length).toBe(0);
  });

  it('fecha o toast antes do tempo ao dispensar', () => {
    service.show('Salvo.');

    service.dismiss(service.toasts()[0].id);

    expect(service.toasts().length).toBe(0);
  });
});
