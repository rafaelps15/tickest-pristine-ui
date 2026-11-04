import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { UserListInfoPanelComponent } from './user-list-info-panel.component';
import { UserSummary } from '../entities/user-summary';

describe('UserListInfoPanelComponent', () => {
  const activeUser: UserSummary = {
    id: 'u1', email: 'maria@empresa.com', firstName: 'Maria', lastName: 'Silva',
    roles: [{ name: 'Agent' }],
    isActive: true, createdAtUtc: '2026-01-01T12:00:00Z', deactivatedAtUtc: null, pendingActivation: false, invitationExpiresAtUtc: null
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserListInfoPanelComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  function createFixture() {
    const fixture = TestBed.createComponent(UserListInfoPanelComponent);
    fixture.componentRef.setInput('user', activeUser);
    return fixture;
  }

  it('is a region labeled by the user name outside modal mode', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    const panel = fixture.nativeElement.querySelector('.info-panel') as HTMLElement;
    expect(panel.getAttribute('role')).toBe('region');
    expect(panel.hasAttribute('aria-modal')).toBeFalse();
    expect(document.getElementById(panel.getAttribute('aria-labelledby')!)?.textContent).toContain('Maria Silva');
  });

  it('becomes a modal dialog in overlay mode', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('modal', true);
    await fixture.whenStable();

    const panel = fixture.nativeElement.querySelector('.info-panel') as HTMLElement;
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.getAttribute('aria-modal')).toBe('true');
  });

  it('in overlay mode, moves focus to the title on open and again when switching users', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('modal', true);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();

    const title = fixture.nativeElement.querySelector('#userInfoPanelTitle') as HTMLElement;
    expect(document.activeElement).toBe(title);

    (document.activeElement as HTMLElement).blur();
    fixture.componentRef.setInput('user', { ...activeUser, id: 'u9', firstName: 'Ana' });
    await fixture.whenStable();
    expect(document.activeElement).toBe(title);

    fixture.nativeElement.remove();
  });

  it('does not steal focus when the list reloads and delivers a new object for the same user', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('modal', true);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();

    const searchInput = document.createElement('input');
    document.body.appendChild(searchInput);
    searchInput.focus();

    fixture.componentRef.setInput('user', { ...activeUser, roles: [...activeUser.roles] });
    await fixture.whenStable();

    expect(document.activeElement).toBe(searchInput);

    searchInput.remove();
    fixture.nativeElement.remove();
  });

  it('in modal mode, Tab on the last control goes back to the first and Shift+Tab on the first goes to the last', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('modal', true);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const first = buttons[0];
    const last = buttons[buttons.length - 1];

    last.focus();
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(first);

    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(last);

    fixture.nativeElement.remove();
  });

  it('outside modal mode, does not trap Tab inside the panel', async () => {
    const fixture = createFixture();
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const last = buttons[buttons.length - 1];
    last.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    last.dispatchEvent(event);

    expect(event.defaultPrevented).toBeFalse();
    expect(document.activeElement).toBe(last);

    fixture.nativeElement.remove();
  });

  it('renders the instant fields received via @Input', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Maria Silva');
    expect(text).toContain('maria@empresa.com');
    expect(text).toContain('Agent');
    expect(text).toContain('Ativo');
    expect(text).toContain('01/01/2026');
  });

  it('shows all of the user roles, without grouping into "+N" (the panel is the detail view)', async () => {
    const userWithManyRoles: UserSummary = {
      ...activeUser,
      roles: [{ name: 'Agent' }, { name: 'Supervisor' }, { name: 'Financeiro' }]
    };
    const fixture = createFixture();
    fixture.componentRef.setInput('user', userWithManyRoles);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Financeiro');
    expect(text).not.toContain('+1');
  });

  it('shows "Convite pendente", the invite validity and the "Reenviar convite" button for those who have not activated the account', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('user', { ...activeUser, pendingActivation: true, invitationExpiresAtUtc: '2026-11-01T15:00:00Z' });
    await fixture.whenStable();
    const emitted = jasmine.createSpy('resend');
    fixture.componentInstance.resendInvitationClick.subscribe(emitted);

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Convite pendente');
    expect(text).toContain('Vale até 01/11/2026');
    const resend = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(button => button.textContent?.includes('Reenviar convite'))!;
    resend.click();

    expect(emitted).toHaveBeenCalled();
  });

  it('does not offer resending the invite to those who already activated the account', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Reenviar convite');
    expect(fixture.nativeElement.textContent).not.toContain('Convite pendente');
  });

  it('says "Nenhuma função" when the user has no role', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('user', { ...activeUser, roles: [] });
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Nenhuma função');
  });

  it('says "Convite expirado" prominently when the invite has expired', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('user', { ...activeUser, pendingActivation: true, invitationExpiresAtUtc: null });
    await fixture.whenStable();

    const expired = fixture.nativeElement.querySelector('.invitation-expired') as HTMLElement;
    expect(expired.textContent).toContain('Convite expirado');
  });

  it('shows each role in the system indigo badge', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    const badge = fixture.nativeElement.querySelector('.info-list .badge') as HTMLElement;
    expect(badge.classList).toContain('bg-label-primary');
    expect(badge.textContent?.trim()).toBe('Agent');
  });

  it('shows the deactivation date only when the user is deactivated', async () => {
    const fixture = createFixture();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).not.toContain('Desativado em');

    fixture.componentRef.setInput('user', { ...activeUser, isActive: false, deactivatedAtUtc: '2026-02-01T12:00:00Z', pendingActivation: false, invitationExpiresAtUtc: null });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Desativado em');
  });

  it('on the logged-in account itself, marks "Você" and replaces Ativar/Desativar with an explanation', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('isCurrentUser', true);
    await fixture.whenStable();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).map(button => button.textContent ?? '');
    expect(buttons.some(text => text.includes('Desativar') || text.includes('Reativar'))).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Você');
    expect(fixture.nativeElement.textContent).toContain('Sua própria conta não pode ser desativada');
  });

  it('shows "Desativar" for an active user and "Reativar" for an inactive one', async () => {
    const fixture = createFixture();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Desativar');

    fixture.componentRef.setInput('user', { ...activeUser, isActive: false });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Reativar');
  });

  it('shows a spinner and disables the button while the mutation is in progress', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('deactivating', true);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('.btn-outline-danger') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
    expect(button.querySelector('.spinner-border')).toBeTruthy();
  });

  it('emits "close" when clicking the close button', async () => {
    const fixture = createFixture();
    await fixture.whenStable();
    const closeSpy = jasmine.createSpy('close');
    fixture.componentInstance.close.subscribe(closeSpy);

    const button = fixture.nativeElement.querySelector('button[aria-label="Fechar painel de informações do usuário"]') as HTMLButtonElement;
    button.click();

    expect(closeSpy).toHaveBeenCalled();
  });

  it('emits editClick, assignRolesClick and toggleActiveClick when clicking the respective buttons', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    const editSpy = jasmine.createSpy('edit');
    const rolesSpy = jasmine.createSpy('roles');
    const toggleSpy = jasmine.createSpy('toggle');
    fixture.componentInstance.editClick.subscribe(editSpy);
    fixture.componentInstance.assignRolesClick.subscribe(rolesSpy);
    fixture.componentInstance.toggleActiveClick.subscribe(toggleSpy);

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>);
    buttons.find(button => button.textContent?.includes('Editar cadastro'))!.click();
    buttons.find(button => button.textContent?.includes('Atribuir funções'))!.click();
    (fixture.nativeElement.querySelector('.btn-outline-danger') as HTMLButtonElement).click();

    expect(editSpy).toHaveBeenCalled();
    expect(rolesSpy).toHaveBeenCalled();
    expect(toggleSpy).toHaveBeenCalled();
  });
});
