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

  it('começa aberto quando não há preferência salva', async () => {
    const fixture = TestBed.createComponent(RoleGuideComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#roleGuideBody')).toBeTruthy();
  });

  it('fecha e abre ao clicar no cabeçalho, e persiste a preferência', async () => {
    const fixture = TestBed.createComponent(RoleGuideComponent);
    await fixture.whenStable();

    const toggleButton = fixture.nativeElement.querySelector('.guide-toggle') as HTMLButtonElement;
    toggleButton.click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#roleGuideBody')).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
  });

  it('restaura o painel fechado quando a preferência salva é "false"', async () => {
    localStorage.setItem(STORAGE_KEY, 'false');

    const fixture = TestBed.createComponent(RoleGuideComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#roleGuideBody')).toBeNull();
  });

  it('não quebra ao alternar quando a escrita no localStorage falha', async () => {
    spyOn(Storage.prototype, 'setItem').and.throwError('bloqueado (ex.: modo privado)');
    const fixture = TestBed.createComponent(RoleGuideComponent);
    await fixture.whenStable();

    const toggleButton = fixture.nativeElement.querySelector('.guide-toggle') as HTMLButtonElement;
    expect(() => toggleButton.click()).not.toThrow();
  });
});
