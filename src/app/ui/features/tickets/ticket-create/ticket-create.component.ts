import { Component, inject, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TicketsService } from '../../../../application/services/tickets.service';
import { DepartmentsService } from '../../../../application/services/departments.service';
import { TicketPriority, TICKET_PRIORITY_LABELS } from '../../../../domain/enums/ticket-priority.enum';

/** Tela de abertura de um novo ticket. */
@Component({
    selector: 'app-ticket-create',
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './ticket-create.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './ticket-create.component.css'
})
export class TicketCreateComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    protected readonly ticketsService = inject(TicketsService);
    protected readonly departmentsService = inject(DepartmentsService);

    readonly priorities = [
        { value: TicketPriority.Low, label: TICKET_PRIORITY_LABELS[TicketPriority.Low] },
        { value: TicketPriority.Medium, label: TICKET_PRIORITY_LABELS[TicketPriority.Medium] },
        { value: TicketPriority.High, label: TICKET_PRIORITY_LABELS[TicketPriority.High] },
        { value: TicketPriority.Urgent, label: TICKET_PRIORITY_LABELS[TicketPriority.Urgent] }
    ];

    form = this.fb.group({
        title: ['', [Validators.required, Validators.maxLength(200)]],
        description: ['', [Validators.required, Validators.maxLength(500)]],
        priority: [TicketPriority.Medium, [Validators.required]],
        departmentId: ['', [Validators.required]],
        sectorId: [{ value: '', disabled: true }, [Validators.required]]
    });

    private readonly selectedDepartmentId = toSignal(this.form.controls.departmentId.valueChanges, { initialValue: '' });

    /** Setores do departamento selecionado, para o cascading de Departamento -> Setor. */
    readonly availableSectors = computed(() => {
        const department = this.departmentsService.departments()
            .find(d => d.id === this.selectedDepartmentId());
        return department?.sectors ?? [];
    });

    ngOnInit(): void {
        this.departmentsService.load();

        this.form.controls.departmentId.valueChanges.subscribe(departmentId => {
            this.form.controls.sectorId.reset('');
            departmentId ? this.form.controls.sectorId.enable() : this.form.controls.sectorId.disable();
        });
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const raw = this.form.getRawValue();
        this.ticketsService.create({
            title: raw.title!,
            description: raw.description!,
            priority: raw.priority!,
            sectorId: raw.sectorId!
        }, () => this.router.navigate(['/tickets']));
    }
}
