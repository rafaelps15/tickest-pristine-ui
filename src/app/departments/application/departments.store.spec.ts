import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { DepartmentsStore } from './departments.store';
import { DepartmentDataService } from '../infrastructure/department.data.service';
import { SectorDataService } from '../infrastructure/sector.data.service';
import { Department } from '../entities/department';

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

  let store: InstanceType<typeof DepartmentsStore>;
  let departmentDataService: jasmine.SpyObj<DepartmentDataService>;
  let sectorDataService: jasmine.SpyObj<SectorDataService>;

  beforeEach(() => {
    departmentDataService = jasmine.createSpyObj('DepartmentDataService', ['getAll', 'create', 'update', 'delete']);
    sectorDataService = jasmine.createSpyObj('SectorDataService', ['create', 'update', 'delete']);
    departmentDataService.getAll.and.returnValue(of(departments));

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        DepartmentsStore,
        { provide: DepartmentDataService, useValue: departmentDataService },
        { provide: SectorDataService, useValue: sectorDataService }
      ]
    });
    store = TestBed.inject(DepartmentsStore);
  });

  it('expõe os departamentos com os setores aninhados', async () => {
    store.load();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(store.departments()).toEqual(departments);
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

  it('expõe a mensagem da API quando o setor tem chamados em aberto', () => {
    const conflict = new HttpErrorResponse({
      status: 409,
      error: { detail: 'O setor tem chamados em aberto ou em andamento.' }
    });
    sectorDataService.delete.and.returnValue(throwError(() => conflict));

    store.deleteSector('sec-1');

    expect(store.mutationError()).toBe('O setor tem chamados em aberto ou em andamento.');
  });

  it('usa a mensagem padrão quando a API não devolve detalhe', () => {
    sectorDataService.delete.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    store.deleteSector('sec-1');

    expect(store.mutationError()).toBe('Erro ao excluir setor');
  });

  it('limpa o erro de mutação', () => {
    sectorDataService.delete.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'Conflito' } })));
    store.deleteSector('sec-1');

    store.clearMutationError();

    expect(store.mutationError()).toBeNull();
  });
});
