import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { UserListGuideComponent } from './user-list-guide.component';

const STORAGE_KEY = 'tickest.userListGuide.open';

describe('UserListGuideComponent', () => {
  beforeEach(async () => {
    localStorage.removeItem(STORAGE_KEY);

    await TestBed.configureTestingModule({
      imports: [UserListGuideComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  it('mostra a legenda de status a partir das duas badges fixas da tela', async () => {
    const fixture = TestBed.createComponent(UserListGuideComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Ativo');
    expect(text).toContain('Inativo');
    expect(text).toContain('Pode entrar no sistema normalmente.');
  });

  it('explica a diferença entre clicar na linha (consulta) e marcar o checkbox (lote)', async () => {
    const fixture = TestBed.createComponent(UserListGuideComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Clicar numa linha');
    expect(text).toContain('Marcar o checkbox');
  });

  it('explica que o termo de busca não fica salvo no link, por privacidade', async () => {
    const fixture = TestBed.createComponent(UserListGuideComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('não fica salvo no link');
  });

  it('lembra a preferência aberto/fechado na chave própria da tela', async () => {
    const fixture = TestBed.createComponent(UserListGuideComponent);
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('.guide-toggle') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
  });
});
