import { Component, ChangeDetectionStrategy } from '@angular/core';
import { GuideSectionComponent, ScreenGuideComponent } from '../../shared/ui/screen-guide/screen-guide.component';

/**
 * Conteúdo do "Guia da Tela" do Novo Chamado: como o departamento/setor escolhe a fila, o que a
 * prioridade quer dizer e onde o chamado aparece depois. O card vem de `<app-screen-guide>`.
 */
@Component({
  selector: 'app-ticket-create-guide',
  imports: [ScreenGuideComponent, GuideSectionComponent],
  templateUrl: './ticket-create-guide.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketCreateGuideComponent {}
