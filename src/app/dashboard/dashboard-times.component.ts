import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { TicketAverageTimes, TicketTimeStat } from '../tickets';
import { DashboardNoticeComponent } from './dashboard-notice.component';

/** Um tempo pronto pra exibir. */
interface TimeCard {
  /** Identificador estável. */
  key: string;
  /** Título do card. */
  label: string;
  /** O que o tempo mede. */
  hint: string;
  /** Números do back-end. */
  stat: TicketTimeStat;
}

/**
 * Minutos úteis em texto curto: "45 min", "3 h 20 min", "120 h". Não converte pra dias: um dia
 * útil depende do calendário do plano de SLA, e o back-end só devolve minutos.
 */
export function formatBusinessMinutes(minutes: number): string {
  const total = Math.round(minutes);
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours >= 100 || rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

/**
 * Tempos médios do Início (primeira resposta e resolução, em minutos úteis): a mediana em
 * destaque (resiste a casos extremos) e a média ao lado. Abaixo da amostra mínima do back-end,
 * mostra "Dados insuficientes" em vez de um número enganoso. Componente de apresentação, com os
 * quatro estados (carregando, erro, vazio e sucesso).
 */
@Component({
  selector: 'app-dashboard-times',
  imports: [DashboardNoticeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="dashboardTimesTitle" [attr.aria-busy]="loading() || null">
      <div class="mb-2">
        <h2 id="dashboardTimesTitle" class="h5 card-title fw-bold mb-1">Tempos de atendimento</h2>
        <p class="text-muted small mb-0">{{ description() }}</p>
      </div>

      @if (error()) {
        <!-- Falha técnica em tom neutro: vermelho fica pro risco operacional (SLA vencido). -->
        <div class="card px-3 py-2"><app-dashboard-notice kind="error" [text]="error()!" (retry)="retry.emit()" /></div>
      } @else if (loading() && !times()) {
        <!-- Esqueleto no formato dos dois cards, como nos grupos de números: a tela não pula quando os tempos chegam. -->
        <div class="row g-3" role="status">
          <span class="visually-hidden">Carregando os tempos de atendimento…</span>
          @for (key of skeletonKeys; track key) {
            <div class="col-12 col-md-6">
              <div class="card times-skeleton" aria-hidden="true">
                <span class="tk-skeleton times-skeleton-label"></span>
                <span class="tk-skeleton times-skeleton-value"></span>
                <span class="tk-skeleton times-skeleton-hint"></span>
              </div>
            </div>
          }
        </div>
      } @else if (times(); as data) {
        <!-- Numa recarga, os tempos ficam como estão: o indicador de atualização é o do cabeçalho da tela. -->
        <div class="row g-3">
          @for (card of cards(); track card.key) {
            <div class="col-12 col-md-6">
              <div class="card h-100">
                <div class="card-body">
                  <!-- Mesma ordem e mesmos papéis do stat-card: rótulo, número (stat-value), apoio. -->
                  <h3 class="fs-6 fw-normal text-muted mb-0">{{ card.label }}</h3>
                  @if (card.stat.medianMinutes !== null && card.stat.averageMinutes !== null) {
                    <p class="d-flex align-items-baseline gap-2 mt-2 mb-1">
                      <span class="fs-4 stat-value">{{ format(card.stat.medianMinutes) }}</span>
                      <span class="text-muted small">de mediana</span>
                    </p>
                    <p class="text-muted small mb-1">Média {{ format(card.stat.averageMinutes) }} · {{ card.stat.sampleSize }} chamados · horário útil</p>
                  } @else {
                    <p class="fs-6 stat-value mt-2 mb-1">Dados insuficientes</p>
                    <p class="text-muted small mb-1">
                      @if (card.stat.sampleSize === 0) {
                        Nenhum chamado entrou na conta ainda; o cálculo precisa de pelo menos {{ data.minimumSampleSize }}.
                      } @else {
                        Só {{ card.stat.sampleSize === 1 ? '1 chamado entrou' : card.stat.sampleSize + ' chamados entraram' }} na conta;
                        o cálculo precisa de pelo menos {{ data.minimumSampleSize }}.
                      }
                    </p>
                  }
                  <p class="text-muted small mb-0">{{ card.hint }}</p>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .times-skeleton {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1.25rem;
      min-height: 8.5rem;
    }

    .times-skeleton-label { width: 40%; height: 0.75rem; }
    .times-skeleton-value { width: 30%; height: 1.75rem; }
    .times-skeleton-hint { width: 70%; height: 0.75rem; }
  `
})
export class DashboardTimesComponent {
  /** Tempos do recorte, ou null enquanto não há resposta. */
  readonly times = input<TicketAverageTimes | null>(null);
  /** Carregando. */
  readonly loading = input(false);
  /** Mensagem de erro, ou null. */
  readonly error = input<string | null>(null);
  /** Se há período escolhido (muda a explicação de quais chamados entram). */
  readonly hasPeriod = input(false);
  /** Complemento da descrição dito pela tela (no escopo "Com filtros", que os tempos seguem os filtros). */
  readonly scopeNote = input('');

  /** "Tentar novamente". */
  readonly retry = output<void>();

  /** Um esqueleto por card de tempo (primeira resposta e resolução). */
  protected readonly skeletonKeys = ['firstResponse', 'resolution'];

  /** O que entra na conta, conforme o período. */
  readonly description = computed(() => (this.hasPeriod()
    ? 'Mediana e média dos chamados respondidos ou resolvidos no período, em horário útil do plano de SLA.'
    : 'Mediana e média de todos os chamados já respondidos ou resolvidos, em horário útil do plano de SLA.') + this.scopeNote());

  /** Os dois tempos, na ordem da jornada do chamado. */
  readonly cards = computed((): TimeCard[] => {
    const times = this.times();
    if (!times) return [];
    return [
      { key: 'firstResponse', label: 'Primeira resposta', hint: 'Da abertura até a primeira mensagem de quem atende.', stat: times.firstResponse },
      { key: 'resolution', label: 'Resolução', hint: 'Da abertura até a primeira resolução.', stat: times.resolution }
    ];
  });

  /** Formata minutos úteis pro card. */
  format(minutes: number): string {
    return formatBusinessMinutes(minutes);
  }
}
