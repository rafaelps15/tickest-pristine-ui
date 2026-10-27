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

  it('lembra a preferência aberto/fechado na chave própria da tela', async () => {
    const fixture = TestBed.createComponent(DepartmentGuideComponent);
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('.guide-toggle') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
  });
});
