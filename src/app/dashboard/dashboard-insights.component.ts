import { Component, ChangeDetectionStrategy, input, signal, computed, effect, inject, DestroyRef, PLATFORM_ID } from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TicketMonitorItem, TicketSlaStatus } from '../tickets';

/** De quanto em quanto tempo o prazo relativo ("vence em 2h 14min") é recalculado, com a aba visível. */
const CLOCK_TICK_MS = 30_000;

/** Item do card já com o prazo relativo e a situação efetiva (vencido mesmo que a API ainda diga "em risco"). */
interface CriticalTicketView {
  /** Chamado vindo da API. */
  ticket: TicketMonitorItem;
  /** Se o prazo já passou, pela hora do servidor — ou se a API já o marcou como vencido. */
  overdue: boolean;
  /** Prazo relativo em pt-BR: "vence em 2h 14min" / "venceu há 35 min". */
  relative: string;
}

/**
 * Formata uma duração (ms) em pt-BR curto pro prazo relativo do card: "menos de 1 min", "35 min",
 * "2h 14min", "3 dias". É hora de relógio (o prazo do SLA já vem calculado em data absoluta pela API).
 */
export function formatSlaDuration(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return 'menos de 1 min';
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 24 * 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest === 0 ? `${hours}h` : `${hours}h ${rest}min`;
  }
  const days = Math.floor(minutes / (24 * 60));
  return days === 1 ? '1 dia' : `${days} dias`;
}

/**
 * Card "Alertas de SLA" do topo da coluna direita do Dashboard: totais de vencidos e em risco da
 * empresa (cada um levando à fila filtrada) e até 5 chamados críticos, o vencido há mais tempo
 * primeiro, cada um linkando pro detalhe do ticket — com o prazo relativo andando sozinho a cada
 * 30s, ancorado na hora do servidor (`clockOffsetMs`). Componente de apresentação — recebe a lista
 * já pronta via `input()`, não injeta nenhum Store (quem busca é o `TicketSummaryStore` do
 * componente pai, único lugar que sabe se o usuário logado tem a permissão `tickets:manage`).
 */
@Component({
  selector: 'app-dashboard-insights',
  imports: [DatePipe, RouterLink],
  templateUrl: './dashboard-insights.component.html',
  styleUrl: './dashboard-insights.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardInsightsComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  /** Chamados com SLA vencido ou em risco, do prazo mais antigo pro mais novo. */
  readonly criticalTickets = input<TicketMonitorItem[]>([]);
  /** Total de chamados ativos com SLA vencido na empresa. */
  readonly breachedCount = input(0);
  /** Total de chamados ativos com SLA em risco na empresa. */
  readonly atRiskCount = input(0);
  /** Diferença (ms) entre o relógio do servidor e o do navegador — `Date.now() + clockOffsetMs` é a hora do servidor. */
  readonly clockOffsetMs = input(0);
  /** Carregando a lista de chamados em risco de SLA. */
  readonly loading = input(false);
  /** Mensagem de erro ao buscar os chamados em risco de SLA, se a busca falhar. */
  readonly error = input<string | null>(null);

  /** Enum exposto ao template, pra montar o filtro da fila nos totais. */
  protected readonly TicketSlaStatus = TicketSlaStatus;

  /** Relógio local (ms), avançado a cada 30s com a aba visível — dispara o recálculo do prazo relativo. */
  protected readonly nowMs = signal(Date.now());

  /** Itens com prazo relativo e situação efetiva, recalculados a cada tick do relógio. */
  protected readonly items = computed<CriticalTicketView[]>(() => {
    const serverNow = this.nowMs() + this.clockOffsetMs();
    return this.criticalTickets().map(ticket => {
      const diff = new Date(ticket.dueAtUtc).getTime() - serverNow;
      return {
        ticket,
        overdue: diff < 0 || ticket.slaStatus === TicketSlaStatus.Breached,
        relative: diff < 0 ? `venceu há ${formatSlaDuration(-diff)}` : `vence em ${formatSlaDuration(diff)}`
      };
    });
  });

  /** Quantos itens listados a API mandou como "em risco" mas já passaram do prazo com a tela aberta. */
  private readonly crossedCount = computed(() =>
    this.items().filter(item => item.overdue && item.ticket.slaStatus === TicketSlaStatus.AtRisk).length);

  /** Total de vencidos exibido: o da API mais os que viraram na tela, pra bater com as etiquetas da lista. */
  protected readonly shownBreachedCount = computed(() => this.breachedCount() + this.crossedCount());

  /** Total de em risco exibido: o da API menos os que já venceram na tela. */
  protected readonly shownAtRiskCount = computed(() => Math.max(0, this.atRiskCount() - this.crossedCount()));

  /** Aviso pro leitor de tela (região `aria-live`) quando um item cruza o prazo com a tela aberta. */
  protected readonly announcement = signal('');

  /** Situação já vista de cada chamado (id → vencido?), pra só anunciar a virada, não a carga inicial. */
  private readonly seenOverdue = new Map<string, boolean>();

  constructor() {
    // Anuncia só a transição "em risco → vencido" de um item que já estava na tela; dados novos
    // (primeira carga, recarga) entram no mapa calados.
    effect(() => {
      for (const { ticket, overdue } of this.items()) {
        if (overdue && this.seenOverdue.get(ticket.id) === false) {
          this.announcement.set(`O ticket "${ticket.title}" venceu o prazo de SLA.`);
        }
        this.seenOverdue.set(ticket.id, overdue);
      }
    });

    if (!isPlatformBrowser(this.platformId)) return;

    const tick = () => {
      if (!document.hidden) this.nowMs.set(Date.now());
    };
    const intervalId = setInterval(tick, CLOCK_TICK_MS);
    // Ao voltar pra aba, atualiza na hora em vez de esperar o próximo tick.
    document.addEventListener('visibilitychange', tick);
    this.destroyRef.onDestroy(() => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', tick);
    });
  }
}
