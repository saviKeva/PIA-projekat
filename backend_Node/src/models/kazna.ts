import mongoose from 'mongoose';

const kazneSchema = new mongoose.Schema({
    kor_ime:{type:String, required:true},
    prostor_id:{type:String, required:true},
    menadzer_kor_ime:{type:String, required:true},
    datum:{type:Date,default:Date.now},

},{versionKey:false});

export default mongoose.model('KaznaModel', kazneSchema, 'kazne');