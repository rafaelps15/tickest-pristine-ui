import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { DashboardNoticeComponent } from './dashboard-notice.component';

describe('DashboardNoticeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardNoticeComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  /** Cria o aviso de erro com a frase dada e espera renderizar. */
  async function renderError(text = 'Não foi possível carregar os alertas de SLA.') {
    const fixture = TestBed.createComponent(DashboardNoticeComponent);
    fixture.componentRef.setInput('kind', 'error');
    fixture.componentRef.setInput('text', text);
    const retry = jasmine.createSpy('retry');
    fixture.componentInstance.retry.subscribe(retry);
    await fixture.whenStable();
    const button = () => fixture.nativeElement.querySelector('[role="alert"] button') as HTMLButtonElement;
    const live = () => (fixture.nativeElement.querySelector('[aria-live="polite"]') as HTMLElement).textContent?.trim();
    return { fixture, retry, button, live };
  }

  /** Espera o atraso do aviso de nova falha (limpa e escreve de novo). */
  const afterAnnounceDelay = () => new Promise(resolve => setTimeout(resolve, 150));

  it('sem tentativa em curso, "Tentar novamente" pede a nova carga', async () => {
    const { retry, button } = await renderError();

    expect(button().textContent).toContain('Tentar novamente');
    expect(button().getAttribute('aria-disabled')).toBeNull();
    button().click();
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('com a tentativa em curso, o botão gira, fica aria-disabled (não disabled, o foco fica nele) e não aceita outro clique', async () => {
    const { fixture, retry, button } = await renderError();
    fixture.componentRef.setInput('busy', true);
    await fixture.whenStable();

    expect(button().textContent).toContain('Tentando…');
    expect(button().querySelector('.spinner-border')).not.toBeNull();
    expect(button().disabled).toBeFalse();
    expect(button().getAttribute('aria-disabled')).toBe('true');
    button().click();
    expect(retry).not.toHaveBeenCalled();
  });

  it('se a tentativa pedida no botão falha de novo, o leitor de tela ouve isso uma vez, com a frase do erro', async () => {
    const { fixture, button, live } = await renderError('Falha simulada');
    button().click();
    fixture.componentRef.setInput('busy', true);
    await fixture.whenStable();
    fixture.componentRef.setInput('busy', false);
    await fixture.whenStable();
    await afterAnnounceDelay();

    expect(live()).toBe('Ainda não foi possível. Falha simulada');
    expect(button().textContent).toContain('Tentar novamente');
  });

  it('uma nova tentativa que não veio do botão (a atualização automática) não anuncia nada', async () => {
    const { fixture, live } = await renderError();
    fixture.componentRef.setInput('busy', true);
    await fixture.whenStable();
    fixture.componentRef.setInput('busy', false);
    await fixture.whenStable();
    await afterAnnounceDelay();

    expect(live()).toBe('');
  });

  it('o aviso "em breve" não tem botão nem estado de tentativa', async () => {
    const fixture = TestBed.createComponent(DashboardNoticeComponent);
    fixture.componentRef.setInput('text', 'Tempos de atendimento: disponível em breve.');
    fixture.componentRef.setInput('busy', true);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-live]')).toBeNull();
  });
});
