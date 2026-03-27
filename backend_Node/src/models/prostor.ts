import mongoose from 'mongoose'

const Schema = mongoose.Schema;

const prostorSchema = new mongoose.Schema({
    naziv: { type: String, required: true, unique: true,trim:true },
    grad: { type: String, required: true, trim:true },           // biće hash
    adresa: {type:String, required:true,trim:true },
    firma: { type: String, required: true,  trim: true },
    kor_ime:{type:String, required:true, trim:true},
    menadzer: { type: String, required: true,  trim: true },
    likes:{type:Number, default:0},
    dislikes:{type: Number, default: 0},
    slike: [String],
    status: { type: String, enum: ['pending', 'active', 'rejected'], default: 'pending' },

    lokacija:{
        lat:{type:Number, required:true},
        lng:{type:Number, required:true}
    },

    jedinice:[{
        tip:{type:String, enum: ['sto', 'kancelarija', 'sala']},
        kapacitet: {type:Number},
        naziv:{type:String},
        cena:{type:Number},
        oprema:{type:String, default:""}
    }],

    opis:{type: String, required: true},
    maxKazne:{type:Number, default:3}
    
    //trim brise prazna mesta sa pocetka i kraja stringa pre nego sto ga
    //sacuva u bazi
}, { versionKey: false });

export default mongoose.model('ProstorModel', prostorSchema, 'prostori');