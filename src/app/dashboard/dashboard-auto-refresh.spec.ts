import { DestroyRef } from '@angular/core';
import { DASHBOARD_REFRESH_MS, refreshAnnouncement, refreshDelay, startDashboardAutoRefresh } from './dashboard-auto-refresh';

/** Documento falso: dispara `visibilitychange` e diz se a aba está visível. */
class FakeDocument extends EventTarget {
  visibilityState: DocumentVisibilityState = 'visible';

  /** Troca a visibilidade e avisa, como o navegador. */
  setVisible(visible: boolean): void {
    this.visibilityState = visible ? 'visible' : 'hidden';
    this.dispatchEvent(new Event('visibilitychange'));
  }
}

/** DestroyRef falso, pra encerrar a assinatura no fim do teste. */
function fakeDestroyRef() {
  const callbacks: (() => void)[] = [];
  const ref = { onDestroy: (callback: () => void) => { callbacks.push(callback); return () => undefined; }, destroyed: false } as unknown as DestroyRef;
  return { ref, destroy: () => callbacks.forEach(callback => callback()) };
}

describe('dashboard-auto-refresh', () => {
  // Sem zone.js nos testes (zoneless): o relógio do Jasmine controla os timers do RxJS e o Date.now().
  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 9, 28, 15, 0));
  });

  afterEach(() => jasmine.clock().uninstall());

  /** Avança o relógio falso. */
  const tick = (ms: number) => jasmine.clock().tick(ms);

  it('refreshDelay: o que falta do intervalo, zero se os dados estão velhos, o intervalo inteiro sem carga', () => {
    expect(refreshDelay(null, 1_000)).toBe(DASHBOARD_REFRESH_MS);
    expect(refreshDelay(0, 30_000)).toBe(DASHBOARD_REFRESH_MS - 30_000);
    expect(refreshDelay(0, 10 * 60_000)).toBe(0);
  });

  it('atualiza a cada 2 minutos com a aba visível', () => {
    const doc = new FakeDocument();
    const refresh = jasmine.createSpy('refresh');
    const { ref, destroy } = fakeDestroyRef();
    startDashboardAutoRefresh(doc as unknown as Document, () => null, refresh, ref);

    tick(DASHBOARD_REFRESH_MS - 1);
    expect(refresh).not.toHaveBeenCalled();
    tick(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    tick(DASHBOARD_REFRESH_MS);
    expect(refresh).toHaveBeenCalledTimes(2);

    destroy();
  });

  it('pausa com a aba oculta e, ao voltar com dados velhos, atualiza na hora', () => {
    const doc = new FakeDocument();
    const refresh = jasmine.createSpy('refresh');
    const { ref, destroy } = fakeDestroyRef();
    const loadedAt = Date.now();
    startDashboardAutoRefresh(doc as unknown as Document, () => loadedAt, refresh, ref);

    doc.setVisible(false);
    tick(10 * 60_000);
    expect(refresh).not.toHaveBeenCalled();

    doc.setVisible(true);
    tick(0);
    expect(refresh).toHaveBeenCalledTimes(1);

    destroy();
  });

  it('ao voltar com dados ainda novos, espera só o que falta do intervalo', () => {
    const doc = new FakeDocument();
    const refresh = jasmine.createSpy('refresh');
    const { ref, destroy } = fakeDestroyRef();
    const loadedAt = Date.now();
    startDashboardAutoRefresh(doc as unknown as Document, () => loadedAt, refresh, ref);

    doc.setVisible(false);
    tick(30_000);
    doc.setVisible(true);
    tick(DASHBOARD_REFRESH_MS - 30_000 - 1);
    expect(refresh).not.toHaveBeenCalled();
    tick(1);
    expect(refresh).toHaveBeenCalledTimes(1);

    destroy();
  });

  it('depois de uma atualização manual, recomeça a contagem (não repete logo em seguida)', () => {
    const doc = new FakeDocument();
    const refresh = jasmine.createSpy('refresh');
    const { ref, destroy } = fakeDestroyRef();
    const auto = startDashboardAutoRefresh(doc as unknown as Document, () => null, refresh, ref);

    tick(DASHBOARD_REFRESH_MS - 10_000);
    auto.restart();
    tick(10_000);
    expect(refresh).not.toHaveBeenCalled();
    tick(DASHBOARD_REFRESH_MS - 10_000);
    expect(refresh).toHaveBeenCalledTimes(1);

    destroy();
  });

  it('refreshAnnouncement: a falha diz o que não veio; a volta pelo relógio diz que os números voltaram, pelo botão só "Atualizado agora"', () => {
    expect(refreshAnnouncement('total', true)).toBe('Não foi possível carregar os números');
    expect(refreshAnnouncement('total', false)).toBe('Não foi possível carregar os números');
    expect(refreshAnnouncement('partial', true)).toBe('Não foi possível atualizar os números');
    expect(refreshAnnouncement('partial', false)).toBe('Não foi possível atualizar os números');
    expect(refreshAnnouncement('ok', true)).toBe('Números de volta: atualizado agora');
    expect(refreshAnnouncement('ok', false)).toBe('Atualizado agora');
  });

  it('para de atualizar quando a tela é destruída', () => {
    const doc = new FakeDocument();
    const refresh = jasmine.createSpy('refresh');
    const { ref, destroy } = fakeDestroyRef();
    startDashboardAutoRefresh(doc as unknown as Document, () => null, refresh, ref);

    destroy();
    tick(3 * DASHBOARD_REFRESH_MS);
    expect(refresh).not.toHaveBeenCalled();
  });
});
