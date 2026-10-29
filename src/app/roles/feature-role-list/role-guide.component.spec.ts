import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { RoleGuideComponent } from './role-guide.component';

const STORAGE_KEY = 'tickest.roleGuide.open';

describe('RoleGuideComponent', () => {
  beforeEach(async () => {
    localStorage.removeItem(STORAGE_KEY);

    await TestBed.configureTestingModule({
      imports: [RoleGuideComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  it('explica o que é uma função e como as permissões funcionam', async () => {
    const fixture = TestBed.createComponent(RoleGuideComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('O que é uma função');
    expect(text).toContain('Permissões');
    expect(text).toContain('Administrador');
  });

  it('lembra a preferência aberto/fechado na chave própria da tela', async () => {
    const fixture = TestBed.createComponent(RoleGuideComponent);
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('.guide-toggle') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
  });
});
