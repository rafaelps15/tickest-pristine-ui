import { Component, inject, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TicketsStore } from '../application/tickets.store';
import { DepartmentsStore } from '../../departments';
import { TicketPriority, TICKET_PRIORITY_LABELS } from '../entities/ticket-priority';
import { ToastService } from '../../shared';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

/** Tela de abertura de um novo ticket. */
@Component({
    selector: 'app-ticket-create',
    imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent],
    templateUrl: './ticket-create.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './ticket-create.component.css'
})
export class TicketCreateComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly toastService = inject(ToastService);
    protected readonly store = inject(TicketsStore);
    protected readonly departmentsStore = inject(DepartmentsStore);

    readonly priorities = [
        { value: TicketPriority.Low, label: TICKET_PRIORITY_LABELS[TicketPriority.Low] },
        { value: TicketPriority.Medium, label: TICKET_PRIORITY_LABELS[TicketPriority.Medium] },
        { value: TicketPriority.High, label: TICKET_PRIORITY_LABELS[TicketPriority.High] },
        { value: TicketPriority.Urgent, label: TICKET_PRIORITY_LABELS[TicketPriority.Urgent] }
    ];

    form = this.fb.group({
        title: ['', [Validators.required, Validators.maxLength(200)]],
        description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
        priority: [TicketPriority.Medium, [Validators.required]],
        departmentId: ['', [Validators.required]],
        sectorId: [{ value: '', disabled: true }, [Validators.required]]
    });

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

    ngOnInit(): void {
        this.departmentsStore.load();

        this.form.controls.departmentId.valueChanges.subscribe(departmentId => {
            this.form.controls.sectorId.reset('');
            departmentId ? this.form.controls.sectorId.enable() : this.form.controls.sectorId.disable();
        });
    }

    /** Verifica se um campo está inválido e já foi tocado, pra só mostrar o erro depois da primeira interação. */
    isFieldInvalid(fieldName: keyof typeof this.form.controls): boolean {
        const control = this.form.controls[fieldName];
        return control.invalid && (control.dirty || control.touched);
    }

    /**
     * Abre o chamado; com o formulário inválido, só marca os campos como tocados pra mostrar os erros
     * (o botão fica habilitado de propósito — desabilitado, quem clica não descobre o que falta).
     */
    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const raw = this.form.getRawValue();
        this.store.create({
            title: raw.title!,
            description: raw.description!,
            priority: raw.priority!,
            sectorId: raw.sectorId!
        }, () => {
            this.toastService.show('Chamado aberto com sucesso.');
            this.router.navigate(['/tickets']);
        });
    }
}
