import { BarController } from 'chart.js';
import { loadChart } from './chart-loader.util';

describe('loadChart', () => {
  it('loads Chart.js on demand, with the pieces of the bar charts already registered', async () => {
    const { Chart } = await loadChart();

    expect<unknown>(Chart.registry.getController('bar')).toBe(BarController);
  });

  it('loads and registers only once: the next calls reuse the same load', async () => {
    const first = loadChart();

    expect(loadChart()).toBe(first);
    const [module, again] = await Promise.all([first, loadChart()]);
    expect(again.Chart).toBe(module.Chart);
  });
});
