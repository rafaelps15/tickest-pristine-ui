import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { SideMenuNavComponent } from './side-menu-nav.component';
import { SessionService } from '../../../services/session.service';

describe('SideMenuNavComponent', () => {
  let hasPermission: jasmine.Spy;

  beforeEach(async () => {
    hasPermission = jasmine.createSpy('hasPermission').and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [SideMenuNavComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([]), { provide: SessionService, useValue: { hasPermission } }]
    }).compileComponents();
  });

  it('shows "Meus Chamados" to those with tickets:view-own', async () => {
    hasPermission.and.callFake((code: string) => code === 'tickets:view-own');
    const fixture = TestBed.createComponent(SideMenuNavComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('a[href="/tickets"]')).not.toBeNull();
  });

  it('hides "Meus Chamados" without tickets:view-own', async () => {
    const fixture = TestBed.createComponent(SideMenuNavComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('a[href="/tickets"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Início');
  });
});
