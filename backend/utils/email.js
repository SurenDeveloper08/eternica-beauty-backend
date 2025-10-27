const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS,
    },
});

const sendContactEmail = async (to, name, email, phone, subject, message) => {
    // Email subject
    const templatePath = path.join(__dirname, '../templates/contact.html');

    if (!fs.existsSync(templatePath)) {
        console.error('❌ contact template not found:', templatePath);
        return;
    }

    let html = fs.readFileSync(templatePath, 'utf-8');
    html = html.replace(/{{name}}/g, name)
        .replace(/{{email}}/g, email)
        .replace(/{{phone}}/g, phone)
        .replace(/{{subject}}/g, subject)
        .replace(/{{message}}/g, message);

    const mailOptions = {
        from: `"Eternica Beauty" <${process.env.SMTP_EMAIL}>`,
        to,
        subject: `Eternica Beauty: New Message from ${name}`,
        html,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendContactEmail;
