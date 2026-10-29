import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { EmptyStateComponent, LoadingStateComponent } from './data-state.components';

/** Tela de teste com um estado vazio (com ação) e um carregamento. */
@Component({
  imports: [EmptyStateComponent, LoadingStateComponent],
  template: `
    <app-empty-state icon="bx-group" title="Nenhum usuário ainda." hint="Cadastre o primeiro.">
      <button type="button">Novo Usuário</button>
    </app-empty-state>
    <app-loading-state label="Carregando usuários…" />
  `
})
class HostComponent {}

describe('EmptyStateComponent e LoadingStateComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  it('mostra ícone decorativo, frase, dica e a próxima ação projetada', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const empty = fixture.nativeElement.querySelector('app-empty-state') as HTMLElement;
    expect(empty.querySelector('i.bx-group')?.getAttribute('aria-hidden')).toBe('true');
    expect(empty.querySelector('.fw-semibold')?.textContent).toContain('Nenhum usuário ainda.');
    expect(empty.textContent).toContain('Cadastre o primeiro.');
    expect(empty.querySelector('button')?.textContent).toContain('Novo Usuário');
  });

  it('anuncia o carregamento como status, com o texto visível', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const loading = fixture.nativeElement.querySelector('app-loading-state') as HTMLElement;
    expect(loading.getAttribute('role')).toBe('status');
    expect(loading.querySelector('.visually-hidden')).toBeNull();
    expect(loading.textContent).toContain('Carregando usuários…');
  });
});
