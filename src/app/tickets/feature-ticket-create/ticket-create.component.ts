import { Component, inject, OnInit, ChangeDetectionStrategy, computed, DestroyRef, Injector } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TicketCreateStore } from '../application/ticket-create.store';
import { TicketsStore } from '../application/tickets.store';
import { DepartmentsStore } from '../../departments';
import { TicketPriority, TICKET_PRIORITY_LABELS } from '../entities/ticket-priority';
import { SessionService, ToastService, isControlInvalid, trimmed } from '../../shared';
import { TICKET_DESCRIPTION_VALIDATORS } from '../ui/ticket-description.validators';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { TicketCreateGuideComponent } from './ticket-create-guide.component';

/** Tela de abertura de um novo ticket. */
@Component({
  selector: 'app-ticket-create',
  imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent, TicketCreateGuideComponent],
  templateUrl: './ticket-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './ticket-create.component.css'
})
export class TicketCreateComponent implements OnInit {
  /** Construtor do formulário do chamado. */
  private readonly fb = inject(FormBuilder);
  /** Router, pra ir a "Meus Chamados" ou ao Início depois de abrir o chamado. */
  private readonly router = inject(Router);
  /** Toast que confirma a abertura do chamado. */
  private readonly toastService = inject(ToastService);
  /** Sessão atual, pra saber se quem abriu pode ver "Meus Chamados". */
  private readonly sessionService = inject(SessionService);
  /** Encerra a ligação do setor ao departamento quando a tela sai. */
  private readonly destroyRef = inject(DestroyRef);
  /** Injector da tela: a lista de "Meus Chamados" só é obtida depois de criar, nunca ao abrir a tela. */
  private readonly injector = inject(Injector);
  /** Store da abertura do chamado: envio e falha. */
  protected readonly store = inject(TicketCreateStore);
  /** Departamentos e setores dos seletores do formulário. */
  protected readonly departmentsStore = inject(DepartmentsStore);

  /** Opções do seletor de prioridade, da mais baixa à mais alta, com o rótulo de cada uma. */
  readonly priorities = [
    { value: TicketPriority.Low, label: TICKET_PRIORITY_LABELS[TicketPriority.Low] },
    { value: TicketPriority.Medium, label: TICKET_PRIORITY_LABELS[TicketPriority.Medium] },
    { value: TicketPriority.High, label: TICKET_PRIORITY_LABELS[TicketPriority.High] },
    { value: TicketPriority.Urgent, label: TICKET_PRIORITY_LABELS[TicketPriority.Urgent] }
  ];

  /**
   * Formulário do chamado. O obrigatório e o mínimo do título e da descrição valem para o texto aparado, que é o
   * enviado (só espaços o back-end recusa); o máximo, para o digitado, o mesmo que o contador mostra.
   */
  form = this.fb.group({
    title: ['', [trimmed(Validators.required), Validators.maxLength(200)]],
    description: ['', TICKET_DESCRIPTION_VALIDATORS],
    priority: [TicketPriority.Medium, [Validators.required]],
    departmentId: ['', [Validators.required]],
    sectorId: [{ value: '', disabled: true }, [Validators.required]]
  });

  /** Departamento escolhido no formulário, como sinal, pra listar os setores dele. */
  private readonly selectedDepartmentId = toSignal(this.form.controls.departmentId.valueChanges, { initialValue: '' });

  /** Departamentos que têm pelo menos um setor — sem setor não há para onde abrir o chamado. */
  readonly departmentsWithSectors = computed(() =>
    this.departmentsStore.departments().filter(d => d.sectors.length > 0));

  /** Setores do departamento selecionado, para o cascading de Departamento -> Setor. */
  readonly availableSectors = computed(() => {
    const department = this.departmentsStore.departments()
      .find(d => d.id === this.selectedDepartmentId());
    return department?.sectors ?? [];
  });

  /** Descarta o erro de um envio anterior, carrega os departamentos e liga o setor ao departamento escolhido. */
  ngOnInit(): void {
    this.store.clearMutationError();
    this.departmentsStore.load();

    this.form.controls.departmentId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(departmentId => {
      this.form.controls.sectorId.reset('');
      if (departmentId) {
        this.form.controls.sectorId.enable();
      } else {
        this.form.controls.sectorId.disable();
      }
    });
  }

  /** Verifica se um campo está inválido e já foi tocado, pra só mostrar o erro depois da primeira interação. */
  isFieldInvalid(fieldName: keyof typeof this.form.controls): boolean {
    return isControlInvalid(this.form.controls[fieldName]);
  }

  /**
   * Abre o chamado com o título e a descrição aparados; com o formulário inválido, só marca os campos como tocados
   * pra mostrar os erros (o botão fica habilitado de propósito — desabilitado, quem clica não descobre o que falta).
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.store.create({
      title: raw.title!.trim(),
      description: raw.description!.trim(),
      priority: raw.priority!,
      sectorId: raw.sectorId!
    }, () => {
      this.toastService.show('Chamado aberto com sucesso.');
      this.goToNextScreen();
    });
  }

  /**
   * Depois de criar: "Meus Chamados" na primeira página, onde o chamado novo aparece, para quem tem
   * `tickets:view-own`; sem ela, o Início (a rota da lista exige a permissão).
   */
  private goToNextScreen(): void {
    if (!this.sessionService.hasPermission('tickets:view-own')) {
      this.router.navigate(['/dashboard']);
      return;
    }
    // A lista é da raiz e guarda a página em que estava. Obtida só agora: criá-la ao abrir a tela
    // dispararia o GET /tickets/mine, que a criação não usa.
    this.injector.get(TicketsStore).goToPage(1);
    this.router.navigate(['/tickets']);
  }
}
