import { Component, ChangeDetectionStrategy } from '@angular/core';
import { GuideSectionComponent, ScreenGuideComponent } from '../../shared/ui/screen-guide/screen-guide.component';
import { UserStatusBadgeComponent } from './user-status-badge.component';

/**
 * Conteúdo do "Guia da Tela" de Usuários: legenda de status (Ativo, Convite pendente, Inativo) —
 * as únicas badges fixas desta tela, já que as de função são dinâmicas (cadastradas em "Funções",
 * sem um conjunto fechado pra legendar). O card recolhível em si vem de `<app-screen-guide>`.
 */
@Component({
  selector: 'app-user-list-guide',
  imports: [ScreenGuideComponent, GuideSectionComponent, UserStatusBadgeComponent],
  templateUrl: './user-list-guide.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListGuideComponent {}
