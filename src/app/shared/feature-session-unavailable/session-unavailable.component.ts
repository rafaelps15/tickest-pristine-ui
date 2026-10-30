import { Component, inject, computed, ChangeDetectionStrategy, OnInit, ElementRef, viewChild, afterNextRender } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SessionUnavailableReason } from '../entities/current-user';
import { SessionRecoveryStore } from '../application/session-recovery.store';
import { parseSessionUnavailableReason, safeReturnUrl } from '../utils/session-unavailable.util';

/** Título e orientação mostrados para cada motivo de falha. */
const REASON_TEXT: Record<SessionUnavailableReason, { title: string; detail: string }> = {
  'rate-limited': {
    title: 'Muitas requisições em pouco tempo',
    detail: 'O servidor limitou o acesso por alguns instantes. Aguarde cerca de um minuto e tente de novo.'
  },
  offline: {
    title: 'Sem conexão com o servidor',
    detail: 'Verifique sua conexão com a internet e tente de novo.'
  },
  'server-error': {
    title: 'O servidor não respondeu como esperado',
    detail: 'Não conseguimos carregar seus dados agora. Tente de novo em instantes.'
  }
};

/**
 * Tela de sessão indisponível (rota `/sessao-indisponivel`, A-42): a sessão continua salva, mas o usuário
 * logado não pôde ser carregado por uma falha passageira. Em vez de mandar pro login, explica o motivo e
 * deixa tentar de novo ou sair.
 */
@Component({
  selector: 'app-session-unavailable',
  templateUrl: './session-unavailable.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SessionRecoveryStore],
  // Visual compartilhado com as demais telas de autenticação (ver shared/ui/auth-form.css).
  styleUrls: ['../ui/auth-form.css']
})
export class SessionUnavailableComponent implements OnInit {
  /** Rota atual, de onde vêm o motivo e a rota de volta. */
  private readonly route = inject(ActivatedRoute);
  /** Store da tela de sessão indisponível. */
  protected readonly store = inject(SessionRecoveryStore);

  /** Título da tela, que recebe o foco ao abrir pra o leitor de tela anunciar o problema. */
  private readonly heading = viewChild.required<ElementRef<HTMLElement>>('heading');

  /** Rota para onde voltar quando o carregamento der certo (só caminho interno). */
  private returnUrl = '/dashboard';

  /** Título e orientação do motivo atual. */
  protected readonly text = computed(() => REASON_TEXT[this.store.reason()]);

  /** Foca o título depois da primeira renderização, para o leitor de tela anunciar o problema. */
  constructor() {
    afterNextRender(() => this.heading().nativeElement.focus());
  }

  /** Lê o motivo e a rota de volta da URL e inicia a tela. */
  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.returnUrl = safeReturnUrl(params.get('retorno'));
    this.store.start(parseSessionUnavailableReason(params.get('motivo')));
  }

  /** Tenta carregar o usuário de novo. */
  retry(): void {
    this.store.retry(this.returnUrl);
  }

  /** Sai da conta e volta ao login. */
  signOut(): void {
    this.store.signOut();
  }
}
