import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import User from '../models/user';
import { map, Observable } from 'rxjs';
import Rezervacija from '../models/rezervacija';
import Prostor from '../models/prostor';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor() { }

  private http = inject(HttpClient);
  private url = "http://localhost:4000/users";

  login(u: string, p: string, t: string): Observable<User> {
    return this.http.post<User>(`${this.url}/login`, { kor_ime: u, lozinka: p, tip: t });
  }

  register(fd: FormData): Observable<any> {
    return this.http.post(`${this.url}/register`, fd);
  }

  getUser(u: string): Observable<User> {
    return this.http.post<User>(`${this.url}/get-user`, { kor_ime: u });
  }



  // zahtev za zaboravljenu lozinku
  forgotPassword(emailOrUsername: string): Observable<any> {
    return this.http.post(`${this.url}/forgot-password`, { emailOrUsername });
  }

  // slanje nove lozinke sa tokenom
  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.url}/reset-password`, { token, newPassword });
  }

  // admin dohvatanje zahteva na čekanju
  getPendingRequests(){
    return this.http.get<User[]>(`${this.url}/pending-requests`);
  }

  getAllUsers(){
    return this.http.get<User[]>(`${this.url}/getAllUsers`);
  }
  // admin: odobravanje ili odbijanje (status: 'active' ili 'rejected')
  processRequest(kor_ime: string, status: string){
    return this.http.post(`${this.url}/process-request`, { kor_ime, status });
  }

  //admin: obrisi korisnika
  processDeleteUser(kor_ime:string){
    return this.http.post(`${this.url}/process-deleteUser`,{kor_ime:kor_ime});
  }

  promeniPodatak(korIme: string, novi: string, ime_polja: string): Observable<any> {
    return this.http.post(`${this.url}/promeniPodatak`, { kor_ime: korIme, nov_podatak: novi, polje: ime_polja });
  }


  updateProfileImage(fd: FormData) {
    return this.http.post(`${this.url}/update-profile-image`, fd);
  }

  getRezervacije(korIme: string): Observable<Rezervacija[]> {
    return this.http.get<Rezervacija[]>(`${this.url}/reservations/${korIme}`).pipe(
      map(data => data.map(r => {
        return {
          ...r,
          od: new Date(r.od), // SAMO OVO, bez oduzimanja ofseta
          do: new Date(r.do)
        };
      }))
    );
  }

  otkaziRezervaciju(id: string) {
    return this.http.delete(`${this.url}/reservations/cancel/${id}`);
  }

  changePassword(kor_ime: string, stara: string, nova: string) {
    return this.http.post(`${this.url}/change-password`, {
      kor_ime,
      staraLozinka: stara,
      novaLozinka: nova
    });


  }

  //za menadzera dohvata prostor na osnovu njegovog kor imena
  getProstoriForManager(kor_ime: string) {
    return this.http.get<Prostor[]>(`${this.url}/getProstoriForManager/${kor_ime}`);
  }

  getRezervacijeForManager(kor_ime: string) {
    return this.http.get<Rezervacija[]>(`${this.url}/getRezervacijeForManager/${kor_ime}`);
  }

  getRezervacijeSve(kor_ime:string){
    return this.http.get<Rezervacija[]>(`${this.url}/getRezervacijeSve/${kor_ime}`)
  }
  cancelReservationByManager(idR: any) {
    return this.http.post(`http://localhost:4000/users/cancel-manager/reservations`,{id:idR});
  }

  potvrdiRezervacijuByManage(idRes: any) {
    return this.http.post(`http://localhost:4000/users/potvrdiRezervaciju/reservations`,{id:idRes});
  }

  getStatistics(godina:number){
    return this.http.get<any[]>(`${this.url}/getStatistics/${godina}`);
  }


}
