import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ChartConfiguration, ChartData } from 'chart.js'
import { BaseChartDirective } from 'ng2-charts';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-admin-statistika',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './admin-statistika.component.html',
  styleUrl: './admin-statistika.component.css'
})
export class AdminStatistikaComponent implements OnInit {

  private us = inject(UserService);
  ngOnInit(): void {

    this.us.getStatistics(2026).subscribe({
      next: (res) => {
        console.log('Backend odgovor:', res);
        if (res && res.length > 0) {
          const labels = res.map((i: any) => i._id);
          const brojke = res.map((i: any) => i.brojRezervacija);
          //novi objekat da bi Angular detektovao promenu
          const mojeBoje = [
            '#36A2EB', '#FF6384', '#FF9F40', '#FFCE56',
            '#4BC0C0', '#9966FF', '#C9CBCF', '#05D5FF',
            '#546E7A', '#AED581'
          ];

          this.popularnostData = {
            labels: labels,
            datasets: [{
              data: brojke,
              backgroundColor: mojeBoje.slice(0, labels.length),
              label: 'Broj rezervacija'
            }]
          };


          this.prihodData = {
            labels: labels,
            datasets: [{
              data: res.map((i: any) => i.prihod),
              label: 'Prihodi (RSD)',
              backgroundColor: '#6aa4a1'
            }]
          };
        }
      },
      error: (err) => console.error('Greška:', err)
    });

  }

  // zajednicke opcije za grafikone
  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom' }
    }
  };

  // podaci za Bar Chart - PRIHODI

  prihodData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Prihodi (RSD)', backgroundColor: '#6aa4a1' }
    ]
  }

  popularnostData: ChartData<'pie'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: ['#FF6384', '#11354d', '#FFCE56', '#b86327', '#9966FF',
          '#FF9F40', '#C9CBCF', '#4BC0C0', '#FFCD56', '#eb36bb']
      }
    ]

  }


}
