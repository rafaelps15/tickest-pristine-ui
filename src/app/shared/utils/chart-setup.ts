import { BarController, BarElement, CategoryScale, Chart, Legend, LinearScale, Tooltip } from 'chart.js';

// Só as peças que os gráficos do sistema usam (barras com eixo de categorias, tooltip e legenda):
// importadas por nome, o build deixa o resto do Chart.js de fora do chunk.
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// Eixos, legenda e tooltip na fonte da interface (Public Sans, passo caption de 0.75rem), não no
// Helvetica/Arial padrão do Chart.js — o canvas não herda a fonte do CSS.
Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
Chart.defaults.font.size = 12;

export { Chart };
