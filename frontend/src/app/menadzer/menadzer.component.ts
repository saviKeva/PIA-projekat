import { Component, inject } from '@angular/core';
import { UserService } from '../services/user.service';
import User from '../models/user';
import { Router, RouterModule } from "@angular/router";
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-menadzer',
  standalone: true,
  imports: [RouterModule, FormsModule, NgIf, NgFor],
  templateUrl: './menadzer.component.html',
  styleUrl: './menadzer.component.css'
})
export class MenadzerComponent {
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
      localStorage.removeItem("logged"); // brišemo ključ iz memorije
      this.router.navigate(['/login']); // vraćamo korisnika na login
    }
}
