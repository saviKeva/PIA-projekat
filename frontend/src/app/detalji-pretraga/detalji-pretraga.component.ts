import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProstorService } from '../services/prostor-service.service';
import L from 'leaflet';
import { CommonModule, DatePipe } from '@angular/common';
import Rezervacija from '../models/rezervacija';
import { FormsModule } from '@angular/forms';
import Recenzija from '../models/recenzija';
import { subscribeOn } from 'rxjs';

const defaultIcon = L.icon({
  iconUrl: 'media/marker-icon.png',
  iconRetinaUrl: 'media/marker-icon-2x.png',
  shadowUrl: 'media/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

@Component({
  selector: 'app-detalji-pretraga',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './detalji-pretraga.component.html',
  styleUrl: './detalji-pretraga.component.css'
})
export class DetaljiPretragaComponent implements OnInit, AfterViewInit {

  prostor: any;
  mapa: any;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(ProstorService);

  danasnjiDatum: string = new Date().toISOString().split('T')[0];

  glavnaSlika: string = "";
  isModalOpen: boolean = false;
  slikaZaUvecanje: string = "";

  allResPlace: Rezervacija[] = [];
  currentResUnit: Rezervacija[] = [];
  indeksUnit: number = 0;

  daniUNedelji: Date[] = []
  izabraniDatum: string = "";
  vremeOd: string = "";
  vremeDo: string = "";


  ngOnInit(): void {
    this.indeksUnit = 0;
    const id = this.route.snapshot.paramMap.get('id');
    const selektovaniTip = this.route.snapshot.queryParamMap.get('tip');
    this.genCurrWeek();
    if (id) {
      this.service.getProstorById(id).subscribe(data => {
        this.prostor = data;

        this.osveziKomentare();

        //dohvatam selektovani tip
        if (selektovaniTip && this.prostor.jedinice) {
          this.prostor.jedinice = this.prostor.jedinice.filter((j: any) => j.tip === selektovaniTip);

          //ako prostor nema nijednu jedinicu tog tipa (za svaki slučaj)
          if (this.prostor.jedinice.length === 0) {
            console.log("Ovaj prostor nema jedinice tipa: ", selektovaniTip);
          }
        }

        //dohvatam sve rezervacije za taj prostor
        this.service.getReservationsForSpace(this.prostor._id).subscribe(rez => {
          this.allResPlace = rez;
          //filtriranje za kalendar
          this.filtrirajZaKalendar();

          //ako su podaci stigli nakon što se html iscrtao, inicijalizujem mapu
          if (this.mapa) this.azurirajMapu();

          //deo za ucitavanje galerije slika
          const sacuvanaSlika = this.getCookie(`glavnaSlika_${this.prostor._id}`);

          if (sacuvanaSlika) {
            this.glavnaSlika = sacuvanaSlika;
          } else {
            this.glavnaSlika = this.prostor.slike[0];
          }
        })


      });




    }
  }

  ngAfterViewInit(): void {
    // Inicijalizujemo mapu na neku privremenu lokaciju (centar Srbije)
    this.mapa = L.map('map').setView([44.0165, 21.0059], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.mapa);
  }

  azurirajMapu(): void {
    if (this.prostor && this.prostor.lokacija && this.mapa) {
      const lat = this.prostor.lokacija.lat;
      const lng = this.prostor.lokacija.lng;

      // setTimeout osigurava da se izvrši u sledećem ciklusu renderovanja
      setTimeout(() => {
        this.mapa.invalidateSize(); // Veoma važno za ispravno prikazivanje slojeva
        this.mapa.setView([lat, lng], 16);

        // Brišemo stare markere ako postoje (opciono)
        // L.marker...
        L.marker([lat, lng])
          .addTo(this.mapa)
          .bindPopup(`<b>${this.prostor.naziv}</b><br>${this.prostor.adresa}`)
          .openPopup();
      }, 100);
    }
  }

  //poenta pamcenja kolacica je da ako se korisnik zadrzi na nekoj slici i onda predje na
  //drugi tab
  //da slika na koju je poslednju kliknio ostane sacuvana
  //da ne bi morao ponovo da lista galeriju
  //pretraga kolacica koji se poklapaju sa imenom moje slike

  postaviGlavnuSliku(slika: string) {
    this.glavnaSlika = slika;

    //kolacic se cuva na 30 dana
    this.setCookie(`glavnaSlika_${this.prostor.id}`, slika, 30);
  }
  getCookie(name: string) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  setCookie(name: string, value: string, days: number) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = `${name}=${value};${expires};path=/`;
  }

  nazad() {
    this.router.navigate(['/clanMreze/pretraga']);
  }

  uvecajSliku(slika: string) {
    this.slikaZaUvecanje = slika;
    this.isModalOpen = true;
  }

  zatvoriModal() {
    this.isModalOpen = false;
  }


  //filtriranje za kalendar

  filtrirajZaKalendar() {
    if (this.prostor && this.prostor.jedinice && this.allResPlace) {
      const jedinica = this.prostor.jedinice[this.indeksUnit];

      // Izvlačenje ID-ja: prvo gledamo da li je u obliku objekta {$oid: ...} ili je običan string
      let aktivnaId = "";
      if (jedinica._id && jedinica._id.$oid) {
        aktivnaId = jedinica._id.$oid;
      } else if (jedinica._id) {
        aktivnaId = jedinica._id;
      }else if(jedinica.id){
        aktivnaId = this.prostor.jedinice[this.indeksUnit].id;
      }



      const aktivna = aktivnaId.trim();
      console.log("TRAŽIM JEDINICU:", `"${aktivna}"`); // navodnici da vidim razmake

      this.currentResUnit = this.allResPlace.filter(r => {
        const resId = r.jedinica_id ? r.jedinica_id.trim() : "";

        // logovi
        console.log(`Poredim bazu: "${resId}" sa aktivnom: "${aktivna}"`);
        console.log("DA LI SU ISTI?", resId === aktivna);

        return resId === aktivna;
      });

      console.log("KONAČAN NIZ:", this.currentResUnit);
    }
  }

  //poziva se na klik strelice - levo/desno
  promeniJedinicu(smer: number) {
    this.indeksUnit += smer;
    this.filtrirajZaKalendar();
  }


  //kalendar i rezervacija termina

  genCurrWeek() {
    let danas = new Date();
    let ponedeljak = new Date(danas);

    //promenljivu ponedeljak postavljam na pocetak nedelje
    //getDay vraca dan u nedelji 0-ned, 1- pon, 2-uto, ... 6-subota
    ponedeljak.setDate(danas.getDate() - (danas.getDay() === 0 ? 6 : danas.getDay() - 1));

    //azuriram naredne dane posle ponedeljka
    for (let i = 0; i < 7; i++) {
      let dan = new Date(ponedeljak);
      dan.setDate(ponedeljak.getDate() + i);
      this.daniUNedelji.push(dan);
    }


  }

  getZauzetiTermini(dan: Date): string[] {
    if (!this.currentResUnit) return [];

    return this.currentResUnit
      .filter(r => {
        const datumRez = new Date(r.od);
        return datumRez.getUTCDate() === dan.getDate() &&
          datumRez.getUTCMonth() === dan.getMonth();
      })
      .map(r => {
        const d1 = new Date(r.od);
        const d2 = new Date(r.do);
        const f = (n: number) => n.toString().padStart(2, '0');

        // Koristimo UTC sate jer smo ih tako upisali u bazu
        return `${f(d1.getUTCHours())}:${f(d1.getUTCMinutes())} - ${f(d2.getUTCHours())}:${f(d2.getUTCMinutes())}`;
      });
  }

  rezervisi() {

    const sad = new Date();
    const noviOd = new Date(`${this.izabraniDatum}T${this.vremeOd}`);
    const noviDo = new Date(`${this.izabraniDatum}T${this.vremeDo}`);

    if (noviOd < sad) {
      alert("Ne mozete rezervisati termin u proslosti!");
      return;
    }

    if (noviDo <= noviOd) {
      alert("Vreme zavrsetka mora biti nakon vremena pocetka!");
      return;
    }

    //provera da li su rezervacije izmedju 23 h uvece i 8 ujutru -> zabranjujem to
    const satOd = noviOd.getHours();
    const satDo = noviDo.getHours();
    const minDo = noviDo.getMinutes();


    if (satOd < 8 || satOd >= 23 || satDo < 8 || (satDo >= 23 && minDo > 0)) {
      alert("Prostor radi od 08:00 do 23:00!");
      return;
    }

    // provera preklapanja na frontu (da ne čekamo backend)
    const konflikt = this.currentResUnit.some(r => (noviOd < new Date(r.do) && noviDo > new Date(r.od)));

    if (konflikt) {
      alert("Termin je zauzet!");
      return;
    }

    // oduzimam ofset da bi toISOString() poslao sate koje vidimo na ekranu
    const fiksniOd = new Date(noviOd.getTime() - noviOd.getTimezoneOffset() * 60000).toISOString();
    const fiksniDo = new Date(noviDo.getTime() - noviDo.getTimezoneOffset() * 60000).toISOString();

    const jObj = this.prostor.jedinice[this.indeksUnit];
    const jId = (jObj._id && jObj._id.$oid) ? jObj._id.$oid : (jObj._id || jObj.id);
    const ulogovani = JSON.parse(localStorage.getItem('logged')!);
    const novaRez = {
      kor_ime: ulogovani,
      prostor_id: this.prostor._id,
      jedinica_id: jId,
      naziv: this.prostor.jedinice[this.indeksUnit].naziv,
      nazivProstora: this.prostor.naziv,
      grad: this.prostor.grad,
      od: fiksniOd,
      do: fiksniDo,
      status: 'kreirana'
    };

    this.service.rezervisi(novaRez).subscribe({
      next: (data: any) => {
        alert("Rezervisano!");

        //resetujem i osvezavam kalendar
        this.vremeOd = "";
        this.vremeDo = "";
        this.ngOnInit();
      }, error: (err: any) => {
        alert(err.error.message || "Greska pri rezervaciji!");
      }

    });
  }

  //KOMENTARI I LAJKOVI/DISLAJKOVI

  sviKomentari: Recenzija[] = []
  noviKomentarTekst: string = ""
  ulogovaniKorisnik: string = JSON.parse(localStorage.getItem('logged')!);

  osveziKomentare() {
    this.service.getKomentari(this.prostor._id).subscribe(
      podaci => {
        this.sviKomentari = podaci;
        console.log("Svi komentari: " + podaci);
      }
    );
  }

  posaljiRecenziju(tip: string) {
    //ako je komentar prazan -> ispisuje alert poruku greske

    if (tip === 'comment' && !this.noviKomentarTekst.trim()) {
      alert("Morate uneti tekst komentara.");
      return;
    }

    const novaRecenzija: Recenzija = {
      prostor_id: this.prostor._id,
      kor_ime: this.ulogovaniKorisnik,
      tip: tip,
      tekst: tip === 'comment' ? this.noviKomentarTekst : undefined
    };

    this.service.ostaviRecenziju(novaRecenzija).subscribe({
      next: (res: any) => {
        alert(res.message);
        this.noviKomentarTekst = ""; //ocistila sa, polje da bude spremno za sledeci komentar
        this.osveziKomentare(); //osvezi listu komentara

        if (tip !== 'comment') {
          //ako je like osvezi broj lajkova tj dohvati pono prosor
          this.service.getProstorById(this.prostor._id).subscribe(
            data => {
              this.prostor = data;
              console.log("Dovaceni prostor " + data);

              this.filtrirajZaKalendar();
              this.osveziKomentare();
            }
          );
        }
      },
      error: (err) => alert(err.error.message || "Greska pri slanju!")
    });

  }

  // U detalji-pretraga.component.ts
  danasDatum(): string {
    const d = new Date();
    const godina = d.getFullYear();
    const mesec = String(d.getMonth() + 1).padStart(2, '0');
    const dan = String(d.getDate()).padStart(2, '0');
    return `${godina}-${mesec}-${dan}`;
  }
}
