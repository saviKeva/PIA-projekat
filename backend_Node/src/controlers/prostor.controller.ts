import ProstorModel from "../models/prostor";
import * as express from 'express'
import ReservationModel from '../models/rezervacija';
import ReviewModel from '../models/recenzija';
import * as fs from 'fs'; // Modul za rad sa fajlovima
import KaznaModel from '../models/kazna';
import mongoose from 'mongoose';

//dohvatanje latitude i longitude za mape
const NodeGeocoder = require('node-geocoder');
const geocoder = NodeGeocoder({ provider: 'openstreetmap' });


export class ProstorController {

    getAllActiveProstor = async (req: express.Request, res: express.Response) => {
        try {
            // Dohvatamo samo prostore ciji je status 'active'
            const prostori = await ProstorModel.find({ status: 'active' });

            res.json(prostori);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Greska pri dobavljanju svih aktivnih prostora!" });
        }
    }

    getPendingProstori = async (req: express.Request, res: express.Response) => {
        try {
            // Dohvatamo samo prostore ciji je status 'active'
            const prostori = await ProstorModel.find({ status: 'pending' });

            res.json(prostori);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Greska pri dobavljanju svih prostora!" });
        }
    }

    getTop5 = async (req: express.Request, res: express.Response) => {
        try {
            const top5 = await ProstorModel.find({ status: 'active' })
                .sort({ likes: -1 }).limit(5); //sotiram opadajuce i onda uzimam prvih 5
            res.json(top5);
        } catch (err) {
            res.status(500).json({ message: "Greska pri dobavljanju top5! " });
        }
    }

    getProstorById = async (req: express.Request, res: express.Response) => {
        let id = req.body._id;
        try {
            const prostor = await ProstorModel.findById(id);
            if (!prostor) {
                return res.status(404).json({ message: "Prostor nije pronađen" });
            }
            res.json(prostor);
        } catch (error) {
            res.status(500).json({ message: "Greska pri dobavljanju prostora po ID-u" });
        }
    }



    pretraziProstore = async (req: express.Request, res: express.Response) => {
        const { tekst, tip, brojOsoba } = req.body;

        let query: any = { status: 'active' };

        if (tekst) {
            query.$or = [
                { naziv: { $regex: tekst, $options: 'i' } },
                { grad: { $regex: tekst, $options: 'i' } }
            ];
        }

        //filtriranje po tipu jedinice i kapacitetu

        if (tip) {
            let jedinicaFilter: any = { tip: tip };

            if (tip === 'kancelarija' && brojOsoba) {
                jedinicaFilter.kapacitet = { $gte: brojOsoba };
            }

            if (tip === 'sala') {
                jedinicaFilter.kapacitet = { $gte: 10, $lte: 12 };
            }

            query.jedinice = { $elemMatch: jedinicaFilter };
        }

        try {
            const rezultati = await ProstorModel.find(query);
            res.json(rezultati);
        } catch (err) {
            res.status(500).json({ message: "Greska pri pretrazi!" });
        }
    }

    //dohvatanje rezervacije za konkretan prostor zbog kalendara

    getReservationsForSpace = async (req: express.Request, res: express.Response) => {
        try {
            const { prostor_id } = req.params;
            // Dohvatam sve rezervacije za taj prostor da bi frontend mogao da ih rotira po jedinicama
            const data = await ReservationModel.find({ prostor_id: prostor_id });
            res.json(data);
            console.log(data);
        } catch (error) {
            res.status(500).json({ message: "Greška pri dohvatanju rezervacija prostora" });
        }
    }

    getReservationsForSpaceClan = async (req: express.Request, res: express.Response) => {
        try {
            const { prostor_id } = req.params;
            const { tip } = req.query;

            // 1. KONVERZIJA: String iz URL-a pretvaramo u ObjectId
            const prostorObjectId = new mongoose.Types.ObjectId(prostor_id);

            let filter: any = { prostor_id: prostorObjectId };

            if (tip && tip !== 'null') {
                const prostor = await ProstorModel.findById(prostorObjectId);

                if(prostor) {
                    // Forsiramo konverziju u String da bismo izbegli Mongoose ObjectId tipove
                    const odgovarajuciIdjevi = prostor.jedinice
                        .filter((j: any) => j.tip === tip)
                        .map((j: any) => j.id.toString().trim()); // DODATO .toString().trim()

                    console.log("Jedinice tipa", tip, "su (očišćeno):", odgovarajuciIdjevi);

                    if (odgovarajuciIdjevi.length === 0) {
                        return res.json([]);
                    }

                    // Sada filter sadrži niz pravih stringova: ['id1', 'id2'...]
                    filter.jedinica_id = { $in: odgovarajuciIdjevi };
                }
            }

            console.log("Konačni filter za bazu:", filter);

            const data = await ReservationModel.find(filter);

            console.log(`Pronađeno ${data.length} rezervacija.`);
            res.json(data);

        } catch (error) {
            console.error("Greška na backendu:", error);
            res.status(500).json({ message: "Greška pri dohvatanju rezervacija" });
        }
    }

