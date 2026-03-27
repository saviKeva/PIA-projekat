import mongoose from "mongoose";

const Schema = mongoose.Schema;

const reviewSchema = new mongoose.Schema({
    prostor_id: String,
    kor_ime: String,
    tekst: String,
    tip: String, //tip moze biti like,dislike ili comment
    datum: {type: Date, default:Date.now}
}, {versionKey:false});

export default mongoose.model('ReviewModel', reviewSchema,'recenzije');