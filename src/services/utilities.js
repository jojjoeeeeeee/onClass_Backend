const nodemailer = require('nodemailer');
const path = require('path');

const mailer = (to,subject,html) => {
    let transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: "onclass.service@gmail.com",
            pass: "ifffblhsfxqvmxao"
        }
    });

    let mailOptions = {
        from: 'onclass.service@gmail.com',
        to: to,
        subject: `onClass(). - ${subject}`,
        html: html,
        attachments: [
            {
                filename: 'onClassLogo.png',
                path: path.join(__dirname, '../../public/img/app_logo.png'),
                cid: 'onClassLogo'
            }
        ]
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error.message);
        }
        console.log(`success send email`)
    });
};

exports.mailer = mailer;