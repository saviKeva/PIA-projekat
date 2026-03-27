import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProstorService } from '../services/prostor-service.service';

@Component({
  selector: 'app-detalji',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalji.component.html',
  styleUrl: './detalji.component.css'
})
export class DetaljiComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(ProstorService);

  prostor: any = null;
  glavnaSlika: string = "";

  isModalOpen: boolean = false;
  slikaZaUvecanje:string ="";

  ngOnInit(): void {
      const id = this.route.snapshot.paramMap.get('id');

      if(id){
        this.service.getProstorById(id).subscribe({
            next: (data)=>{
              this.prostor = data;

              //da li vec postoji zapamcena slika
              const sacuvanaSlika = this.getCookie(`glavnaSlika_${this.prostor._id}`);

              if(sacuvanaSlika){
                this.glavnaSlika = sacuvanaSlika;
              }else{

                //ako nema kolacica podrazumeva se prva slika iz niza
                this.glavnaSlika = this.prostor.slike[0];
              }
            }
        });
      }

  }

  // funkcija koja se poziva klikom na thumbnail
  postaviGlavnuSliku(slika: string) {
    this.glavnaSlika = slika;
    // cuvam u kolačić na 30 dana
    this.setCookie(`glavnaSlika_${this.prostor._id}`, slika, 30);
  }

  // pomoćne funkcije za kolačiće
  setCookie(name: string, value: string, days: number) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = `${name}=${value};${expires};path=/`;
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

  nazad() {
    this.router.navigate(['/']);
  }

  uvecajSliku(slika:string){
    this.slikaZaUvecanje = slika;
    this.isModalOpen = true;
  }

  zatvoriModal(){
    this.isModalOpen = false;
  }

}
