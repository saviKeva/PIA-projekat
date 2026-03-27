import { Component, inject } from '@angular/core';
import User from '../models/user';
import { UserService } from '../services/user.service';
import { NgIf, NgForOf } from "@angular/common";
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-admin-all-users',
  standalone: true,
  imports: [NgIf, NgForOf, RouterLink],
  templateUrl: './admin-all-users.component.html',
  styleUrl: './admin-all-users.component.css'
})
export class AdminAllUsersComponent {
  korisnici: User[] = [];
  private userService = inject(UserService);

  ngOnInit() {
    this.osveziListu();
  }

  osveziListu() {
    this.userService.getAllUsers().subscribe({
      next: (data: User[]) => this.korisnici = data,
      error: (err: any) => console.error("Greška pri dobavljanju korisnika", err)
    });
  }

  obradi(kor_ime: string, status: string) {
    this.userService.processDeleteUser(kor_ime).subscribe({
      next: (res: any) => {
        alert(res.message);
        this.osveziListu(); // Ponovo učitava tabelu nakon promene statusa
      },
      error: (err: any) => alert("Greška pri brisanju korisnika: " + kor_ime)
    });
  }

  //pretraga korisnika

  
}
