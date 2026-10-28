import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { DashboardGuideComponent } from './dashboard-guide.component';

describe('DashboardGuideComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardGuideComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  /** Cria o guia (anexado ao documento, pra o foco funcionar) e devolve o fixture e o botão que abre. */
  async function setup(inputs: { showOperation?: boolean; showMine?: boolean } = {}) {
    const fixture = TestBed.createComponent(DashboardGuideComponent);
    fixture.componentRef.setInput('showOperation', inputs.showOperation ?? false);
    fixture.componentRef.setInput('showMine', inputs.showMine ?? false);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector('.guide-trigger') as HTMLButtonElement;
    return { fixture, trigger };
  }

  /** O diálogo aberto, ou null. */
  const dialog = () => document.querySelector('[role="dialog"]');

  afterEach(() => document.querySelectorAll('app-dashboard-guide').forEach(element => element.remove()));

  it('começa fechado: só o botão "Guia da tela" no cabeçalho, sem ocupar o corpo da tela', async () => {
    const { trigger } = await setup();

    expect(trigger.textContent).toContain('Guia da tela');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(dialog()).toBeNull();
  });

  it('abre um diálogo centralizado com título acessível', async () => {
    const { fixture, trigger } = await setup();
    trigger.click();
    await fixture.whenStable();

    const box = dialog()!;
    expect(box).not.toBeNull();
    expect(box.getAttribute('aria-modal')).toBe('true');
    const titleId = box.getAttribute('aria-labelledby')!;
    expect(document.getElementById(titleId)?.textContent).toContain('Guia da tela');
  });

  it('fecha com Esc e devolve o foco ao botão que abriu', async () => {
    const { fixture, trigger } = await setup();
    trigger.focus();
    trigger.click();
    await fixture.whenStable();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();

    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('fecha pelo botão visível de fechar', async () => {
    const { fixture, trigger } = await setup();
    trigger.click();
    await fixture.whenStable();

    (document.querySelector('[role="dialog"] .btn-close') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(dialog()).toBeNull();
  });

  it('organiza o conteúdo por bloco: indicadores e gráfico pra todos', async () => {
    const { fixture, trigger } = await setup();
    trigger.click();
    await fixture.whenStable();

    const titles = Array.from(document.querySelectorAll('[role="dialog"] h3')).map(h => h.textContent?.trim());
    expect(titles).toEqual(['Indicadores', 'Gráfico da operação', 'Atualização']);
  });

  it('pra quem atende a fila, explica também filtros, Central de atenção e Alertas de SLA', async () => {
    const { fixture, trigger } = await setup({ showOperation: true });
    trigger.click();
    await fixture.whenStable();

    const titles = Array.from(document.querySelectorAll('[role="dialog"] h3')).map(h => h.textContent?.trim());
    expect(titles).toEqual(['Indicadores', 'Gráfico da operação', 'Filtros', 'Central de atenção', 'Alertas de SLA', 'Atualização']);
    expect(document.querySelector('[role="dialog"]')!.textContent).toContain('75% do prazo');
  });

  it('pra quem abre chamados, explica "Seus chamados" e que a lista mostra só os próprios', async () => {
    const { fixture, trigger } = await setup({ showMine: true });
    trigger.click();
    await fixture.whenStable();

    const text = document.querySelector('[role="dialog"]')!.textContent;
    expect(text).toContain('Seus chamados');
    expect(text).toContain('você vê só os seus');
  });
});
