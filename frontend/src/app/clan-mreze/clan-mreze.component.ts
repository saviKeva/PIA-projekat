import { NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink,RouterOutlet } from '@angular/router';
import { UserService } from '../services/user.service';
import User from '../models/user';

@Component({
  selector: 'app-clan-mreze',
  standalone: true,
  imports: [FormsModule, NgIf, RouterLink, RouterOutlet],
  templateUrl: './clan-mreze.component.html',
  styleUrl: './clan-mreze.component.css'
})
export class ClanMrezeComponent implements OnInit {

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
    this.router.navigate(['/login']); // vraćamo korisnika na početnu
  }



}
