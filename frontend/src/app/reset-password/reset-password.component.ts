import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="container mt-5 text-white bg-dark p-4 rounded">
      <h3>Postavljanje nove lozinke</h3>
      <div class="form-group">
        <label>Nova lozinka:</label>
        <input [type]="showPassword ? 'text' : 'password'" class="form-control mb-2" [(ngModel)]="novaLozinka" placeholder="Unesite novu lozinku">
        <button type="button" class="btn btn-outline-light" (click)="togglePassword()">
            {{ showPassword ? 'Sakrij' : 'Prikaži' }}
          </button>
      </div>
      <button class="btn btn-success w-100" (click)="resetuj()">Postavi lozinku</button>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  novaLozinka = "";
  token = "";
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private router = inject(Router);

  showPassword:boolean = false;


  ngOnInit() {

    this.token = this.route.snapshot.params['token'];
  }

  resetuj() {

    const passRegex = /^[a-zA-Z](?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[a-zA-Z\d!@#$%^&*]{7,11}$/;

    if (!passRegex.test(this.novaLozinka)) {
      alert("Lozinka mora imati 8-12 karaktera, početi slovom, imati bar jedno veliko slovo, broj i specijalan znak.");
      return;
    }

    this.userService.resetPassword(this.token, this.novaLozinka).subscribe({
      next: (res: any) => {
        alert("Lozinka uspešno promenjena!");
        this.router.navigate(['/login']);
      },
      error: (err: any) => {

        const poruka = err.error?.message || "Link je istekao (30 min) ili je nevažeći.";
        alert(poruka);
      }
    });
  }

  togglePassword(){
    this.showPassword = !this.showPassword;
  }
}
