import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { Role } from '../entities/role';

/**
 * Card "Resumo" de Funções: estatísticas reais, calculadas a partir das funções já carregadas
 * (nenhum endpoint de agregação existe pra isso, mas não precisa — os dados já estão na tela).
 * Componente de apresentação — recebe a lista via `@Input`, não injeta nenhum Store.
 */
@Component({
  selector: 'app-role-insights',
  templateUrl: './role-insights.component.html',
  styleUrl: './role-insights.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoleInsightsComponent {
  /** Funções carregadas na tela. */
  readonly roles = input<Role[]>([]);

  /** Quantidade de funções sem nenhuma permissão atribuída — não dão acesso a nada administrativo. */
  readonly rolesWithoutPermissions = computed(() =>
    this.roles().filter(role => role.permissionCodes.length === 0).length);
}
