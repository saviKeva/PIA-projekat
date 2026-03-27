import mongoose from 'mongoose'

const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
    kor_ime: { type: String, required: true, unique: true },
    lozinka: { type: String, required: true },           // biće hash
    ime: String,
    prezime: String,
    pol: String,
    adresa: String,
    tel: String,
    mejl: { type: String, required: true, unique: true, trim: true, lowercase: true },
    tip: { type: String, enum: ['admin', 'menadzer', 'clanMreze'] },
    slika: { type: String, default: './uploads/default.jpg' },
    // NOVA POLJA
    status: { type: String, enum: ['pending', 'active', 'rejected'], default: 'pending' },
    
    // Samo za menadžera
    firmaNaziv: String,
    adresaSedista: String,
    maticniBroj: { 
        type: String, 
        unique: true, 
        sparse: true,                    // da ne traži unique ako nije menadžer
        match: [/^\d{8}$/, 'Matični broj mora imati tačno 8 cifara']
    },
    pib: { 
        type: String, 
        unique: true, 
        sparse: true,
        match: [/^[1-9]\d{8}$/, 'PIB mora imati 9 cifara i ne počinje sa 0']
    },

        resetPasswordToken: {
        type: String,
        default: null,
        sparse: true,
        required: false
    },

    resetPasswordExpires: {
    type: Date,
    default: null,
    // Dodaj ovo da TypeScript shvati da može biti null
    required: false
    },

    // opciono – ako želiš da čuvaš razlog odbijanja
    rejectedReason: {
        type: String,
        default: null
    }
}, { versionKey: false });

export default mongoose.model('UserModel', userSchema, 'korisnici');