import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { Router, RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  private userService = inject(UserService)
  private router = inject(Router)

  kor_ime = ""
  lozinka = ""
  tip = ""
  message = ""
  showPassword = false;

  login() {
  this.message = ""; // Resetujemo poruku pre svakog pokušaja

  this.userService.login(this.kor_ime, this.lozinka, this.tip).subscribe({
    next: (data) => {
      // Ovaj deo se izvršava SAMO ako je backend vratio status 200 OK
      if (data) {
        localStorage.setItem("logged", JSON.stringify(data.kor_ime));
        this.message = "";
        this.router.navigate([data.tip]);
      }
    },
    error: (err) => {
      // Ovaj deo se izvršava kada backend vrati 401, 403, itd.
      console.log(err); // Proveri u konzoli (F12) šta piše

      // Uzimamo tačnu poruku koju si napisala na backendu (npr. "Pogrešna lozinka!")
      if (err.error && err.error.message) {
        this.message = err.error.message;
      } else {
        this.message = "Greška: Pogrešno korisničko ime, lozinka ili tip!";
      }
    }
  });
}


  registrujSe() {
    this.router.navigate(['/register']);
  }


  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }


}
