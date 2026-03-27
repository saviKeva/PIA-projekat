import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';

import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';

import { ProstorService } from '../services/prostor-service.service';
import { UserService } from '../services/user.service';
//import { CalendarOptions } from '@fullcalendar/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-menadzer-kalendar',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './menadzer-kalendar.component.html',
  styleUrl: './menadzer-kalendar.component.css'
})
export class MenadzerKalendarComponent implements OnInit {

  prostori: any[] = [];
  izabraniProstor: any = null;
  jedinice: any[] = [];
  izabranaJedinica: any = null;
  rezervacije: any[] = [];

  private ps = inject(ProstorService);
  private us = inject(UserService);

  calendarOptions: any = {
    initialView: 'resourceTimelineDay',
    timeZone: 'locale', // Koristimo lokalno vreme pretraživača
    schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, resourceTimelinePlugin],
    editable: true,
    resourceAreaWidth: '20%',
    resourceAreaHeaderContent: 'Jedinice',
    resources: [],
    events: [],
    slotMinTime: '08:00:00',
    slotMaxTime: '23:00:00',  //prostor po mojoj proceni radi izmedju 8h ujutro i 23h uvece
    slotDuration: '01:00:00',
    snapDuration: '00:30:00',
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // iskljucuje AM/PM
    },
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    eventDrop: this.onEventDrop.bind(this),
    eventResize: this.onEventResize.bind(this)
  };

  ngOnInit(): void {
    const loggedStr = localStorage.getItem("logged");
    if (loggedStr) {
      const korIme = JSON.parse(loggedStr);
      this.us.getProstoriForManager(korIme).subscribe(data => {
        this.prostori = data;
      });
    }
  }

  // sprečava gubljenje sata prilikom slanja na backend
  //iz nekog razloga na back-u se doda + 1 na ono sto mu ja poslajem
  formatDatum(date: Date): string {
    const pad = (n: number) => (n < 10 ? '0' + n : n);

    // kopija datuma
    let d = new Date(date.getTime());

    // ovo ne diram nikako MORA MINUS JEDAN (Beograd je UTC + 1 mozda zato ne znam sto, ali bez ovog minus pomera sve u bazi za 1 h unapred)
    d.setHours(d.getHours() - 1);

    const godina = d.getFullYear();
    const mesec = pad(d.getMonth() + 1);
    const dan = pad(d.getDate());
    const sati = pad(d.getHours());
    const minuti = pad(d.getMinutes());
    const sekunde = pad(d.getSeconds());

    return `${godina}-${mesec}-${dan}T${sati}:${minuti}:${sekunde}.000Z`;
  }

  onProstorSelect() {
    this.izabranaJedinica = null;
    this.jedinice = this.izabraniProstor?.jedinice ?? [];

    this.calendarOptions = {
      ...this.calendarOptions,
      resources: this.jedinice.map(j => ({
        id: String(j.id),
        title: j.naziv
      }))
    };

    this.ucitajRezervacije();
  }

  onJedinicaSelect() {
    this.ucitajRezervacije();
  }

  ucitajRezervacije() {
    if (!this.izabraniProstor) return;

    const prostorId = this.izabraniProstor._id.$oid || this.izabraniProstor._id;

    this.ps.getReservationsForSpace(prostorId).subscribe({
      next: (res: any) => {
        this.rezervacije = res;
        let filtrirane = res;

        if (this.izabranaJedinica) {
          filtrirane = res.filter((r: any) => String(r.jedinica_id) === String(this.izabranaJedinica.id));
        }

        this.calendarOptions = {
          ...this.calendarOptions,
          initialDate: '2026-03-11',
          events: filtrirane.map((r: any) => {
            const d1 = new Date(r.od);
            const d2 = new Date(r.do);

            // toISOString() pretvara Date sa 'Z' u string.
            // slice(0, 19) uklanja 'Z' i milisekunde.
            //rezultat: "2026-03-11T14:00:00" -> kalendar ovo crta tačno na 14:00.
            const startStr = d1.toISOString().slice(0, 19);
            const endStr = d2.toISOString().slice(0, 19);
            return {
              id: r._id.$oid || r._id,
              resourceId: String(r.jedinica_id),
              title: `${r.kor_ime} (${r.naziv})`,
              start: startStr,
              end: endStr,
              color: r.status === 'potvrdjena' ? '#28a745' : '#ffc107',
              textColor: r.status === 'potvrdjena' ? 'white' : 'black'
            };
          })
        };
      },
      error: (err: any) => console.error("Greska pri ucitavanju rezervacija: ", err)
    });
  }

  //da mi
  onEventDrop(info: any) {
    const id = info.event.id;
    // Koristimo našu funkciju umesto .toISOString()
    const noviOd = this.formatDatum(info.event.start);
    const noviDo = this.formatDatum(info.event.end);

    this.ps.updateReservationTime(id, noviOd as any, noviDo as any).subscribe({
      next: () => alert("Termin uspešno pomeren!"),
      error: err => {
        alert("Greška: " + (err.error.message || "termin je zauzet!"));
        info.revert();
      }
    });
  }

  //kada resim da proirim sa strelicom termin da azurira u bazi
  onEventResize(info: any) {
    const id = info.event.id;
    const noviOd = this.formatDatum(info.event.start);
    const noviDo = this.formatDatum(info.event.end);

    this.ps.updateReservationTime(id, noviOd as any, noviDo as any).subscribe({
      next: () => alert("Termin uspešno ažuriran!"),
      error: err => {
        alert("Greška pri promeni trajanja: " + (err.error.message || "termin je zauzet!"));
        info.revert();
      }
    });
  }
}
