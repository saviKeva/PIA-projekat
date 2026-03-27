import { NgIf, NgForOf } from '@angular/common';
import { Component, inject, NgModule, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterOutlet } from '@angular/router';
import Prostor from '../models/prostor';
import { ProstorService } from '../services/prostor-service.service';


@Component({
  selector: 'app-pretraga-i-rezervacija',
  standalone: true,
  imports: [FormsModule, RouterLink, NgIf, NgForOf],
  templateUrl: './pretraga-i-rezervacija.component.html',
  styleUrl: './pretraga-i-rezervacija.component.css'
})
export class PretragaIRezervacijaComponent implements OnInit{
  pretragaTekst: string = ""
  izabraniTip: string  | null = null;
  brojOsobaKancelarija: number | null = null;
  rezultati: Prostor[] = [];
  private service = inject(ProstorService);
  message=""
  flag:boolean = false;

  ngOnInit(): void {
      this.message="";
      this.flag=false;
  }


  toggleTip(tip:string){
    if(this.izabraniTip === tip){
      this.izabraniTip = null;
      this.brojOsobaKancelarija = null;
      this.message="";
      this.flag = false;
    }else{
      this.izabraniTip = tip;
      this.message="";
      this.flag = false;
    }
  }

  pretrazi() {
  const filter = {
    tekst: this.pretragaTekst,
    tip: this.izabraniTip,
    brojOsoba: this.brojOsobaKancelarija
  };

  this.service.pretrazi(filter).subscribe(data => {
    this.rezultati = data;

    //niz prazan (dužina 0) ili null
    if (!this.rezultati || this.rezultati.length === 0) {
      this.message = "Nema rezultata za zadatu pretragu!";
      this.flag = true;
    } else {
      this.message = "";
      this.flag = false;
    }
  });
}

}
