import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';
import fs from 'fs/promises';

//imam dva storage -a, jedan je za fajlove a drugi za slike
const storage = multer.diskStorage({
    destination: (req: Request, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req: Request, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

//storage za json fajlove
const jsonStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads_jsons/');
    },
    filename: (req, file, cb) => {
        //generisanje imena
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e8);
        cb(null, 'config-' + uniqueSuffix + '.json');
    }
});


const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(new Error('Dozvoljeni su samo JPG i PNG fajlovi!'));
    }
};

export const upload = multer({
    storage,
    limits: { fileSize: 3 * 1024 * 1024 },
    fileFilter,
});   


export const uploadJSON = multer({
    storage: jsonStorage, // ← OVDE si ga povezala sa 'uploads_jsons' folderom
    fileFilter: (req, file, cb) => {
        if (file.originalname.endsWith('.json')) {
            cb(null, true);
        } else {
            cb(new Error('Dozvoljeni su samo JSON fajlovi!') as any, false);
        }
    }
});

// dodatna middleware funkcija za proveru dimenzija (pozovi posle upload-a)
export const validateImageDimensions = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // ako Multer nije upload-ovao fajl (npr. nije poslat ili greška ranije) preskacem
    if (!req.file) {
        return next();
    }

    try {
        const metadata = await sharp(req.file.path).metadata();

        // dimenzije slike
        if (
            !metadata.width ||
            !metadata.height ||
            metadata.width < 100 ||
            metadata.width > 300 ||
            metadata.height < 100 ||
            metadata.height > 300
        ) {
            // brisanje - nevalidan fajl 
            await fs.unlink(req.file.path).catch(() => {
                console.warn(`Nije uspelo brisanje nevalidne slike: ${req.file?.path}`);
            });

            return res.status(400).json({
                message: 'Slika mora biti između 100×100 i 300×300 piksela (širina i visina).',
            });
        }

        // nastavljam dalje
        next();
    } catch (err) {
        console.error('Greška pri proveri dimenzija slike:', err);

        // u slučaju greške brišem fajl da ne ostane neproveren
        if (req.file?.path) {
            await fs.unlink(req.file.path).catch(() => { });
        }

        return res.status(500).json({
            message: 'Greška pri proveri dimenzija slike. Pokušajte ponovo sa drugom slikom.',
        });
    }
};