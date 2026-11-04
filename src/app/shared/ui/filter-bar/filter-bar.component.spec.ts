import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { FilterBarComponent } from './filter-bar.component';

/** Tela de teste com um campo, um extra e o botão de limpar. */
@Component({
  imports: [FilterBarComponent],
  template: `
    <app-filter-bar [clearable]="clearable()" (clear)="cleared = cleared + 1">
      <div class="col-12"><label for="q">Buscar</label><input id="q" /></div>
      <div filterExtras class="form-check"><input id="x" type="checkbox" /></div>
    </app-filter-bar>
  `
})
class HostComponent {
  /** Se o botão de limpar aparece. */
  readonly clearable = signal(true);
  /** Quantas vezes "Limpar filtros" foi clicado. */
  cleared = 0;
}

describe('FilterBarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  it('puts the fields in the grid and the extras in the footer, before "Limpar filtros"', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.row.g-3 #q')).not.toBeNull();
    const footer = fixture.nativeElement.querySelector('.filters-footer') as HTMLElement;
    expect(footer.firstElementChild?.hasAttribute('filterExtras')).toBeTrue();
    expect(footer.lastElementChild?.textContent).toContain('Limpar filtros');
  });

  it('notifies the screen when "Limpar filtros" is clicked', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('.btn-clear-filters') as HTMLButtonElement).click();

    expect(fixture.componentInstance.cleared).toBe(1);
  });

  it('hides the clear button when there is nothing to clear', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.clearable.set(false);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.btn-clear-filters')).toBeNull();
  });
});
