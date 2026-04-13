const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

const environment = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID || 'test_client_id';
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || 'test_client_secret';

  if (process.env.PAYPAL_MODE === 'live') {
    return new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret);
  }
  return new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
};

const client = () => new checkoutNodeJssdk.core.PayPalHttpClient(environment());

module.exports = { client };
