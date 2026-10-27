import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { DepartmentsStore } from './departments.store';
import { DepartmentDataService } from '../infrastructure/department.data.service';
import { SectorDataService } from '../infrastructure/sector.data.service';
import { Department, DepartmentDetail } from '../entities/department';
import { UserDataService, UserSummary } from '../../users';
import { PagedResponse } from '../../shared';

describe('DepartmentsStore', () => {
  const departments: Department[] = [
    {
      id: 'dep-1',
      name: 'Tecnologia da Informação',
      description: 'Equipamentos, sistemas, redes e acessos.',
      responsibleUserName: null,
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
    departmentDataService = jasmine.createSpyObj('DepartmentDataService', ['getAll', 'getById', 'create', 'update', 'delete']);
    sectorDataService = jasmine.createSpyObj('SectorDataService', ['create', 'update', 'delete']);
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

  it('expõe os departamentos com os setores aninhados', async () => {
    store.load();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.departments()).toEqual(departments);
  });

  it('marca mutating durante a criação de departamento, e libera ao terminar', async () => {
    const subject = new Subject<string>();
    departmentDataService.create.and.returnValue(subject);

    store.create({ name: 'Operações', description: 'Logística' });
    expect(store.mutating()).toBeTrue();

    subject.next('dep-2');
    subject.complete();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.mutating()).toBeFalse();
  });

  it('marca mutating durante a atualização de departamento, mesmo quando a API falha', async () => {
    departmentDataService.update.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.update('dep-1', { name: 'TI', description: 'Tecnologia' });

    expect(store.mutating()).toBeFalse();
    expect(store.mutationError()).toBe('Erro ao atualizar departamento');
  });

  it('marca mutating durante a criação de setor, e libera ao terminar', async () => {
    const subject = new Subject<string>();
    sectorDataService.create.and.returnValue(subject);

    store.createSector({ name: 'Sistemas', departmentId: 'dep-1' });
    expect(store.mutating()).toBeTrue();

    subject.next('sec-2');
    subject.complete();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.mutating()).toBeFalse();
  });

  it('cria o setor no departamento informado e recarrega os departamentos', async () => {
    sectorDataService.create.and.returnValue(of('sec-2'));
    await TestBed.inject(ApplicationRef).whenStable();
    departmentDataService.getAll.calls.reset();
    const onSuccess = jasmine.createSpy('onSuccess');

    store.createSector({ name: 'Sistemas', departmentId: 'dep-1' }, onSuccess);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(sectorDataService.create).toHaveBeenCalledWith({ name: 'Sistemas', departmentId: 'dep-1' });
    expect(departmentDataService.getAll).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });

  it('expõe a mensagem da API quando o nome do setor já existe no departamento', () => {
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

  it('atualiza e exclui setores pelo id', () => {
    sectorDataService.update.and.returnValue(of(undefined));
    sectorDataService.delete.and.returnValue(of(undefined));

    store.updateSector('sec-1', { name: 'Suporte' });
    store.deleteSector('sec-1');

    expect(sectorDataService.update).toHaveBeenCalledWith('sec-1', { name: 'Suporte' });
    expect(sectorDataService.delete).toHaveBeenCalledWith('sec-1');
  });

  it('expõe a mensagem da API quando a atualização do setor falha', () => {
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

  it('põe a falha da exclusão do setor no deleteError, com o id dele, sem sujar o erro da página', () => {
    const conflict = new HttpErrorResponse({
      status: 409,
      error: { detail: 'O setor tem chamados em aberto ou em andamento.' }
    });
    sectorDataService.delete.and.returnValue(throwError(() => conflict));
    const onSuccess = jasmine.createSpy('onSuccess');

    store.deleteSector('sec-1', onSuccess);

    expect(store.deleteError()).toEqual({ targetId: 'sec-1', message: 'O setor tem chamados em aberto ou em andamento.' });
    expect(store.mutationError()).toBeNull();
    expect(store.deletingId()).toBeNull();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('usa a mensagem padrão quando a API não devolve detalhe', () => {
    sectorDataService.delete.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.deleteSector('sec-1');

    expect(store.deleteError()?.message).toBe('Não foi possível excluir o setor.');
  });

  it('exclui o departamento, chama o onSuccess e libera o deletingId', () => {
    const pending = new Subject<void>();
    departmentDataService.delete.and.returnValue(pending.asObservable());
    const onSuccess = jasmine.createSpy('onSuccess');

    store.delete('dep-1', onSuccess);
    expect(store.deletingId()).toBe('dep-1');

    pending.next();
    pending.complete();

    expect(departmentDataService.delete).toHaveBeenCalledWith('dep-1');
    expect(onSuccess).toHaveBeenCalled();
    expect(store.deletingId()).toBeNull();
  });

  it('ignora uma segunda exclusão enquanto a primeira está em voo (clique duplo)', () => {
    departmentDataService.delete.and.returnValue(new Subject<void>().asObservable());
    sectorDataService.delete.and.returnValue(of(undefined));

    store.delete('dep-1');
    store.delete('dep-1');
    store.deleteSector('sec-1');

    expect(departmentDataService.delete).toHaveBeenCalledTimes(1);
    expect(sectorDataService.delete).not.toHaveBeenCalled();
  });

  it('põe a falha da exclusão do departamento no deleteError e limpa ao tentar de novo ou fechar', () => {
    departmentDataService.delete.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'Tem chamados.' } })));

    store.delete('dep-1');
    expect(store.deleteError()).toEqual({ targetId: 'dep-1', message: 'Tem chamados.' });

    departmentDataService.delete.and.returnValue(new Subject<void>().asObservable());
    store.delete('dep-1');
    expect(store.deleteError()).toBeNull();

    departmentDataService.delete.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    store.clearDeleteError();
    expect(store.deleteError()).toBeNull();
  });

  it('busca o detalhe de um departamento e devolve pro callback', async () => {
    const detail: DepartmentDetail = { id: 'dep-1', name: 'TI', description: 'Equipamentos', responsibleUserId: 'u-1' };
    departmentDataService.getById.and.returnValue(of(detail));
    const onLoaded = jasmine.createSpy('onLoaded');

    store.getDepartmentDetail('dep-1', onLoaded);

    expect(departmentDataService.getById).toHaveBeenCalledWith('dep-1');
    expect(onLoaded).toHaveBeenCalledWith(detail);
  });

  it('entrega a falha do detalhe pro onError, sem chamar o onLoaded nem sujar o erro da página', () => {
    departmentDataService.getById.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const onLoaded = jasmine.createSpy('onLoaded');
    const onError = jasmine.createSpy('onError');

    store.getDepartmentDetail('dep-1', onLoaded, onError);

    expect(onError).toHaveBeenCalledWith('Não foi possível carregar o responsável atual.');
    expect(onLoaded).not.toHaveBeenCalled();
    expect(store.mutationError()).toBeNull();
    expect(store.listState().error).toBeNull();
  });

  it('avisa no onError quando não há conexão com o servidor', () => {
    departmentDataService.getById.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    const onError = jasmine.createSpy('onError');

    store.getDepartmentDetail('dep-1', () => {}, onError);

    expect(onError).toHaveBeenCalledWith('Não foi possível conectar ao servidor. Verifique sua conexão.');
  });

  it('busca candidatos a responsável por nome/e-mail', async () => {
    userDataService.getAll.and.returnValue(of(pageOf([candidate])));

    store.searchResponsibleCandidates('carlos');

    expect(userDataService.getAll).toHaveBeenCalledWith({ status: 'Active', search: 'carlos', page: 1, pageSize: 8 });
    expect(store.responsibleCandidates()).toEqual([candidate]);
  });

  it('limpa os candidatos quando a busca de responsável fica vazia, sem chamar a API', () => {
    userDataService.getAll.and.returnValue(of(pageOf([candidate])));
    store.searchResponsibleCandidates('carlos');
    userDataService.getAll.calls.reset();

    store.searchResponsibleCandidates('   ');

    expect(userDataService.getAll).not.toHaveBeenCalled();
    expect(store.responsibleCandidates()).toEqual([]);
  });

  it('expõe a mensagem de erro quando a busca de responsável falhar', () => {
    userDataService.getAll.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.searchResponsibleCandidates('carlos');

    expect(store.responsibleSearchError()).toBe('Erro ao buscar usuários');
    expect(store.responsibleCandidates()).toEqual([]);
  });

  it('limpa a busca e os candidatos a responsável', () => {
    userDataService.getAll.and.returnValue(of(pageOf([candidate])));
    store.searchResponsibleCandidates('carlos');

    store.clearResponsibleSearch();

    expect(store.responsibleCandidates()).toEqual([]);
    expect(store.responsibleSearchError()).toBeNull();
  });

  it('limpa o erro de mutação', () => {
    sectorDataService.update.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'Conflito' } })));
    store.updateSector('sec-1', { name: 'Suporte' });
    expect(store.mutationError()).toBe('Conflito');

    store.clearMutationError();

    expect(store.mutationError()).toBeNull();
  });

  it('não quebra a tela quando a listagem falha: departamentos vazio e erro exposto, em vez de lançar', async () => {
    departmentDataService.getAll.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    store.load();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(() => store.departments()).not.toThrow();
    expect(store.departments()).toEqual([]);
    expect(store.listState().loading).toBeFalse();
    expect(store.listState().error).toBeTruthy();
  });
});
