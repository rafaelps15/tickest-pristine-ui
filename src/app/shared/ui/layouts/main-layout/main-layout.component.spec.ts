import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MainLayoutComponent, activeTicketsMenu } from './main-layout.component';

describe('MainLayoutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
  });

  it('abre e fecha o menu off-canvas por botões com nome acessível e aria-expanded', async () => {
    const fixture = TestBed.createComponent(MainLayoutComponent);
    await fixture.whenStable();

    const openButton = fixture.nativeElement.querySelector('button[aria-label="Abrir menu"]') as HTMLButtonElement;
    const closeButton = fixture.nativeElement.querySelector('button[aria-label="Fechar menu"]') as HTMLButtonElement;
    expect(openButton).withContext('o ☰ deve ser um <button> rotulado, não um link javascript:void(0)').toBeTruthy();
    expect(closeButton).toBeTruthy();
    expect(openButton.getAttribute('aria-expanded')).toBe('false');

    openButton.click();
    await fixture.whenStable();
    expect(openButton.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('.layout-wrapper').classList).toContain('menu-open');

    closeButton.click();
    await fixture.whenStable();
    expect(openButton.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('activeTicketsMenu', () => {
  it('ativa "Meus Tickets" na lista, no Novo Ticket e no detalhe', () => {
    expect(activeTicketsMenu('/tickets')).toBe('mine');
    expect(activeTicketsMenu('/tickets?page=2')).toBe('mine');
    expect(activeTicketsMenu('/tickets/novo')).toBe('mine');
    expect(activeTicketsMenu('/tickets/8cc6644c-af6d-4c71-bb70-74d713b42cf0')).toBe('mine');
  });

  it('ativa "Monitorar Tickets" no Monitor e no detalhe aberto a partir dele', () => {
    expect(activeTicketsMenu('/tickets/monitorar')).toBe('monitor');
    expect(activeTicketsMenu('/tickets/monitorar?status=1')).toBe('monitor');
    expect(activeTicketsMenu('/tickets/t1?from=monitor')).toBe('monitor');
  });

  it('não ativa nenhum item de tickets fora de /tickets', () => {
    expect(activeTicketsMenu('/dashboard')).toBeNull();
    expect(activeTicketsMenu('/usuarios')).toBeNull();
  });
});
