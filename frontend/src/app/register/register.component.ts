import { NgFor, NgIf } from '@angular/common';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, NgIf,NgFor],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  private http = inject(HttpClient)
  private router = inject(Router)


  userData: any = {
    kor_ime: '',
    lozinka: '',
    ime: '',
    prezime: '',
    pol: '',
    adresa: '',
    tel: '',
    mejl: '',
    tip: '',
    slika:'',
    firmaNaziv: '',
    adresaSedista: '',
    maticniBroj: '',
    pib: ''
  };

  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  uploadProgress = 0;
  fileError = '';
  message: any;

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    this.fileError = '';

    if (!this.selectedFile) {
      this.fileError = 'Molimo izaberite sliku.';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result;
    };
    reader.readAsDataURL(this.selectedFile);
  }

  register() {

    const formData = new FormData();

    for (const key in this.userData) {
      formData.append(key, this.userData[key])
    }

    if (this.selectedFile) {
    formData.append('slika', this.selectedFile);
  }

    this.uploadUserData(formData);

  }


  // ovo je za bar sa procentima dokle se stiglo sa obradom zahteva da korisnik ne bi video da je aplikacija zamrznuta
  uploadUserData(formData: FormData) {
  this.http.post('http://localhost:4000/users/register', formData, {
    reportProgress: true,
    observe: 'events'
  }).subscribe({
    next: event => {
      if (event.type === HttpEventType.UploadProgress && event.total) {
        this.uploadProgress = Math.round((event.loaded / event.total) * 100);
      } else if (event.type === HttpEventType.Response) {
        alert("Zahtev poslat! Čeka se odobrenje admina.");
        this.router.navigate(['/login']);
      }
    },
    error: err => {
      // Ovde preuzimamo poruku sa backenda (npr. "Slika je prevelika" ili "PIB već postoji")
      this.fileError = err.error?.message || "Došlo je do greške pri registraciji.";
      this.uploadProgress = 0; // Resetuj progres bar ako pukne
    }
  });
}

isPhoneValid():boolean{
  const phone = this.userData.tel ? this.userData.tel.trim() : '';

  const phoneRegex = /^(06\d{8}|\+3816\d{8})$/;

  return phoneRegex.test(phone);
}

isEmailValid():boolean{
  const email = this.userData.mejl? this.userData.mejl.trim(): '';

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

isPibValid():boolean{
  const pib = this.userData.pib ? this.userData.pib.trim() : '';

  //9 cifara i ne sme poceti nulom
  return /^[1-9]\d{8}$/.test(pib);
}

isMaticniBrojValid():boolean{
  const mb = this.userData.maticniBroj ? this.userData.maticniBroj.trim():'';

  return /^\d{8}$/.test(mb);
}
isFormInvalid(): boolean {
  // osnovna polja koja su obavezna za SVE (zajednička polja)
  const commonFields = ['kor_ime', 'lozinka', 'ime', 'prezime', 'pol', 'adresa', 'tel', 'mejl', 'tip'];

  const basicInvalid = commonFields.some(field => !this.userData[field] || this.userData[field].trim() === '');

  const formatsInvalid = !this.isPhoneValid() || !this.isEmailValid();


  // dodatna polja ako je korisnik izabrao 'menadzer'
  if (this.userData.tip === 'menadzer') {
    const managerInvalid = !this.userData.firmaNaziv || !this.userData.adresaSedista || !this.userData.maticniBroj || !this.isPibValid() || !this.isMaticniBrojValid();
    return basicInvalid || managerInvalid || formatsInvalid;
  }

  // ako nije menadzer (znaci clanMreze), gledam samo osnovna polja
  return basicInvalid || formatsInvalid;
}

}
