import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { RoleInsightsComponent } from './role-insights.component';
import { Role } from '../entities/role';

function makeRole(overrides: Partial<Role> = {}): Role {
  return { name: 'Atendente', permissionCodes: ['tickets:manage'], isDefault: false, isAdministrator: false, ...overrides };
}

describe('RoleInsightsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleInsightsComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();
  });

  it('mostra a quantidade total de funções cadastradas', async () => {
    const fixture = TestBed.createComponent(RoleInsightsComponent);
    fixture.componentRef.setInput('roles', [makeRole(), makeRole({ name: 'Administrador' })]);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('2');
    expect(fixture.nativeElement.textContent).toContain('funções cadastradas');
  });

  it('mostra a mensagem positiva quando nenhuma função está sem permissão', async () => {
    const fixture = TestBed.createComponent(RoleInsightsComponent);
    fixture.componentRef.setInput('roles', [makeRole()]);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Todas as funções têm pelo menos uma permissão atribuída.');
  });

  it('mostra a quantidade de funções sem nenhuma permissão atribuída', async () => {
    const fixture = TestBed.createComponent(RoleInsightsComponent);
    fixture.componentRef.setInput('roles', [makeRole({ permissionCodes: [] }), makeRole({ name: 'Vazia', permissionCodes: [] })]);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('2');
    expect(text).toContain('funções sem nenhuma permissão atribuída');
    expect(text).not.toContain('Todas as funções têm pelo menos uma permissão atribuída.');
  });
});
