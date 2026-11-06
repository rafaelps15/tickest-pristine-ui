import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { SideMenuNavComponent } from './side-menu-nav.component';
import { SessionService } from '../../../services/session.service';

describe('SideMenuNavComponent', () => {
  /** Permissões da sessão no teste; cada teste define as suas antes de criar o componente. */
  let permissions = new Set<string>();

  /** Cria o menu com as permissões dadas e o item de chamados ativo informado. */
  async function render(granted: string[], activeTicketsItem: 'mine' | 'monitor' | null = null): Promise<HTMLElement> {
    permissions = new Set(granted);
    const fixture = TestBed.createComponent(SideMenuNavComponent);
    fixture.componentRef.setInput('activeTicketsItem', activeTicketsItem);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  /** Textos dos itens de menu, na ordem em que aparecem. */
  function itemLabels(root: HTMLElement): (string | undefined)[] {
    return Array.from(root.querySelectorAll('.menu-item .menu-link div')).map(label => label.textContent?.trim());
  }

  /** Link do item com o texto dado, ou `null` se o item não aparece. */
  function linkOf(root: HTMLElement, label: string): HTMLAnchorElement | null {
    return Array.from(root.querySelectorAll<HTMLAnchorElement>('.menu-item .menu-link'))
      .find(link => link.textContent?.trim() === label) ?? null;
  }

  beforeEach(async () => {
    permissions = new Set();
    await TestBed.configureTestingModule({
      imports: [SideMenuNavComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SessionService, useValue: { hasPermission: (code: string) => permissions.has(code) } }
      ]
    }).compileComponents();
  });

  it('shows "Meus Chamados" to those with tickets:view-own', async () => {
    const root = await render(['tickets:view-own']);

    expect(root.querySelector('a[href="/tickets"]')).not.toBeNull();
  });

  it('hides "Meus Chamados" without tickets:view-own', async () => {
    const root = await render([]);

    expect(root.querySelector('a[href="/tickets"]')).toBeNull();
    expect(root.textContent).toContain('Início');
  });

  it('shows only the main group, without the administration header, for a user with no admin permission', async () => {
    const root = await render(['tickets:view-own']);

    expect(itemLabels(root)).toEqual(['Início', 'Meus Chamados']);
    expect(root.textContent).not.toContain('Administração');
  });

  it('shows the administration header and every admin item, in order, when all permissions are granted', async () => {
    const root = await render(['tickets:view-own', 'tickets:manage', 'users:read', 'roles:read', 'departments:manage']);

    expect(root.textContent).toContain('Administração');
    expect(itemLabels(root)).toEqual(['Início', 'Meus Chamados', 'Monitorar Chamados', 'Usuários', 'Funções', 'Departamentos e setores']);
  });

  const onePermissionCases = [
    { permission: 'tickets:manage', label: 'Monitorar Chamados' },
    { permission: 'users:read', label: 'Usuários' },
    { permission: 'roles:read', label: 'Funções' },
    { permission: 'departments:manage', label: 'Departamentos e setores' },
    { permission: 'sectors:manage', label: 'Departamentos e setores' }
  ];

  for (const { permission, label } of onePermissionCases) {
    it(`shows only "${label}" under the administration header when the user has just ${permission}`, async () => {
      const root = await render([permission]);

      expect(root.textContent).toContain('Administração');
      expect(itemLabels(root)).toEqual(['Início', label]);
    });
  }

  it('does not show "Funções", nor the administration header, to someone with roles:manage but without roles:read: GET /roles would refuse', async () => {
    const root = await render(['tickets:view-own', 'roles:manage']);

    expect(linkOf(root, 'Funções')).toBeNull();
    expect(root.textContent).not.toContain('Administração');
  });

  it('points each item to its route', async () => {
    const root = await render(['tickets:view-own', 'tickets:manage', 'users:read', 'roles:read', 'departments:manage']);

    expect(linkOf(root, 'Início')?.getAttribute('href')).toBe('/dashboard');
    expect(linkOf(root, 'Meus Chamados')?.getAttribute('href')).toBe('/tickets');
    expect(linkOf(root, 'Monitorar Chamados')?.getAttribute('href')).toBe('/tickets/monitorar');
    expect(linkOf(root, 'Usuários')?.getAttribute('href')).toBe('/usuarios');
    expect(linkOf(root, 'Funções')?.getAttribute('href')).toBe('/roles');
    expect(linkOf(root, 'Departamentos e setores')?.getAttribute('href')).toBe('/departamentos');
  });

  it('marks "Meus Chamados" as the current page when the active tickets item is "mine"', async () => {
    const root = await render(['tickets:view-own', 'tickets:manage'], 'mine');
    const mine = linkOf(root, 'Meus Chamados');
    const monitor = linkOf(root, 'Monitorar Chamados');

    expect(mine?.closest('.menu-item')?.classList).toContain('active');
    expect(mine?.getAttribute('aria-current')).toBe('page');
    expect(monitor?.closest('.menu-item')?.classList).not.toContain('active');
    expect(monitor?.hasAttribute('aria-current')).toBeFalse();
  });

  it('marks "Monitorar Chamados" as the current page when the active tickets item is "monitor"', async () => {
    const root = await render(['tickets:view-own', 'tickets:manage'], 'monitor');
    const mine = linkOf(root, 'Meus Chamados');
    const monitor = linkOf(root, 'Monitorar Chamados');

    expect(monitor?.closest('.menu-item')?.classList).toContain('active');
    expect(monitor?.getAttribute('aria-current')).toBe('page');
    expect(mine?.closest('.menu-item')?.classList).not.toContain('active');
    expect(mine?.hasAttribute('aria-current')).toBeFalse();
  });

  it('marks no tickets item as current outside the tickets screens', async () => {
    const root = await render(['tickets:view-own', 'tickets:manage'], null);

    for (const label of ['Meus Chamados', 'Monitorar Chamados']) {
      const link = linkOf(root, label);
      expect(link?.closest('.menu-item')?.classList).withContext(label).not.toContain('active');
      expect(link?.hasAttribute('aria-current')).withContext(label).toBeFalse();
    }
  });
});
