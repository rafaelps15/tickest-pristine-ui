import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { SessionUnavailableComponent } from './session-unavailable.component';
import { SessionRecoveryStore } from '../application/session-recovery.store';
import { SessionUnavailableReason } from '../entities/current-user';

describe('SessionUnavailableComponent', () => {
  const reason = signal<SessionUnavailableReason>('server-error');
  const retrying = signal(false);
  const failedAttempts = signal(0);
  let storeStub: {
    reason: typeof reason; retrying: typeof retrying; failedAttempts: typeof failedAttempts;
    start: jasmine.Spy; retry: jasmine.Spy; signOut: jasmine.Spy;
  };

  /** Cria a tela com os parâmetros de URL informados. */
  async function render(queryParams: Record<string, string>) {
    TestBed.configureTestingModule({
      imports: [SessionUnavailableComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } } }
      ]
    });
    TestBed.overrideComponent(SessionUnavailableComponent, {
      set: { providers: [{ provide: SessionRecoveryStore, useValue: storeStub }] }
    });
    const fixture = TestBed.createComponent(SessionUnavailableComponent);
    await fixture.whenStable();
    return fixture;
  }

  beforeEach(() => {
    reason.set('server-error');
    retrying.set(false);
    failedAttempts.set(0);
    storeStub = {
      reason, retrying, failedAttempts,
      start: jasmine.createSpy('start').and.callFake((r: SessionUnavailableReason) => reason.set(r)),
      retry: jasmine.createSpy('retry'),
      signOut: jasmine.createSpy('signOut')
    };
  });

  it('mostra o motivo do limite de requisições e diz que a sessão continua ativa', async () => {
    const fixture = await render({ motivo: 'rate-limited', retorno: '/tickets' });
    const text = fixture.nativeElement.textContent as string;

    expect(storeStub.start).toHaveBeenCalledWith('rate-limited');
    expect(text).toContain('Muitas requisições em pouco tempo');
    expect(text).toContain('Sua sessão continua ativa');
  });

  it('tenta de novo voltando para a rota de origem informada', async () => {
    const fixture = await render({ motivo: 'offline', retorno: '/tickets?status=1' });
    const button = [...fixture.nativeElement.querySelectorAll('button')].find((b: HTMLButtonElement) => b.textContent?.includes('Tentar novamente')) as HTMLButtonElement;

    button.click();

    expect(storeStub.retry).toHaveBeenCalledWith('/tickets?status=1');
  });

  it('ignora um retorno para outro site e volta para o Início', async () => {
    const fixture = await render({ motivo: 'offline', retorno: 'https://outro-site.com' });
    const button = [...fixture.nativeElement.querySelectorAll('button')].find((b: HTMLButtonElement) => b.textContent?.includes('Tentar novamente')) as HTMLButtonElement;

    button.click();

    expect(storeStub.retry).toHaveBeenCalledWith('/dashboard');
  });

  it('desabilita os botões e anuncia enquanto tenta de novo', async () => {
    const fixture = await render({ motivo: 'server-error' });
    retrying.set(true);
    await fixture.whenStable();

    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    expect([...buttons].every(b => b.disabled)).toBeTrue();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Tentando carregar seus dados');
  });

  it('anuncia quando a nova tentativa ainda não deu certo', async () => {
    const fixture = await render({ motivo: 'server-error' });
    failedAttempts.set(1);
    reason.set('offline');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Ainda não foi possível');
    expect(fixture.nativeElement.textContent).toContain('Sem conexão com o servidor');
  });

  it('sai da conta pelo botão "Sair da conta"', async () => {
    const fixture = await render({ motivo: 'server-error' });
    const button = [...fixture.nativeElement.querySelectorAll('button')].find((b: HTMLButtonElement) => b.textContent?.includes('Sair da conta')) as HTMLButtonElement;

    button.click();

    expect(storeStub.signOut).toHaveBeenCalled();
  });
});
