import { NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Coworking Hub Manager';

  router = inject(Router);

  // app.component.ts
  ulogovan(): boolean {
    return localStorage.getItem('logged') !== null;
    // Ili koristi servis ako ga imaš: return this.authService.isLoggedIn();
  }

  odjavise(){
    localStorage.removeItem('ulogovanKorisnik');
    this.router.navigate(['/login']);
  }


}
