/*
 * Regras globais do styles.css que vieram de cópias nos componentes (E-19): o Karma carrega o styles.css, então
 * o estilo calculado no navegador de teste é o mesmo que as telas recebem.
 */
describe('styles.css', () => {
  /** Elementos criados no teste, tirados do documento no fim. */
  const created: HTMLElement[] = [];

  /** Põe o HTML no documento e devolve o primeiro elemento, para ler o estilo calculado. */
  function render(html: string): HTMLElement {
    const host = document.createElement('div');
    host.innerHTML = html;
    document.body.appendChild(host);
    created.push(host);
    return host.firstElementChild as HTMLElement;
  }

  afterEach(() => created.splice(0).forEach(element => element.remove()));

  it('draws the neutral box of a read failure with .load-error-notice, as Departamentos and Funções had', () => {
    const style = getComputedStyle(render('<div class="load-error-notice"><span>Não foi possível carregar.</span></div>'));

    expect(style.display).toBe('flex');
    expect(style.flexWrap).toBe('wrap');
    expect(style.alignItems).toBe('center');
    expect([style.rowGap, style.columnGap]).toEqual(['8px', '12px']);
    expect(style.marginBottom).toBe('16px');
    expect(style.padding).toBe('12px 16px');
    expect(style.borderRadius).toBe('12px');
    expect(style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(style.color).toBe('rgb(95, 111, 130)');
    expect(style.boxShadow).toContain('rgba(105, 108, 255, 0.08)');
  });

  it('gives .info-list-title the same label step as the terms of .info-list', () => {
    const title = getComputedStyle(render('<div class="info-list-title">Descrição</div>'));
    const term = getComputedStyle(render('<dl class="info-list"><dt>Prazo</dt><dd>02/01/2026</dd></dl>').querySelector('dt')!);

    expect(title.textTransform).toBe('uppercase');
    expect(title.fontWeight).toBe('700');
    expect([title.color, title.fontSize, title.letterSpacing]).toEqual([term.color, term.fontSize, term.letterSpacing]);
  });

  it('takes the transition off every .table when the person asks for reduced motion', () => {
    /** Regras de estilo dentro de um `@media` com a condição dada, em todas as folhas que o teste carregou. */
    const rulesInMedia = (condition: string): CSSStyleRule[] => Array.from(document.styleSheets).flatMap(sheet => {
      try {
        return Array.from(sheet.cssRules);
      } catch {
        return [];
      }
    }).filter((rule): rule is CSSMediaRule => rule instanceof CSSMediaRule && rule.conditionText.includes(condition))
      .flatMap(media => Array.from(media.cssRules))
      .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule);

    const tableRules = rulesInMedia('prefers-reduced-motion: reduce').filter(rule => rule.selectorText === '.table');
    expect(tableRules.map(rule => rule.style.getPropertyValue('transition'))).toContain('none');
  });

  it('keeps the fixed-width digits of .num, which the cancel countdown of Meus Chamados uses', () => {
    expect(getComputedStyle(render('<span class="cancel-hint num">por mais 8 min</span>')).fontVariantNumeric).toBe('tabular-nums');
  });
});
