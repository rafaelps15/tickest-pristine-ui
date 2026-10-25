import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

/** Chave usada para lembrar se o Guia da Tela ficou aberto ou fechado, entre sessões. */
const GUIDE_OPEN_STORAGE_KEY = 'tickest.dashboardGuide.open';

/** Lê a preferência salva de aberto/fechado; `true` (aberto) se não houver nada salvo ou a leitura falhar. */
function readStoredOpenPreference(): boolean {
  try {
    const saved = localStorage.getItem(GUIDE_OPEN_STORAGE_KEY);
    return saved === null ? true : saved === 'true';
  } catch {
    return true;
  }
}

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
  /** Se o painel está aberto — restaurado do localStorage, sem quebrar a tela se a leitura falhar. */
  protected readonly open = signal(readStoredOpenPreference());

  /** Alterna o painel e salva a preferência, sem quebrar a tela se a escrita falhar. */
  protected toggle(): void {
    const next = !this.open();
    this.open.set(next);

    try {
      localStorage.setItem(GUIDE_OPEN_STORAGE_KEY, String(next));
    } catch {
      // Preferência não persiste nesta sessão (ex.: modo privado); a tela continua funcionando.
    }
  }
}
