import { Component, ChangeDetectionStrategy } from '@angular/core';
import { GuideSectionComponent, ScreenGuideComponent } from '../../shared/ui/screen-guide/screen-guide.component';

/**
 * Conteúdo do "Guia da Tela" de Departamentos: explica a relação entre departamento e setor, e
 * como a busca funciona. O card recolhível em si vem de `<app-screen-guide>`.
 */
@Component({
  selector: 'app-department-guide',
  imports: [ScreenGuideComponent, GuideSectionComponent],
  templateUrl: './department-guide.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DepartmentGuideComponent {}
