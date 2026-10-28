import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { DashboardVolumeChartComponent } from './dashboard-volume-chart.component';

describe('DashboardVolumeChartComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardVolumeChartComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])]
    }).compileComponents();
  });

  /** Cria o gráfico com os inputs informados. */
  async function create(inputs: Record<string, unknown>) {
    const fixture = TestBed.createComponent(DashboardVolumeChartComponent);
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    await fixture.whenStable();
    return fixture;
  }

  it('mostra o período escolhido nas datas e avisa que segue os filtros', async () => {
    const fixture = await create({ points: [{ periodStart: '2026-10-27', count: 3 }], range: { from: '2026-10-01', to: '2026-10-28' }, filtered: true });

    expect(fixture.nativeElement.textContent).toContain('De 01/10/2026 a 28/10/2026 · com os filtros acima');
  });

  it('sem período, diz a janela pelo agrupamento', async () => {
    const fixture = await create({ points: [], groupBy: 'Week' });

    expect(fixture.nativeElement.textContent).toContain('Últimas 12 semanas');
  });

  it('avisa a troca de agrupamento e o "Tentar novamente"', async () => {
    const fixture = await create({ failed: true });
    const groupings: string[] = [];
    let retried = false;
    fixture.componentInstance.groupByChange.subscribe(g => groupings.push(g));
    fixture.componentInstance.retry.subscribe(() => retried = true);

    const month = Array.from(fixture.nativeElement.querySelectorAll('.btn-group button') as NodeListOf<HTMLButtonElement>).find(b => b.textContent?.includes('Mês'))!;
    month.click();
    (fixture.nativeElement.querySelector('.chart-container button') as HTMLButtonElement).click();

    expect(groupings).toEqual(['Month']);
    expect(retried).toBeTrue();
  });

  it('a tabela acessível rotula os meses e mostra os resolvidos quando existem', async () => {
    const fixture = await create({ groupBy: 'Month', points: [{ periodStart: '2026-10-01', count: 4, resolvedCount: 3 }] });

    (Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).find(b => b.textContent?.includes('Ver como tabela'))!).click();
    await fixture.whenStable();

    const row = fixture.nativeElement.querySelector('table tbody tr') as HTMLElement;
    expect(row.textContent).toContain('out/26');
    expect(row.textContent).toContain('4');
    expect(row.textContent).toContain('3');
    expect(fixture.nativeElement.textContent).toContain('Criados x Resolvidos');
  });
});
