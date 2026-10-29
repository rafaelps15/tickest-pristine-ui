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

  it('explica o que a tela não diz sozinha: filtros do Resumo, busca, regra de exclusão e responsável', async () => {
    const fixture = TestBed.createComponent(DepartmentGuideComponent);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Como os avisos filtram');
    expect(text).toContain('o filtro sai sozinho');
    expect(text).toContain('O que a busca encontra');
    // Os títulos do Guia não repetem os títulos dos cards da tela (DESIGN.md).
    expect(text).not.toMatch(/\bResumo\b/);
    expect(text).toContain('com chamados em andamento não pode ser excluído');
    expect(text).toContain('Responsável');
    // A relação departamento × setor já está no subtítulo e no card: o Guia não repete.
    expect(text).not.toContain('Departamento e setor');
  });

  it('começa fechado até na primeira visita (exceção do DESIGN.md) e lembra quando o usuário abre', async () => {
    const fixture = TestBed.createComponent(DepartmentGuideComponent);
    await fixture.whenStable();

    const toggle = fixture.nativeElement.querySelector('.guide-toggle') as HTMLButtonElement;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    toggle.click();
    await fixture.whenStable();

    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
  });
});
