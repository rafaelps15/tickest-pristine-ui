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

  it('starts closed even on the first visit, so it does not push the list below the fold', async () => {
    const fixture = TestBed.createComponent(UserListGuideComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.guide-toggle').getAttribute('aria-expanded')).toBe('false');
  });

  it('shows the legend of the three fixed statuses of the screen, with the shared badge', async () => {
    const fixture = await createOpen();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Ativo');
    expect(text).toContain('Convite pendente');
    expect(text).toContain('Inativo');
    expect(fixture.nativeElement.querySelectorAll('app-user-status-badge').length).toBe(3);
  });

  it('explains what the name and the checkbox do, and who is left out of the batch', async () => {
    const fixture = await createOpen();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('O nome abre o painel');
    expect(text).toContain('a sua conta e quem já está inativo ficam de fora do lote');
  });

  it('explains that the searched term does not go into the link, for privacy', async () => {
    const fixture = await createOpen();

    expect(fixture.nativeElement.textContent).toContain('não vai pro link');
  });

  it('remembers the open/closed preference under the screen own key', async () => {
    const fixture = TestBed.createComponent(UserListGuideComponent);
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('.guide-toggle') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
  });
});
