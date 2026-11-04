import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { AppComponent } from './app.component';
import { CurrentUserService } from './shared';

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
  /** Nova tentativa de GET /users/me em andamento, controlada pelo teste. */
  const retrying = signal(false);

  beforeEach(() => {
    guardResult = new Subject<boolean>();
    retrying.set(false);
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'espera', component: TargetComponent, canActivate: [() => guardResult] }]),
        { provide: CurrentUserService, useValue: { retrying } }
      ]
    });
  });

  it('shows the retry notice while the navigation waits for the user to load', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    TestBed.inject(Router).navigateByUrl('/espera');
    retrying.set(true);
    await settle(fixture);

    const notice = fixture.nativeElement.querySelector('app-session-retry-notice') as HTMLElement;
    expect(notice).toBeTruthy();
    expect(notice.getAttribute('role')).toBe('status');
    expect(notice.textContent).toContain('Conectando ao servidor');
  });

  it('hides the notice when the navigation ends', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const navigation = TestBed.inject(Router).navigateByUrl('/espera');
    retrying.set(true);
    await settle(fixture);
    expect(fixture.nativeElement.querySelector('app-session-retry-notice')).toBeTruthy();

    guardResult.next(true);
    guardResult.complete();
    await navigation;
    await settle(fixture);

    expect(fixture.nativeElement.querySelector('app-session-retry-notice')).toBeNull();
  });

  it('does not show the notice on a background retry, with no pending navigation', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    retrying.set(true);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-session-retry-notice')).toBeNull();
  });
});
