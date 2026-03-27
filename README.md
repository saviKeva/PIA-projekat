# PIA-projekat
Projekat iz Programiranja Internet Aplikacija JAN/FEB 2026. godine

**Napomene:** 
* podaci za bazu su za mart 2026. godine i potrebno je promeniti ih da bi se testirala aplikacija ako se ovaj projekat ikada kasnije negde koristi. 
* U fajlu biblioteke.txt je skript za upit za MongoDB bazu koji omogucava pomeranje svih datuma u kolekciji za odredjen broj dana, pa se to moze iskoristiti da se izbegne rucno menjanje podataka u bazi.
* Koriscen je nodemailer, za to je potrebno generisati sa svog gmail naloga sifru da bi radilo i ostaviti svoj nalog. Takodje, ovo ce raditi samo ako korisnik kome se salje link za reset lozinke otvara gmail na istom racunaru gde je i server aplikacije.

 **Pretpostavke za nejasnoce u projektu**:
* uvek postoji jedan otvoreni prostor, u prostori kolekciji imam niz jedinice. Ako je tip sto, misli se na sto u otvorenom prostoru, ako je tip kancelarija - kancelarija, ako je tip sala - konferencijska sala. Korisnik sto u otvorenom prosoru rezervise u punom kapacitetu ne moze rezervisati pojedinacno mesto za stolom, ali moze pojedinacan sto u otvorenom prostoru. Kancelariju clan mreze rezervise u punom kapacitetu, takodje salu moze da rezervise u punom kapacitetu i nikako drugacije. Svi prostori rade od 8 do 23 h (moja neka pretpostavka zbog generisanja statistike kod admina i izvestaja sa JSPDF kod menadzera).
* Trenutne rezervacije menadzera - one u tekucoj nedelji.
* Potvrdjena rezervacija znaci da je korisnik dosao najkasnije 10 min po pocetku termina i one ce biti kod menadzera precrtane. One koje su u buducnosti ili su pocele a menadzer ih nije jos uvek oznacio -> one imaju status kreirana. Rezervacija moze da se otkaze ako se korisnik nije pojavio nakon 10 min i status je kreirana, ili moze da s potvrdi ako je proslo 10 min i krisnik je dosao. U prvom slucaju korisnik dobija kaznu, i rezevacija se brise iz baze, u drugom slucaju se ne brise samo menja status u potvrdjena i postaje precrtana u tabeli menadzera.
* Korisnik koji dobije tri kazne za neki prostor, bez obzira na jedinicu tog prostora, ne sme vise niti da rezervise niti da komentarise nista u tom prostoru!
* za dodavanje prostora iz JSON fajla paziti da ako sama ne stavim id prostora, on ce dodati oid sam, i zato imam provere za jedinica_id u detalji-pretraga komponenti za rezervisi i filtrirajZaKalendar metodama.

**Stvari koje treba doraditi:**
* Fali izmena jedinica u okviru nekog prostora kao deo forme kod menadzera, npr. dodavanje nove jednice, promena naziva/cene/kapaciteta postojecih jeidinica itd. za konkretan prostor menadzera.
* Fali da se kod generisanja izvestaja doda za koji mesec / godinu mi treba izvestaj o popunjenosti tog prostora
* Fali da se doda poruka na fronu, tj da se uhvati poruka sa backa i prikaze na frontu kad se menja profilna slika kad se stavi vece od 300 px ili manje od 100px kod profila usera/menadzera itd.


