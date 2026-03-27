import { Component, inject, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';
import { NgFor, NgIf } from '@angular/common';
import User from '../models/user';
import { Router, RouterModule } from "@angular/router";

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [NgFor, NgIf, RouterModule],
  templateUrl:'./admin.component.html',
  styleUrl:'./admin.component.css'
})
export class AdminComponent implements OnInit {
  private servis = inject(UserService);
    router = inject(Router);
    message = "";


    user: User = new User();

    ngOnInit(): void {
      let username = JSON.parse(localStorage.getItem("logged")!);

      if (username == null) {
        this.router.navigate(['/login']);
      }

      this.servis.getUser(username).subscribe({
        next: (data) => {
          if (data) {
            this.user = data;
          } else {
            alert("Pogresni podaci za korisnika (null)!")
            this.message = "Pogresni podaci!"
          }
        },
        error: (err) => {
          this.message = err.error?.message || "Greska pri dohvatanju podataka za clana mreze!"

        }
      })
    }

    logout() {
      localStorage.removeItem("logged"); // brišem ključ iz memorije
      this.router.navigate(['/login']); // vraćam admina na početnu
    }

}
