export default class Rezervacija{
  _id?: string;
  kor_ime=""
  prostor_id=""
  jedinica_id=""
  naziv=""
  nazivProstora=""
  grad=""
  status=""
  od:Date = new Date();
  do:Date = new Date();
}
