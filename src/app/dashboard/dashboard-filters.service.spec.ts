import { TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { DashboardFiltersService } from './dashboard-filters.service';

/** Tela mínima que fornece o serviço, pra ele ter uma rota ativa de verdade. */
@Component({ template: '', providers: [DashboardFiltersService] })
class HostComponent {}

describe('DashboardFiltersService', () => {
  let harness: RouterTestingHarness;

  /** Abre a tela no endereço informado e devolve o serviço dela. */
  async function open(url: string): Promise<DashboardFiltersService> {
    await harness.navigateByUrl(url);
    return harness.routeDebugElement!.injector.get(DashboardFiltersService);
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'dashboard', component: HostComponent }])
      ]
    });
    harness = await RouterTestingHarness.create();
  });

  it('reads the filters from the URL when opening the screen', async () => {
    const service = await open('/dashboard?sectorId=s1&priority=2&assignee=none');

    expect(service.filters()).toEqual(jasmine.objectContaining({ sectorId: 's1', priority: 2, assignee: 'none', period: undefined }));
    expect(service.active()).toBeTrue();
  });

  it('writes to the URL when a filter changes, keeping the screen other parameters', async () => {
    const service = await open('/dashboard?sectorId=s1&outro=x');
    const router = TestBed.inject(Router);

    service.update({ priority: 4 });
    await harness.fixture.whenStable();

    expect(router.url).toContain('sectorId=s1');
    expect(router.url).toContain('priority=4');
    expect(router.url).toContain('outro=x');
    expect(service.filters()).toEqual(jasmine.objectContaining({ sectorId: 's1', priority: 4, assignee: undefined }));
  });

  it('removing a filter removes the parameter from the URL, and "limpar" removes all', async () => {
    const service = await open('/dashboard?sectorId=s1&priority=3');
    const router = TestBed.inject(Router);

    service.update({ sectorId: undefined });
    await harness.fixture.whenStable();
    expect(router.url).not.toContain('sectorId');

    service.clear();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/dashboard');
    expect(service.active()).toBeFalse();
  });

  it('follows the URL when it changes externally (browser back, link)', async () => {
    const service = await open('/dashboard');

    await harness.navigateByUrl('/dashboard?assignee=me');

    expect(service.filters().assignee).toBe('me');
  });

  it('does not navigate when nothing changed', async () => {
    const service = await open('/dashboard?priority=2');
    const navigate = spyOn(TestBed.inject(Router), 'navigate');

    service.update({ priority: 2 });

    expect(navigate).not.toHaveBeenCalled();
  });
});
