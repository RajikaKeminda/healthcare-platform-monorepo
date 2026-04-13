const twilio = require('twilio');

const sendSMS = async ({ to, body }) => {
  if (!process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID === 'your_twilio_account_sid') {
    console.log(`[DEV] SMS would be sent to ${to}: ${body}`);
    return { sid: 'dev_mock' };
  }
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
};

module.exports = { sendSMS };
