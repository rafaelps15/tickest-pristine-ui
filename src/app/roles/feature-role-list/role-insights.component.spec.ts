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

  it('shows the total of roles on a supporting line, with no big number when nothing requires action', async () => {
    const fixture = TestBed.createComponent(RoleInsightsComponent);
    fixture.componentRef.setInput('roles', [makeRole(), makeRole({ name: 'Administrador' })]);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('2 funções no sistema');
    expect(fixture.nativeElement.querySelector('.insights-stat')).toBeNull();
  });

  it('shows the positive message when no role is without permissions', async () => {
    const fixture = TestBed.createComponent(RoleInsightsComponent);
    fixture.componentRef.setInput('roles', [makeRole()]);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('todas com pelo menos uma permissão');
  });

  it('shows the number of roles with no permission assigned', async () => {
    const fixture = TestBed.createComponent(RoleInsightsComponent);
    fixture.componentRef.setInput('roles', [makeRole({ permissionCodes: [] }), makeRole({ name: 'Vazia', permissionCodes: [] })]);
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(fixture.nativeElement.querySelector('.insights-stat').textContent).toBe('2');
    expect(text).toContain('funções sem nenhuma permissão');
    expect(text).not.toContain('todas com pelo menos uma permissão');
  });

  it('does not claim that "todas têm permissão" for an empty list or one that has not arrived yet', async () => {
    const fixture = TestBed.createComponent(RoleInsightsComponent);
    fixture.componentRef.setInput('roles', []);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).not.toContain('todas com pelo menos uma permissão');

    fixture.componentRef.setInput('loading', true);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.insights-stat').textContent).toBe('—');
    expect(fixture.nativeElement.textContent).not.toContain('funções no sistema');
  });
});
