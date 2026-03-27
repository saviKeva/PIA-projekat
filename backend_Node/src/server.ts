import express, { Router } from 'express'
import cors from 'cors'
import mongoose from 'mongoose';
import multer, { FileFilterCallback } from 'multer';
import userRouter from './routes/user.routes';
import User from './models/user';
import * as bcrypt from 'bcryptjs';
import prostoriRouter from './routes/prostor.routes';

const app = express()
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/projekat")
const connection = mongoose.connection;
connection.once('open', async () => {
    console.log("db connection ok")

    await seedAdmin();
})
// const upload = multer({
//     dest: './uploads/',
//     limits: {
//         fileSize: 1_000_000, // 1MB
//     },
//     fileFilter: (req: express.Request, file: Express.Multer.File, cb: FileFilterCallback) => {
//         if (!file.originalname.endsWith('.jpg')) {
//             return cb(new Error('File format is incorrect'));
//         }
//         cb(null, true);
//     },
// });

const router = Router()
router.use('/users', userRouter)
router.use('/prostori', prostoriRouter)
app.use('/', router)
app.use('/uploads', express.static('uploads'));
app.listen(4000, () => console.log('Express running on port 4000'))

async function seedAdmin() {
    const adminExists = await User.findOne({ tip: 'admin' });
    if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123!', 10);
        const admin = new User({
            kor_ime: 'admin',
            lozinka: hashedPassword,
            ime: 'Sistem',
            prezime: 'Administrator',
            mejl: 'admin@hub.rs',
            tel: '000000',
            tip: 'admin',
            status: 'active'
        });
        await admin.save();
        console.log("Admin nalog je uspešno kreiran: admin / admin123!");
    }
}