import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { DepartmentGuideComponent } from './department-guide.component';

const STORAGE_KEY = 'tickest.departmentGuide.open';

describe('DepartmentGuideComponent', () => {
  beforeEach(async () => {
    localStorage.removeItem(STORAGE_KEY);

    await TestBed.configureTestingModule({
      imports: [DepartmentGuideComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  it('explica a relação entre departamento e setor, e como a busca funciona', async () => {
    const fixture = TestBed.createComponent(DepartmentGuideComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Departamento e setor');
    expect(text).toContain('Busca');
    expect(text).toContain('Responsável');
  });

  it('começa aberto quando não há preferência salva', async () => {
    const fixture = TestBed.createComponent(DepartmentGuideComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#departmentGuideBody')).toBeTruthy();
  });

  it('fecha e abre ao clicar no cabeçalho, e persiste a preferência', async () => {
    const fixture = TestBed.createComponent(DepartmentGuideComponent);
    await fixture.whenStable();

    const toggleButton = fixture.nativeElement.querySelector('.guide-toggle') as HTMLButtonElement;
    toggleButton.click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#departmentGuideBody')).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
  });

  it('restaura o painel fechado quando a preferência salva é "false"', async () => {
    localStorage.setItem(STORAGE_KEY, 'false');

    const fixture = TestBed.createComponent(DepartmentGuideComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#departmentGuideBody')).toBeNull();
  });

  it('não quebra ao alternar quando a escrita no localStorage falha', async () => {
    spyOn(Storage.prototype, 'setItem').and.throwError('bloqueado (ex.: modo privado)');
    const fixture = TestBed.createComponent(DepartmentGuideComponent);
    await fixture.whenStable();

    const toggleButton = fixture.nativeElement.querySelector('.guide-toggle') as HTMLButtonElement;
    expect(() => toggleButton.click()).not.toThrow();
  });
});
