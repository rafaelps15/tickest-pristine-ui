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

  /** Cria o Guia já aberto (ele começa fechado até na 1ª visita). */
  async function createOpen() {
    localStorage.setItem(STORAGE_KEY, 'true');
    const fixture = TestBed.createComponent(UserListGuideComponent);
    await fixture.whenStable();
    return fixture;
  }

  it('começa fechado até na primeira visita, pra não empurrar a lista pra baixo da dobra', async () => {
    const fixture = TestBed.createComponent(UserListGuideComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.guide-toggle').getAttribute('aria-expanded')).toBe('false');
  });

  it('mostra a legenda dos três status fixos da tela, com o badge compartilhado', async () => {
    const fixture = await createOpen();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Ativo');
    expect(text).toContain('Convite pendente');
    expect(text).toContain('Inativo');
    expect(fixture.nativeElement.querySelectorAll('app-user-status-badge').length).toBe(3);
  });

  it('explica o que o nome e o checkbox fazem, e quem fica fora do lote', async () => {
    const fixture = await createOpen();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('O nome abre o painel');
    expect(text).toContain('a sua conta e quem já está inativo ficam de fora do lote');
  });

  it('explica que o termo buscado não vai pro link, por privacidade', async () => {
    const fixture = await createOpen();

    expect(fixture.nativeElement.textContent).toContain('não vai pro link');
  });

  it('lembra a preferência aberto/fechado na chave própria da tela', async () => {
    const fixture = TestBed.createComponent(UserListGuideComponent);
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('.guide-toggle') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
  });
});
