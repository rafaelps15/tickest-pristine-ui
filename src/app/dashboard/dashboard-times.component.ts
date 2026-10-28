import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { TicketAverageTimes, TicketTimeStat } from '../tickets';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mb-4" aria-labelledby="dashboardTimesTitle" [attr.aria-busy]="loading() || null">
      <div class="mb-2">
        <h2 id="dashboardTimesTitle" class="h6 section-label mb-0">Tempos de atendimento</h2>
        <p class="text-muted small mb-0">{{ description() }}</p>
      </div>

      <!-- Resumo pro leitor de tela quando os tempos chegam ou mudam com os filtros (como nos grupos de números). -->
      @if (announce()) {
        <p class="visually-hidden" aria-live="polite">{{ liveSummary() }}</p>
      }

      @if (error()) {
        <div class="alert alert-danger border-0 shadow-sm d-flex align-items-center justify-content-between gap-3 mb-0" role="alert">
          <span><i class="bx bx-error-circle me-1" aria-hidden="true"></i>{{ error() }}</span>
          <button type="button" class="btn btn-sm btn-outline-danger flex-shrink-0" (click)="retry.emit()">Tentar novamente</button>
        </div>
      } @else if (loading() && !times()) {
        <p class="text-muted small mb-0" role="status">
          <span class="spinner-border spinner-border-sm text-primary me-2" aria-hidden="true"></span>Carregando os tempos de atendimento…
        </p>
      } @else if (times(); as data) {
        <!-- Recarga com tempos na tela (troca de filtro): esmaece, como os grupos de números. -->
        <div class="row g-3" [class.times-refreshing]="loading()">
          @for (card of cards(); track card.key) {
            <div class="col-12 col-md-6">
              <div class="card h-100">
                <div class="card-body">
                  <!-- Mesma ordem e mesmos papéis do stat-card: rótulo, número (stat-value), apoio. -->
                  <h3 class="fs-6 fw-normal text-muted mb-0">{{ card.label }}</h3>
                  @if (card.stat.medianMinutes !== null && card.stat.averageMinutes !== null) {
                    <p class="d-flex align-items-baseline gap-2 mt-2 mb-1">
                      <span class="fs-3 stat-value">{{ format(card.stat.medianMinutes) }}</span>
                      <span class="text-muted small">de mediana</span>
                    </p>
                    <p class="text-muted small mb-1">Média {{ format(card.stat.averageMinutes) }} · {{ card.stat.sampleSize }} chamados · horário útil</p>
                  } @else {
                    <p class="fs-5 stat-value mt-2 mb-1">Dados insuficientes</p>
                    <p class="text-muted small mb-1">
                      @if (card.stat.sampleSize === 0) {
                        Nenhum chamado entrou na conta ainda; o cálculo precisa de pelo menos {{ data.minimumSample }}.
                      } @else {
                        Só {{ card.stat.sampleSize === 1 ? '1 chamado entrou' : card.stat.sampleSize + ' chamados entraram' }} na conta;
                        o cálculo precisa de pelo menos {{ data.minimumSample }}.
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
    .times-refreshing {
      opacity: 0.6;
      transition: opacity 150ms ease;
    }
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
  /**
   * Se o próprio grupo anuncia os números ao leitor de tela. A tela desliga quando vários grupos
   * mudam juntos (troca de filtro) e anuncia um resumo só, em vez de uma frase por grupo.
   */
  readonly announce = input(true);

  /** "Tentar novamente". */
  readonly retry = output<void>();

  /** O que entra na conta, conforme o período. */
  readonly description = computed(() => this.hasPeriod()
    ? 'Mediana e média dos chamados respondidos ou resolvidos no período, em horário útil do plano de SLA.'
    : 'Mediana e média de todos os chamados já respondidos ou resolvidos, em horário útil do plano de SLA.');

  /** Os dois tempos, na ordem da jornada do chamado. */
  readonly cards = computed((): TimeCard[] => {
    const times = this.times();
    if (!times) return [];
    return [
      { key: 'firstResponse', label: 'Primeira resposta', hint: 'Da abertura até a primeira mensagem de quem atende.', stat: times.firstResponse },
      { key: 'resolution', label: 'Resolução', hint: 'Da abertura até a primeira resolução.', stat: times.resolution }
    ];
  });

  /** Frase lida pelo leitor de tela quando os tempos chegam ("Tempos médios: primeira resposta, mediana de 1 h 15 min…"). */
  readonly liveSummary = computed(() => {
    if (this.loading() || this.error()) return '';
    const parts = this.cards().map(card => card.stat.medianMinutes !== null
      ? `${card.label.toLowerCase()}, mediana de ${formatBusinessMinutes(card.stat.medianMinutes)}`
      : `${card.label.toLowerCase()}, dados insuficientes`);
    return parts.length ? `Tempos de atendimento: ${parts.join('; ')}.` : '';
  });

  /** Formata minutos úteis pro card. */
  format(minutes: number): string {
    return formatBusinessMinutes(minutes);
  }
}
