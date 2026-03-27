import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth : {
        user: "andjelandjasavic@gmail.com",
        pass: "xiic snjo stvb njio"
    }
});