import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { RowActionsComponent } from './row-actions.component';

/** Tela de teste com um "⋮" de duas ações. */
@Component({
  imports: [RowActionsComponent],
  template: `
    <app-row-actions label="Ações para Ana" [busy]="busy()" rowKey="u1">
      <li><button type="button" class="dropdown-item">Editar</button></li>
      <li><button type="button" class="dropdown-item">Desativar</button></li>
    </app-row-actions>
  `
})
class HostComponent {
  /** Uma ação da linha está em andamento. */
  readonly busy = signal(false);
}

describe('RowActionsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  it('rotula o botão e expõe a chave da linha pra devolver o foco', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const toggle = fixture.nativeElement.querySelector('.btn-row-actions') as HTMLButtonElement;
    expect(toggle.getAttribute('aria-label')).toBe('Ações para Ana');
    expect(toggle.getAttribute('data-row-actions')).toBe('u1');
    expect(toggle.getAttribute('data-bs-toggle')).toBe('dropdown');
  });

  it('projeta os itens dentro do menu', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const items = fixture.nativeElement.querySelectorAll('.dropdown-menu .dropdown-item');
    expect(items.length).toBe(2);
  });

  it('troca o ícone por um spinner enquanto a linha está ocupada', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.busy.set(true);
    await fixture.whenStable();

    const toggle = fixture.nativeElement.querySelector('.btn-row-actions') as HTMLButtonElement;
    expect(toggle.querySelector('.spinner-border')).not.toBeNull();
    expect(toggle.querySelector('.bx-dots-vertical-rounded')).toBeNull();
  });
});