    addReservation = async (req: express.Request, res: express.Response) => {
        try {
            // Destrukturiranje podataka iz req.body
            const prostor_id: string = req.body.prostor_id;
            const jedinica_id: string = req.body.jedinica_id;
            const kor_ime: string = req.body.kor_ime;
            const tod: string = req.body.od;
            const tdo: string = req.body.do;



            const noviOd = new Date(tod);
            const noviDo = new Date(tdo);
            const sad = new Date();

            if (noviOd < sad) {
                return res.status(400).json({ message: "Termin je u proslosti!" });
            }

            if (noviDo <= noviOd) {
                return res.status(400).json({ message: "Neispravan vremenski interval." });
            }



            // 1. Provera limita kazni za ovaj prostor
            const prostor = await ProstorModel.findById(prostor_id);
            if (!prostor) return res.status(404).json({ message: "Prostor nije pronađen!" });

            const brojKazni = await KaznaModel.countDocuments({
                kor_ime: kor_ime,
                prostor_id: prostor_id
            });

            if (brojKazni >= (prostor.maxKazne || 3)) {
                return res.status(403).json({
                    message: `Rezervacija odbijena. Imate ${brojKazni} kazne u ovom prostoru, što je limit.`
                });
            }

            // - Logika preklapanja:
            // Termin je zauzet ako (NoviStart < PostojeciKraj) I (NoviKraj > PostojeciStart)
            const konflikt = await ReservationModel.findOne({
                prostor_id: prostor_id,
                jedinica_id: jedinica_id,
                $and: [
                    { od: { $lt: noviDo } },
                    { do: { $gt: noviOd } }
                ]
            });

            if (konflikt) {
                return res.status(400).json({ message: "Termin je već zauzet!" });
            }

            const novaRez = new ReservationModel({
                ...req.body,
                status: "kreirana"
            });
            await novaRez.save();

            console.log("Nova rezervacija sacuvana: " + novaRez);
            res.json({ message: "Uspešno!" });
        } catch (err) {
            res.status(500).json({ message: "Server error" });
        }
    }

    ostaviRecenziju = async (req: express.Request, res: express.Response) => {
        try {

            const { prostor_id, kor_ime, tekst, tip, datum } = req.body;
            const brojRezervacija = await ReservationModel.countDocuments({
                prostor_id: prostor_id,
                kor_ime: kor_ime,
                status: "potvrdjena"
            });

            if (brojRezervacija == 0) {
                return res.status(403).json({ message: "Morate imati bar jednu potvrdjenu rezervaciju." })
            }

            //izracunaj koliko je vec ostavio aktivnosti (broj lajkova + komentara ne sme biti veci od broja rezervacija

            const brojAktivnosti = await ReviewModel.countDocuments({
                prostor_id: prostor_id,
                kor_ime: kor_ime
            });

            //provera kvote

            if (brojAktivnosti >= brojRezervacija) {
                return res.status(403).json({ message: "Ne mozete dati vise komentara/reakcija, jer ste iskoristili to pravo za sve svoje rezervacije ovog prostora!" })
            }

            //sacuvati novu recenziju u bazu (svejedno jel lajk/dislajk/komentar)
            const novaRecenzija = new ReviewModel({ prostor_id, kor_ime, tekst, tip, datum });
            await novaRecenzija.save();

            //ako je u pitanju bio lajk ili dislajk treba azurirati njihov broj u prostorModelu

            if (tip === 'like') {
                await ProstorModel.updateOne({ _id: prostor_id }, { $inc: { likes: 1 } });
            } else if (tip === 'dislike') {
                await ProstorModel.updateOne({ _id: prostor_id }, { $inc: { dislikes: 1 } });
            }
            res.json({ message: "Uspesno sacuvano!" })
        } catch (err) {
            res.status(500).send("Greska na serveru!")
        }
    }

