
import * as express from 'express';
import * as bcrypt from 'bcryptjs';
import User from '../models/user';
import crypto from 'crypto';               // za reset token
import { transporter } from '../config/email';
import * as fs from 'fs';
import * as path from 'path'
import ReservationModel from '../models/rezervacija';
import ProstorModel from "../models/prostor";
import KaznaModel from '../models/kazna';

export class UserController {
  login = async (req: express.Request, res: express.Response) => {
    try {
      const { kor_ime, lozinka, tip } = req.body;

      const user = await User.findOne({ kor_ime, tip });
      if (!user) {
        return res.status(401).json({ message: "Korisnik ne postoji ili pogrešan tip!" });
      }
      if (!(await bcrypt.compare(lozinka, user.lozinka))) {
        return res.status(401).json({ message: "Pogrešna lozinka!" });
      }

      if (user.status !== 'active') {
        return res.status(403).json({
          message: user.status === 'pending'
            ? 'Nalog čeka odobrenje administratora'
            : 'Nalog je odbijen'
        });
      }

      res.json(user);   // ili samo { kor_ime: user.kor_ime, tip: user.tip, ... }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  };


  register = async (req: express.Request, res: express.Response) => {
    try {
      const {
        kor_ime, lozinka, ime, prezime, pol, adresa, tel, mejl, tip,
        firmaNaziv, adresaSedista, maticniBroj, pib
      } = req.body;

      // 1. Obavezna polja za sve
      if (!kor_ime || !lozinka || !ime || !prezime || !mejl || !tip) {
        return res.status(400).json({ message: 'Obavezna polja nisu popunjena' });
      }

      // 2. Provera jedinstvenosti kor_ime i mejl
      const existing = await User.findOne({ $or: [{ kor_ime }, { mejl }] });
      if (existing) {
        return res.status(409).json({ message: 'Korisničko ime ili email već postoji' });
      }

      // Regex za lozinku (počinje slovom, 8-12 kar, bar 1 veliko, 1 broj, 1 specijalni)
      const passRegex = /^[a-zA-Z](?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[a-zA-Z\d!@#$%^&*]{7,11}$/;
      if (!passRegex.test(lozinka)) {
        return res.status(400).json({
          message: 'Lozinka: 8-12 karaktera, počinje slovom, bar 1 veliko slovo, 1 broj, 1 specijalni karakter'
        });
      }

      // 3. Ako je menadžer – obavezna polja firme + provera max 2 menadžera
      if (tip === 'menadzer') {
        if (!firmaNaziv || !adresaSedista || !maticniBroj || !pib) {
          return res.status(400).json({ message: 'Za menadžera su obavezni podaci o firmi: naziv, adresa sedišta, matični broj i PIB' });
        }

        // Provera koliko aktivnih menadžera ima ta firma (po maticniBroj)
        const managerCount = await User.countDocuments({
          tip: 'menadzer',
          maticniBroj: maticniBroj,
          // status: 'active'   ← ako imaš status pending/active, dodaj ovo
        });

        if (managerCount >= 2) {
          return res.status(403).json({ message: 'Ova firma već ima 2 registrovana menadžera. Registracija trećeg nije dozvoljena.' });
        }
      } else {
        // Za ne-menadžere – zabraniti firmena polja
        if (firmaNaziv || adresaSedista || maticniBroj || pib) {
          return res.status(400).json({ message: 'Podaci o firmi su dozvoljeni samo za menadžere' });
        }
      }

      // 4. Hash lozinke
      const hashedPassword = await bcrypt.hash(lozinka, 10);


      const newUser = new User({
        kor_ime, ime, prezime, pol, adresa, tel, mejl, tip,
        lozinka: hashedPassword,
        slika: req.file?.path || './uploads/default.jpg',
        firmaNaziv: tip === 'menadzer' ? firmaNaziv : undefined,
        adresaSedista: tip === 'menadzer' ? adresaSedista : undefined,
        maticniBroj: tip === 'menadzer' ? maticniBroj : undefined,
        pib: tip === 'menadzer' ? pib : undefined,
        status: 'pending'
      });

      await newUser.save();
      res.status(201).json({ message: 'Zahtev za registraciju uspešno poslat. Čeka odobrenje admina.' });

    } catch (err: any) {
      console.error(err);
      if (err.code === 11000) {
        return res.status(409).json({ message: 'Duplikat: korisničko ime, email, matični broj ili PIB već postoje' });
      }
      res.status(500).json({ message: 'Greška pri registraciji' });
    }
  };


  forgotPassword = async (req: express.Request, res: express.Response) => {
    try {
      const { emailOrUsername } = req.body;
      const user = await User.findOne({
        $or: [{ mejl: emailOrUsername }, { kor_ime: emailOrUsername }]
      });

      if (!user) {
        // Ne otkrivaj da li korisnik postoji (sigurnost)
        return res.status(200).json({ message: 'Ako korisnik postoji, link je poslat na email' });
      }

      // Generiši token (30 min)
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();

      const resetUrl = `http://localhost:4200/reset-password/${resetToken}`;

      await transporter.sendMail({
        to: user.mejl,
        subject: 'Resetovanje lozinke - Coworking Hub',
        html: `
        <p>Kliknite na link da resetujete lozinku (važi 30 minuta):</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>Ako niste vi zahtevali, ignorišite ovaj email.</p>
      `
      });

      res.json({
        message: 'Link za reset poslat na email: ',
        debugLink: resetUrl
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Greška pri slanju email-a' });
    }
  };

  resetPassword = async (req: express.Request, res: express.Response) => {
    try {
      const { token, newPassword } = req.body;

      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ message: 'Token je istekao ili nevažeći' });
      }

      // proveravam regex lozinke ponovo
      const passRegex = /^[a-zA-Z](?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[a-zA-Z\d!@#$%^&*]{7,11}$/;
      if (!passRegex.test(newPassword)) {
        return res.status(400).json({ message: 'Lozinka ne ispunjava uslove' });
      }

      user.lozinka = await bcrypt.hash(newPassword, 10);

      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      res.json({ message: 'Lozinka uspešno promenjena' });
    } catch (err) {
      res.status(500).json({ message: 'Greška pri resetu lozinke' });
    }
  };

  getUser = async (req: express.Request, res: express.Response) => {
    const { kor_ime } = req.body;
    const user = await User.findOne({ kor_ime });
    if (!user) return res.status(404).json({ message: 'Korisnik nije nađen' });
    res.json(user);
  };



  getAllPending = async (req: express.Request, res: express.Response) => {
    try {
      // pronalazim sve korisnike koji su na čekanju (pending) 
      const pendingUsers = await User.find({ status: 'pending' });
      res.json(pendingUsers);
    } catch (err) {
      res.status(500).json({ message: 'Greška pri dobavljanju zahteva' });
    }
  };

  getAllUsers = async (req: express.Request, res: express.Response) => {
    try {
      // pronalazim sve korisnike koji nisu admini
      const users = await User.find({ tip: { $ne: 'admin' } });
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: 'Greška pri dobavljanju korisnika' });
    }
  };


  approveOrReject = async (req: express.Request, res: express.Response) => {
    try {
      const { kor_ime, status } = req.body; // status treba da bude 'active' ili 'rejected' 

      const user = await User.findOneAndUpdate(
        { kor_ime: kor_ime },
        { status: status },
        { new: true }
      );

      if (!user) return res.status(404).json({ message: 'Korisnik nije nađen' });

      res.json({ message: `Korisnik je uspešno ${status === 'active' ? 'odobren' : 'odbijen'}.` });
    } catch (err) {
      res.status(500).json({ message: 'Greška pri obradi zahteva' });
    }
  };

  //admin - brisanje korisnickih naloga
  adminDelete = async (req: express.Request, res: express.Response) => {
    try {

      const { kor_ime } = req.body;

      // brišem korisnika iz kolekcije korisnici
      const user = await User.findOneAndDelete({ kor_ime: kor_ime });

      if (!user) {
        return res.status(404).json({ message: `Korisnik ${kor_ime} nije pronađen!` });
      }

      // brisanje buducih rezervacija
      // uslov - kor_ime se podudara I polje 'od' (početak rezervacije) je veće od trenutnog vremena
      const trenutnoVreme = new Date();

      const obrisaneRezervacije = await ReservationModel.deleteMany({
        kor_ime: kor_ime,
        od: { $gte: trenutnoVreme } // $gte je "greater than or equal"
      });

      console.log(`Uspesno obrisan korisnik: ${kor_ime}`);
      console.log(`Broj obrisanih budućih rezervacija: ${obrisaneRezervacije.deletedCount}`);

      res.json({
        message: `Korisnik ${kor_ime} je obrisan, kao i ${obrisaneRezervacije.deletedCount} budućih rezervacija.`
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Greška pri obradi brisanja na serveru" });
    }
  }

  // adminDelete = async(req:express.Request,res:express.Response) => {
  //   try {
  //     const {kor_ime} = req.body;

  //     const user = await User.findOneAndDelete({kor_ime:kor_ime});

  //     console.log("Uspesno obrisan: ", user?.kor_ime);

  //     if(!user){
  //       return res.status(404).json({message:`Greska pri brisanju user-a!`});
  //     }

  //     res.json({message:`Korisnik ${user.kor_ime} je uspesno obrisan!`});

  //   } catch (error) {
  //     res.status(500).json({message:"Greska pri obradi brisanja user a na server-u"});
  //   }
  // }


  promeniPodatak = async (req: express.Request, res: express.Response) => {
    try {
      const { kor_ime, nov_podatak, polje } = req.body;

      if (['mejl', 'kor_ime', 'tel'].includes(polje)) {
        const exists = await User.findOne({ [polje]: nov_podatak, kor_ime: { $ne: kor_ime } });
        if (exists) {
          return res.status(400).json({ message: `Ovaj ${polje} već koristi drugi korisnik!` });
        }
      }

      const success = await User.updateOne({ 'kor_ime': kor_ime }, { $set: { [polje]: nov_podatak } });
      //moram da stavis polje u uglaste zagrade, inace trazi bas polje koje se zove "polje" u bazi
      if (!success) return res.status(404).json({ message: 'Neuspesna promena podataka!' });

      res.json("OK");
    } catch (error) {
      res.status(500).json({ message: 'Greška pri promeni podataka' });
    }
  }


  updateProfileImage = async (req: express.Request, res: express.Response) => {
    try {
      const { kor_ime } = req.body;
      const newImagePath = req.file?.path;

      if (!newImagePath) {
        return res.status(400).json({ message: "Slika nije poslata" });
      }

      const user = await User.findOne({ kor_ime });
      if (!user) return res.status(404).json({ message: 'Korisnik nije nađen' });

      const oldImagePath = user.slika;

      // BRISANJE STARE SLIKE
      if (oldImagePath && !oldImagePath.includes('default.jpg')) {
        // Koristimo asinhrono brisanje da ne blokiramo resurs
        fs.unlink(path.resolve(oldImagePath), (err) => {
          if (err) {
            console.warn("Sistem nije mogao da obriše staru sliku...");
          } else {
            console.log("Stara slika uspešno obrisana.");
          }
        });
      }

      // Ažuriramo putanju u bazi bez obzira na to da li je stara slika obrisana
      user.slika = newImagePath;
      await user.save();

      res.json({ message: 'OK', novaSlika: newImagePath });

    } catch (err) {
      console.error("Greška:", err);
      res.status(500).json({ message: 'Greška pri promeni slike' });
    }
  }

  //MENADZER - ovo je za rezervacije na nedeljnom nivou
  getRezervacijeForManager = async (req: express.Request, res: express.Response) => {
    try {
      const { kor_ime } = req.params;



      //racunanje ponedeljka i nedelje
      const danas = new Date();
      danas.setHours(0, 0, 0, 0); // Resetujemo vreme na početak dana

      const danUNedelji = danas.getDay(); // 0 je nedelja, 1 je ponedeljak...
      //pomeraj: ako je nedelja (0), treba mi -6 dana, inace (1 - danUNedelji)
      const pomeraj = danUNedelji === 0 ? -6 : 1 - danUNedelji;

      const ponedeljak = new Date(danas);
      ponedeljak.setDate(danas.getDate() + pomeraj);
      ponedeljak.setHours(0, 0, 0, 0);

      const nedelja = new Date(ponedeljak);
      nedelja.setDate(ponedeljak.getDate() + 6);
      nedelja.setHours(23, 59, 59, 999);

      // traženje prostora
      const prostori = await ProstorModel.find({ kor_ime: kor_ime });

      //ako menadžer nema prostore, odmah vratim prazan niz
      if (!prostori || prostori.length === 0) {
        console.log(`Menadžer ${kor_ime} nema dodeljenih prostora.`);
        return res.json([]);
      }

      const prostorIds = prostori.map(p => p._id.toString());

      console.log("Korisnik:", kor_ime);
      console.log("ID-jevi njegovih prostora:", prostorIds);
      const sveBezFiltera = await ReservationModel.find({ prostor_id: { $in: prostorIds } });
      console.log("Sve rezervacije za te prostore (bez datuma):", sveBezFiltera.length);

      // traženje rezervacija sa filterom za nedelju
      const sveRezervacije = await ReservationModel.find({
        prostor_id: { $in: prostorIds },
        od: {
          $gte: ponedeljak,
          $lte: nedelja
        }
      });

      console.log(`Pronađeno ${sveRezervacije.length} rezervacija za menadžera ${kor_ime}`);
      res.json(sveRezervacije);

    } catch (error) {
      console.error("GRESKA NA BACKENDU:", error);
      res.status(500).json({ message: "Doslo je do greške na serveru." });
    }
  }

  // dohvata sve rezervacije za menadzera ikada
  getRezervacijeSve = async (req: express.Request, res: express.Response) => {
    try {
      const { kor_ime } = req.params;


      // traženje prostora
      const prostori = await ProstorModel.find({ kor_ime: kor_ime });

      //ako menadžer nema prostore, odmah vratmi prazan niz - OVO SPREČAVA ERROR 500
      if (!prostori || prostori.length === 0) {
        console.log(`Menadžer ${kor_ime} nema dodeljenih prostora.`);
        return res.json([]);
      }

      const prostorIds = prostori.map(p => p._id.toString());

      console.log("Korisnik:", kor_ime);
      console.log("ID-jevi njegovih prostora:", prostorIds);
      const sveBezFiltera = await ReservationModel.find({ prostor_id: { $in: prostorIds } });
      console.log("Sve rezervacije za te prostore (bez datuma):", sveBezFiltera.length);

      // 3. Traženje rezervacija sa filterom za nedelju
      const sveRezervacije = await ReservationModel.find({
        prostor_id: { $in: prostorIds },
      });

      console.log(`Pronađeno ${sveRezervacije.length} rezervacija za menadžera ${kor_ime}`);
      res.json(sveRezervacije);

    } catch (error) {
      console.error("GRESKA NA BACKENDU:", error);
      res.status(500).json({ message: "Doslo je do greške na serveru." });
    }
  }

  getProstoriForManager = async (req: express.Request, res: express.Response) => {
    try {
      const { kor_ime } = req.params;
      const prostori = await ProstorModel.find({ kor_ime: kor_ime, status: "active" });
      console.log("Pronadjeni prostori za menadzera: " + prostori);
      res.json(prostori);
    } catch (error) {
      console.log("Greska pri dohvatanju prostora za menadzera ");
      res.status(500).json({ message: "Greska pri dohvatanju prostora za menadzera!" });
    }
  }

  //ovo je da menadzer otkaze rezeraciju
  cancelManager = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.body;
      console.log("Pokusavam da otkazem rezervaciju: " + id);
      const reserv = await ReservationModel.findById(id);

      const prostor_id = reserv?.prostor_id;


      if (!reserv) return res.status(404).json({ message: "Rezervacija nije pronadjena!" });
      const tod = new Date(reserv.od);
      const now = new Date();
      const pocetak = tod.getTime();
      const sada = now.getTime();
      const protekloMinuta = (sada - pocetak) / (1000 * 60);
      console.log(protekloMinuta);

      tod.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);

      const terminNijeDanas = tod.getTime() > now.getTime();

      console.log(terminNijeDanas);

      // Menadžer može da otkaže tek kada termin krene
      if (protekloMinuta < 0 && !terminNijeDanas) {
        return res.status(400).json({ message: "Termin još nije počeo. Sačekajte početak za proveru prisustva." });
      }

      // Ako je prošlo više od 10 minuta, menadžer ima pravo da ga odjavi i kazni
      if (protekloMinuta < 10 && !terminNijeDanas) {
        return res.status(400).json({ message: "Morate sačekati bar 10 minuta od početka termina pre odjavljivanja." });
      }
      await ReservationModel.findByIdAndDelete(id);

      //nadjem ko je menadzer prostora
      const prostor = await ProstorModel.findById(reserv.prostor_id);

      //zapis u kolekciji kazni
      const novaKazna = new KaznaModel({
        kor_ime: reserv.kor_ime,
        prostor_id: reserv.prostor_id,
        menadzer_kor_ime: prostor?.kor_ime

      });

      await novaKazna.save();

      res.json({ message: "Za korsinika " + reserv.kor_ime + " odjavljen je termin za prostor  i zabelezena je kazna!" });


    } catch (err) {
      console.log("DETALJNA GRESKA - otkazivanje: ", err);
      res.status(500).json({ message: "Greska pri otkazivanju!" });
    }
  }

  potvrdiRezervaciju = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.body;

      //filter traži ID i proverava da status nije potvrdjena
      const result = await ReservationModel.updateOne(
        {
          _id: id,
          status: { $ne: "potvrdjena" } // $ne znači "not equal" (nije jednako)
        },
        {
          $set: { status: "potvrdjena" }
        }
      );

      // ako je matchedCount 0, znači ili da rezervacija ne postoji
      // ili da je već ranije potvrđena pa je filter nije uhvatio
      if (result.matchedCount === 0) {
        return res.status(400).json({
          message: "Rezervacija nije pronađena ili je već ranije potvrđena!"
        });
      }

      res.json({ message: "Rezervacija uspešno potvrđena!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Greška na serveru!" });
    }
  }




