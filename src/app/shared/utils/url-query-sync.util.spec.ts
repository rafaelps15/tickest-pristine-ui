import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRoute, ParamMap, Router, convertToParamMap } from '@angular/router';
import { clampPageToTotal, queryParamsMatch, syncQueryParamsToUrl } from './url-query-sync.util';

describe('url-query-sync.util', () => {
  describe('queryParamsMatch', () => {
    it('treats null as an absent parameter and compares numbers as text', () => {
      const current = convertToParamMap({ page: '2' });

      expect(queryParamsMatch(current, { page: 2, status: null })).toBeTrue();
      expect(queryParamsMatch(current, { page: 3 })).toBeFalse();
      expect(queryParamsMatch(current, { page: null })).toBeFalse();
      expect(queryParamsMatch(current, { status: 'all' })).toBeFalse();
    });

    it('compares a repeated parameter value by value, in order', () => {
      const current = convertToParamMap({ sectorId: ['s1', 's2'] });

      expect(queryParamsMatch(current, { sectorId: ['s1', 's2'] })).toBeTrue();
      expect(queryParamsMatch(current, { sectorId: ['s2', 's1'] })).toBeFalse();
      expect(queryParamsMatch(current, { sectorId: ['s1'] })).toBeFalse();
    });
  });

  describe('syncQueryParamsToUrl', () => {
    let navigate: jasmine.Spy;
    let route: { snapshot: { queryParamMap: ParamMap } };

    beforeEach(() => {
      navigate = jasmine.createSpy('navigate').and.resolveTo(true);
      route = { snapshot: { queryParamMap: convertToParamMap({ page: '2' }) } };
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          { provide: Router, useValue: { navigate } },
          { provide: ActivatedRoute, useValue: route }
        ]
      });
    });

    it('does not navigate while the parameters already match the current URL', () => {
      TestBed.runInInjectionContext(() => syncQueryParamsToUrl(() => ({ page: 2, status: null })));
      TestBed.tick();

      expect(navigate).not.toHaveBeenCalled();
    });

    it('navigates to the new parameters without stacking history when they change', () => {
      const page = signal(2);
      TestBed.runInInjectionContext(() => syncQueryParamsToUrl(() => ({ page: page(), status: null })));
      TestBed.tick();

      page.set(3);
      TestBed.tick();

      expect(navigate).toHaveBeenCalledOnceWith([], { relativeTo: route, queryParams: { page: 3, status: null }, replaceUrl: true });
    });
  });

  describe('clampPageToTotal', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    });

    it('goes back to the last valid page when the requested page is past the total', () => {
      const totalPages = signal(0);
      const goToPage = jasmine.createSpy('goToPage');
      TestBed.runInInjectionContext(() => clampPageToTotal(totalPages, () => 5, goToPage));
      TestBed.tick();
      expect(goToPage).not.toHaveBeenCalled();

      totalPages.set(3);
      TestBed.tick();

      expect(goToPage).toHaveBeenCalledOnceWith(3);
    });

    it('leaves a page within the total alone', () => {
      const goToPage = jasmine.createSpy('goToPage');
      TestBed.runInInjectionContext(() => clampPageToTotal(() => 3, () => 2, goToPage));
      TestBed.tick();

      expect(goToPage).not.toHaveBeenCalled();
    });
  });
});
