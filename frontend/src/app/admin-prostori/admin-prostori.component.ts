import { Component, inject, OnInit } from '@angular/core';
import Prostor from '../models/prostor';
import { ProstorService } from '../services/prostor-service.service';
import { NgIf, NgFor} from "@angular/common";

@Component({
  selector: 'app-admin-prostori',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './admin-prostori.component.html',
  styleUrl: './admin-prostori.component.css'
})
export class AdminProstoriComponent implements OnInit {

  prostori: any[] = []; // Koristimo any jer ćemo dodati polje 'menadzerObj'

  private ps = inject(ProstorService);

  ngOnInit(): void {
    this.osveziListu();
  }

  osveziListu() {

    this.ps.getPendingProstori().subscribe({

      next: (p: any) => {

        this.prostori = p;

        console.log("Prostori uspesno stigli: ", p);

      }, error: (err: any) => {
        console.error("Greska: ", err);
      }

    });

  }

  obradi(naziv: string, id: string) {
    this.ps.aproveProstor(naziv, id).subscribe({
      next: (res: any) => {
        alert(res.message);
        this.osveziListu(); 
      },
      error: (err: any) => alert(err.message)
    });
  }

}
