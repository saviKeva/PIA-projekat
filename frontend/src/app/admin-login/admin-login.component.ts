import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { Router, RouterModule } from '@angular/router'; //  RouterModule za linkove
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, NgIf, RouterModule],
  templateUrl: '../login/login.component.html',
  styleUrl: '../login/login.component.css'
})
export class AdminLoginComponent {
  private userService = inject(UserService);
  private router = inject(Router);

  kor_ime = "";
  lozinka = "";
  tip = "admin"; // admin tip je fiksiran za ovu formu
  message = "";
  showPassword = false; // Ovo je nedostajalo

  login() {
    this.userService.login(this.kor_ime, this.lozinka, this.tip).subscribe({
      next: (data) => {
        if (data) {
          localStorage.setItem("logged", JSON.stringify(data.kor_ime));
          this.router.navigate(['/admin']);
        } else {
          this.message = "Pogrešni podaci!";
        }
      },
      error: (err) => {
        this.message = err.error?.message || "Greška pri prijavi administratora.";
      }
    });
  }

  
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // admin nema opciju brze registracije, ali metoda mora postojati ako je u HTML-u
  registrujSe() {
    this.message = "Administratori se ne mogu sami registrovati.";
  }
}
