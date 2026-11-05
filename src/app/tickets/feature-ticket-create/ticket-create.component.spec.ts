import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TicketCreateComponent } from './ticket-create.component';
import { TicketsStore } from '../application/tickets.store';
import { TicketPriority } from '../entities/ticket-priority';
import { Department, DepartmentsStore } from '../../departments';
import { ToastService } from '../../shared';

describe('TicketCreateComponent', () => {
  const informationTechnology: Department = {
    id: 'dep-1',
    name: 'TI',
    description: 'Tecnologia da Informação',
    responsibleUserId: null, responsibleUserName: null,
    sectors: [{ id: 'sec-1', name: 'Helpdesk', description: null }]
  };
  const departmentWithoutSectors: Department = {
    id: 'dep-2',
    name: 'Jurídico',
    description: 'Contratos e processos',
    responsibleUserId: null, responsibleUserName: null,
    sectors: []
  };

  let ticketsStoreFake: {
    state: ReturnType<typeof signal<{ error: string | null }>>;
    creating: ReturnType<typeof signal<boolean>>;
    create: jasmine.Spy;
  };
  let departmentsStoreFake: {
    departments: ReturnType<typeof signal<Department[]>>;
    listState: ReturnType<typeof signal<{ loading: boolean; error: string | null }>>;
    load: jasmine.Spy;
  };
  let toastServiceFake: { show: jasmine.Spy };

  beforeEach(async () => {
    ticketsStoreFake = { state: signal({ error: null }), creating: signal(false), create: jasmine.createSpy('create') };
    departmentsStoreFake = {
      departments: signal<Department[]>([informationTechnology, departmentWithoutSectors]),
      listState: signal({ loading: false, error: null }),
      load: jasmine.createSpy('load')
    };
    toastServiceFake = { show: jasmine.createSpy('show') };

    await TestBed.configureTestingModule({
      imports: [TicketCreateComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TicketsStore, useValue: ticketsStoreFake },
        { provide: DepartmentsStore, useValue: departmentsStoreFake },
        { provide: ToastService, useValue: toastServiceFake }
      ]
    }).compileComponents();
  });

  it('loads the departments on initialization', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();

    expect(departmentsStoreFake.load).toHaveBeenCalled();
  });

  it('only offers departments that have sectors', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();

    const options = Array.from<HTMLOptionElement>(
      fixture.nativeElement.querySelectorAll('#ticketDepartmentId option')
    ).map(option => option.textContent?.trim());

    expect(options).toContain('TI');
    expect(options).not.toContain('Jurídico');
  });

  it('enables and lists the sectors of the chosen department', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.form.controls.departmentId.setValue('dep-1');
    await fixture.whenStable();

    expect(component.form.controls.sectorId.enabled).toBeTrue();
    expect(component.availableSectors()).toEqual(informationTechnology.sectors);
  });

  it('shows a spinner in the Departamento field while the list loads', async () => {
    departmentsStoreFake.listState.set({ loading: true, error: null });
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Carregando departamentos…');
  });

  it('shows the departments store error when the fetch fails', async () => {
    departmentsStoreFake.listState.set({ loading: false, error: 'Erro ao carregar departamentos' });
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Erro ao carregar departamentos');
  });

  it('links the Título field to its error text via aria-describedby', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.form.controls.title.markAsTouched();
    fixture.detectChanges();

    const titleInput = fixture.nativeElement.querySelector('#ticketTitle') as HTMLInputElement;
    expect(titleInput.getAttribute('aria-describedby')).toBe('ticketTitleError');
    expect(fixture.nativeElement.querySelector('#ticketTitleError')).toBeTruthy();
  });

  it('shows a per-field validation error after it is touched and invalid', async () => {
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

  it('requires at least 10 characters in the description', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.form.controls.description.setValue('curta');
    component.form.controls.description.markAsTouched();
    fixture.detectChanges();

    expect(component.isFieldInvalid('description')).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('A descrição deve ter pelo menos 10 caracteres.');
  });

  it('marks all fields as touched when trying to submit an invalid form', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.onSubmit();

    expect(ticketsStoreFake.create).not.toHaveBeenCalled();
    expect(component.form.controls.title.touched).toBeTrue();
    expect(component.form.controls.departmentId.touched).toBeTrue();
  });

  it('opens the ticket in the chosen sector', async () => {
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

  it('shows a success toast when the ticket is opened', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.form.controls.title.setValue('Impressora não funciona');
    component.form.controls.description.setValue('A impressora do 2º andar não imprime nada.');
    component.form.controls.departmentId.setValue('dep-1');
    component.form.controls.sectorId.setValue('sec-1');
    component.onSubmit();

    const onSuccess = ticketsStoreFake.create.calls.mostRecent().args[1];
    onSuccess();

    expect(toastServiceFake.show).toHaveBeenCalledWith('Chamado aberto com sucesso.');
  });

  it('leaves submit enabled with the empty form and, on submit, shows the errors without opening the ticket', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();

    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitButton.disabled).toBeFalse();

    submitButton.click();
    await fixture.whenStable();

    expect(ticketsStoreFake.create).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('O título é obrigatório.');
    expect(fixture.nativeElement.textContent).toContain('A descrição é obrigatória.');
    expect(fixture.nativeElement.textContent).toContain('Selecione o departamento.');
  });

  it('shows how many of the 500 description characters have been used', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();

    const hint = () => (fixture.nativeElement.querySelector('#ticketDescriptionHint') as HTMLElement).textContent?.trim();
    expect(hint()).toBe('0/500');

    const textarea = fixture.nativeElement.querySelector('#ticketDescription') as HTMLTextAreaElement;
    textarea.value = 'Impressora parada';
    textarea.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(hint()).toBe('17/500');
  });

  it('disables and shows a spinner on the submit button while the ticket is being created', async () => {
    ticketsStoreFake.creating.set(true);
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();

    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitButton.disabled).toBeTrue();
    expect(submitButton.querySelector('.spinner-border')).toBeTruthy();
  });

  it('warns that a department must be chosen first, while the sector is disabled', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Escolha um departamento primeiro.');

    fixture.componentInstance.form.controls.departmentId.setValue('dep-1');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Escolha um departamento primeiro.');
  });

  it('shows the submit error right above the submit button, as an alert', async () => {
    ticketsStoreFake.state.set({ error: 'O setor escolhido não atende mais chamados.' });
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    const submit = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(alert.textContent).toContain('O setor escolhido não atende mais chamados.');
    expect(alert.compareDocumentPosition(submit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(alert.nextElementSibling).toBe(submit.parentElement);
  });
});
