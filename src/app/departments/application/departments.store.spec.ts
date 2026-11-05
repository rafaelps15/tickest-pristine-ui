import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { DepartmentsStore } from './departments.store';
import { DepartmentDataService } from '../infrastructure/department.data.service';
import { SectorDataService } from '../infrastructure/sector.data.service';
import { Department } from '../entities/department';
import { UserDataService, UserSummary } from '../../users';
import { PagedResponse } from '../../shared';

describe('DepartmentsStore', () => {
  const departments: Department[] = [
    {
      id: 'dep-1',
      name: 'Tecnologia da Informação',
      description: 'Equipamentos, sistemas, redes e acessos.',
      responsibleUserId: null, responsibleUserName: null,
      sectors: [{ id: 'sec-1', name: 'Suporte técnico', description: null }]
    }
  ];

  const candidate: UserSummary = {
    id: 'u-1', email: 'carlos@empresa.com', firstName: 'Carlos', lastName: 'Souza',
    roles: [], isActive: true, createdAtUtc: '2026-01-01T12:00:00Z', deactivatedAtUtc: null, pendingActivation: false, invitationExpiresAtUtc: null
  };

  function pageOf(items: UserSummary[]): PagedResponse<UserSummary> {
    return { items, page: 1, pageSize: 8, totalCount: items.length, totalPages: 1, hasPreviousPage: false, hasNextPage: false };
  }

  let store: InstanceType<typeof DepartmentsStore>;
  let departmentDataService: jasmine.SpyObj<DepartmentDataService>;
  let sectorDataService: jasmine.SpyObj<SectorDataService>;
  let userDataService: jasmine.SpyObj<UserDataService>;

  beforeEach(() => {
    departmentDataService = jasmine.createSpyObj('DepartmentDataService', ['getAll', 'create', 'update', 'deactivate']);
    sectorDataService = jasmine.createSpyObj('SectorDataService', ['create', 'update', 'deactivate']);
    userDataService = jasmine.createSpyObj('UserDataService', ['getAll']);
    departmentDataService.getAll.and.returnValue(of(departments));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        DepartmentsStore,
        { provide: DepartmentDataService, useValue: departmentDataService },
        { provide: SectorDataService, useValue: sectorDataService },
        { provide: UserDataService, useValue: userDataService }
      ]
    });
    store = TestBed.inject(DepartmentsStore);
  });

  it('exposes the departments with their nested sectors', async () => {
    store.load();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.departments()).toEqual(departments);
  });

  it('passes the id of the created department to onSuccess', () => {
    departmentDataService.create.and.returnValue(of('dep-novo'));
    const onSuccess = jasmine.createSpy('onSuccess');

    store.create({ name: 'Operações', description: 'Logística' }, onSuccess);

    expect(onSuccess).toHaveBeenCalledWith('dep-novo');
  });

  it('sets mutating during department creation, and releases it when done', async () => {
    const subject = new Subject<string>();
    departmentDataService.create.and.returnValue(subject);

    store.create({ name: 'Operações', description: 'Logística' });
    expect(store.mutating()).toBeTrue();

    subject.next('dep-2');
    subject.complete();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.mutating()).toBeFalse();
  });

  it('sets mutating during department update, even when the API fails', async () => {
    departmentDataService.update.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.update('dep-1', { name: 'TI', description: 'Tecnologia' });

    expect(store.mutating()).toBeFalse();
    expect(store.mutationError()).toBe('Erro ao atualizar departamento');
  });

  it('sets mutating during sector creation, and releases it when done', async () => {
    const subject = new Subject<string>();
    sectorDataService.create.and.returnValue(subject);

    store.createSector({ name: 'Sistemas', departmentId: 'dep-1' });
    expect(store.mutating()).toBeTrue();

    subject.next('sec-2');
    subject.complete();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.mutating()).toBeFalse();
  });

  it('creates the sector in the given department and reloads the departments', async () => {
    sectorDataService.create.and.returnValue(of('sec-2'));
    await TestBed.inject(ApplicationRef).whenStable();
    departmentDataService.getAll.calls.reset();
    const onSuccess = jasmine.createSpy('onSuccess');

    store.createSector({ name: 'Sistemas', departmentId: 'dep-1' }, onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(sectorDataService.create).toHaveBeenCalledWith({ name: 'Sistemas', departmentId: 'dep-1' });
    expect(departmentDataService.getAll).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith('sec-2');
  });

  it('exposes the API message when the sector name already exists in the department', () => {
    const conflict = new HttpErrorResponse({
      status: 409,
      error: { detail: "Já existe um setor ativo com o nome 'Sistemas' neste departamento." }
    });
    sectorDataService.create.and.returnValue(throwError(() => conflict));
    const onSuccess = jasmine.createSpy('onSuccess');

    store.createSector({ name: 'Sistemas', departmentId: 'dep-1' }, onSuccess);

    expect(store.mutationError()).toBe("Já existe um setor ativo com o nome 'Sistemas' neste departamento.");
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('updates and deactivates sectors by id', () => {
    sectorDataService.update.and.returnValue(of(undefined));
    sectorDataService.deactivate.and.returnValue(of(undefined));

    store.updateSector('sec-1', { name: 'Suporte' });
    store.deactivateSector('sec-1');

    expect(sectorDataService.update).toHaveBeenCalledWith('sec-1', { name: 'Suporte' });
    expect(sectorDataService.deactivate).toHaveBeenCalledWith('sec-1');
  });

  it('exposes the API message when the sector update fails', () => {
    const conflict = new HttpErrorResponse({
      status: 409,
      error: { detail: "Já existe um setor ativo com o nome 'Suporte' neste departamento." }
    });
    sectorDataService.update.and.returnValue(throwError(() => conflict));
    const onSuccess = jasmine.createSpy('onSuccess');

    store.updateSector('sec-1', { name: 'Suporte' }, onSuccess);

    expect(store.mutationError()).toBe("Já existe um setor ativo com o nome 'Suporte' neste departamento.");
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('puts the sector deactivation failure in deactivateError, with its id, without polluting the page error', () => {
    const conflict = new HttpErrorResponse({
      status: 409,
      error: { detail: 'O setor tem chamados em aberto ou em andamento.' }
    });
    sectorDataService.deactivate.and.returnValue(throwError(() => conflict));
    const onSuccess = jasmine.createSpy('onSuccess');

    store.deactivateSector('sec-1', onSuccess);

    expect(store.deactivateError()).toEqual({ targetId: 'sec-1', message: 'O setor tem chamados em aberto ou em andamento.' });
    expect(store.mutationError()).toBeNull();
    expect(store.deactivatingId()).toBeNull();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('uses the default message when the API returns no detail', () => {
    sectorDataService.deactivate.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.deactivateSector('sec-1');

    expect(store.deactivateError()?.message).toBe('Não foi possível desativar o setor.');
  });

  it('deactivates the department, calls onSuccess and releases deactivatingId', () => {
    const pending = new Subject<void>();
    departmentDataService.deactivate.and.returnValue(pending.asObservable());
    const onSuccess = jasmine.createSpy('onSuccess');

    store.deactivate('dep-1', onSuccess);
    expect(store.deactivatingId()).toBe('dep-1');

    pending.next();
    pending.complete();

    expect(departmentDataService.deactivate).toHaveBeenCalledWith('dep-1');
    expect(onSuccess).toHaveBeenCalled();
    expect(store.deactivatingId()).toBeNull();
  });

  it('ignores a second deactivation while the first is in flight (double click)', () => {
    departmentDataService.deactivate.and.returnValue(new Subject<void>().asObservable());
    sectorDataService.deactivate.and.returnValue(of(undefined));

    store.deactivate('dep-1');
    store.deactivate('dep-1');
    store.deactivateSector('sec-1');

    expect(departmentDataService.deactivate).toHaveBeenCalledTimes(1);
    expect(sectorDataService.deactivate).not.toHaveBeenCalled();
  });

  it('puts the department deactivation failure in deactivateError and clears it on retry or close', () => {
    departmentDataService.deactivate.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'Tem chamados.' } })));

    store.deactivate('dep-1');
    expect(store.deactivateError()).toEqual({ targetId: 'dep-1', message: 'Tem chamados.' });

    departmentDataService.deactivate.and.returnValue(new Subject<void>().asObservable());
    store.deactivate('dep-1');
    expect(store.deactivateError()).toBeNull();

    departmentDataService.deactivate.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    store.clearDeactivateError();
    expect(store.deactivateError()).toBeNull();
  });

  it('searches for assignee candidates by name/email', async () => {
    userDataService.getAll.and.returnValue(of(pageOf([candidate])));

    store.searchResponsibleCandidates('carlos');

    expect(userDataService.getAll).toHaveBeenCalledWith({ status: 'Active', search: 'carlos', page: 1, pageSize: 8 });
    expect(store.responsibleCandidates()).toEqual([candidate]);
  });

  it('clears the candidates when the assignee search becomes empty, without calling the API', () => {
    userDataService.getAll.and.returnValue(of(pageOf([candidate])));
    store.searchResponsibleCandidates('carlos');
    userDataService.getAll.calls.reset();

    store.searchResponsibleCandidates('   ');

    expect(userDataService.getAll).not.toHaveBeenCalled();
    expect(store.responsibleCandidates()).toEqual([]);
  });

  it('exposes the error message when the assignee search fails', () => {
    userDataService.getAll.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.searchResponsibleCandidates('carlos');

    expect(store.responsibleSearchError()).toBe('Erro ao buscar usuários');
    expect(store.responsibleCandidates()).toEqual([]);
  });

  it('clears the assignee search and candidates', () => {
    userDataService.getAll.and.returnValue(of(pageOf([candidate])));
    store.searchResponsibleCandidates('carlos');

    store.clearResponsibleSearch();

    expect(store.responsibleCandidates()).toEqual([]);
    expect(store.responsibleSearchError()).toBeNull();
  });

  it('a new assignee search cancels the previous one: the old, slow response does not overwrite the current one', () => {
    const slow = new Subject<PagedResponse<UserSummary>>();
    const other: UserSummary = { ...candidate, id: 'u-2', firstName: 'Carla' };
    userDataService.getAll.and.returnValues(slow, of(pageOf([other])));

    store.searchResponsibleCandidates('car');
    expect(store.searchingResponsible()).toBeTrue();
    store.searchResponsibleCandidates('carla');
    slow.next(pageOf([candidate]));

    expect(store.responsibleCandidates()).toEqual([other]);
    expect(store.responsibleSearchTerm()).toBe('carla');
    expect(store.searchingResponsible()).toBeFalse();
  });

  it('keeps the term of the last answered search, and clears it when the search becomes empty', () => {
    userDataService.getAll.and.returnValue(of(pageOf([])));

    store.searchResponsibleCandidates(' carlos ');
    expect(store.responsibleSearchTerm()).toBe('carlos');

    store.searchResponsibleCandidates('');
    expect(store.responsibleSearchTerm()).toBeNull();
  });

  it('a save failure goes to mutationError (of the dialog), not to the listing load error', async () => {
    store.load();
    await TestBed.inject(ApplicationRef).whenStable();
    departmentDataService.create.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.create({ name: 'Operações', description: 'Logística' });

    expect(store.mutationError()).toBe('Erro ao criar departamento');
    expect(store.listState().error).toBeNull();
    expect(store.departments()).toEqual(departments);
  });

  it('clears the mutation error', () => {
    sectorDataService.update.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'Conflito' } })));
    store.updateSector('sec-1', { name: 'Suporte' });
    expect(store.mutationError()).toBe('Conflito');

    store.clearMutationError();

    expect(store.mutationError()).toBeNull();
  });

  it('does not break the screen when the listing fails: departments empty and error exposed, instead of throwing', async () => {
    departmentDataService.getAll.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    store.load();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(() => store.departments()).not.toThrow();
    expect(store.departments()).toEqual([]);
    expect(store.listState().loading).toBeFalse();
    expect(store.listState().error).toBeTruthy();
  });
});
