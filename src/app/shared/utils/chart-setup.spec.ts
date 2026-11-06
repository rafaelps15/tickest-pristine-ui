import { BarController, BarElement, CategoryScale, Legend, LinearScale, Tooltip } from 'chart.js';

/** Carrega o módulo como o `loadChart` faz em produção: por import dinâmico, com o CSS da página já aplicado. */
function loadSetup() {
  return import('./chart-setup');
}

describe('chart-setup', () => {
  it('registers the pieces of the bar charts: the controller, the bar, the category and linear axes, the tooltip and the legend', async () => {
    const { Chart } = await loadSetup();

    expect<unknown>(Chart.registry.getController('bar')).toBe(BarController);
    expect<unknown>(Chart.registry.getElement('bar')).toBe(BarElement);
    expect<unknown>(Chart.registry.getScale('category')).toBe(CategoryScale);
    expect<unknown>(Chart.registry.getScale('linear')).toBe(LinearScale);
    expect<unknown>(Chart.registry.getPlugin('tooltip')).toBe(Tooltip);
    expect<unknown>(Chart.registry.getPlugin('legend')).toBe(Legend);
  });

  it('leaves out the pieces that no screen draws, such as the line chart', async () => {
    const { Chart } = await loadSetup();

    expect(() => Chart.registry.getController('line')).toThrowError(/not a registered controller/);
  });

  it('draws in the font of the interface, at the caption size, instead of the Chart.js default', async () => {
    const { Chart } = await loadSetup();

    expect(Chart.defaults.font.family).toBe(getComputedStyle(document.body).fontFamily);
    expect(Chart.defaults.font.size).toBe(12);
  });
});