    getKomentari = async (req: express.Request, res: express.Response) => {
        const { prostor_id } = req.params;
        const komentari = await ReviewModel.find({
            prostor_id: prostor_id,
            tekst: { $exists: true, $ne: "" } //komentari koji postoje i nisu jednaki praznom stringu
        })
            .sort({ datum: -1 }) //sortira opadajuce, tj najkasnijih 10 komentara idu prvi
            .limit(10);
        console.log(komentari);
        res.json(komentari);
    }


    //MENADZER


    addProstor = async (req: express.Request, res: express.Response) => {
        try {
            const podaci = req.body;
            const jedinice = podaci.jedinice;

            //serverska validacija za jedinice

            //proveravam stolove u otvorenom prostoru >= 5
            const stolovi = jedinice.filter((j: any) => j.tip === 'sto');
            if (stolovi.length < 5) {
                return res.status(400).json({
                    message: `Otvoreni radni prostor mora imati najmanje 5 stolova. Trenutno je uneto: ${stolovi.length} `
                });
            }

            //provera jedinstvenosti naziva
            const nazivi = jedinice.map((j: any) => j.naziv);
            if (new Set(nazivi).size !== nazivi.length) {
                return res.status(400).json({
                    message: "Svi nazivi jedinica (stolovi, kancelarije i sale) moraju biti jedinstveni na nivou istog prostora!"
                });
            }

            //provera za sale
            for (let j of jedinice) {
                if (j.tip === 'sala') {
                    j.kapacitet = 11;
                    if (j.oprema && j.oprema.length > 300) {
                        return res.status(400).json({ message: `Oprema opis za salu je predugacak - max 300 karaktera!` });
                    }
                }
            }

            //nalzanje latitude i longitute koordinata za mapu na osnocu adrese
            const adresa = `${podaci.ulica} ${podaci.broj}, ${podaci.grad}, Serbia`;
            let lat = 44.8125;
            let lng = 20.4612;

            try {
                const resGeo = await geocoder.geocode(adresa);
                if (resGeo && resGeo.length > 0) {
                    lat = resGeo[0].latitude;
                    lng = resGeo[1].longitude;

                    console.log("lat: ", lat);
                    console.log("lng: ", lng);
                }
            } catch (error) {
                console.error("Geocoding failed, using defaults", error);
            }

            //cuvam novi prostor u bazi
            const noviProstorObjekat = new ProstorModel({
                naziv: podaci.naziv,
                grad: podaci.grad,
                adresa: `${podaci.ulica} ${podaci.broj}, ${podaci.grad}`,
                firma: podaci.firma,
                kor_ime: podaci.kor_ime,
                menadzer: podaci.menadzer,
                likes: 0,
                dislikes: 0,
                slike: podaci.slike,
                opis: podaci.opis,
                cenaPoSatu: podaci.cenaPoSatu,
                lokacija: { lat, lng },
                jedinice: jedinice,
                status: 'pending',
                maxKazne: podaci.maxKazne
            })

            await noviProstorObjekat.save();
            console.log("uspesno sacuvano u bazu - novi prostor");

            return res.status(200).json({ message: "OK" });

        } catch (error) {
            console.error("DETALJNA GRESKA:", error);
            res.status(500).json({ message: "Greska na serveru!" });
        }
    }



