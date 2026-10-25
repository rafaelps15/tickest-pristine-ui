import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { Department } from '../entities/department';

/**
 * Card "Resumo" de Departamentos: estatísticas reais, calculadas a partir dos departamentos já
 * carregados (nenhum endpoint de agregação existe pra isso, mas não precisa — os dados já estão
 * na tela). Componente de apresentação — recebe a lista via `@Input`, não injeta nenhum Store.
 */
@Component({
  selector: 'app-department-insights',
  templateUrl: './department-insights.component.html',
  styleUrl: './department-insights.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DepartmentInsightsComponent {
  /** Departamentos carregados na tela. */
  readonly departments = input<Department[]>([]);

  /** Total de setores, somando os de todos os departamentos. */
  readonly totalSectors = computed(() =>
    this.departments().reduce((sum, department) => sum + department.sectors.length, 0));

  /** Departamentos sem nenhum setor — não aparecem na abertura de chamados. */
  readonly departmentsWithoutSectors = computed(() =>
    this.departments().filter(department => department.sectors.length === 0).length);

  /** Departamentos sem responsável definido. */
  readonly departmentsWithoutResponsible = computed(() =>
    this.departments().filter(department => !department.responsibleUserName).length);
}
