import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { DropdownFixedPositionDirective } from './dropdown-fixed-position.directive';

/** Botão de dropdown mínimo com a diretiva. */
@Component({
  imports: [DropdownFixedPositionDirective],
  template: `<button type="button" id="toggle" data-bs-toggle="dropdown" appDropdownFixedPosition>Ações</button>`
})
class HostComponent {}

/** Dropdown do Bootstrap falso: guarda o elemento e as opções e conta os dispose(). */
class FakeDropdown {
  static created: FakeDropdown[] = [];
  readonly dispose = jasmine.createSpy('dispose');

  constructor(readonly element: Element, readonly options?: Record<string, unknown>) {
    FakeDropdown.created.push(this);
  }
}

/** Global `bootstrap` da página, que o index.html carrega pela CDN. */
interface BootstrapGlobal {
  /** Bootstrap carregado na página (`undefined` nos testes, fora este). */
  bootstrap?: unknown;
}

describe('DropdownFixedPositionDirective', () => {
  let previousBootstrap: unknown;

  beforeEach(async () => {
    FakeDropdown.created = [];
    previousBootstrap = (window as unknown as BootstrapGlobal).bootstrap;
    (window as unknown as BootstrapGlobal).bootstrap = { Dropdown: FakeDropdown };

    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  afterEach(() => {
    (window as unknown as BootstrapGlobal).bootstrap = previousBootstrap;
  });

  it('creates the Bootstrap dropdown on the element with the fixed positioning strategy', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    expect(FakeDropdown.created.length).toBe(1);
    const [dropdown] = FakeDropdown.created;
    expect(dropdown.element).toBe(fixture.nativeElement.querySelector('#toggle'));
    const popperConfig = dropdown.options?.['popperConfig'] as (config: Record<string, unknown>) => Record<string, unknown>;
    expect(popperConfig({ placement: 'bottom-end' })).toEqual({ placement: 'bottom-end', strategy: 'fixed' });
  });

  it('disposes the Bootstrap dropdown when the element leaves the screen', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    expect(FakeDropdown.created[0].dispose).not.toHaveBeenCalled();

    fixture.destroy();

    expect(FakeDropdown.created[0].dispose).toHaveBeenCalledTimes(1);
  });
});