    uploadFromJSON = async (req: express.Request, res: express.Response) => {
        let putanjaDoFajla = "";
        try {
            //provera fajla
            if (!req.file) {
                return res.status(400).json({ message: "Niste poslali fajl!" });
            }

            putanjaDoFajla = req.file.path;

            if (!req.file.originalname.endsWith('.json')) {
                fs.unlinkSync(putanjaDoFajla);
                return res.status(400).json({ message: "Dozvoljeni su samo .json fajlovi!" });
            }
            //citanje iz fajla
            const sadrzajFajla = fs.readFileSync(putanjaDoFajla, 'utf8');
            const podaci = JSON.parse(sadrzajFajla);

            const ulogovan_kor_ime = req.body.kor_ime;
            const ulogovana_firma = req.body.firma;

            // provera da li kor_ime u fajlu odgovara ulogovanom korisniku
            if (podaci.kor_ime !== ulogovan_kor_ime) {
                fs.unlinkSync(putanjaDoFajla);
                return res.status(403).json({
                    message: `Greška: Korisničko ime u fajlu (${podaci.kor_ime}) se ne poklapa sa Vašim (${ulogovan_kor_ime})!`
                });
            }

        
            if (podaci.firma !== ulogovana_firma) {
                fs.unlinkSync(putanjaDoFajla);
                return res.status(403).json({ message: "Firma u fajlu se ne poklapa sa Vašom registrovanom firmom!" });
            }

            
            //ako nema ni jednog stola ne postoji otvoreni prostor
            const openSpaceFilter = podaci.jedinice.filter((j: any) => j.tip === 'sto');
            if (openSpaceFilter.length == 0) {
                fs.unlinkSync(putanjaDoFajla);
                return res.status(400).json({ message: "Mora postojati tačno jedan otvoreni prostor (tip: 'sto')!" });
            }

            for (let j of podaci.jedinice) {
                const dupliNaziv = podaci.jedinice.filter((jed: any) => jed.naziv === j.naziv);
                if (dupliNaziv.length > 1) {
                    fs.unlinkSync(putanjaDoFajla);
                    return res.status(400).json({ message: `Naziv '${j.naziv}' se ponavlja unutar fajla!` });
                }

                if (j.tip === 'sala') {
                    j.kapacitet = 12; // Fiksiraš prema zahtevu
                    if (j.oprema && j.oprema.length > 300) {
                        fs.unlinkSync(putanjaDoFajla);
                        return res.status(400).json({ message: `Oprema za salu ${j.naziv} prelazi 300 karaktera!` });
                    }
                }
            }

            // cuvanje u bazu
            podaci.status = 'pending';
            podaci.slike = ["default_prostor.jpg"];

            const noviProstor = new ProstorModel(podaci);
            await noviProstor.save();

            // brisanje fajla
            fs.unlinkSync(putanjaDoFajla);
            res.json({ message: "Prostor uspešno uvezen iz fajla!" });

        } catch (err) {
            if (putanjaDoFajla && fs.existsSync(putanjaDoFajla)) fs.unlinkSync(putanjaDoFajla);
            res.status(400).json({ message: "Greška: Fajl nije u ispravnom formatu ili nedostaju obavezna polja." });
        }
    }

    //za interaktivni kalendar
    updateReservationTime = async (req: express.Request, res: express.Response) => {
        try {
            const { id, noviOd, noviDo } = req.body;

            const resv = await ReservationModel.findById(id);
            if (!resv) return res.status(404).json({ message: "Rezervacija nije nađena!" });

            // SAMO OVO IZMENI: nemoj dodavati +"Z" jer ga frontend već šalje
            const dateOd = new Date(noviOd);
            const dateDo = new Date(noviDo);

            // Provera validnosti datuma (za svaki slučaj)
            if (isNaN(dateOd.getTime()) || isNaN(dateDo.getTime())) {
                return res.status(400).json({ message: "Nevalidan format datuma!" });
            }

            const konflikt = await ReservationModel.findOne({
                _id: { $ne: id },
                prostor_id: resv.prostor_id,
                jedinica_id: resv.jedinica_id,
                $and: [
                    { od: { $lt: dateDo } },
                    { do: { $gt: dateOd } }
                ]
            });

            if (konflikt) {
                return res.status(400).json({ message: "Novi termin je zauzet!" });
            }

            resv.od = dateOd;
            resv.do = dateDo;
            await resv.save();

            res.json({ message: "Termin uspešno pomeren!" });
        } catch (error) {
            console.error("Greska na serveru:", error); // Bolje logovanje za debug
            res.status(500).json({ message: "Greska pri azuriranju na serveru" });
        }
    }

    //admin - odobravanje prostora
    aproveSpace = async (req: express.Request, res: express.Response) => {
        try {
            const { naziv, _id } = req.body;

            const result = await ProstorModel.updateOne(
                {
                    _id, naziv, status: 'pending'
                },
                {
                    $set: { status: "active" }
                }
            );

            if (result.matchedCount == 0) {
                console.error("Prostor nije pronadjen ili je vec ranije stavljen na active!");
                return res.status(400).json({
                    message: "Prostor nije pronadjen ili je vec ranije stavljen na active!"
                });
            }

            res.json({ message: "Prostor uspesno odobren!" });

        } catch (error) {
            console.error("Greska na serveru: ", error);
            res.status(500).json({ message: "Greska na serveru!" })
        }
    }
}