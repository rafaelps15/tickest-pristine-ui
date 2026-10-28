import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { Department } from '../departments';
import { TicketDashboardAssignee, TicketDashboardScope, TicketPriority, TICKET_PRIORITY_LABELS } from '../tickets';
import { FilterBarComponent } from '../shared/ui/filter-bar/filter-bar.component';

/** Um filtro ativo, mostrado como chip removível. */
interface ActiveFilterChip {
  /** Qual filtro o chip remove. */
  key: keyof TicketDashboardScope;
  /** Texto do chip ("Setor: Helpdesk"). */
  label: string;
}

/** Rótulos do filtro de responsável. */
const ASSIGNEE_LABELS: Record<TicketDashboardAssignee, string> = {
  me: 'Atribuídos a mim',
  none: 'Sem responsável'
};

/**
 * Barra de filtros dos widgets operacionais do Início: setor (agrupado por departamento),
 * prioridade e responsável — os recortes que a API aceita. Mostra os filtros ativos como chips
 * removíveis. Componente de apresentação: recebe os filtros e os departamentos por `input()` e
 * avisa as trocas por `output()`; quem grava na URL é a tela.
 */
@Component({
  selector: 'app-dashboard-filter-bar',
  imports: [FilterBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-filter-bar label="Filtrar a operação" [clearable]="chips().length > 0" (clear)="clear.emit()">
      <div class="col-12 col-md-4">
        <label class="form-label small" for="dashboardSector">Setor</label>
        <select #sectorSelect id="dashboardSector" class="form-select" [value]="filters().sectorId ?? ''"
                (change)="change.emit({ sectorId: sectorSelect.value || undefined })">
          <option value="">Todos os setores</option>
          @for (department of departments(); track department.id) {
            <optgroup [label]="department.name">
              @for (sector of department.sectors; track sector.id) {
                <option [value]="sector.id">{{ sector.name }}</option>
              }
            </optgroup>
          }
        </select>
      </div>
      <div class="col-6 col-md-4">
        <label class="form-label small" for="dashboardPriority">Prioridade</label>
        <select #prioritySelect id="dashboardPriority" class="form-select" [value]="filters().priority ?? ''"
                (change)="change.emit({ priority: toPriority(prioritySelect.value) })">
          <option value="">Todas</option>
          @for (priority of priorityOptions; track priority) {
            <option [value]="priority">{{ priorityLabels[priority] }}</option>
          }
        </select>
      </div>
      <div class="col-6 col-md-4">
        <label class="form-label small" for="dashboardAssignee">Responsável</label>
        <select #assigneeSelect id="dashboardAssignee" class="form-select" [value]="filters().assignee ?? ''"
                (change)="change.emit({ assignee: toAssignee(assigneeSelect.value) })">
          <option value="">Qualquer um</option>
          <option value="me">Atribuídos a mim</option>
          <option value="none">Sem responsável</option>
        </select>
      </div>

      @if (chips().length > 0) {
        <ul filterExtras class="list-unstyled d-flex flex-wrap gap-2 mb-0 filter-chips" aria-label="Filtros aplicados">
          @for (chip of chips(); track chip.key) {
            <li>
              <button type="button" class="btn btn-sm filter-chip" [attr.aria-label]="'Remover o filtro ' + chip.label"
                      (click)="change.emit(removal(chip.key))">
                {{ chip.label }} <i class="bx bx-x" aria-hidden="true"></i>
              </button>
            </li>
          }
        </ul>
      }
    </app-filter-bar>
  `,
  styles: `
    .filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      border: 1px solid var(--tk-border);
      border-radius: 999px;
      background-color: rgba(var(--tk-primary-rgb), 0.08);
      color: var(--tk-text-primary);
    }

    .filter-chip:hover,
    .filter-chip:focus-visible {
      border-color: var(--tk-primary);
    }
  `
})
export class DashboardFilterBarComponent {
  /** Filtros aplicados agora (vindos da URL). */
  readonly filters = input.required<TicketDashboardScope>();
  /** Departamentos ativos, com os setores — só o que a API devolve pra quem está logado. */
  readonly departments = input<Department[]>([]);

  /** Troca de um filtro (`undefined` remove aquele filtro). */
  readonly change = output<Partial<TicketDashboardScope>>();
  /** Remove todos os filtros. */
  readonly clear = output<void>();

  /** Prioridades, da mais baixa à mais alta. */
  readonly priorityOptions = [TicketPriority.Low, TicketPriority.Medium, TicketPriority.High, TicketPriority.Urgent];
  readonly priorityLabels = TICKET_PRIORITY_LABELS;

  /** Filtros ativos como chips, na ordem da barra. */
  readonly chips = computed((): ActiveFilterChip[] => {
    const filters = this.filters();
    const chips: ActiveFilterChip[] = [];
    if (filters.sectorId) {
      const sector = this.departments().flatMap(d => d.sectors).find(s => s.id === filters.sectorId);
      chips.push({ key: 'sectorId', label: `Setor: ${sector?.name ?? 'selecionado'}` });
    }
    if (filters.priority !== undefined) {
      chips.push({ key: 'priority', label: `Prioridade: ${this.priorityLabels[filters.priority]}` });
    }
    if (filters.assignee) {
      chips.push({ key: 'assignee', label: ASSIGNEE_LABELS[filters.assignee] });
    }
    return chips;
  });

  /** Valor do seletor de prioridade → prioridade (vazio ou fora da lista = sem filtro). */
  toPriority(value: string): TicketPriority | undefined {
    const priority = Number(value);
    return this.priorityOptions.includes(priority) ? priority : undefined;
  }

  /** Valor do seletor de responsável → filtro (vazio ou desconhecido = sem filtro). */
  toAssignee(value: string): TicketDashboardAssignee | undefined {
    return value === 'me' || value === 'none' ? value : undefined;
  }

  /** Troca que remove só um filtro. */
  removal(key: keyof TicketDashboardScope): Partial<TicketDashboardScope> {
    return { [key]: undefined };
  }
}
