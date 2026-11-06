import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { AppComponent } from './app.component';
import { CurrentUserService } from './shared/services/current-user.service';

/** Tela de destino dos testes de navegação. */
@Component({ template: 'destino' })
class TargetComponent { }

/** Deixa o router emitir os eventos da navegação e redesenha (o `whenStable` esperaria a navegação pendente). */
async function settle(fixture: { detectChanges(): void }): Promise<void> {
  await new Promise(resolve => setTimeout(resolve));
  fixture.detectChanges();
}

describe('AppComponent', () => {
  /** Guard pendente: a navegação para `/espera` só termina quando o teste emitir. */
  let guardResult: Subject<boolean>;
  /** Nova tentativa da primeira carga de GET /users/me em andamento, controlada pelo teste. */
  const retrying = signal(false);

  beforeEach(() => {
    guardResult = new Subject<boolean>();
    retrying.set(false);
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'espera', component: TargetComponent, canActivate: [() => guardResult] }]),
        { provide: CurrentUserService, useValue: { retryingFirstLoad: retrying } }
      ]
    });
  });

  /** Host do aviso de nova tentativa, que fica sempre no DOM. */
  function notice(fixture: { nativeElement: HTMLElement }): HTMLElement {
    return fixture.nativeElement.querySelector('app-session-retry-notice') as HTMLElement;
  }

  /** Região viva do aviso, que existe antes do texto para o leitor de tela anunciar. */
  function liveRegion(fixture: { nativeElement: HTMLElement }): HTMLElement | null {
    return fixture.nativeElement.querySelector('app-session-retry-notice [role="status"]');
  }

  it('shows the retry notice while the navigation waits for the user to load', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    TestBed.inject(Router).navigateByUrl('/espera');
    retrying.set(true);
    await settle(fixture);

    expect(notice(fixture).classList).toContain('is-active');
    expect(liveRegion(fixture)?.textContent).toContain('Conectando ao servidor');
  });

  it('announces the notice in a live region that was already in the DOM before', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    const region = liveRegion(fixture);
    expect(region).toBeTruthy();
    expect(region?.textContent?.trim()).toBe('');

    TestBed.inject(Router).navigateByUrl('/espera');
    retrying.set(true);
    await settle(fixture);

    expect(liveRegion(fixture)).toBe(region);
    expect(region?.textContent).toContain('Conectando ao servidor');
  });

  it('hides the notice when the navigation ends', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const navigation = TestBed.inject(Router).navigateByUrl('/espera');
    retrying.set(true);
    await settle(fixture);
    expect(notice(fixture).classList).toContain('is-active');

    guardResult.next(true);
    guardResult.complete();
    await navigation;
    await settle(fixture);

    expect(notice(fixture).classList).not.toContain('is-active');
    expect(liveRegion(fixture)?.textContent?.trim()).toBe('');
  });

  it('does not show the notice on a background retry, with no pending navigation', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    retrying.set(true);
    await fixture.whenStable();

    expect(notice(fixture).classList).not.toContain('is-active');
    expect(liveRegion(fixture)?.textContent?.trim()).toBe('');
  });
});
