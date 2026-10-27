import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { SummaryCardComponent } from '../../shared/ui/summary-card/summary-card.component';
import { Department } from '../entities/department';

/** Problema de estrutura que o Resumo aponta e a lista pode filtrar. */
export type DepartmentIssue = 'withoutSectors' | 'withoutResponsible';

/**
 * Card "Resumo" de Departamentos: estatísticas reais, calculadas a partir dos departamentos já
 * carregados (nenhum endpoint de agregação existe pra isso, mas não precisa — os dados já estão
 * na tela). Os avisos são botões que filtram a lista pelo problema. Componente de apresentação —
 * recebe a lista via `input()`, não injeta nenhum Store.
 */
@Component({
  selector: 'app-department-insights',
  templateUrl: './department-insights.component.html',
  styleUrl: './department-insights.component.css',
  imports: [SummaryCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DepartmentInsightsComponent {
  /** Departamentos carregados na tela. */
  readonly departments = input<Department[]>([]);

  /** A lista ainda está carregando — o card mostra "—" em vez de números. */
  readonly loading = input(false);
  /** A lista falhou ao carregar — o card mostra "—" e o motivo em vez de números. */
  readonly failed = input(false);

  /** Filtro de problema aplicado na lista agora (o aviso correspondente fica pressionado), ou `null`. */
  readonly activeIssue = input<DepartmentIssue | null>(null);
  /** Pede pra filtrar a lista por um problema, ou `null` pra voltar a todos. */
  readonly issueChange = output<DepartmentIssue | null>();

  /** Total de setores, somando os de todos os departamentos. */
  readonly totalSectors = computed(() =>
    this.departments().reduce((sum, department) => sum + department.sectors.length, 0));

  /** Departamentos sem nenhum setor — não aparecem na abertura de chamados. */
  readonly departmentsWithoutSectors = computed(() =>
    this.departments().filter(department => department.sectors.length === 0).length);

  /** Departamentos sem responsável definido. */
  readonly departmentsWithoutResponsible = computed(() =>
    this.departments().filter(department => !department.responsibleUserName).length);

  /** Liga o filtro do aviso clicado, ou desliga se ele já era o ativo. */
  toggle(issue: DepartmentIssue): void {
    this.issueChange.emit(this.activeIssue() === issue ? null : issue);
  }
}
