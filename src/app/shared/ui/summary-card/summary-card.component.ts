import { Component, ChangeDetectionStrategy, input } from '@angular/core';

/**
 * Card "Resumo" de uma tela administrativa (Departamentos, Funções): título com ícone e os números
 * projetados em `.insights-section`. Enquanto a lista carrega, ou quando ela falhou, mostra "—" e
 * o motivo em vez do conteúdo — por contrato, nunca um `0` de fallback nem uma afirmação ("todas
 * têm permissão") calculada sobre uma lista que ainda não chegou.
 */
@Component({
  selector: 'app-summary-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block mb-3' },
  template: `
    <div class="card insights-card h-100" [attr.aria-busy]="loading() || null">
      <div class="card-body">
        <div class="d-flex align-items-center gap-2 mb-2">
          <i class="bx {{ icon() }} fs-5 text-muted" aria-hidden="true"></i>
          <h2 class="h6 fw-bold mb-0">{{ title() }}</h2>
        </div>

        @if (loading() || failed()) {
          <div class="insights-section mb-0">
            <div class="insights-stat" aria-hidden="true">—</div>
            <p class="text-muted small mb-0">{{ loading() ? 'Carregando o resumo…' : 'Resumo indisponível enquanto a lista não carregar.' }}</p>
          </div>
        } @else {
          <ng-content />
        }
      </div>
    </div>
  `
})
export class SummaryCardComponent {
  /** Título do card. */
  readonly title = input('Resumo');
  /** Classe do ícone Boxicons ao lado do título. */
  readonly icon = input('bx-bar-chart-alt-2');
  /** A lista de onde saem os números ainda está carregando. */
  readonly loading = input(false);
  /** A lista de onde saem os números falhou ao carregar. */
  readonly failed = input(false);
}
