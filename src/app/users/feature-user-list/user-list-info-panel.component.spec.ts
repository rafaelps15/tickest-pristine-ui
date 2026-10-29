import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { UserListInfoPanelComponent } from './user-list-info-panel.component';
import { UserSummary } from '../entities/user-summary';
import { setRoleColor } from '../../shared';

const ROLE_COLOR_STORAGE_KEY = 'tickest.roleColors';

describe('UserListInfoPanelComponent', () => {
  const activeUser: UserSummary = {
    id: 'u1', email: 'maria@empresa.com', firstName: 'Maria', lastName: 'Silva',
    roles: [{ name: 'Agent' }],
    isActive: true, createdAtUtc: '2026-01-01T12:00:00Z', deactivatedAtUtc: null
  };

  beforeEach(async () => {
    localStorage.removeItem(ROLE_COLOR_STORAGE_KEY);
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

  it('renderiza os campos instantâneos recebidos por @Input', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Maria Silva');
    expect(text).toContain('maria@empresa.com');
    expect(text).toContain('Agent');
    expect(text).toContain('Ativo');
    expect(text).toContain('01/01/2026');
  });

  it('mostra no máximo 2 badges de função e agrupa o restante em "+N"', async () => {
    const userWithManyRoles: UserSummary = {
      ...activeUser,
      roles: [{ name: 'Agent' }, { name: 'Supervisor' }, { name: 'Financeiro' }]
    };
    const fixture = createFixture();
    fixture.componentRef.setInput('user', userWithManyRoles);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('+1');
  });

  it('usa a cor customizada da função quando escolhida (prévia local)', async () => {
    setRoleColor('Agent', '#ff3e1d');
    const fixture = createFixture();
    await fixture.whenStable();

    const badge = fixture.nativeElement.querySelector('.info-list .badge') as HTMLElement;
    expect(badge.classList).toContain('badge-role-custom');
    expect(badge.style.getPropertyValue('--role-color')).toBe('#ff3e1d');
  });

  it('mostra a data de desativação só quando o usuário está desativado', async () => {
    const fixture = createFixture();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).not.toContain('Desativado em');

    fixture.componentRef.setInput('user', { ...activeUser, isActive: false, deactivatedAtUtc: '2026-02-01T12:00:00Z' });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Desativado em');
  });

  it('esconde o botão Ativar/Desativar quando canToggleActive é false (própria conta logada)', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('canToggleActive', false);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Desativar');
    expect(fixture.nativeElement.textContent).not.toContain('Reativar');
  });

  it('mostra "Desativar" para um usuário ativo e "Reativar" para um inativo', async () => {
    const fixture = createFixture();
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Desativar');

    fixture.componentRef.setInput('user', { ...activeUser, isActive: false });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Reativar');
  });

  it('mostra um spinner e desabilita o botão enquanto a mutação está em andamento', async () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('deactivating', true);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('.btn-outline-danger') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
    expect(button.querySelector('.spinner-border')).toBeTruthy();
  });

  it('emite "close" ao clicar no botão de fechar', async () => {
    const fixture = createFixture();
    await fixture.whenStable();
    const closeSpy = jasmine.createSpy('close');
    fixture.componentInstance.close.subscribe(closeSpy);

    const button = fixture.nativeElement.querySelector('button[aria-label="Fechar painel de informações do usuário"]') as HTMLButtonElement;
    button.click();

    expect(closeSpy).toHaveBeenCalled();
  });

  it('emite editClick, assignRolesClick e toggleActiveClick ao clicar nos respectivos botões', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    const editSpy = jasmine.createSpy('edit');
    const rolesSpy = jasmine.createSpy('roles');
    const toggleSpy = jasmine.createSpy('toggle');
    fixture.componentInstance.editClick.subscribe(editSpy);
    fixture.componentInstance.assignRolesClick.subscribe(rolesSpy);
    fixture.componentInstance.toggleActiveClick.subscribe(toggleSpy);

    (fixture.nativeElement.querySelector('[data-bs-target="#userEditModal"]') as HTMLButtonElement).click();
    (fixture.nativeElement.querySelector('[data-bs-target="#userRolesModal"]') as HTMLButtonElement).click();
    (fixture.nativeElement.querySelector('.btn-outline-danger') as HTMLButtonElement).click();

    expect(editSpy).toHaveBeenCalled();
    expect(rolesSpy).toHaveBeenCalled();
    expect(toggleSpy).toHaveBeenCalled();
  });
});
