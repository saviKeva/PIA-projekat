import { Request, Response, NextFunction } from 'express';
import { ProstorController } from '../controlers/prostor.controller';
import {Router, RequestHandler} from 'express';
import { upload, uploadJSON } from '../config/multer-config';

const prostoriRouter = Router();
const ctrl = new ProstorController();

prostoriRouter.get('/getActiveProstori', (req,res)=>ctrl.getAllActiveProstor(req,res));
prostoriRouter.get('/getTop5',(req,res)=>{ctrl.getTop5(req,res)});
prostoriRouter.get('/getReservationsForSpace/:prostor_id',(req,res)=>{ctrl.getReservationsForSpace(req,res)});
prostoriRouter.get('/getReservationsForSpaceClan/:prostor_id',(req,res)=>{ctrl.getReservationsForSpaceClan(req,res)});

prostoriRouter.route('/getProstorById').post(
    (req,res)=>{ctrl.getProstorById(req,res)}
)

prostoriRouter.post('/pretraga', (req,res) => {ctrl.pretraziProstore(req,res)});

//rezervacije dodavanje nove
prostoriRouter.post('/addReservation', (req,res) => {
    ctrl.addReservation(req,res);
});

prostoriRouter.post('/ostaviRecenziju', (req,res)=>{
    ctrl.ostaviRecenziju(req,res);
})

prostoriRouter.get('/getKomentari/:prostor_id', (req,res)=>{
    ctrl.getKomentari(req,res);
})





// DODAVANJE PROSTORA

prostoriRouter.post('/upload-from-json', uploadJSON.single('fajl'), (req,res)=>{
    ctrl.uploadFromJSON(req,res);
})

prostoriRouter.post('/addProstor', (req,res)=>{
    ctrl.addProstor(req,res);
})
prostoriRouter.post('/update-reservation-time', (req, res) => {
    ctrl.updateReservationTime(req, res);
});


// admin odobravanje prostora
prostoriRouter.post('/aproveSpace', (req,res)=>{
    ctrl.aproveSpace(req,res);
})

prostoriRouter.get('/getPendingProstori', (req,res)=>{
    ctrl.getPendingProstori(req,res);
})
export default prostoriRouter;