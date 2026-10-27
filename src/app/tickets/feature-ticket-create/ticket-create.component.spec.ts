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

  it('mostra um spinner no campo Departamento enquanto a lista carrega', async () => {
    departmentsStoreFake.listState.set({ loading: true, error: null });
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Carregando departamentos…');
  });

  it('mostra o erro do store de departamentos quando a busca falhar', async () => {
    departmentsStoreFake.listState.set({ loading: false, error: 'Erro ao carregar departamentos' });
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Erro ao carregar departamentos');
  });

  it('liga o campo Título ao seu texto de erro via aria-describedby', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;

    component.form.controls.title.markAsTouched();
    fixture.detectChanges();

    const titleInput = fixture.nativeElement.querySelector('#ticketTitle') as HTMLInputElement;
    expect(titleInput.getAttribute('aria-describedby')).toBe('ticketTitleError');
    expect(fixture.nativeElement.querySelector('#ticketTitleError')).toBeTruthy();
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

  it('mostra um toast de sucesso ao abrir o chamado', async () => {
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

    expect(toastServiceFake.show).toHaveBeenCalledWith('Ticket aberto com sucesso.');
  });

  it('deixa o envio habilitado com o formulário vazio e, ao enviar, mostra os erros sem abrir o chamado', async () => {
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

  it('mostra quantos dos 500 caracteres da descrição já foram usados', async () => {
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

  it('desabilita e mostra um spinner no botão de envio enquanto o ticket está sendo criado', async () => {
    ticketsStoreFake.creating.set(true);
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();

    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitButton.disabled).toBeTrue();
    expect(submitButton.querySelector('.spinner-border')).toBeTruthy();
  });

  it('avisa que é preciso escolher um departamento primeiro, enquanto o setor está desabilitado', async () => {
    const fixture = TestBed.createComponent(TicketCreateComponent);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Escolha um departamento primeiro.');

    fixture.componentInstance.form.controls.departmentId.setValue('dep-1');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Escolha um departamento primeiro.');
  });
});
