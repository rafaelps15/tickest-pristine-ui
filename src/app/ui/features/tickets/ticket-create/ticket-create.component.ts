import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TicketsService } from '../../../../application/services/tickets.service';
import { SectorsService } from '../../../../application/services/sectors.service';
import { TicketPriority, TICKET_PRIORITY_LABELS } from '../../../../domain/enums/ticket-priority.enum';

/** Tela de abertura de um novo ticket. */
@Component({
    selector: 'app-ticket-create',
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './ticket-create.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrl: './ticket-create.component.css'
})
export class TicketCreateComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    protected readonly ticketsService = inject(TicketsService);
    protected readonly sectorsService = inject(SectorsService);

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
        sectorId: ['', [Validators.required]]
    });

    ngOnInit(): void {
        this.sectorsService.load();
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
