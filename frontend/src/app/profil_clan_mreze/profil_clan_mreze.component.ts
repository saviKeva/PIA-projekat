import { NgIf, NgForOf, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../services/user.service';
import User from '../models/user';
import Rezervacija from '../models/rezervacija';

@Component({
  selector: 'app-profil-clan-mreze',
  standalone: true,
  imports: [FormsModule, RouterLink, NgIf, NgForOf, DatePipe],
  templateUrl: './profil_clan_mreze.component.html',
  styleUrl: './profil_clan_mreze.component.css'
})
export class ProfilClanMrezeComponent implements OnInit {

  private servis = inject(UserService);
  private router = inject(Router);

  user: User = new User();
  podaci: Array<string>[] = [];
  message = "";
  selectedFile: File | null = null;
  rezervacije: any[] = [];
  sortSmer: number[] = [1,1,1,1]; //1 rastuce, -1 opadajuce



  ngOnInit(): void {
    let username = JSON.parse(localStorage.getItem("logged")!); //sta radi upitnik ovde?

    this.servis.getUser(username).subscribe({
      next: (data) => {
        if (data) {
          this.user = data;

          //Moram ovde pozvati fju za dohvatanje rezervacija inace se nece videti pri ucitavanju stranice
          this.ucitajSveRezervacije();
        } else {
          this.message = "Pogresni podaci!"
        }
      },
      error: (err) => {
        this.message = err.error?.message || "Greska pri dohvatanju podataka za clana mreze!" //sta radi ova tacka pre message
      }
    })



  }
  //IZMENA LICNIH PODATAKA

  fieldErrors: any = {}; // cuva greške za svako polje (npr. fieldErrors['pib'])
  showPassword: boolean = false; // prikaz/skrivanje lozinke
  passwordMessage: string = ""; // posebna poruka za lozinku
  errors: any = {}; // objekat koji čuva greške za svako polje
  izmeni(podatak: string, ime_polja: string) {
    // resetuj grešku za to konkretno polje pre provere
    this.errors[ime_polja] = "";

    // validacija na frontu (PIB i Matični)
    if (ime_polja === 'pib' && !/^[1-9]\d{8}$/.test(podatak)) {
      this.errors[ime_polja] = "PIB mora imati 9 cifara i ne sme početi nulom.";
      return;
    }
    if (ime_polja === 'maticniBroj' && !/^\d{8}$/.test(podatak)) {
      this.errors[ime_polja] = "Matični broj mora imati tačno 8 cifara.";
      return;
    }

    // slanje na server
    this.servis.promeniPodatak(this.user.kor_ime, podatak, ime_polja).subscribe({
      next: (data) => {
        if (data == "OK") {
          alert("Uspešno ste izmenili polje: " + ime_polja);
          this.errors[ime_polja] = ""; // brišem poruku ako je bila crvena
        }
      },
      error: (err) => {
        // ako backend vrati grešku (npr. email već postoji), ispiši je ispod polja
        this.errors[ime_polja] = err.error?.message || "Greška pri izmeni.";
      }
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
  //uhvati fajl iz input-a
  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  promeniSliku() {
    if (!this.selectedFile) {
      this.message = "Odaberite sliku!";
      return;
    }

    const fd = new FormData();
    fd.append('slika', this.selectedFile);
    fd.append('kor_ime', this.user.kor_ime);

    this.servis.updateProfileImage(fd).subscribe({
      next: (res: any) => {
        this.message = "Slika uspesno promenjena!"
        this.user.slika = res.novaSlika;
        this.selectedFile = null; //resetujem input
      },
      error: (err) => {
        this.message = "Greska pri upload-u!"
      }
    })
  }


  ucitajSveRezervacije() {
    console.log("Pokrećem ucitavanje za: ", this.user.kor_ime); // debug
    this.servis.getRezervacije(this.user.kor_ime).subscribe({
      next: (data) => {
        this.rezervacije = data;
        console.log("Rezervacije stigle sa servera:", this.rezervacije);
      },
      error: (err) => {
        console.error("Greška u servisu:", err);
        this.message = "Greska pri ucitavanju rezervacija.";
      }
    });
  }

  otkazi(id: string) {
    if (confirm("Da li ste sigurni da zelite da otkazete rezervaciju?")) {
      this.servis.otkaziRezervaciju(id).subscribe({
        next: (res: any) => {
          this.message = res.message;
          if (!res.message) {
            this.message = "Nije moguce otkazati!"
            return;
          }
          this.ngOnInit();
          //odmah filtriram rezervacije na front-u da bi rezervacija odmah nestala iz tabele
        },
        error: (err) => {
          this.message = err.error?.message || "Greska pri otkazivanju";

        }
      })
    }
  }


  sortiraj(kolona: string, index:number) {
    this.sortSmer[index] = this.sortSmer[index] * -1;
    this.rezervacije.sort((a, b) => {
      if (a[kolona] < b[kolona]) return -1 * this.sortSmer[index];
      if (a[kolona] > b[kolona]) return 1 * this.sortSmer[index];
      return 0;
    })
  }

  mozeOtkazati(od: any): boolean {
    const sada = new Date();
    const odT = new Date(od);
    //pošto su oba Date objekti, oduzimanje daje milisekunde
    const razlikaMS = odT.getTime() - sada.getTime();
    const razlikaSati = razlikaMS / (1000 * 60 * 60);

    //iz nekog razloga dodaje gmt + 1
    const pravaRazlikaSati = razlikaSati - (odT.getTimezoneOffset() / -60);

    // console.log(odT.getTimezoneOffset());

    // console.log(odT);
    // console.log(sada);
    // console.log(pravaRazlikaSati);
    // console.log("Moze otkazati: ", pravaRazlikaSati>=12);

    return pravaRazlikaSati >= 12;
  }

  staraLozinka = "";
  novaLozinka = "";

  // funkcija za promenu lozinke sa alertom i porukama
  promeniLozinku() {
    this.errors['lozinka'] = "";
    if (!this.staraLozinka || !this.novaLozinka) {
      this.errors['lozinka'] = "Popunite oba polja.";
      return;
    }

    this.servis.changePassword(this.user.kor_ime, this.staraLozinka, this.novaLozinka).subscribe({
      next: (res: any) => {
        alert("Lozinka je uspešno promenjena!");
        this.staraLozinka = "";
        this.novaLozinka = "";
      },
      error: (err) => {
        this.errors['lozinka'] = err.error?.message || "Greška pri promeni lozinke.";
      }
    });
  }


  //provere za tel, mejl, pib i maticni
  isPhoneValid(): boolean {
    const phone = this.user.tel ? this.user.tel.trim() : '';

    const phoneRegex = /^(06\d{8}|\+3816\d{8})$/;

    return phoneRegex.test(phone);
  }

  isEmailValid(): boolean {
    const email = this.user.mejl ? this.user.mejl.trim() : '';

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }





}
