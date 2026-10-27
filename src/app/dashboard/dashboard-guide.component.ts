import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { GuideSectionComponent, ScreenGuideComponent } from '../shared/ui/screen-guide/screen-guide.component';

/**
 * Conteúdo do "Guia da Tela" do Dashboard: explica o que cada card de estatística representa e
 * como ler o gráfico de volume. O card recolhível em si vem de `<app-screen-guide>` — aberto por
 * padrão como nas demais telas (decisão de 2026-10-27), lembrando se o usuário o fechou.
 */
@Component({
  selector: 'app-dashboard-guide',
  imports: [ScreenGuideComponent, GuideSectionComponent],
  templateUrl: './dashboard-guide.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardGuideComponent {
  /** Mostra a seção "Alertas de SLA" — só pra quem vê o card (permissão `tickets:manage`). */
  readonly showSla = input(false);
  /** Mostra a seção "Seus chamados" — só pra quem vê esse bloco (abre chamados e não atende a fila). */
  readonly showMine = input(false);
}
