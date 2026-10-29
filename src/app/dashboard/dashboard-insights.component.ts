import { Component, ChangeDetectionStrategy, input, output, signal, computed, effect, untracked, inject, viewChild, afterNextRender, ElementRef, Injector, DestroyRef, PLATFORM_ID } from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { Params, RouterLink } from '@angular/router';
import { TicketMonitorItem, TicketSlaStatus } from '../tickets';
import { formatSlaDuration } from '../shared';
import { DashboardNoticeComponent } from './dashboard-notice.component';

/** De quanto em quanto tempo o prazo relativo ("vence em 2h 14min") é recalculado, com a aba visível. */
const CLOCK_TICK_MS = 30_000;

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
  imports: [DatePipe, RouterLink, DashboardNoticeComponent],
  templateUrl: './dashboard-insights.component.html',
  styleUrl: './dashboard-insights.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardInsightsComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  /** Injetor pro `afterNextRender` do foco depois de uma nova tentativa que deu certo. */
  private readonly injector = inject(Injector);

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
  /** Quando os alertas chegaram (ms) — o "atualizado às" do card. Null sem dados. */
  readonly loadedAtMs = input<number | null>(null);
  /** Atualizando os alertas com a lista anterior ainda na tela — o botão "Atualizar" gira. */
  readonly refreshing = input(false);
  /**
   * Mostra os totais de atrasados e em risco. Com o agregado da operação (spec 026), os totais moram
   * no topo da tela e no grupo de SLA, e os Alertas ficam só com a lista do que agir.
   */
  readonly showTotals = input(true);
  /** Os Alertas seguem os filtros do Início (escopo "Com filtros"): o subtítulo e o vazio dizem isso. */
  readonly filtered = input(false);
  /** Query params do "Ver a fila pelo prazo" (os filtros, no escopo "Com filtros"). */
  readonly queueParams = input<Params>({});

  /** Se "Atribuir" aparece nos alertas sem responsável: a API exige `tickets:assign` pra atribuir a outra pessoa. */
  readonly canAssign = input(true);

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

  /** Título do card, que recebe o foco quando a nova tentativa dá certo. */
  private readonly alertsTitle = viewChild<ElementRef<HTMLElement>>('alertsTitle');

  /** A pessoa pediu "Tentar novamente" no aviso de erro e a tentativa ainda não terminou. */
  private readonly retryPending = signal(false);
  /** A tentativa pedida já começou a carregar (o fim dela é o próximo `loading` falso). */
  private retryStarted = false;

  constructor() {
    // Fim da tentativa pedida no aviso: se deu certo, o aviso (e o botão focado nele) sai da tela e o
    // foco, que cairia no início da página, vai pro título. Se falhou, a pendência acaba aqui — uma
    // atualização automática que dê certo depois não mexe no foco.
    effect(() => {
      const loading = this.loading();
      const failed = !!this.error();
      untracked(() => {
        if (!this.retryPending()) return;
        if (loading) { this.retryStarted = true; return; }
        if (failed && !this.retryStarted) return;
        this.retryPending.set(false);
        this.retryStarted = false;
        if (failed) return;
        // Só depois do desenho o aviso sai da tela e o foco cai no body; se a pessoa já foi pra outro lugar, fica lá.
        afterNextRender(() => {
          const focusLost = !document.activeElement || document.activeElement === document.body;
          if (focusLost) this.alertsTitle()?.nativeElement.focus();
        }, { injector: this.injector });
      });
    });

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
    // Ao voltar pra aba, o relógio anda na hora. Dados novos quem pede é a atualização automática do
    // Início (a cada 2 min, e na volta se estiverem velhos) — pedir aqui também duplicava a requisição.
    const onVisibility = () => tick();
    const intervalId = setInterval(tick, CLOCK_TICK_MS);
    document.addEventListener('visibilitychange', onVisibility);
    this.destroyRef.onDestroy(() => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    });
  }

  /** "Tentar novamente" do aviso de erro: recarrega os alertas e, se der certo, leva o foco ao título. */
  protected retryFromNotice(): void {
    this.retryPending.set(true);
    this.refresh.emit();
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
