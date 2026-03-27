import { DatePipe, NgFor, NgIf, NgClass } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProstorService } from '../services/prostor-service.service';
import Rezervacija from '../models/rezervacija';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-menadzer-rezervacije',
  standalone: true,
  imports: [FormsModule, NgIf, DatePipe, NgFor, NgClass],
  templateUrl: './menadzer-rezervacije.component.html',
  styleUrl: './menadzer-rezervacije.component.css'
})
export class MenadzerRezervacijeComponent implements OnInit {

  rezervacije: Rezervacija[] = [];
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private uservice = inject(UserService);
  user: any = null;

  nepotvrdjene: Rezervacija[] = [];

  ngOnInit(): void {
    this.nepotvrdjene = [];
    this.rezervacije = [];

    const username = JSON.parse(localStorage.getItem("logged")!);

    if (username) {
      this.uservice.getUser(username).subscribe({
        next: (u: any) => {
          this.user = u;
          console.log("Podaci o menadzeru - rezervacije component - su spremni!")
          if (this.user) {
            this.uservice.getRezervacijeForManager(this.user.kor_ime).subscribe({
              next: (data: any) => {
                this.rezervacije = data.map((r: any) => {
                  const d1 = new Date(r.od);
                  const d2 = new Date(r.do);

                  return {
                    ...r,
                    od: new Date(r.od), // Samo običan Date, bez oduzimanja ofseta
                    do: new Date(r.do)
                  };
                });
                this.nepotvrdjene = this.rezervacije.filter(r => r.status == "kreirana");
                console.log("Stigle rezervacije: ", this.rezervacije);
              }, error: (err: any) => {
                console.error("Greska pri ucitavanju rezervacija!", err);
              }
            })
          }
        },
        error: (err) => {
          console.error("Greska pri dohvatanju korisnika", err);
        }
      });
      console.log(this.user);



    }


  }


  otkazi(id: string) {
    this.uservice.cancelReservationByManager(id).subscribe({
      next: (data: any) => {
        alert(data.message || "Rezervacija uspesno otkazana!");
        this.ngOnInit();
      }, error: (err: any) => {
        alert("Greska: " + (err.error?.message || "Doslo je do greske na serveru!"))
      }
    })
  }

  potvrdi(id: string) {
    this.uservice.potvrdiRezervacijuByManage(id).subscribe({
      next: (res: any) => {
        alert(res.message || "Rezervacija uspesno potvrdjena!");
        this.ngOnInit();
      }, error: (err: any) => {
        alert("Greska: " + (err.error?.message || "Doslo je do greske na serveru!"));
      }
    })
  }

  mozeDaOtkaze(vremeOd: any): boolean {
    const pocetak = new Date(vremeOd);
    const sada = new Date();

    console.log(pocetak);

    //razlika u minutima: pozitivna ako je vreme poorslo (sada > pocetak)
    //iz nekog razloga dodaje +1
    const prosloMinuta = (sada.getTime() - pocetak.getTime() ) / 60000  + 60;
    console.log(prosloMinuta);

    //može da otkaže ako je prošlo više od 10 minuta od početka
    return prosloMinuta >= 10;
  }

  mozeDaPotvrdi(vremeOd: any, vremeDo: any): boolean {
    const pocetak = new Date(vremeOd).getTime();
    const kraj = new Date(vremeDo).getTime();
    const sada = new Date().getTime();

    const prosloMinutaOdPocetka = (sada - pocetak) / 60000 + 60;

    
    //prošlo je više od 10 minuta od početka (prosloMinutaOdPocetka >= 10)
    //trenutno vreme je još uvek pre kraja termina (sada < kraj)
    return prosloMinutaOdPocetka >= 10 && sada < kraj;
  }



}
