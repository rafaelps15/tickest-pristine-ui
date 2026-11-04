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

  it('with no attempt in progress, "Tentar novamente" requests the new load', async () => {
    const { retry, button } = await renderError();

    expect(button().textContent).toContain('Tentar novamente');
    expect(button().getAttribute('aria-disabled')).toBeNull();
    button().click();
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('with the attempt in progress, the button spins, becomes aria-disabled (not disabled, so focus stays on it) and does not accept another click', async () => {
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

  it('if the attempt requested from the button fails again, the screen reader hears it once, with the error sentence', async () => {
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

  it('a new attempt that did not come from the button (the automatic refresh) announces nothing', async () => {
    const { fixture, live } = await renderError();
    fixture.componentRef.setInput('busy', true);
    await fixture.whenStable();
    fixture.componentRef.setInput('busy', false);
    await fixture.whenStable();
    await afterAnnounceDelay();

    expect(live()).toBe('');
  });

  it('the "em breve" notice has no button and no attempt state', async () => {
    const fixture = TestBed.createComponent(DashboardNoticeComponent);
    fixture.componentRef.setInput('text', 'Tempos de atendimento: disponível em breve.');
    fixture.componentRef.setInput('busy', true);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-live]')).toBeNull();
  });
});
