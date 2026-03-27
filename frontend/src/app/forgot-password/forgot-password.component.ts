import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="container mt-5">
      <div class="card p-4 bg-dark text-white">
        <h3>Zaboravljena lozinka</h3>
        <p>Unesite korisničko ime ili e-mail adresu kako biste dobili link za resetovanje.</p>
        <input type="text" class="form-control mb-3" [(ngModel)]="podatak" placeholder="Korisničko ime ili Email">
        <button class="btn btn-primary" (click)="posaljiZahtev()">Pošalji link</button>
        <p class="mt-3 text-warning">{{ poruka }}</p>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  podatak = "";
  poruka = "";
  private userService = inject(UserService);

  posaljiZahtev() {
    this.userService.forgotPassword(this.podatak).subscribe({
      next: (res:any) => {
        this.poruka = "Link za resetovanje je poslat na vašu adresu (i važi 30 min): " + res.debugLink;
        console.log(res.debugLink);
      },

      error: (err) => this.poruka = "Korisnik nije pronađen."
    });
  }
}
