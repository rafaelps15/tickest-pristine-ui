import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TicketCreateComponent } from './ticket-create.component';
import { TicketsStore } from '../application/tickets.store';
import { TicketPriority } from '../entities/ticket-priority';
import { Department, DepartmentsStore } from '../../departments';

describe('TicketCreateComponent', () => {
  const informationTechnology: Department = {
    id: 'dep-1',
    name: 'TI',
    description: 'Tecnologia da Informação',
    responsibleUserName: null,
    sectors: [{ id: 'sec-1', name: 'Helpdesk', description: null }]
  };
  const departmentWithoutSectors: Department = {
    id: 'dep-2',
    name: 'Jurídico',
    description: 'Contratos e processos',
    responsibleUserName: null,
    sectors: []
  };

  let ticketsStoreFake: { state: ReturnType<typeof signal<{ error: string | null }>>; create: jasmine.Spy };
  let departmentsStoreFake: { departments: ReturnType<typeof signal<Department[]>>; load: jasmine.Spy };

  beforeEach(async () => {
    ticketsStoreFake = { state: signal({ error: null }), create: jasmine.createSpy('create') };
    departmentsStoreFake = {
      departments: signal<Department[]>([informationTechnology, departmentWithoutSectors]),
      load: jasmine.createSpy('load')
    };

    await TestBed.configureTestingModule({
      imports: [TicketCreateComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TicketsStore, useValue: ticketsStoreFake },
        { provide: DepartmentsStore, useValue: departmentsStoreFake }
      ]
    }).compileComponents();
  });

  it('carrega os departamentos ao inicializar', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();

    expect(departmentsStoreFake.load).toHaveBeenCalled();
  });

  it('só oferece departamentos que têm setores', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();

    const options = Array.from<HTMLOptionElement>(
      fixture.nativeElement.querySelectorAll('#ticketDepartmentId option')
    ).map(option => option.textContent?.trim());

    expect(options).toContain('TI');
    expect(options).not.toContain('Jurídico');
  });

  it('libera e lista os setores do departamento escolhido', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.form.controls.departmentId.setValue('dep-1');
    await fixture.whenStable();

    expect(component.form.controls.sectorId.enabled).toBeTrue();
    expect(component.availableSectors()).toEqual(informationTechnology.sectors);
  });

  it('mostra erro de validação por campo depois de tocado e inválido', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    expect(component.isFieldInvalid('title')).toBeFalse();

    component.form.controls.title.markAsTouched();
    fixture.detectChanges();

    expect(component.isFieldInvalid('title')).toBeTrue();
    const titleInput = fixture.nativeElement.querySelector('#ticketTitle') as HTMLInputElement;
    expect(titleInput.classList).toContain('is-invalid');
    expect(fixture.nativeElement.textContent).toContain('O título é obrigatório.');
  });

  it('exige pelo menos 10 caracteres na descrição', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.form.controls.description.setValue('curta');
    component.form.controls.description.markAsTouched();
    fixture.detectChanges();

    expect(component.isFieldInvalid('description')).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('A descrição deve ter pelo menos 10 caracteres.');
  });

  it('marca todos os campos como tocados ao tentar enviar um formulário inválido', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.onSubmit();

    expect(ticketsStoreFake.create).not.toHaveBeenCalled();
    expect(component.form.controls.title.touched).toBeTrue();
    expect(component.form.controls.departmentId.touched).toBeTrue();
  });

  it('abre o chamado no setor escolhido', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.form.controls.title.setValue('Impressora não funciona');
    component.form.controls.description.setValue('A impressora do 2º andar não imprime nada.');
    component.form.controls.departmentId.setValue('dep-1');
    component.form.controls.sectorId.setValue('sec-1');
    component.onSubmit();

    expect(ticketsStoreFake.create).toHaveBeenCalledWith({
      title: 'Impressora não funciona',
      description: 'A impressora do 2º andar não imprime nada.',
      priority: TicketPriority.Medium,
      sectorId: 'sec-1'
    }, jasmine.any(Function));
  });
});
