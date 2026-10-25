import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { UserListInsightsComponent } from './user-list-insights.component';

describe('UserListInsightsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserListInsightsComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  it('mostra as três prévias de "Atividade da Equipe", claramente marcadas como "Em breve"', async () => {
    const fixture = TestBed.createComponent(UserListInsightsComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Atividade da Equipe');
    expect(text).toContain('Em breve');
    expect(text).toContain('Cadastros recentes');
    expect(text).toContain('Distribuição por função');
    expect(text).toContain('Atividade de login');
  });

  it('não promete as métricas como roadmap confirmado, só como exemplo', async () => {
    const fixture = TestBed.createComponent(UserListInsightsComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('exemplos do que poderia vir aqui');
  });
});
