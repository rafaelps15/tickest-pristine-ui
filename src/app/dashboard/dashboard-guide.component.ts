import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';
import { DialogComponent } from '../shared/ui/dialog/dialog.component';

/**
 * "Guia da tela" do Início: um botão discreto no cabeçalho que abre um diálogo centralizado
 * (`<app-dialog>`: foco preso, Esc e X fecham, o foco volta pro botão) com a explicação de cada
 * bloco — filtros, indicadores, gráfico, central de atenção e alertas de SLA. Saiu do corpo da tela,
 * onde empurrava os números pra baixo da dobra.
 */
@Component({
  selector: 'app-dashboard-guide',
  imports: [DialogComponent],
  templateUrl: './dashboard-guide.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .guide-dialog {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    /* Medida confortável de leitura no diálogo largo. */
    .guide-dialog p {
      max-width: 65ch;
    }

    /* Alvo de toque mínimo no celular, como os demais controles do cabeçalho. */
    @media (pointer: coarse) {
      .guide-trigger { min-height: 44px; }
    }
  `
})
export class DashboardGuideComponent {
  /** Mostra as seções da operação (filtros, central de atenção, alertas de SLA) — só pra quem atende a fila. */
  readonly showOperation = input(false);
  /** Mostra a seção "Seus chamados" — só pra quem abre chamados e não atende a fila. */
  readonly showMine = input(false);
  /** O escopo "Com filtros" já tem back-end (muda o que o guia diz sobre filtros e indicadores). */
  readonly filteredAvailable = input(false);
  /** O gráfico por período também segue os filtros (spec 028). */
  readonly flowFilteredAvailable = input(false);

  /** O diálogo está aberto. */
  readonly open = signal(false);
}
