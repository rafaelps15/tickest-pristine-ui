import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { TicketCreateComponent } from './ticket-create.component';
import { TicketCreateStore } from '../application/ticket-create.store';
import { TicketsStore } from '../application/tickets.store';
import { TicketPriority } from '../entities/ticket-priority';
import { Department, DepartmentsStore } from '../../departments';
import { SessionService, ToastService } from '../../shared';
import { environment } from '../../../environments/environment';

describe('TicketCreateComponent', () => {
  const informationTechnology: Department = {
    id: 'dep-1',
    name: 'TI',
    description: 'Tecnologia da Informação',
    responsibleUserId: null, responsibleUserName: null, activeTicketCount: 0,
    sectors: [{ id: 'sec-1', name: 'Helpdesk', description: null, activeTicketCount: 0 }]
  };
  const departmentWithoutSectors: Department = {
    id: 'dep-2',
    name: 'Jurídico',
    description: 'Contratos e processos',
    responsibleUserId: null, responsibleUserName: null, activeTicketCount: 0,
    sectors: []
  };

  let createStoreFake: {
    mutationError: ReturnType<typeof signal<string | null>>;
    creating: ReturnType<typeof signal<boolean>>;
    create: jasmine.Spy;
    clearMutationError: jasmine.Spy;
  };
  /** Lista de "Meus Chamados": a tela só a usa depois de criar, para voltar à primeira página. */
  let ticketsStoreFake: { goToPage: jasmine.Spy };
  let sessionServiceFake: { hasPermission: jasmine.Spy };
  let departmentsStoreFake: {
    departments: ReturnType<typeof signal<Department[]>>;
    listState: ReturnType<typeof signal<{ loading: boolean; error: string | null }>>;
    load: jasmine.Spy;
  };
  let toastServiceFake: { show: jasmine.Spy };

  beforeEach(async () => {
    createStoreFake = {
      mutationError: signal<string | null>(null),
      creating: signal(false),
      create: jasmine.createSpy('create'),
      clearMutationError: jasmine.createSpy('clearMutationError')
    };
    ticketsStoreFake = { goToPage: jasmine.createSpy('goToPage') };
    sessionServiceFake = { hasPermission: jasmine.createSpy('hasPermission').and.returnValue(true) };
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
        { provide: TicketCreateStore, useValue: createStoreFake },
        { provide: TicketsStore, useValue: ticketsStoreFake },
        { provide: DepartmentsStore, useValue: departmentsStoreFake },
        { provide: SessionService, useValue: sessionServiceFake },
        { provide: ToastService, useValue: toastServiceFake }
      ]
    }).compileComponents();
  });

  it('loads the departments on initialization', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();

    expect(departmentsStoreFake.load).toHaveBeenCalled();
  });

  it('discards the submit error of a previous visit when the screen opens', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();

    expect(createStoreFake.clearMutationError).toHaveBeenCalled();
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

  it('stops tying the sector to the department once the screen is destroyed', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();
    const form = fixture.componentInstance.form;

    fixture.destroy();
    form.controls.departmentId.setValue('dep-1');

    expect(form.controls.sectorId.disabled).toBeTrue();
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

  it('with a title of only spaces, does not open the ticket and says the title is required', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.form.controls.title.setValue('     ');
    component.form.controls.description.setValue('A impressora do 2º andar não imprime nada.');
    component.form.controls.departmentId.setValue('dep-1');
    component.form.controls.sectorId.setValue('sec-1');
    component.onSubmit();
    fixture.detectChanges();

    expect(createStoreFake.create).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#ticketTitleError')?.textContent).toContain('O título é obrigatório.');
  });

  it('does not count the surrounding spaces toward the minimum: with "abc" followed by 7 spaces, does not open the ticket and shows the minimum message', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.form.controls.title.setValue('Impressora não funciona');
    component.form.controls.description.setValue('abc       ');
    component.form.controls.departmentId.setValue('dep-1');
    component.form.controls.sectorId.setValue('sec-1');
    component.onSubmit();
    fixture.detectChanges();

    expect(createStoreFake.create).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#ticketDescriptionError')?.textContent)
      .toContain('A descrição deve ter pelo menos 10 caracteres.');
  });

  it('opens the ticket with the title and the description trimmed of surrounding spaces', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.form.controls.title.setValue('  Impressora não funciona  ');
    component.form.controls.description.setValue('  A impressora do 2º andar não imprime nada.  ');
    component.form.controls.departmentId.setValue('dep-1');
    component.form.controls.sectorId.setValue('sec-1');
    component.onSubmit();

    expect(createStoreFake.create).toHaveBeenCalledWith({
      title: 'Impressora não funciona',
      description: 'A impressora do 2º andar não imprime nada.',
      priority: TicketPriority.Medium,
      sectorId: 'sec-1'
    }, jasmine.any(Function));
  });

  it('marks all fields as touched when trying to submit an invalid form', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.onSubmit();

    expect(createStoreFake.create).not.toHaveBeenCalled();
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

    expect(createStoreFake.create).toHaveBeenCalledWith({
      title: 'Impressora não funciona',
      description: 'A impressora do 2º andar não imprime nada.',
      priority: TicketPriority.Medium,
      sectorId: 'sec-1'
    }, jasmine.any(Function));
  });

  /** Preenche o formulário válido, envia e devolve o callback de sucesso passado ao Store. */
  async function submitValidForm(): Promise<() => void> {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.form.controls.title.setValue('Impressora não funciona');
    component.form.controls.description.setValue('A impressora do 2º andar não imprime nada.');
    component.form.controls.departmentId.setValue('dep-1');
    component.form.controls.sectorId.setValue('sec-1');
    component.onSubmit();

    return createStoreFake.create.calls.mostRecent().args[1];
  }

  it('after opening the ticket, with tickets:view-own, shows the success notice and goes to Meus Chamados on the first page', async () => {
    sessionServiceFake.hasPermission.and.callFake((code: string) => code === 'tickets:create' || code === 'tickets:view-own');
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const onSuccess = await submitValidForm();

    onSuccess();

    expect(toastServiceFake.show).toHaveBeenCalledWith('Chamado aberto com sucesso.');
    expect(ticketsStoreFake.goToPage).toHaveBeenCalledOnceWith(1);
    expect(navigate).toHaveBeenCalledOnceWith(['/tickets']);
  });

  it('after opening the ticket, without tickets:view-own, shows the success notice and goes to Início, without touching the list', async () => {
    sessionServiceFake.hasPermission.and.callFake((code: string) => code === 'tickets:create');
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const onSuccess = await submitValidForm();

    onSuccess();

    expect(toastServiceFake.show).toHaveBeenCalledWith('Chamado aberto com sucesso.');
    expect(navigate).toHaveBeenCalledOnceWith(['/dashboard']);
    expect(ticketsStoreFake.goToPage).not.toHaveBeenCalled();
  });

  it('leaves submit enabled with the empty form and, on submit, shows the errors without opening the ticket', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();

    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitButton.disabled).toBeFalse();

    submitButton.click();
    await fixture.whenStable();

    expect(createStoreFake.create).not.toHaveBeenCalled();
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
    createStoreFake.creating.set(true);
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
    createStoreFake.mutationError.set('O setor escolhido não atende mais chamados.');
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    const submit = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(alert.textContent).toContain('O setor escolhido não atende mais chamados.');
    expect(alert.compareDocumentPosition(submit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(alert.nextElementSibling).toBe(submit.parentElement);
  });
});

describe('TicketCreateComponent with the real stores and TicketDataService (A-47)', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketCreateComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        // Logado só com tickets:create: a lista dele (GET /tickets/mine) seria recusada pela API.
        { provide: SessionService, useValue: { userId: signal('u1'), hasPermission: (code: string) => code === 'tickets:create' } },
        {
          provide: DepartmentsStore,
          useValue: { departments: signal<Department[]>([]), listState: signal({ loading: false, error: null }), load: jasmine.createSpy('load') }
        },
        { provide: ToastService, useValue: { show: jasmine.createSpy('show') } }
      ]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('opening /tickets/novo does not request the list of tickets (GET /tickets/mine)', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();

    http.expectNone(request => request.url === `${environment.apiUrl}/tickets/mine`);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });
});
