import { Component, inject, OnInit, AfterViewInit, ElementRef, ViewChild, PLATFORM_ID, ChangeDetectionStrategy, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../../application/services/auth.service';
import { TicketsService } from '../../../application/services/tickets.service';
import { Router, RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

/** UI da área restrita. */
@Component({
    selector: 'app-dashboard',
    imports: [RouterLink],
    templateUrl: './dashboard.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly ticketsService = inject(TicketsService);

  @ViewChild('ticketChart') ticketChartCanvas!: ElementRef;

  private chart: Chart | null = null;

  constructor() {
    // Redesenha o gráfico sempre que a lista de tickets (e portanto as contagens por status) mudar.
    effect(() => {
      const total = this.ticketsService.total();
      const open = this.ticketsService.openCount();
      const inProgress = this.ticketsService.inProgressCount();
      const resolved = this.ticketsService.resolvedCount();

      if (isPlatformBrowser(this.platformId) && this.ticketChartCanvas) {
        this.renderChart(open, inProgress, resolved, total - open - inProgress - resolved);
      }
    });
  }

  ngOnInit() {
    this.ticketsService.loadForCurrentUser();
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.renderChart(
        this.ticketsService.openCount(),
        this.ticketsService.inProgressCount(),
        this.ticketsService.resolvedCount(),
        this.ticketsService.total() - this.ticketsService.openCount() - this.ticketsService.inProgressCount() - this.ticketsService.resolvedCount()
      );
    }
  }

  private renderChart(open: number, inProgress: number, resolved: number, other: number) {
    const ctx = this.ticketChartCanvas.nativeElement.getContext('2d');

    this.chart?.destroy();

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Aberto', 'Em Andamento', 'Resolvido', 'Fechado/Cancelado'],
        datasets: [{
          data: [open, inProgress, resolved, other],
          backgroundColor: ['#ffab00', '#03c3ec', '#71dd37', '#a1acb8'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
