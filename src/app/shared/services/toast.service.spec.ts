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

  it('shows a toast and closes it by itself after 4s', () => {
    service.show('Salvo.');
    expect(service.toasts().length).toBe(1);

    jasmine.clock().tick(4001);
    expect(service.toasts().length).toBe(0);
  });

  it('gives double the time to a toast with an action, so there is time to reach the button', () => {
    service.show('Desativado.', 'success', { label: 'Desfazer', run: () => undefined });

    jasmine.clock().tick(4001);
    expect(service.toasts().length).toBe(1);

    jasmine.clock().tick(4000);
    expect(service.toasts().length).toBe(0);
  });

  it('runs the action and closes the toast', () => {
    const run = jasmine.createSpy('run');
    service.show('Desativado.', 'success', { label: 'Desfazer', run });
    const id = service.toasts()[0].id;

    service.runAction(id);

    expect(run).toHaveBeenCalled();
    expect(service.toasts().length).toBe(0);
  });

  it('closes the toast early when dismissed', () => {
    service.show('Salvo.');

    service.dismiss(service.toasts()[0].id);

    expect(service.toasts().length).toBe(0);
  });
});
