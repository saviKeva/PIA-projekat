import { DatePipe, NgForOf, NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';

import User from '../models/user';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menadzer-profil',
  standalone: true,
  imports: [FormsModule, NgForOf, NgIf],
  templateUrl: './menadzer_profil.component.html',
  styleUrl: './menadzer_profil.component.css'
})
export class MenadzerProfilComponent implements OnInit {

  private servis = inject(UserService);

  router = inject(Router);

  user: User = new User();
  podaci: Array<string>[] = [];
  message = "";
  selectedFile: File | null = null;
  prostori: any[] = [];
  sortSmer: number = 1;


  ngOnInit(): void {
    let username = JSON.parse(localStorage.getItem("logged")!);

    this.servis.getUser(username).subscribe({
      next: (data) => {
        if (data) {
          this.user = data;
          console.log("User " + data);
          //ucitaj sve prostore
          this.ucitajSveProstore();
        } else {
          this.message = "Pogresni podaci!"
        }
      },
      error: (err) => {
        this.message = err.error?.message || "Greska pri dohvaanju podatka za menadzera!"
      }
    })
  }



  //IZMENA LICNIH PODATAKA

  errors: any = {}; //cuva greske za svako polje
  passwordMessage: string = "";
  showPassword: boolean = false;

  izmeni(podatak: string, ime_polja: string) {

    //pre provere resetovati gresku za polje
    this.errors[ime_polja] = "";

    if (ime_polja === 'pib' && !/^[1-9]\d{8}$/.test(podatak)) {
      this.errors[ime_polja] = "PIB mora imati 9 cifara i ne sme poceti nulom!"
      return;
    }

    if (ime_polja === 'maticniBroj' && !/^\d{8}$/.test(podatak)) {
      this.errors[ime_polja] = "PIB mora imati 9 cifara i ne sme poceti nulom!"
      return;
    }

    //saljem na server
    this.servis.promeniPodatak(this.user.kor_ime, podatak, ime_polja).subscribe({
      next: (data) => {
        if (data == "OK") {
          alert("Uspesno ste izmenili polje: " + ime_polja);
          this.errors[ime_polja] = ""; //brisem staru poruku greske
        }
      }, error: (err) => {
        this.errors[ime_polja] = err.error?.message || ("Greska pri izmeni polja " + ime_polja);

      }
    });
  }


  //promena slike

  onFileSelected(event: any) {
    //dohvatanje fajla iz inputa
    this.selectedFile = event.target.files[0];
  }

  promeniSliku() {
    if (!this.selectedFile) {
      this.message = "Odaberite sliku!"
      return;
    }

    const fd = new FormData();

    fd.append('slika', this.selectedFile);
    fd.append('kor_ime', this.user.kor_ime);

    this.servis.updateProfileImage(fd).subscribe(
      {
        next: (res: any) => {
          this.message = "Slika uspesno promenjena!";
          this.user.slika = res.novaSlika;
          this.selectedFile = null; //resetujem input za sliku
        },
        error: (err) => {
          this.message = "Greska pri upload-u slike!";
        }
      }
    )
  }

  //prostori
  ucitajSveProstore(){
    console.log("Pokrecem ucitavanje za: ", this.user.kor_ime);
    this.servis.getProstoriForManager(this.user.kor_ime).subscribe({
      next: (data) =>{
        this.prostori = data;
        console.log("Prostori sa servera:", data);
      },
      error: (err) =>{
        console.error("Greska u servisu: ", err);
        this.message = "Greska pri ucitavanju prostora"
      }
    })
  }

  //formatiranje ispisa za jedinice
  getOpenSpaceInfo(jedinice:any[]){
    const stolovi = jedinice.filter(j=> j.tip === 'sto');
    const nazivi = stolovi.map(s=>s.naziv).join(', ');
    return {
      broj:stolovi.length,
      nazivi: nazivi
    };
  }

  getOffices(jedinice:any[]){
    return jedinice.filter(j=>j.tip === 'kancelarija');
  }

  getHalls(jedinice:any[]){
    return jedinice.filter(j=>j.tip === 'sala');
  }

  //promena lozinke
  staraLozinka = "";
  novaLozinka = "";


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

  togglePassword() {
    //sakrij/prikazi lozinku
    this.showPassword = !this.showPassword;
  }

  //odjavljivanje iz sistema
  logout() {
    localStorage.removeItem("logged"); //brišemo ključ iz memorije
    this.router.navigate(['/login']); //vraćam korisnika na login
  }


  isPhoneValid():boolean{
  const phone = this.user.tel ? this.user.tel.trim() : '';

  const phoneRegex = /^(06\d{8}|\+3816\d{8})$/;

  return phoneRegex.test(phone);
}

isEmailValid():boolean{
  const email = this.user.mejl? this.user.mejl.trim(): '';

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

isPibValid():boolean{
  const pib = this.user.pib ? this.user.pib.trim() : '';

  //9 cifara i ne sme poceti nulom
  return /^[1-9]\d{8}$/.test(pib);
}

isMaticniBrojValid():boolean{
  const mb = this.user.maticniBroj ? this.user.maticniBroj.trim():'';

  return /^\d{8}$/.test(mb);
}
}
