import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { DepartmentInsightsComponent } from './department-insights.component';
import { Department } from '../entities/department';

function makeDepartment(overrides: Partial<Department> = {}): Department {
  return {
    id: 'd1', name: 'TI', description: 'Tecnologia', responsibleUserName: 'Fulano',
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

  it('mostra o total de departamentos e setores', async () => {
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

  it('não mostra os alertas quando todos os departamentos têm setor e responsável', async () => {
    const fixture = TestBed.createComponent(DepartmentInsightsComponent);
    fixture.componentRef.setInput('departments', [makeDepartment()]);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).not.toContain('sem nenhum setor');
    expect(text).not.toContain('sem responsável definido');
  });

  it('avisa quantos departamentos estão sem nenhum setor', async () => {
    const fixture = TestBed.createComponent(DepartmentInsightsComponent);
    fixture.componentRef.setInput('departments', [makeDepartment({ sectors: [] })]);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('1 departamento sem nenhum setor');
  });

  it('avisa quantos departamentos estão sem responsável definido', async () => {
    const fixture = TestBed.createComponent(DepartmentInsightsComponent);
    fixture.componentRef.setInput('departments', [makeDepartment({ responsibleUserName: null })]);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('1 departamento sem responsável definido');
  });

  it('mostra "—" e o motivo, em vez de "0 departamentos", quando a lista falhou ao carregar', async () => {
    const fixture = TestBed.createComponent(DepartmentInsightsComponent);
    fixture.componentRef.setInput('departments', []);
    fixture.componentRef.setInput('failed', true);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.insights-stat').textContent).toBe('—');
    expect(fixture.nativeElement.textContent).toContain('Resumo indisponível');
    expect(fixture.nativeElement.textContent).not.toContain('0 departamentos');
  });
});
