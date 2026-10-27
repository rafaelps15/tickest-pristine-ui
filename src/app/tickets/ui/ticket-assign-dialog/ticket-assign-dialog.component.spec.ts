import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TicketAssignDialogComponent } from './ticket-assign-dialog.component';
import { UserSummary } from '../../../users';
import { clearRoleColor, setRoleColor } from '../../../shared';

const candidate: UserSummary = {
  id: 'u2', email: 'joao.pedro@empresa.com', firstName: 'João', lastName: 'Pedro',
  roles: [{ name: 'Atendente' }], isActive: true, createdAtUtc: '2025-01-01T12:00:00Z', deactivatedAtUtc: null
};
const other: UserSummary = { ...candidate, id: 'u3', firstName: 'Ana', lastName: 'Lima', email: 'ana.lima@empresa.com' };

/** Tela de teste que liga o diálogo como as telas reais (detalhe e Monitorar). */
@Component({
  imports: [TicketAssignDialogComponent],
  template: `
    <app-ticket-assign-dialog ticketTitle="Impressora parada" [currentName]="currentName()" currentUserId="u9"
                              [candidates]="candidates()" [searching]="searching()" [searchError]="searchError()"
                              [saving]="saving()" [error]="error()"
                              (search)="searches.push($event)" (confirm)="confirmed.push($event)" (closed)="closedCount = closedCount + 1" />
  `
})
class HostComponent {
  /** Responsável atual do chamado. */
  readonly currentName = signal<string | null>(null);
  /** Candidatos da última busca. */
  readonly candidates = signal<UserSummary[]>([]);
  /** A busca está em andamento. */
  readonly searching = signal(false);
  /** Erro da busca. */
  readonly searchError = signal<string | null>(null);
  /** A atribuição está em andamento. */
  readonly saving = signal(false);
  /** Erro da atribuição. */
  readonly error = signal<string | null>(null);
  /** Termos pedidos pela busca. */
  readonly searches: string[] = [];
  /** Atribuições confirmadas. */
  readonly confirmed: { userId: string; name: string }[] = [];
  /** Quantas vezes pediu pra fechar. */
  closedCount = 0;
}

describe('TicketAssignDialogComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  afterEach(() => {
    clearRoleColor('Atendente');
    document.body.classList.remove('modal-open');
  });

  /** Digita na busca do diálogo. */
  function type(fixture: { nativeElement: HTMLElement }, text: string): void {
    const input = fixture.nativeElement.querySelector('#ticketAssigneeSearch') as HTMLInputElement;
    input.value = text;
    input.dispatchEvent(new Event('input'));
  }

  /** Linhas de candidato renderizadas. */
  function options(fixture: { nativeElement: HTMLElement }): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('[role="option"]'));
  }

  /** Botão de confirmar do rodapé. */
  function confirmButton(fixture: { nativeElement: HTMLElement }): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.modal-footer .btn-primary') as HTMLButtonElement;
  }

  it('pede a busca só 300ms depois de parar de digitar', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    type(fixture, 'jo');
    await new Promise(resolve => setTimeout(resolve, 100));
    type(fixture, 'joão');
    expect(fixture.componentInstance.searches).toEqual([]);

    await new Promise(resolve => setTimeout(resolve, 350));
    expect(fixture.componentInstance.searches).toEqual(['joão']);
  });

  it('pede pra digitar quando a busca está vazia, e avisa quando não encontra ninguém', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Digite para buscar um usuário ativo.');

    type(fixture, 'inexistente');
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Nenhum usuário encontrado.');
  });

  it('mostra o erro de busca (ex.: sem permissão users:read) em vez da lista', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.searchError.set('Você não tem permissão para buscar usuários.');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Você não tem permissão para buscar usuários.');
  });

  it('marca o candidato clicado e desmarca ao clicar de novo', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.candidates.set([candidate]);
    type(fixture, 'joão');
    await fixture.whenStable();

    const row = options(fixture)[0];
    row.click();
    await fixture.whenStable();
    expect(row.classList).toContain('is-selected');
    expect(row.getAttribute('aria-selected')).toBe('true');

    row.click();
    await fixture.whenStable();
    expect(row.getAttribute('aria-selected')).toBe('false');
  });

  it('navega entre os candidatos com as setas, com foco circulante', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.componentInstance.candidates.set([candidate, other]);
    type(fixture, 'a');
    await fixture.whenStable();

    const list = fixture.nativeElement.querySelector('[role="listbox"]') as HTMLElement;
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await fixture.whenStable();
    expect(document.activeElement).toBe(options(fixture)[1]);
    expect(options(fixture)[1].getAttribute('tabindex')).toBe('0');

    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await fixture.whenStable();
    expect(document.activeElement).toBe(options(fixture)[0]);
    fixture.nativeElement.remove();
  });

  it('usa a cor customizada da função e agrupa as funções além da segunda num "+N"', async () => {
    setRoleColor('Atendente', '#ff3e1d');
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.candidates.set([{ ...candidate, roles: [{ name: 'Atendente' }, { name: 'Administrador' }, { name: 'Supervisor' }] }]);
    type(fixture, 'joão');
    await fixture.whenStable();

    const badge = options(fixture)[0].querySelector('.badge') as HTMLElement;
    expect(badge.classList).toContain('badge-role-custom');
    expect(badge.style.getPropertyValue('--role-color')).toBe('#ff3e1d');
    const overflow = options(fixture)[0].querySelector('.badge-roles-overflow') as HTMLElement;
    expect(overflow.textContent).toContain('+1');
    expect(overflow.hasAttribute('tabindex')).toBeFalse();
  });

  it('só confirma com um candidato marcado, emitindo id e nome', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.candidates.set([candidate]);
    type(fixture, 'joão');
    await fixture.whenStable();
    expect(confirmButton(fixture).disabled).toBeTrue();

    options(fixture)[0].click();
    await fixture.whenStable();
    confirmButton(fixture).click();

    expect(fixture.componentInstance.confirmed).toEqual([{ userId: 'u2', name: 'João Pedro' }]);
  });

  it('diz "Atribuir" na primeira atribuição e "Reatribuir", com aviso de substituição, ao trocar o responsável', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.candidates.set([candidate]);
    type(fixture, 'joão');
    await fixture.whenStable();
    expect(confirmButton(fixture).textContent?.trim()).toBe('Atribuir');

    fixture.componentInstance.currentName.set('Maria Souza');
    options(fixture)[0].click();
    await fixture.whenStable();

    expect(confirmButton(fixture).textContent?.trim()).toBe('Reatribuir');
    expect(fixture.nativeElement.textContent).toContain('Isso substitui Maria Souza por João Pedro como responsável.');
  });

  it('mostra o erro da atribuição e trava confirmar/fechar enquanto atribui', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.error.set('O usuário não atende chamados.');
    fixture.componentInstance.saving.set(true);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('O usuário não atende chamados.');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(fixture.componentInstance.closedCount).toBe(0);
    expect(confirmButton(fixture).disabled).toBeTrue();
  });
});
