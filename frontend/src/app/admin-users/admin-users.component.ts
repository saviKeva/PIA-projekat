import { Component, inject, OnInit } from '@angular/core';
import User from '../models/user';
import { UserService } from '../services/user.service';
import { NgFor, NgIf } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
  zahtevi: User[] = [];
  private userService = inject(UserService);

  ngOnInit() {
    this.osveziListu();
  }

  osveziListu() {
    this.userService.getPendingRequests().subscribe({
      next: (data: User[]) => this.zahtevi = data,
      error: (err: any) => console.error("Greška pri dobavljanju zahteva", err)
    });
  }

  obradi(kor_ime: string, status: string) {
    this.userService.processRequest(kor_ime, status).subscribe({
      next: (res: any) => {
        alert(res.message);
        this.osveziListu(); // Ponovo učitava tabelu nakon promene statusa
      },
      error: (err: any) => alert("Greška pri obradi zahteva.")
    });
  }

  //navigiranje na stranicu za uredjivanje



}
