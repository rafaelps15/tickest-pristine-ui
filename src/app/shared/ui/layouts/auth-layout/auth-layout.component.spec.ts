import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { AuthLayoutComponent } from './auth-layout.component';

/** Tela de autenticação de teste, que a rota põe dentro do card. */
@Component({ template: '<h1>Entrar</h1>' })
class StubAuthPageComponent {}

describe('AuthLayoutComponent', () => {
  /** Tema do documento antes do teste, restaurado no fim. */
  let previousTheme: string | null;

  beforeEach(async () => {
    previousTheme = document.documentElement.getAttribute('data-bs-theme');
    await TestBed.configureTestingModule({
      imports: [AuthLayoutComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([{ path: 'login', component: StubAuthPageComponent }])]
    }).compileComponents();
  });

  afterEach(() => {
    if (previousTheme === null) document.documentElement.removeAttribute('data-bs-theme');
    else document.documentElement.setAttribute('data-bs-theme', previousTheme);
  });

  it('renders the authentication screen of the route inside the card', async () => {
    const fixture = TestBed.createComponent(AuthLayoutComponent);
    await TestBed.inject(Router).navigateByUrl('/login');
    await fixture.whenStable();

    const body = fixture.nativeElement.querySelector('.auth-layout-card .auth-layout-body') as HTMLElement;
    expect(body.querySelector('h1')?.textContent).toBe('Entrar');
  });

  it('forces the light theme, even when the system or the previous screen left the dark one', async () => {
    document.documentElement.setAttribute('data-bs-theme', 'dark');

    const fixture = TestBed.createComponent(AuthLayoutComponent);
    await fixture.whenStable();

    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('light');
  });
});
