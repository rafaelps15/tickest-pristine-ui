import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection, signal, viewChild } from '@angular/core';
import { provideRouter } from '@angular/router';
import { PageCrumb, PageHeaderComponent } from './page-header.component';

/** Tela de teste com trilha, subtítulo, ação e um trecho extra projetado no título. */
@Component({
  imports: [PageHeaderComponent],
  template: `
    <app-page-header [title]="title()" [subtitle]="subtitle()" [crumbs]="crumbs()">
      <strong pageTitle>{{ extra() }}</strong>
      <button pageActions type="button" class="btn btn-primary">Novo</button>
    </app-page-header>
  `
})
class HostComponent {
  /** Título passado ao cabeçalho. */
  readonly title = signal('Funções');
  /** Subtítulo passado ao cabeçalho. */
  readonly subtitle = signal<string | null>('O que cada função permite.');
  /** Trilha passada ao cabeçalho. */
  readonly crumbs = signal<PageCrumb[]>([{ label: 'Administração' }, { label: 'Usuários', link: '/usuarios' }]);
  /** Trecho extra projetado dentro do h1. */
  readonly extra = signal('');
  /** Cabeçalho renderizado, pra chamar `focus()`. */
  readonly header = viewChild.required(PageHeaderComponent);
}

describe('PageHeaderComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])]
    }).compileComponents();
  });

  it('renders the title as the only h1 of the screen, with the breadcrumb outside it', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const headings = fixture.nativeElement.querySelectorAll('h1');
    expect(headings.length).toBe(1);
    expect(headings[0].textContent.trim()).toBe('Funções');

    const nav = fixture.nativeElement.querySelector('nav[aria-label="Trilha"]') as HTMLElement;
    expect(nav.textContent).toContain('Administração');
    expect(headings[0].textContent).not.toContain('Administração');
  });

  it('turns into links only the breadcrumb levels that have a route', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const links = fixture.nativeElement.querySelectorAll('.page-crumbs a') as NodeListOf<HTMLAnchorElement>;
    expect(links.length).toBe(1);
    expect(links[0].textContent?.trim()).toBe('Usuários');
    expect(links[0].getAttribute('href')).toBe('/usuarios');
  });

  it('renders neither breadcrumb nor subtitle when they were not passed', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.crumbs.set([]);
    fixture.componentInstance.subtitle.set(null);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('nav')).toBeNull();
    expect(fixture.nativeElement.querySelector('.page-subtitle')).toBeNull();
  });

  it('shows the subtitle and the projected actions', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.page-subtitle').textContent).toContain('O que cada função permite.');
    expect(fixture.nativeElement.querySelector('.page-actions button').textContent).toContain('Novo');
  });

  it('appends to the h1 the content marked with [pageTitle]', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.title.set('');
    fixture.componentInstance.extra.set('Bom dia, Ana!');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe('Bom dia, Ana!');
  });

  it('moves focus to the title with focus()', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    document.body.appendChild(fixture.nativeElement);

    fixture.componentInstance.header().focus();

    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('h1'));
    fixture.nativeElement.remove();
  });
});
