import { TestBed } from '@angular/core/testing';
import { ApplicationRef, provideZonelessChangeDetection, signal } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { termSearchResource } from './term-search-resource.util';

describe('termSearchResource', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('does not search with an empty term or one with only spaces', async () => {
    const term = signal<string | null>('   ');
    const search = jasmine.createSpy('search').and.returnValue(of(['Ana Lima']));
    const resource = TestBed.runInInjectionContext(() => termSearchResource(term, search));
    await TestBed.inject(ApplicationRef).whenStable();

    term.set(null);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(search).not.toHaveBeenCalled();
    expect(resource.value()).toBeUndefined();
    expect(resource.isLoading()).toBeFalse();
  });

  it('searches the trimmed term and exposes the result', async () => {
    const search = jasmine.createSpy('search').and.returnValue(of(['Ana Lima']));
    const resource = TestBed.runInInjectionContext(() => termSearchResource(signal(' ana '), search));
    await TestBed.inject(ApplicationRef).whenStable();

    expect(search).toHaveBeenCalledOnceWith('ana');
    expect(resource.value()).toEqual(['Ana Lima']);
  });

  it('cancels the search of the previous term when the term changes, so a late answer is not shown', async () => {
    const first = new Subject<string[]>();
    const search = jasmine.createSpy('search').and.returnValues(first, of(['Ana Lima']));
    const term = signal<string | null>('an');
    const resource = TestBed.runInInjectionContext(() => termSearchResource(term, search));
    TestBed.tick();
    expect(first.observed).toBeTrue();
    expect(resource.isLoading()).toBeTrue();

    term.set('ana');
    await TestBed.inject(ApplicationRef).whenStable();
    first.next(['Antônio Reis']);

    expect(first.observed).toBeFalse();
    expect(resource.value()).toEqual(['Ana Lima']);
    expect(resource.isLoading()).toBeFalse();
  });

  it('exposes the failure of the search as the error of the resource', async () => {
    const failure = new Error('falhou');
    const resource = TestBed.runInInjectionContext(() => termSearchResource(signal('ana'), () => throwError(() => failure)));
    await TestBed.inject(ApplicationRef).whenStable();

    expect(resource.error()).toBe(failure);
    expect(resource.hasValue()).toBeFalse();
    expect(resource.isLoading()).toBeFalse();
  });
});
