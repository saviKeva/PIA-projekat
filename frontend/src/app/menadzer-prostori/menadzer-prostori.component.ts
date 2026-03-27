import { Component, inject, OnInit } from '@angular/core';
import { ProstorService } from '../services/prostor-service.service';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-menadzer-prostori',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor],
  templateUrl: './menadzer-prostori.component.html',
  styleUrl: './menadzer-prostori.component.css'
})
export class MenadzerProstoriComponent implements OnInit {
  ngOnInit(): void {
    const username = JSON.parse(localStorage.getItem("logged")!);

    if(username){
      this.uservis.getUser(username).subscribe({
      next: (user1: any) => {
        this.user = user1;
        console.log("Podaci o menadžeru su spremni:", user1);
      },
      error: (err) => console.error("Greška pri dohvatanju korisnika", err)
    });
    }
  }

  user:any=null;
  forma: any = {
    naziv: '',
    grad: '',
    ulica: '',
    broj: '',
    opis: '',
    cenaPoSatu: null,
    brojStolova: 5,
    maxKazne: 3
  }

  kancelarije: any[] = [];
  sale: any[] = [];

  private servis = inject(ProstorService);
  private router = inject(Router);
  private uservis = inject(UserService);

  dodajKancelariju() {
    this.kancelarije.push({ naziv: '', kapacitet: 1 });
  }

  dodajSalu() {
    this.sale.push({ naziv: '', oprema: '' });
  }

  obrisiKancelariju(i: number) {
    this.kancelarije.splice(i, 1);
  }

  obrisiSalu(i: number) {
    this.sale.splice(i, 1);
  }

  podnesiZahtev() {
    if (this.forma.brojStolova < 5) {
      alert("Otvoreni radni prostor mora imati bar 5 stolova!");
      return;
    }

    let jedinice = [];

    // 1. Dodavanje stolova
    for (let i = 1; i <= this.forma.brojStolova; i++) {
      jedinice.push({
        tip: 'sto',
        naziv: `Sto ${i}`,
        kapacitet: 1,
        cena: this.forma.cenaPoSatu,
        oprema: ""
      });
    }

    // 2. Dodavanje kancelarija
    this.kancelarije.forEach(k => {
      jedinice.push({
        tip: 'kancelarija',
        naziv: k.naziv,
        kapacitet: k.kapacitet,
        cena: this.forma.cenaPoSatu,
        oprema: ""
      });
    });

    // 3. Dodavanje sala
    for (let s of this.sale) {
      if (s.oprema.length > 300) {
        alert(`Oprema za salu ${s.naziv} je predugačka!`);
        return;
      }
      jedinice.push({
        tip: 'sala',
        naziv: s.naziv,
        kapacitet: 11, // Fiksno po tekstu
        cena: this.forma.cenaPoSatu,
        oprema: s.oprema
      });
    }

    // 4. Provera jedinstvenosti naziva (da ne šaljemo džabe ako ima duplikata)
    const nazivi = jedinice.map(j => j.naziv);
    if (new Set(nazivi).size !== nazivi.length) {
      alert("Svi nazivi jedinica (stolovi, kancelarije, sale) moraju biti jedinstveni!");
      return;
    }


    console.log("Ulogovani korisnik iz storage-a:", this.user);

    const slanje = {
      naziv: this.forma.naziv,
      grad: this.forma.grad,
      ulica: this.forma.ulica,
      broj: this.forma.broj,
      opis: this.forma.opis,
      cenaPoSatu: this.forma.cenaPoSatu, 
      firma: this.user.firmaNaziv || 'Default firma',
      kor_ime: this.user.kor_ime,
      menadzer: this.user.ime + " " + this.user.prezime,
      jedinice: jedinice,
      maxKazne: this.forma.maxKazne,
      slike: ["default_prostor.jpg"] 
    };

    this.servis.addProstor(slanje).subscribe({
      next: (res: any) => {
        if (res.message === "OK" || res.message === "Prostor uspešno kreiran!") {
          alert("Uspešno ste poslali zahtev za novi prostor!");
          this.router.navigate(['/moj-profil']);
        }
      },
      error: (err: any) => {
        alert("Greška: " + (err.error?.message || "Došlo je do greške na serveru."));
      }
    });
  }


  //selektovanje JSON fajla

  selectedFile: File | null = null;

  onFileSelected(event:any){
    this.selectedFile = event.target.files[0];
  }

  posaljiFajl(){
    if(!this.selectedFile){
      alert("Izaberite fajl!");
      return;
    }

    //PAZNJA! FormData ne sluzi za prosledjivanje JSON fajl vec za prosledjivanje podataka o
    //trnutno ulogovanom menadzeru

    const fd = new FormData();

    fd.append('fajl', this.selectedFile);

    fd.append('kor_ime', this.user.kor_ime);

    fd.append('firma', this.user.firmaNaziv);

    this.servis.uploadKonfiguraciju(fd).subscribe({
      next: (res:any)=>{
        alert("Prostor uspesno kreiran iz JSON-a!");
        this.router.navigate(['/menadzer/profil']);
      }, error:(err)=>{
        alert("Greska: " + (err.error?.message || "Neuspesan upload."));
      }
    });
  }
}
