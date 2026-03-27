import { NgFor, NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ProstorService } from '../services/prostor-service.service';

@Component({
  selector: 'app-pocetna',
  standalone: true,
  imports: [FormsModule,RouterLink, NgIf, NgFor],
  templateUrl: './pocetna.component.html',
  styleUrl: './pocetna.component.css'
})
export class PocetnaComponent implements OnInit {
  prostori: any[] = [];
  filtriraniProstori: any[] =[];
  top5: any[] = [];
  dostupniGradovi: string[] = [];
  private service = inject(ProstorService);
  private router = inject(Router);
  message = "";

  //filteri
  filterNaziv: string = '';
  selektovaniGradovi: any[] = [];

  //sortiranje
  sortKolona: string = '';
  sortSmer: number = 1; //1 za ASC, -1 za DESC

  ngOnInit(): void {
    this.message="";
      this.service.getActiveProstori().subscribe({
        next: (data) => {
          if(data){
            this.prostori = data;

            this.filtriraniProstori = [...this.prostori];
            this.top5 = this.prostori.sort((a,b)=>b.likes-a.likes).slice(0,5);
            this.dostupniGradovi = [...new Set(this.prostori.map(p => p.grad))];
          }
        },
        error: (err) => {
          console.log(err);

          if(err.error && err.error.message){
            this.message = err.error.message;
          }else{
            this.message = "Greska: getActiveProstori";
          }
        }

      });
  }

  pretrazi() {
    this.filtriraniProstori = this.prostori.filter(p => {
      const matchNaziv = p.naziv.toLowerCase().includes(this.filterNaziv.toLowerCase());
      const matchGrad = this.selektovaniGradovi.length === 0 || this.selektovaniGradovi.includes(p.grad);
      return matchNaziv && matchGrad;
    });
  }

  sortiraj(kolona: string) {
    this.sortSmer *= -1;
    this.filtriraniProstori.sort((a, b) => {
      return a[kolona].localeCompare(b[kolona]) * this.sortSmer;
    });
  }

  detalji(prostor: any) {
    this.router.navigate(['/detalji', prostor._id]); // Bolje je koristiti ID
  }


}