  //REZERVACIJE
  getReservationForUser = async (req: express.Request, res: express.Response) => {
    try {
      const { kor_ime } = req.params;
      console.log("Trazim rezervacije za: ", kor_ime);

      //racunanje ponedeljka i nedelje
      const danas = new Date();
      danas.setHours(0, 0, 0, 0); // Resetujemo vreme na početak dana


      // Dodajemo status: "kreirana" u filter
      const data = await ReservationModel.find({
        kor_ime: kor_ime,
        status: "kreirana",
        od: {
          $gte: danas
        }
      });

      console.log("Pronadjeno samo kreiranih: ", data.length);
      res.json(data);
    } catch (error) {
      console.log("Greska pri dohvatanju rezervacija", error);
      res.status(500).json({ message: "Greska pri dohvatanju rezervacija" });
    }
  }

  //pazi - ovo je da user otkaze rezervaciju
  cancel = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const reserv = await ReservationModel.findById(id);

      if (!reserv) return res.status(404).json({ message: "Rezervacija nije pronadjena!" });

      const pocetak = new Date(reserv.od).getTime();
      const sada = new Date().getTime();
      const razlikaUsatima = (pocetak - sada) / (1000 * 60 * 60);

      if (razlikaUsatima < 12) {
        return res.status(400).json({ message: "Otkazivanje nije moguce (manje od 12h je ostalo do termina)!" });

      }
      await ReservationModel.findByIdAndDelete(id);
      res.json({ message: "Rezervacija uspesno otkazana!" });
    } catch (err) {
      res.status(500).json({ message: "Greska pri otkazivanju!" });
    }
  }



  changePassword = async (req: express.Request, res: express.Response) => {
    try {
      const { kor_ime, staraLozinka, novaLozinka } = req.body;


      const user = await User.findOne({ kor_ime });
      if (!user) return res.status(404).json({ message: "Korisnik nije nađen" });

      //stara lozinka
      const isMatch = await bcrypt.compare(staraLozinka, user.lozinka);
      if (!isMatch) {
        return res.status(401).json({ message: "Trenutna lozinka nije ispravna!" });
      }

      //validacija nove lozinke
      const passRegex = /^[a-zA-Z](?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[a-zA-Z\d!@#$%^&*]{7,11}$/;
      if (!passRegex.test(novaLozinka)) {
        return res.status(400).json({
          message: 'Nova lozinka: 8-12 karaktera, počinje slovom, bar 1 veliko slovo, 1 broj i 1 specijalni karakter.'
        });
      }

      // kriptovanje nove lozinke i čuvanje
      user.lozinka = await bcrypt.hash(novaLozinka, 10);
      await user.save();

      res.json({ message: "Lozinka uspešno promenjena!" });
    } catch (err) {
      res.status(500).json({ message: "Greška na serveru pri promeni lozinke." });
    }
  };


  // statistika za administratora

  //   getStatistics = async (req: express.Request, res: express.Response) => {
  //     try {
  //       const god = parseInt(req.params.godina);
  //       const podaci = await ReservationModel.aggregate([
  //         {
  //           $project: {
  //             nazivProstora: 1,
  //             cena: 1,
  //             status: 1,
  //             godina: { $year: "$od" } //izvlacim godinu iz datuma da je uporedim sa god
  //           }
  //         }, {
  //           $match: {
  //             godina: god,
  //             status: 'potvrdjena'
  //           }
  //         },
  //         {
  //           $group:{
  //             _id:"$nazivProstora",
  //             prihod:{$sum: "$cena"},
  //             brojRezervacija:{$sum:1}
  //           }
  //         }

  //       ]);
  //       res.json(podaci);
  //       console.log("Statistka podaci: ",podaci);
  //     } catch (err) {
  //       res.status(500).json({ message: "Greska na serveru: statistika menader!" });
  //     }
  //   }



  getStatistics = async (req: express.Request, res: express.Response) => {
    try {
      const god = parseInt(req.params.godina);
      const podaci = await ReservationModel.aggregate([
        // 0. KLJUČNO: Pretvaramo string u ObjectId pre lookup-a
        {
          $addFields: {
            prostor_id_obj: { $toObjectId: "$prostor_id" }
          }
        },
        // 1. Spajamo koristeći novo polje
        {
          $lookup: {
            from: "prostori",           // Proveri u MongoDB Compass-u tačno ime kolekcije!
            localField: "prostor_id_obj",
            foreignField: "_id",
            as: "detaljiProstora"
          }
        },
        { $unwind: "$detaljiProstora" },

        // 3. Filtriranje jedinice i datuma
        {
          $addFields: {
            jedinicaPodaci: {
              $filter: {
                input: "$detaljiProstora.jedinice",
                as: "j",
                cond: { $eq: ["$$j.id", "$jedinica_id"] }
              }
            },
            datumOd: { $toDate: "$od" }
          }
        },
        // 4. Izvlačenje cene
        {
          $addFields: {
            izracunataCena: {
              $convert: {
                input: { $arrayElemAt: ["$jedinicaPodaci.cena", 0] },
                to: "double",
                onError: 0
              }
            }
          }
        },
        // 5. Projekcija i Match
        {
          $project: {
            nazivProstora: 1,
            izracunataCena: 1,
            status: 1,
            godina: { $year: "$datumOd" }
          }
        },
        // PAŽNJA: Match mora biti precizan
        {
          $match: {
            godina: god,
            status: "potvrdjena" // Proveri da li je u bazi "potvrdjena" ili "potvrđena"
          }
        },
        // 6. Grupisanje
        {
          $group: {
            _id: "$nazivProstora",
            prihod: { $sum: "$izracunataCena" },
            brojRezervacija: { $sum: 1 }
          }
        }
      ]);
      console.log('Rezultat agregacije:', podaci);
      res.json(podaci);
    } catch (err) {
      console.error('Greška u agregaciji:', err);
      res.status(500).json(err);
    }
  }

}