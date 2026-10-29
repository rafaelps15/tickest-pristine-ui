import { Component, ChangeDetectionStrategy } from '@angular/core';

/**
 * Prévia de "Atividade da Equipe" de Usuários: só aparece em telas muito largas, no espaço que
 * sobra ao lado da tabela — mesmo padrão de insight que consoles de gestão de usuário de alto
 * nível (Okta, Azure AD/Entra, Auth0) mostram ao lado da listagem: atividade recente e
 * distribuição por papel. Conteúdo 100% estático e claramente marcado como "Em breve" — ainda não
 * existe nenhum endpoint de agregação (cadastros recentes, distribuição por função, atividade de
 * login) pra alimentar isso com dado real (R-03: nenhum número aqui é inventado).
 */
@Component({
  selector: 'app-user-list-insights',
  templateUrl: './user-list-insights.component.html',
  styleUrl: './user-list-insights.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListInsightsComponent {}
