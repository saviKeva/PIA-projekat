import { Request, Response, NextFunction } from 'express';
import { UserController } from '../controlers/user.controller';   // controlers, ne controllers
import { upload, validateImageDimensions } from '../config/multer-config';
import { Router, RequestHandler } from 'express';
// ... importi kontrolera i upload-a

const userRouter = Router();
const ctrl = new UserController();

//login
userRouter.post('/login', (req, res) =>{ ctrl.login(req, res)}); 

//register
userRouter.post('/register', [
    upload.single('slika'),
    validateImageDimensions as RequestHandler 
], (req: Request, res: Response) => { 
    ctrl.register(req, res); 
});

// admin rute
userRouter.get('/pending-requests', (req, res) => ctrl.getAllPending(req, res));
userRouter.post('/process-request', (req, res) => {ctrl.approveOrReject(req, res)});
userRouter.get('/getAllUsers', (req,res)=>{ctrl.getAllUsers(req,res)});

//login zaboravljena lozinka
userRouter.post('/forgot-password', (req, res) => {ctrl.forgotPassword(req, res)}); 
userRouter.post('/reset-password', (req, res) => {ctrl.resetPassword(req, res)}); 
//dohvatanje user-a
userRouter.post('/get-user', (req, res) => {ctrl.getUser(req, res)});

//clan mreze - izmena podataka
userRouter.post('/promeniPodatak', (req, res) => {ctrl.promeniPodatak(req, res)});
userRouter.post('/update-profile-image', [
    upload.single('slika'), //slika je naziv polja koji se salje sa front-a
    validateImageDimensions as RequestHandler
], (req:Request, res:Response) => {
    ctrl.updateProfileImage(req, res)});
userRouter.post('/change-password', (req, res) => {ctrl.changePassword(req,res)});

//deo za rezervacije
userRouter.get('/reservations/:kor_ime',(req,res)=>ctrl.getReservationForUser(req,res));
userRouter.delete('/reservations/cancel/:id',(req,res)=>{ctrl.cancel(req,res)});

userRouter.get('/getRezervacijeForManager/:kor_ime', (req,res)=>{
    ctrl.getRezervacijeForManager(req,res);
});

userRouter.get('/getRezervacijeSve/:kor_ime', (req,res)=>{
    ctrl.getRezervacijeSve(req,res);
});


userRouter.get('/getProstoriForManager/:kor_ime', (req,res)=>{
    ctrl.getProstoriForManager(req,res);
})

userRouter.post('/cancel-manager/reservations', (req,res)=>{
    ctrl.cancelManager(req,res);
})

userRouter.post('/potvrdiRezervaciju/reservations', (req,res)=>{
    ctrl.potvrdiRezervaciju(req,res);
})

//admin delete user
userRouter.post('/process-deleteUser', (req,res)=>{
    ctrl.adminDelete(req,res);
})

userRouter.get('/getStatistics/:godina', (req,res)=>{
    ctrl.getStatistics(req,res);
})

export default userRouter;