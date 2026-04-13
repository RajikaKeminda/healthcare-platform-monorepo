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
  if (!process.env.EMAIL_USER) {
    console.log(`[DEV] Email would be sent to ${to}: ${subject}`);
    return { messageId: 'dev_mock' };
  }
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Healthcare Platform <noreply@healthcare.com>',
    to,
    subject,
    html,
    text,
  };
  return transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };
