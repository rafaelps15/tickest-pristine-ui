import { Component, ChangeDetectionStrategy, computed, input, output, signal } from '@angular/core';
import { Department } from '../departments';
import { TicketAssignee, TicketPriority, TICKET_PRIORITY_LABELS } from '../tickets';
import { FilterBarComponent } from '../shared/ui/filter-bar/filter-bar.component';
import { DASHBOARD_PERIOD_DAYS, DASHBOARD_PERIOD_LABELS, DashboardFilterChip, DashboardFilters, DashboardPeriodPreset, addDays, dashboardFilterChips } from './dashboard-filters';
import { isIsoDate } from '../shared';

/** Valor do seletor de período pro período personalizado. */
const CUSTOM_PERIOD = 'custom';

/**
 * Barra de filtros dos widgets operacionais do Início: período (pronto ou personalizado),
 * departamento, setor, prioridade e responsável (qualquer pessoa elegível) — os recortes que a
 * API aceita. Mostra os filtros ativos como chips removíveis. Componente de apresentação: recebe
 * os filtros, os departamentos e os responsáveis por `input()` e avisa as trocas por `output()`;
 * quem grava na URL é a tela.
 */
@Component({
  selector: 'app-dashboard-filter-bar',
  imports: [FilterBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!--
      Três campos à vista (período, departamento, setor: o recorte que muda a leitura da tela) e os de uso
      menos frequente em "Mais filtros (n)", como no Monitor — DESIGN.md: no máximo 3–4 campos visíveis.
    -->
    <app-filter-bar label="Filtrar a operação" [clearable]="chips().length > 0" (clear)="clear.emit()">
      <div class="col-12 col-md-4">
        <label class="form-label small" for="dashboardPeriod">Período de abertura</label>
        <select #periodSelect id="dashboardPeriod" class="form-select" [value]="periodValue()"
                (change)="change.emit(toPeriod(periodSelect.value))">
          <option value="">Todo o período</option>
          @for (period of periodOptions; track period) {
            <option [value]="period">{{ periodLabels[period] }}</option>
          }
          <option value="custom">Personalizado</option>
        </select>
      </div>
      <div class="col-12 col-md-4">
        <label class="form-label small" for="dashboardDepartment">Departamento</label>
        <select #departmentSelect id="dashboardDepartment" class="form-select" [value]="filters().departmentId ?? ''"
                (change)="change.emit(toDepartment(departmentSelect.value))">
          <option value="">Todos os departamentos</option>
          @for (department of departmentOptions(); track department.id) {
            <option [value]="department.id">{{ department.name }}</option>
          }
        </select>
      </div>
      <div class="col-12 col-md-4">
        <label class="form-label small" for="dashboardSector">Setor</label>
        <select #sectorSelect id="dashboardSector" class="form-select" [value]="filters().sectorId ?? ''"
                (change)="change.emit({ sectorId: sectorSelect.value || undefined })">
          <option value="">{{ selectedDepartment() ? 'Todos do departamento' : 'Todos os setores' }}</option>
          @for (department of sectorGroups(); track department.id) {
            <optgroup [label]="department.name">
              @for (sector of department.sectors; track sector.id) {
                <option [value]="sector.id">{{ sector.name }}</option>
              }
            </optgroup>
          }
        </select>
      </div>
      <div id="dashboardMoreFilters" class="col-12" [hidden]="!moreFiltersOpen()">
        <div class="row g-3">
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
        <select #assigneeSelect id="dashboardAssignee" class="form-select" [value]="assigneeValue()"
                (change)="change.emit(toAssignee(assigneeSelect.value))">
          <option value="">Qualquer um</option>
          <option value="me">Atribuídos a mim</option>
          <option value="none">Sem responsável</option>
          @if (assignees().length > 0) {
            <optgroup [label]="assigneeGroupLabel()">
              @for (assignee of assignees(); track assignee.id) {
                <option [value]="assignee.id">{{ assignee.fullName }}</option>
              }
            </optgroup>
          }
        </select>
      </div>
        </div>
      </div>

      @if (periodValue() === 'custom') {
        <div class="col-6 col-md-3">
          <label class="form-label small" for="dashboardFrom">De</label>
          <input #fromInput id="dashboardFrom" type="date" class="form-control" [value]="filters().from ?? ''"
                 [class.is-invalid]="dateError() === 'from'" [attr.aria-invalid]="dateError() === 'from' || null"
                 [attr.aria-describedby]="dateError() === 'from' ? 'dashboardDateError' : null"
                 [max]="filters().to ?? today()" (change)="onDateChange('from', fromInput)" />
        </div>
        <div class="col-6 col-md-3">
          <label class="form-label small" for="dashboardTo">Até</label>
          <input #toInput id="dashboardTo" type="date" class="form-control" [value]="filters().to ?? ''"
                 [class.is-invalid]="dateError() === 'to'" [attr.aria-invalid]="dateError() === 'to' || null"
                 [attr.aria-describedby]="dateError() === 'to' ? 'dashboardDateError' : null"
                 [min]="filters().from ?? ''" [max]="today()" (change)="onDateChange('to', toInput)" />
        </div>
        @if (dateError()) {
          <!-- Data recusada: diz o motivo, em vez de só voltar o campo pro valor aplicado. -->
          <p id="dashboardDateError" class="col-12 small text-danger mb-0 mt-1" role="alert">
            {{ dateError() === 'from' ? 'O início precisa ser no máximo o fim do período.' : 'O fim precisa ser no mínimo o início do período.' }}
            Mantivemos a data anterior.
          </p>
        }
      }

      <button filterExtras type="button" class="btn btn-link btn-more-filters text-decoration-none px-0"
              aria-controls="dashboardMoreFilters" [attr.aria-expanded]="moreFiltersOpen()" (click)="toggleMoreFilters()">
        <i class="bx me-1" [class.bx-chevron-down]="!moreFiltersOpen()" [class.bx-chevron-up]="moreFiltersOpen()" aria-hidden="true"></i>
        {{ moreFiltersOpen() ? 'Menos filtros' : 'Mais filtros' }}@if (secondaryFilterCount() > 0) { ({{ secondaryFilterCount() }}) }
      </button>

      @if (chips().length > 0) {
        <ul filterExtras class="list-unstyled d-flex flex-wrap gap-2 mb-0 filter-chips" aria-label="Filtros aplicados">
          @for (chip of chips(); track chip.key) {
            <li>
              <button type="button" class="btn btn-sm filter-chip" [attr.aria-label]="'Remover o filtro ' + chip.label"
                      (click)="change.emit(chip.removal)">
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

    /* Toque: o chip inteiro remove o filtro, então ele ganha a altura mínima de um alvo de dedo (44px). */
    @media (pointer: coarse) {
      .filter-chip {
        min-height: 44px;
        padding-inline: 0.875rem;
      }
    }
  `
})
export class DashboardFilterBarComponent {
  /** Filtros aplicados agora (vindos da URL). */
  readonly filters = input.required<DashboardFilters>();
  /** Departamentos ativos, com os setores — só o que a API devolve pra quem está logado. */
  readonly departments = input<Department[]>([]);
  /** Responsáveis elegíveis (GET /tickets/assignees). */
  readonly assignees = input<TicketAssignee[]>([]);
  /** Total de responsáveis elegíveis; maior que a lista quando ela veio cortada. */
  readonly assigneesTotal = input(0);
  /** Hoje (`aaaa-mm-dd`, horário de Brasília): limite do período e fim do personalizado. */
  readonly today = input.required<string>();

  /** Troca de um filtro (`undefined` remove aquele filtro). */
  readonly change = output<Partial<DashboardFilters>>();
  /** Remove todos os filtros. */
  readonly clear = output<void>();

  /** Prioridades, da mais baixa à mais alta. */
  readonly priorityOptions = [TicketPriority.Low, TicketPriority.Medium, TicketPriority.High, TicketPriority.Urgent];
  readonly priorityLabels = TICKET_PRIORITY_LABELS;
  /** Períodos prontos, do mais curto ao mais longo. */
  readonly periodOptions = Object.keys(DASHBOARD_PERIOD_DAYS) as DashboardPeriodPreset[];
  readonly periodLabels = DASHBOARD_PERIOD_LABELS;

  /** Se a linha "Mais filtros" (prioridade e responsável) está aberta — estado de tela, não vai pra URL. */
  readonly moreFiltersOpen = signal(false);

  /** Qual ponta do período personalizado foi recusada por inverter o intervalo (ou data inválida), ou null. */
  readonly dateError = signal<'from' | 'to' | null>(null);

  /** Quantos filtros de "Mais filtros" estão aplicados (aparece no botão, com a linha fechada ou aberta). */
  readonly secondaryFilterCount = computed(() => {
    const filters = this.filters();
    return (filters.priority !== undefined ? 1 : 0) + (filters.assignee || filters.assignedToUserId ? 1 : 0);
  });

  /** Só os departamentos com setores: um departamento vazio não recorta nada. */
  readonly departmentOptions = computed(() => this.departments().filter(d => d.sectors.length > 0));

  /** Departamento escolhido, se existir na lista. */
  readonly selectedDepartment = computed(() => this.departments().find(d => d.id === this.filters().departmentId) ?? null);

  /** Setores no seletor: só os do departamento escolhido, ou todos agrupados por departamento. */
  readonly sectorGroups = computed(() => {
    const department = this.selectedDepartment();
    return department ? [department] : this.departmentOptions();
  });

  /** Rótulo do grupo de pessoas; diz quando a lista não traz todo mundo. */
  readonly assigneeGroupLabel = computed(() => {
    const shown = this.assignees().length;
    const total = this.assigneesTotal();
    return total > shown ? `Pessoas da equipe (${shown} de ${total}, em ordem de nome)` : 'Pessoas da equipe';
  });

  /** Valor do seletor de período. */
  readonly periodValue = computed(() => {
    const filters = this.filters();
    return filters.period ?? (filters.from || filters.to ? CUSTOM_PERIOD : '');
  });

  /** Valor do seletor de responsável. */
  readonly assigneeValue = computed(() => this.filters().assignee ?? this.filters().assignedToUserId ?? '');

  /** Filtros ativos como chips, na ordem da barra. */
  readonly chips = computed((): DashboardFilterChip[] => dashboardFilterChips(this.filters(), this.departments(), this.assignees()));

  /** Abre ou fecha a linha "Mais filtros". */
  toggleMoreFilters(): void {
    this.moreFiltersOpen.update(open => !open);
  }

  /** Valor do seletor de período → troca: pronto, personalizado (começa nos últimos 30 dias) ou nenhum. */
  toPeriod(value: string): Partial<DashboardFilters> {
    if (value === CUSTOM_PERIOD) {
      return { period: undefined, from: addDays(this.today(), -29), to: this.today() };
    }
    const period = value in DASHBOARD_PERIOD_DAYS ? value as DashboardPeriodPreset : undefined;
    return { period, from: undefined, to: undefined };
  }

  /** Valor do seletor de departamento → troca; o setor escolhido fica só se for desse departamento. */
  toDepartment(value: string): Partial<DashboardFilters> {
    const department = this.departments().find(d => d.id === value);
    const sectorId = this.filters().sectorId;
    const keepSector = !department || department.sectors.some(s => s.id === sectorId);
    return { departmentId: department?.id, sectorId: keepSector ? sectorId : undefined };
  }

  /** Valor do seletor de prioridade → prioridade (vazio ou fora da lista = sem filtro). */
  toPriority(value: string): TicketPriority | undefined {
    const priority = Number(value);
    return this.priorityOptions.includes(priority) ? priority : undefined;
  }

  /** Valor do seletor de responsável → troca: "meus", "sem responsável", uma pessoa da lista ou ninguém. */
  toAssignee(value: string): Partial<DashboardFilters> {
    if (value === 'me' || value === 'none') return { assignee: value, assignedToUserId: undefined };
    const person = this.assignees().find(a => a.id === value);
    return { assignee: undefined, assignedToUserId: person?.id };
  }

  /**
   * Troca uma ponta do período personalizado. Campo vazio deixa aquela ponta em aberto ("desde" ou
   * "até"); data inválida ou que inverte o intervalo não vai pra URL e o campo volta pro valor aplicado.
   */
  onDateChange(edge: 'from' | 'to', field: HTMLInputElement): void {
    const value = field.value;
    if (value === '') {
      this.dateError.set(null);
      this.change.emit({ [edge]: undefined });
      return;
    }
    const other = edge === 'from' ? this.filters().to : this.filters().from;
    const inverted = other && isIsoDate(value) && (edge === 'from' ? value > other : value < other);
    if (!isIsoDate(value) || inverted) {
      field.value = this.filters()[edge] ?? '';
      this.dateError.set(edge);
      return;
    }
    this.dateError.set(null);
    this.change.emit({ [edge]: value });
  }
}
