import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService } from '../services/user.service';
import { FormsModule } from '@angular/forms';
import { NgIf } from "@angular/common";


@Component({
  selector: 'app-admin-update-user',
  standalone: true,
  imports: [FormsModule, NgIf, RouterLink],
  templateUrl: './admin-update-user.component.html',
  styleUrl: './admin-update-user.component.css'
})
export class AdminUpdateUserComponent implements OnInit {
  kor_ime: string = ''

  private route = inject(ActivatedRoute);
  private us = inject(UserService)
  private router = inject(Router)
  user: any;

  ngOnInit(): void {
    //ovo u kombinaciji sa ActivatedRoute vadi korisnika iz putanje
    this.kor_ime = this.route.snapshot.paramMap.get('kor_ime') || '';
    console.log("Uređujem korisnika:", this.kor_ime);

    this.us.getUser(this.kor_ime).subscribe({
      next: (u) => {
        this.user = u;
        console.log("User pronadjen: ", u);
      },
      error: (err: any) => {
        console.log("Doslo do greske: ", err.message);
      }
    })
  }


  //UREDI deo admin
  //izmena licnih podataka

  podaci: Array<string>[] = [];
  message = "";
  selectedFile: File | null = null;

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

    //slanje na server
    this.us.promeniPodatak(this.user.kor_ime, podatak, ime_polja).subscribe({
      next: (data) => {
        if (data == "OK") {
          alert("Uspešno ste izmenili polje: " + ime_polja);
          this.errors[ime_polja] = ""; // brišem poruku ako je bila crvena
        }
      },
      error: (err) => {
        //ako backend vrati grešku (npr. email već postoji), ispiši je ispod polja
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

    this.us.updateProfileImage(fd).subscribe({
      next: (res: any) => {
        this.message = "Slika uspesno promenjena!"
        this.user.slika = res.novaSlika;
        this.selectedFile = null; //resetuj input
      },
      error: (err) => {
        this.message = "Greska pri upload-u!"
      }
    })
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

    this.us.changePassword(this.user.kor_ime, this.staraLozinka, this.novaLozinka).subscribe({
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
