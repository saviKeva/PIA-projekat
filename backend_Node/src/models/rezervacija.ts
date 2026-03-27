import mongoose from 'mongoose'

const Schema = mongoose.Schema;

let ReservationSchema = new Schema({
    kor_ime:{
        type:String,
        required: true,
        trim: true
    },
    prostor_id:{
        type:String,
        required:true
    },
    jedinica_id:{
        type:String,
        required:true
    },
    naziv:{
        type:String,
        required:true,
        trim:true,
        minlength:2
    },
    nazivProstora:{
        type:String,
        required:true,
        trim:true,
        minlength:2
    },
    grad:{
        type:String,
        required: true,
        trim:true
    },
    status:{
        type:String,
        default:'kreirana'
    },
    od:{
        type:Date,
        required:true
    },
    do:{
        type:Date,
        required:true
    }
},{
    versionKey: false
});

export default mongoose.model('ReservationModel', ReservationSchema, 'reservations');