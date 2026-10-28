import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { DashboardFilterBarComponent } from './dashboard-filter-bar.component';
import { DashboardFilters } from './dashboard-filters';
import { Department } from '../departments';
import { TicketAssignee } from '../tickets';

@Component({
  template: `<app-dashboard-filter-bar [filters]="filters()" [departments]="departments" [assignees]="assignees" today="2026-10-28"
                                       (change)="changes.push($event)" (clear)="cleared = true" />`,
  imports: [DashboardFilterBarComponent]
})
class HostComponent {
  filters = signal<DashboardFilters>({});
  departments: Department[] = [
    { id: 'd1', name: 'TI', description: '', responsibleUserName: null, sectors: [{ id: 's1', name: 'Helpdesk', description: null }] },
    { id: 'd2', name: 'RH', description: '', responsibleUserName: null, sectors: [{ id: 's2', name: 'Folha', description: null }] },
    { id: 'd3', name: 'Vazio', description: '', responsibleUserName: null, sectors: [] }
  ];
  assignees: TicketAssignee[] = [{ id: 'u-ana', fullName: 'Ana Souza', sectorId: 's1', sectorName: 'Helpdesk' }];
  changes: Partial<DashboardFilters>[] = [];
  cleared = false;
}

describe('DashboardFilterBarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  /** Escolhe um valor num seletor e dispara o `change`. */
  function choose(fixture: { nativeElement: HTMLElement }, selector: string, value: string): void {
    const select = fixture.nativeElement.querySelector(selector) as HTMLSelectElement;
    select.value = value;
    select.dispatchEvent(new Event('change'));
  }

  it('lista os setores agrupados por departamento, e só os departamentos com setores', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const groups = Array.from(fixture.nativeElement.querySelectorAll('#dashboardSector optgroup') as NodeListOf<HTMLOptGroupElement>);
    expect(groups.map(g => g.label)).toEqual(['TI', 'RH']);
    const departments = Array.from(fixture.nativeElement.querySelectorAll('#dashboardDepartment option') as NodeListOf<HTMLOptionElement>);
    expect(departments.map(o => o.textContent?.trim())).toEqual(['Todos os departamentos', 'TI', 'RH']);
  });

  it('com um departamento escolhido, o seletor de setor mostra só os setores dele', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.filters.set({ departmentId: 'd2' });
    await fixture.whenStable();

    const options = Array.from(fixture.nativeElement.querySelectorAll('#dashboardSector option') as NodeListOf<HTMLOptionElement>);
    expect(options.map(o => o.textContent?.trim())).toEqual(['Todos do departamento', 'Folha']);
  });

  it('trocar de departamento tira o setor que não é dele', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.filters.set({ sectorId: 's1' });
    await fixture.whenStable();

    choose(fixture, '#dashboardDepartment', 'd2');
    choose(fixture, '#dashboardDepartment', 'd1');

    expect(fixture.componentInstance.changes).toEqual([{ departmentId: 'd2', sectorId: undefined }, { departmentId: 'd1', sectorId: 's1' }]);
  });

  it('avisa a troca de prioridade e de responsável (pessoa, "meus" ou nenhum)', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    choose(fixture, '#dashboardPriority', '4');
    choose(fixture, '#dashboardAssignee', 'u-ana');
    choose(fixture, '#dashboardAssignee', 'me');
    choose(fixture, '#dashboardAssignee', '');

    expect(fixture.componentInstance.changes).toEqual([
      { priority: 4 },
      { assignee: undefined, assignedToUserId: 'u-ana' },
      { assignee: 'me', assignedToUserId: undefined },
      { assignee: undefined, assignedToUserId: undefined }
    ]);
  });

  it('o período pronto limpa o personalizado, e o personalizado começa nos últimos 30 dias', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    choose(fixture, '#dashboardPeriod', '7d');
    choose(fixture, '#dashboardPeriod', 'custom');

    expect(fixture.componentInstance.changes).toEqual([
      { period: '7d', from: undefined, to: undefined },
      { period: undefined, from: '2026-09-29', to: '2026-10-28' }
    ]);
  });

  it('no personalizado, mostra as datas e recusa um início depois do fim', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.filters.set({ from: '2026-10-01', to: '2026-10-10' });
    await fixture.whenStable();

    const from = fixture.nativeElement.querySelector('#dashboardFrom') as HTMLInputElement;
    from.value = '2026-10-20';
    from.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.changes).toEqual([]);
    expect(from.value).toBe('2026-10-01');

    from.value = '2026-10-05';
    from.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.changes).toEqual([{ from: '2026-10-05' }]);
  });

  it('mostra os filtros ativos como chips, e cada chip remove só o seu filtro', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.filters.set({ from: '2026-10-01', to: '2026-10-28', departmentId: 'd1', sectorId: 's1', priority: 4, assignedToUserId: 'u-ana' });
    await fixture.whenStable();

    const chips = Array.from(fixture.nativeElement.querySelectorAll('.filter-chip') as NodeListOf<HTMLButtonElement>);
    expect(chips.map(chip => chip.textContent?.trim())).toEqual([
      'De 01/10/2026 a 28/10/2026', 'Departamento: TI', 'Setor: Helpdesk', 'Prioridade: Urgente', 'Responsável: Ana Souza'
    ]);
    expect(chips[3].getAttribute('aria-label')).toBe('Remover o filtro Prioridade: Urgente');

    chips[0].click();
    chips[3].click();
    expect(fixture.componentInstance.changes).toEqual([{ from: undefined, to: undefined }, { priority: undefined }]);
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
