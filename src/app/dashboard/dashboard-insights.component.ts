import { Component, ChangeDetectionStrategy, input, output, signal, computed, effect, inject, DestroyRef, PLATFORM_ID } from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TicketMonitorItem, TicketSlaStatus } from '../tickets';
import { formatSlaDuration } from '../shared';

/** De quanto em quanto tempo o prazo relativo ("vence em 2h 14min") é recalculado, com a aba visível. */
const CLOCK_TICK_MS = 30_000;

/** Idade a partir da qual a lista é recarregada ao voltar pra aba (não é polling: só na volta). */
const STALE_AFTER_MS = 5 * 60_000;

/** Duração do realce de um item que acabou de vencer — o mesmo tempo da animação `.just-crossed` no CSS. */
const HIGHLIGHT_MS = 1_600;

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
  /** Quando os alertas chegaram (ms) — "Atualizado às" e a recarga ao voltar pra aba. Null sem dados. */
  readonly loadedAtMs = input<number | null>(null);
  /** Atualizando os alertas com a lista anterior ainda na tela — o botão "Atualizar" gira. */
  readonly refreshing = input(false);

  /** Pede pra recarregar só os alertas ("Atualizar", "Tentar novamente" ou volta pra aba depois de um tempo). */
  readonly refresh = output<void>();
  /** Pede pra atribuir um responsável ao chamado de um alerta sem dono — quem usa abre o diálogo de atribuição. */
  readonly assign = output<TicketMonitorItem>();

  /** Enum exposto ao template, pra montar o filtro da fila nos totais. */
  protected readonly TicketSlaStatus = TicketSlaStatus;

  /** Relógio local (ms), avançado a cada 30s com a aba visível — dispara o recálculo do prazo relativo. */
  protected readonly nowMs = signal(Date.now());

  /** Há alertas pra listar (carregado, sem erro, com pelo menos um chamado) — a faixa mostra a coluna da lista. */
  protected readonly hasAlerts = computed(() => !this.loading() && !this.error() && this.criticalTickets().length > 0);

  /** Fila em dia (carregado, sem erro, nenhum alerta): a faixa vira uma linha compacta. */
  protected readonly isQuiet = computed(() => !this.loading() && !this.error() && this.criticalTickets().length === 0);

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

  /**
   * Ids que acabaram de cruzar o prazo com a tela aberta — recebem um realce breve (`.just-crossed`)
   * pra explicar a mudança de etiqueta, e saem do conjunto quando a animação termina.
   */
  protected readonly justCrossedIds = signal<ReadonlySet<string>>(new Set());

  /** Situação já vista de cada chamado (id → vencido?), pra só anunciar a virada, não a carga inicial. */
  private readonly seenOverdue = new Map<string, boolean>();

  /** Timers que tiram cada id de `justCrossedIds` — limpos se o card for destruído antes. */
  private readonly highlightTimers = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    // Anuncia (e realça) só a transição "em risco → vencido" de um item que já estava na tela;
    // dados novos (primeira carga, recarga) entram no mapa calados.
    effect(() => {
      for (const { ticket, overdue } of this.items()) {
        if (overdue && this.seenOverdue.get(ticket.id) === false) {
          this.announcement.set(`O chamado "${ticket.title}" está atrasado.`);
          this.highlightCrossed(ticket.id);
        }
        this.seenOverdue.set(ticket.id, overdue);
      }
    });
    this.destroyRef.onDestroy(() => this.highlightTimers.forEach(clearTimeout));

    if (!isPlatformBrowser(this.platformId)) return;

    const tick = () => {
      if (!document.hidden) this.nowMs.set(Date.now());
    };
    // Ao voltar pra aba: o relógio anda na hora e, se a lista é mais velha que STALE_AFTER_MS, pede
    // dados novos — sem isso o relógio vivo dava a impressão de "agora" sobre uma lista de horas atrás.
    const onVisibility = () => {
      tick();
      const loadedAt = this.loadedAtMs();
      if (!document.hidden && loadedAt !== null && !this.refreshing() && Date.now() - loadedAt > STALE_AFTER_MS) {
        this.refresh.emit();
      }
    };
    const intervalId = setInterval(tick, CLOCK_TICK_MS);
    document.addEventListener('visibilitychange', onVisibility);
    this.destroyRef.onDestroy(() => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    });
  }

  /** Marca o item que acabou de vencer pelo tempo do realce (`HIGHLIGHT_MS`) e depois o desmarca. */
  private highlightCrossed(ticketId: string): void {
    this.justCrossedIds.update(ids => new Set(ids).add(ticketId));
    const timer = setTimeout(() => {
      this.highlightTimers.delete(timer);
      this.justCrossedIds.update(ids => {
        const next = new Set(ids);
        next.delete(ticketId);
        return next;
      });
    }, HIGHLIGHT_MS);
    this.highlightTimers.add(timer);
  }
}
