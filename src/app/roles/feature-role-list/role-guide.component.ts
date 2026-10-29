import { Component, ChangeDetectionStrategy } from '@angular/core';
import { GuideSectionComponent, ScreenGuideComponent } from '../../shared/ui/screen-guide/screen-guide.component';

/**
 * Conteúdo do "Guia da Tela" de Funções: explica o que é uma função e como as permissões
 * funcionam. O card recolhível em si vem de `<app-screen-guide>`.
 */
@Component({
  selector: 'app-role-guide',
  imports: [ScreenGuideComponent, GuideSectionComponent],
  templateUrl: './role-guide.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoleGuideComponent {}
