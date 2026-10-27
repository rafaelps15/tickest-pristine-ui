import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { DashboardGuideComponent } from './dashboard-guide.component';

const STORAGE_KEY = 'tickest.dashboardGuide.open';

describe('DashboardGuideComponent', () => {
  beforeEach(async () => {
    localStorage.removeItem(STORAGE_KEY);

    await TestBed.configureTestingModule({
      imports: [DashboardGuideComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  it('explica o que cada card de estatística e o gráfico representam', async () => {
    const fixture = TestBed.createComponent(DashboardGuideComponent);
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('.guide-toggle') as HTMLButtonElement).click();
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Total de Tickets');
    expect(text).toContain('Em Aberto');
    expect(text).toContain('Em Andamento');
    expect(text).toContain('Resolvidos');
    expect(text).toContain('Dia, Semana ou Mês');
  });

  it('mantém o corpo no DOM (só escondido), pro aria-controls do botão apontar pra algo que existe', async () => {
    const fixture = TestBed.createComponent(DashboardGuideComponent);
    await fixture.whenStable();

    const controls = (fixture.nativeElement.querySelector('.guide-toggle') as HTMLElement).getAttribute('aria-controls');
    expect(fixture.nativeElement.querySelector(`#${controls}`)).not.toBeNull();
  });

  it('explica "em risco" e "vencido" só pra quem vê os Alertas de SLA', async () => {
    const fixture = TestBed.createComponent(DashboardGuideComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).not.toContain('Alertas de SLA');

    fixture.componentRef.setInput('showSla', true);
    await fixture.whenStable();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Alertas de SLA');
    expect(text).toContain('Em risco:');
    expect(text).toContain('Vencido:');
  });

  it('começa fechado quando não há preferência salva (tela mais visitada do sistema)', async () => {
    const fixture = TestBed.createComponent(DashboardGuideComponent);
    await fixture.whenStable();

    expect((fixture.nativeElement.querySelector('#dashboardGuideBody') as HTMLElement).hidden).toBeTrue();
    expect(fixture.nativeElement.querySelector('button[aria-expanded="false"]')).toBeTruthy();
  });

  it('abre e fecha ao clicar no cabeçalho, e persiste a preferência', async () => {
    const fixture = TestBed.createComponent(DashboardGuideComponent);
    await fixture.whenStable();

    const toggleButton = fixture.nativeElement.querySelector('.guide-toggle') as HTMLButtonElement;
    toggleButton.click();
    await fixture.whenStable();

    expect((fixture.nativeElement.querySelector('#dashboardGuideBody') as HTMLElement).hidden).toBeFalse();
    expect(toggleButton.getAttribute('aria-expanded')).toBe('true');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');

    toggleButton.click();
    await fixture.whenStable();

    expect((fixture.nativeElement.querySelector('#dashboardGuideBody') as HTMLElement).hidden).toBeTrue();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
  });

  it('restaura o painel aberto quando a preferência salva é "true"', async () => {
    localStorage.setItem(STORAGE_KEY, 'true');

    const fixture = TestBed.createComponent(DashboardGuideComponent);
    await fixture.whenStable();

    expect((fixture.nativeElement.querySelector('#dashboardGuideBody') as HTMLElement).hidden).toBeFalse();
  });

  it('começa fechado mesmo que a leitura do localStorage falhe', async () => {
    spyOn(Storage.prototype, 'getItem').and.throwError('bloqueado (ex.: modo privado)');

    const fixture = TestBed.createComponent(DashboardGuideComponent);
    await fixture.whenStable();

    expect((fixture.nativeElement.querySelector('#dashboardGuideBody') as HTMLElement).hidden).toBeTrue();
  });

  it('não quebra ao alternar quando a escrita no localStorage falha', async () => {
    spyOn(Storage.prototype, 'setItem').and.throwError('bloqueado (ex.: modo privado)');
    const fixture = TestBed.createComponent(DashboardGuideComponent);
    await fixture.whenStable();

    const toggleButton = fixture.nativeElement.querySelector('.guide-toggle') as HTMLButtonElement;
    expect(() => toggleButton.click()).not.toThrow();
    await fixture.whenStable();

    expect((fixture.nativeElement.querySelector('#dashboardGuideBody') as HTMLElement).hidden).toBeFalse();
  });
});
