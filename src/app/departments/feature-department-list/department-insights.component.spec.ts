import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { DepartmentInsightsComponent } from './department-insights.component';
import { Department } from '../entities/department';

function makeDepartment(overrides: Partial<Department> = {}): Department {
  return {
    id: 'd1', name: 'TI', description: 'Tecnologia', responsibleUserId: 'resp-1', responsibleUserName: 'Fulano',
    sectors: [{ id: 's1', name: 'Suporte', description: null }],
    ...overrides
  };
}

describe('DepartmentInsightsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepartmentInsightsComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  it('shows the total of departments and sectors', async () => {
    const fixture = TestBed.createComponent(DepartmentInsightsComponent);
    fixture.componentRef.setInput('departments', [
      makeDepartment(),
      makeDepartment({ id: 'd2', name: 'RH', sectors: [{ id: 's2', name: 'Recrutamento', description: null }, { id: 's3', name: 'Folha', description: null }] })
    ]);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('2');
    expect(text).toContain('departamentos');
    expect(text).toContain('3');
    expect(text).toContain('setores');
  });

  it('does not show the alerts when all departments have a sector and an assignee', async () => {
    const fixture = TestBed.createComponent(DepartmentInsightsComponent);
    fixture.componentRef.setInput('departments', [makeDepartment()]);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('sem nenhum setor');
    expect(text).not.toContain('sem responsável definido');
  });

  it('warns how many departments have no sector at all', async () => {
    const fixture = TestBed.createComponent(DepartmentInsightsComponent);
    fixture.componentRef.setInput('departments', [makeDepartment({ sectors: [] })]);
    await fixture.whenStable();

    const chip = fixture.nativeElement.querySelector('.insights-chip-warning') as HTMLButtonElement;
    expect(chip.textContent?.replace(/\s+/g, ' ')).toContain('1 sem nenhum setor');
    expect(chip.textContent).toContain('não aparece na abertura de chamados');
  });

  it('warns how many departments have no assignee defined', async () => {
    const fixture = TestBed.createComponent(DepartmentInsightsComponent);
    fixture.componentRef.setInput('departments', [makeDepartment({ responsibleUserId: null, responsibleUserName: null })]);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent.replace(/\s+/g, ' ')).toContain('1 sem responsável');
  });

  it('the notice is a filter: emits the problem on click and turns off on a second click', async () => {
    const fixture = TestBed.createComponent(DepartmentInsightsComponent);
    fixture.componentRef.setInput('departments', [makeDepartment({ sectors: [] })]);
    const emitted: (string | null)[] = [];
    fixture.componentInstance.issueChange.subscribe(issue => emitted.push(issue));
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('.insights-chip') as HTMLButtonElement;
    expect(button.getAttribute('aria-pressed')).toBe('false');
    button.click();

    fixture.componentRef.setInput('activeIssue', 'withoutSectors');
    await fixture.whenStable();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    button.click();

    expect(emitted).toEqual(['withoutSectors', null]);
  });

  it('shows "—" and the reason, instead of "0 departamentos", when the list failed to load', async () => {
    const fixture = TestBed.createComponent(DepartmentInsightsComponent);
    fixture.componentRef.setInput('departments', []);
    fixture.componentRef.setInput('failed', true);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.insights-stat').textContent).toBe('—');
    expect(fixture.nativeElement.textContent).toContain('Resumo indisponível');
    expect(fixture.nativeElement.textContent).not.toContain('0 departamentos');
  });
});
