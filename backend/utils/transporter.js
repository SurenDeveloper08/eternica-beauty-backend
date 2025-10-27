// backend/utils/transporter.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,  
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_EMAIL, // example: Sales@eternicabeauty.com
    pass: process.env.SMTP_PASS,   // Gmail app password (not your login)
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP connection failed:", error.message);
  } else {
    console.log("✅ SMTP server ready to send emails");
  }
});

export default transporter;
