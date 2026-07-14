import { Component, inject, OnInit, AfterViewInit, ElementRef, ViewChild, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../../application/services/auth.service';
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

  @ViewChild('ticketChart') ticketChartCanvas!: ElementRef;

  // Estatísticas Mockadas (serão substituídas por dados do back-end futuramente)
  stats = {
    total: 124,
    open: 45,
    pending: 12,
    resolved: 67
  };

  ngOnInit() {
    // Inicialização futura aqui
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initChart();
    }
  }

  private initChart() {
    const ctx = this.ticketChartCanvas.nativeElement.getContext('2d');
    
    // Gradiente para o gráfico
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(105, 108, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(105, 108, 255, 0)');

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'],
        datasets: [{
          label: 'Tickets Criados',
          data: [65, 59, 80, 81, 56, 55, 70],
          borderColor: '#696cff',
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#696cff',
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#fff',
            titleColor: '#566a7f',
            bodyColor: '#566a7f',
            borderColor: '#e7e7ff',
            borderWidth: 1,
            padding: 10,
            displayColors: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              display: true,
              color: '#f0f2f5'
            },
            ticks: {
              color: '#a1acb8'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#a1acb8'
            }
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
