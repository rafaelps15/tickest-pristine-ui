import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ConfirmDialogService } from './confirm-dialog.service';

describe('ConfirmDialogService', () => {
  let service: ConfirmDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), ConfirmDialogService] });
    service = TestBed.inject(ConfirmDialogService);
  });

  it('should expose the confirmation request options as soon as confirm() is called', () => {
    service.confirm({ title: 'Excluir?', message: 'Essa ação não pode ser desfeita.' }).subscribe();

    expect(service.options()).toEqual({ title: 'Excluir?', message: 'Essa ação não pode ser desfeita.' });
  });

  it('should emit true and clear the options when resolved with confirmation', () => {
    let result: boolean | undefined;
    service.confirm({ title: 'Excluir?', message: '...' }).subscribe(value => result = value);

    service.resolve(true);

    expect(result).toBeTrue();
    expect(service.options()).toBeNull();
  });

  it('should emit false when resolved with cancellation', () => {
    let result: boolean | undefined;
    service.confirm({ title: 'Excluir?', message: '...' }).subscribe(value => result = value);

    service.resolve(false);

    expect(result).toBeFalse();
  });

  it('should answer false to the previous request when another is opened before it is resolved', () => {
    let first: boolean | undefined;
    let firstCompleted = false;
    service.confirm({ title: 'Primeiro', message: '...' }).subscribe({
      next: value => first = value,
      complete: () => firstCompleted = true
    });

    let second: boolean | undefined;
    service.confirm({ title: 'Segundo', message: '...' }).subscribe(value => second = value);
    service.resolve(true);

    expect(first).toBeFalse();
    expect(firstCompleted).toBeTrue();
    expect(second).toBeTrue();
    expect(service.options()).toBeNull();
  });

  it('should support a new confirmation request after the previous one is resolved', () => {
    service.confirm({ title: 'Primeiro', message: '...' }).subscribe();
    service.resolve(true);

    let result: boolean | undefined;
    service.confirm({ title: 'Segundo', message: '...' }).subscribe(value => result = value);
    service.resolve(false);

    expect(result).toBeFalse();
  });
});
