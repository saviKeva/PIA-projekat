export interface Jedinica{
  id?: string;
  tip:'sto'| 'kancelaija' | 'sala';
  kapacitet: number;
  naziv:string;
  cena:number;
  oprema?:string;
}

export interface Lokacija{
  lat:number;
  lng:number;
}

export default class Prostor{
  _id?: string
  naziv=""
  grad=""
  adresa=""
  firma=""
  kor_ime=""
  menadzer=""
  likes=0
  dislikes=0
  slike:Array<string> =[] //niz stringova za slike
  status=""

  lokacija:Lokacija = {lat:44.7866, lng:20.4489};
  jedinice:Jedinica[] = [];
  opis=""
  maxKazne=3
}
