import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ConfirmDialogService } from './confirm-dialog.service';

describe('ConfirmDialogService', () => {
  let service: ConfirmDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), ConfirmDialogService] });
    service = TestBed.inject(ConfirmDialogService);
  });

  it('deve expor as opções do pedido de confirmação assim que confirm() é chamado', () => {
    service.confirm({ title: 'Excluir?', message: 'Essa ação não pode ser desfeita.' }).subscribe();

    expect(service.options()).toEqual({ title: 'Excluir?', message: 'Essa ação não pode ser desfeita.' });
  });

  it('deve emitir true e limpar as opções quando resolvido com confirmação', () => {
    let result: boolean | undefined;
    service.confirm({ title: 'Excluir?', message: '...' }).subscribe(value => result = value);

    service.resolve(true);

    expect(result).toBeTrue();
    expect(service.options()).toBeNull();
  });

  it('deve emitir false quando resolvido com cancelamento', () => {
    let result: boolean | undefined;
    service.confirm({ title: 'Excluir?', message: '...' }).subscribe(value => result = value);

    service.resolve(false);

    expect(result).toBeFalse();
  });

  it('deve suportar um novo pedido de confirmação depois do anterior ser resolvido', () => {
    service.confirm({ title: 'Primeiro', message: '...' }).subscribe();
    service.resolve(true);

    let result: boolean | undefined;
    service.confirm({ title: 'Segundo', message: '...' }).subscribe(value => result = value);
    service.resolve(false);

    expect(result).toBeFalse();
  });
});
