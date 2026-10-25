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

  it('começa aberto quando não há preferência salva', async () => {
    const fixture = TestBed.createComponent(UserListGuideComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#userListGuideBody')).toBeTruthy();
  });

  it('fecha e abre ao clicar no cabeçalho, e persiste a preferência', async () => {
    const fixture = TestBed.createComponent(UserListGuideComponent);
    await fixture.whenStable();

    const toggleButton = fixture.nativeElement.querySelector('.guide-toggle') as HTMLButtonElement;
    toggleButton.click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#userListGuideBody')).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');

    toggleButton.click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#userListGuideBody')).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
  });

  it('restaura o painel fechado quando a preferência salva é "false"', async () => {
    localStorage.setItem(STORAGE_KEY, 'false');

    const fixture = TestBed.createComponent(UserListGuideComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#userListGuideBody')).toBeNull();
  });
});
