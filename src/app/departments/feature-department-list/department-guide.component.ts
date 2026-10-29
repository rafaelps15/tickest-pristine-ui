import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

/** Chave usada para lembrar se o Guia da Tela ficou aberto ou fechado, entre sessões. */
const GUIDE_OPEN_STORAGE_KEY = 'tickest.departmentGuide.open';

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
 * Painel "Guia da Tela" de Departamentos: explica a relação entre departamento e setor, e como a
 * busca funciona. Componente de apresentação — não injeta nenhum Store, só texto fixo.
 */
@Component({
  selector: 'app-department-guide',
  templateUrl: './department-guide.component.html',
  styleUrl: './department-guide.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DepartmentGuideComponent {
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
