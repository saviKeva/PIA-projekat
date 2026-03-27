import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'
import { ProstorService } from '../services/prostor-service.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-menadzer-izvestaj',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menadzer-izvestaj.component.html',
  styleUrl: './menadzer-izvestaj.component.css'
})
export class MenadzerIzvestajComponent implements OnInit {

  sviProstori: any[] = [];
  sveRezervacije: any = [];
  ulogovaniMenadzer: string = "";
  ucitavanje: boolean = false;
  trenutniMesecNaziv: string = "";

  ps = inject(ProstorService);
  us = inject(UserService);
  meseci = ["Januar", "Februar", "Mart", "April", "Maj", "Jun", "Jul", "Avgust", "Septembar", "Oktobar",
    "Novembar", "Decembar"
  ];

  ngOnInit(): void {
    this.trenutniMesecNaziv = this.meseci[new Date().getMonth()];
    const loggedStr = localStorage.getItem("logged");
    if (loggedStr) {
      this.ulogovaniMenadzer = JSON.parse(loggedStr);
      this.osveziPodatke();
    }

  }

  osveziPodatke() {
    this.ucitavanje = true;

    // dohvatamo sve prostore za menadzera
    this.us.getProstoriForManager(this.ulogovaniMenadzer).subscribe({
      next: (d: any) => {
        this.sviProstori = d;

        console.log("Prostori za menadzera stigli: ", this.sviProstori);

        this.us.getRezervacijeSve(this.ulogovaniMenadzer).subscribe({
          next: (r: any) => {
            this.sveRezervacije = r;
            this.ucitavanje = false;
            console.log("Rezervacije stigle: ", this.sveRezervacije);
          }, error: (err: any) => {
            console.log("Greska pri ucitavanju rezervacija: ", err);
          }
        })
      }, error: (err: any) => {
        console.log("Greska pri ucitavanju prostora: ", err);
      }
    })
  }

  getBrojDanaUMesecu(godina: number, mesec: number): number {
    return new Date(godina, mesec + 1, 0).getDate();
    //trik da vratim poslednji dan u mesecu
  }

  generisiZbirniPDF() {
    const doc = new jsPDF();
    const danas = new Date();
    const mesecIndex = danas.getMonth();
    const godina = danas.getFullYear();
    const brojDana = this.getBrojDanaUMesecu(godina, mesecIndex);
    const radniSatiDnevno = 15; // 08:00 - 23:00
    const kapacitetPoJedinici = brojDana * radniSatiDnevno;

    // --- ZAGLAVLJE PDF-a ---
    doc.setFontSize(22);
    doc.setTextColor(40, 167, 69);
    doc.text("IZVEŠTAJ O POPUNJENOSTI", 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Menadžer: ${this.ulogovaniMenadzer}`, 14, 30);
    doc.text(`Mesec: ${this.trenutniMesecNaziv} ${godina}`, 14, 37);
    doc.text(`Radno vreme: 08:00 - 23:00h`, 14, 44);

    const tabelaPodaci: any[] = [];

    this.sviProstori.forEach(prostor => {
      const pId = prostor._id.$oid || prostor._id;

      // Filtriramo rezervacije za ovaj prostor u tekućem mesecu
      const rezProstora = this.sveRezervacije.filter((r:any) =>
        String(r.prostor_id) === String(pId) &&
        new Date(r.od).getMonth() === mesecIndex
      );

      // 1. OPEN SPACE GRUPA
      const stolovi = prostor.jedinice.filter((j: any) => j.naziv.toLowerCase().startsWith('sto'));
      if (stolovi.length > 0) {
        let satiOS = 0;
        rezProstora.filter((r:any) => r.naziv.toLowerCase().startsWith('sto')).forEach((r:any) => {
          satiOS += (new Date(r.do).getTime() - new Date(r.od).getTime()) / 3600000;
        });

        const kapOS = stolovi.length * kapacitetPoJedinici;
        const procOS = kapOS > 0 ? ((satiOS / kapOS) * 100).toFixed(2) : "0.00";

        tabelaPodaci.push([
          prostor.naziv,
          `Otvoreni prostor: ${stolovi.length} stolova`,
          `${procOS} %`
        ]);
      }

      // 2. POJEDINAČNE JEDINICE (Kancelarije i Sale)
      const ostale = prostor.jedinice.filter((j: any) => !j.naziv.toLowerCase().startsWith('sto'));
      ostale.forEach((j: any) => {
        let satiJedinice = 0;
        rezProstora.filter((r:any) => String(r.jedinica_id) === String(j.id)).forEach((r:any)=> {
          satiJedinice += (new Date(r.do).getTime() - new Date(r.od).getTime()) / 3600000;
        });

        const procenat = ((satiJedinice / kapacitetPoJedinici) * 100).toFixed(2);

        //format: Ime - Tip: Tip
        const tipPrikaz = j.tip ? j.tip : (j.naziv.toLowerCase().includes('sala') ? 'Konferencijska sala' : 'Kancelarija');
        const formatiranNaziv = `${j.naziv} - Tip: ${tipPrikaz}`;

        tabelaPodaci.push([
          prostor.naziv,
          formatiranNaziv,
          `${procenat} %`
        ]);
      });
    });

    autoTable(doc, {
      startY: 50,
      head: [['Prostor', 'Jedinica - Tip', 'Popunjenost (%)']],
      body: tabelaPodaci,
      theme: 'grid',
      headStyles: { fillColor: [40, 167, 69] },
      columnStyles: { 2: { halign: 'right' } }
    });

    doc.save(`Izvestaj_${this.trenutniMesecNaziv}_${godina}.pdf`);
  }

}
