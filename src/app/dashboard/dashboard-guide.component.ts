import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { createPersistedToggle, writePersistedToggle } from '../shared';

/** Chave usada para lembrar se o Guia da Tela ficou aberto ou fechado, entre sessões. */
const GUIDE_OPEN_STORAGE_KEY = 'tickest.dashboardGuide.open';

/**
 * Painel "Guia da Tela" do Dashboard: explica o que cada card de estatística representa e como
 * ler o gráfico de volume. Componente de apresentação — não injeta nenhum Store, só texto fixo.
 */
@Component({
  selector: 'app-dashboard-guide',
  templateUrl: './dashboard-guide.component.html',
  styleUrl: './dashboard-guide.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardGuideComponent {
  /** Mostra a seção "Alertas de SLA" — só pra quem vê o card (permissão `tickets:manage`). */
  readonly showSla = input(false);

  /**
   * Se o painel está aberto — restaurado do localStorage, `false` (fechado) se não houver nada
   * salvo: o Dashboard é a tela mais visitada do sistema, então o painel explicativo não deveria
   * empurrar os cards reais pra baixo em toda visita repetida (achado no critique de 2026-10-24).
   */
  protected readonly open = createPersistedToggle(GUIDE_OPEN_STORAGE_KEY, false);

  /** Alterna o painel e salva a preferência, sem quebrar a tela se a escrita falhar. */
  protected toggle(): void {
    const next = !this.open();
    this.open.set(next);
    writePersistedToggle(GUIDE_OPEN_STORAGE_KEY, next);
  }
}
