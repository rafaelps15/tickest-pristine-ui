import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { DashboardFilterBarComponent } from './dashboard-filter-bar.component';
import { Department } from '../departments';
import { TicketDashboardScope } from '../tickets';

@Component({
  template: `<app-dashboard-filter-bar [filters]="filters()" [departments]="departments" (change)="changes.push($event)" (clear)="cleared = true" />`,
  imports: [DashboardFilterBarComponent]
})
class HostComponent {
  filters = signal<TicketDashboardScope>({});
  departments: Department[] = [
    { id: 'd1', name: 'TI', description: '', responsibleUserName: null, sectors: [{ id: 's1', name: 'Helpdesk', description: null }] }
  ];
  changes: Partial<TicketDashboardScope>[] = [];
  cleared = false;
}

describe('DashboardFilterBarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  it('lista os setores agrupados por departamento', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const group = fixture.nativeElement.querySelector('#dashboardSector optgroup') as HTMLOptGroupElement;
    expect(group.label).toBe('TI');
    expect(group.textContent).toContain('Helpdesk');
  });

  it('avisa a troca de cada filtro (vazio remove o filtro)', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const sector = fixture.nativeElement.querySelector('#dashboardSector') as HTMLSelectElement;
    sector.value = 's1';
    sector.dispatchEvent(new Event('change'));
    const priority = fixture.nativeElement.querySelector('#dashboardPriority') as HTMLSelectElement;
    priority.value = '4';
    priority.dispatchEvent(new Event('change'));
    const assignee = fixture.nativeElement.querySelector('#dashboardAssignee') as HTMLSelectElement;
    assignee.value = '';
    assignee.dispatchEvent(new Event('change'));

    expect(fixture.componentInstance.changes).toEqual([{ sectorId: 's1' }, { priority: 4 }, { assignee: undefined }]);
  });

  it('mostra os filtros ativos como chips, e cada chip remove só o seu filtro', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.filters.set({ sectorId: 's1', priority: 4, assignee: 'none' });
    await fixture.whenStable();

    const chips = Array.from(fixture.nativeElement.querySelectorAll('.filter-chip') as NodeListOf<HTMLButtonElement>);
    expect(chips.map(chip => chip.textContent?.trim())).toEqual(['Setor: Helpdesk', 'Prioridade: Urgente', 'Sem responsável']);
    expect(chips[1].getAttribute('aria-label')).toBe('Remover o filtro Prioridade: Urgente');

    chips[1].click();
    expect(fixture.componentInstance.changes).toEqual([{ priority: undefined }]);
  });

  it('só oferece "Limpar filtros" com algum filtro ativo', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.btn-clear-filters')).toBeNull();

    fixture.componentInstance.filters.set({ assignee: 'me' });
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('.btn-clear-filters') as HTMLButtonElement).click();

    expect(fixture.componentInstance.cleared).toBeTrue();
  });
});
