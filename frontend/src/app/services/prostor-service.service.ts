import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import Prostor from '../models/prostor';
import { map, Observable } from 'rxjs';
import Rezervacija from '../models/rezervacija';
import Recenzija from '../models/recenzija';

@Injectable({
  providedIn: 'root'
})
export class ProstorService {

  constructor() { }

  private http = inject(HttpClient);

  url = "http://localhost:4000/prostori"

  getActiveProstori() {
    return this.http.get<Prostor[]>(`${this.url}/getActiveProstori`);
  }

  getTop5() {
    return this.http.get<Prostor[]>(`${this.url}/getTop5`);
  }

  getProstorById(id: string) {
    return this.http.post<Prostor>(`${this.url}/getProstorById`, { _id: id });
  }

  pretrazi(filter: any) {
    return this.http.post<Prostor[]>(`${this.url}/pretraga`, filter);
  }

  //dohvatanje svih rezervacija za konkretan prostor zbog onog smenjivanja kalendara za jedinice
  getReservationsForSpaceClan(prostor_id: string, tip: string | null) {
    // return this.http.get<Rezervacija[]>(`${this.url}/getReservationsForSpace/${prostor_id}`).pipe(
    //   map(rezervacije => {
    //     return rezervacije.map(r => {
    //       r.od = new Date(r.od);
    //       r.do = new Date(r.do);
    //       return r;
    //     });
    //   })
    // );
    let url = `${this.url}/getReservationsForSpaceClan/${prostor_id}`;
    url += `?tip=${tip}`;
    return this.http.get<Rezervacija[]>(url).pipe(
      map(rezervacije => {
        return rezervacije.map(r => {
          r.od = new Date(r.od);
          r.do = new Date(r.do);
          return r;
        });
      })
    );
  }

  getReservationsForSpace(prostor_id: string) {
    return this.http.get<Rezervacija[]>(`${this.url}/getReservationsForSpace/${prostor_id}`).pipe(
      map(rezervacije => {
        return rezervacije.map(r => {
          r.od = new Date(r.od);
          r.do = new Date(r.do);
          return r;
        });
      })
    );
  }


  rezervisi(novaRez: any) {
    return this.http.post(`${this.url}/addReservation`, novaRez);
  }

  ostaviRecenziju(recenzija: Recenzija) {
    return this.http.post(`${this.url}/ostaviRecenziju`, recenzija);
  }

  getKomentari(prostor_id: string) {
    return this.http.get<Recenzija[]>(`${this.url}/getKomentari/${prostor_id}`);
  }

  uploadKonfiguraciju(formData: FormData) {
    return this.http.post(`${this.url}/upload-from-json`, formData);
  }

  // prostor.service.ts

  // U prostor.service.ts
  updateReservationTime(id: string, noviOd: string, noviDo: string) { // Promenite Date u string
    const body = { id, noviOd, noviDo };
    return this.http.post('http://localhost:4000/prostori/update-reservation-time', body);
  }

  addProstor(podaci: any) {
    return this.http.post<any>(`${this.url}/addProstor`, podaci);
  }

  // admin - odobravanje prostora
  aproveProstor(naziv: string, id: string) {
    return this.http.post<any>(`${this.url}/aproveSpace`, { naziv, _id: id });
  }

  getPendingProstori() {
    return this.http.get<Prostor[]>(`${this.url}/getPendingProstori`);
  }

}
