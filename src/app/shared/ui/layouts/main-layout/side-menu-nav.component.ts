import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SessionService } from '../../../services/session.service';
import { TICKETS_MANAGE_PERMISSION } from '../../../entities/permission-codes';

/**
 * Itens do menu lateral da área autenticada, agrupados em "Principal" e "Administração": cada item de
 * administração só aparece com a permissão que a tela exige. Abrir, fechar e prender o foco ficam no
 * `MainLayoutComponent`, que envolve esta lista.
 */
@Component({
  selector: 'app-side-menu-nav',
  imports: [RouterModule],
  templateUrl: './side-menu-nav.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './side-menu-nav.component.css'
})
export class SideMenuNavComponent {
  /** Sessão: permissões que decidem os itens do menu (Meus Chamados e os de administração). */
  protected readonly sessionService = inject(SessionService);

  /** Permissão de atender a fila, que mostra "Monitorar Chamados" e a seção de administração. */
  protected readonly ticketsManagePermission = TICKETS_MANAGE_PERMISSION;

  /** Item de tickets ativo para a URL atual (ver `activeTicketsMenu`). */
  readonly activeTicketsItem = input<'mine' | 'monitor' | null>(null);
}
