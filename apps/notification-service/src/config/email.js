const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[DEV] Email would be sent to ${to}: ${subject}`);
    return { messageId: 'dev_mock' };
  }

  // Gmail requires the "from" address to exactly match the authenticated account.
  // Using a mismatched display-only address like "noreply@healthcare.com" causes
  // authentication failures. Always send from the real Gmail account.
  const from = `HealthCare+ <${process.env.EMAIL_USER}>`;

  const mailOptions = { from, to, subject, html, text };
  return transporter.sendMail(mailOptions);
};

module.exports = { sendEmail, transporter };
