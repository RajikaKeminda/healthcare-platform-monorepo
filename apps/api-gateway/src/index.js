require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'] }));
app.use(morgan('combined'));
// Do NOT add express.json() — it consumes the body stream before
// the proxy can pipe it upstream, causing 408 / request-aborted errors.

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: 'Too many requests' });
app.use(limiter);

const services = {
  PATIENT:      process.env.PATIENT_SERVICE_URL      || 'http://localhost:3001',
  DOCTOR:       process.env.DOCTOR_SERVICE_URL       || 'http://localhost:3002',
  APPOINTMENT:  process.env.APPOINTMENT_SERVICE_URL  || 'http://localhost:3003',
  TELEMEDICINE: process.env.TELEMEDICINE_SERVICE_URL || 'http://localhost:3004',
  PAYMENT:      process.env.PAYMENT_SERVICE_URL      || 'http://localhost:3005',
  NOTIFICATION: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006',
  AI_SYMPTOM:   process.env.AI_SYMPTOM_SERVICE_URL   || 'http://localhost:3007',
};

// When app.use('/api/patients', middleware) is called, Express strips the
// '/api/patients' prefix from req.url before the middleware sees it.
// pathRewrite adds it back so the upstream service receives the full path.
const makeProxy = (target, mountPath) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (path) => mountPath + path,
    on: {
      error: (err, req, res) => {
        console.error(`Proxy error → ${target}: ${err.message}`);
        if (!res.headersSent) {
          res.status(502).json({ message: 'Service temporarily unavailable', service: target });
        }
      },
    },
  });

app.use('/api/patients',      makeProxy(services.PATIENT,      '/api/patients'));
app.use('/api/doctors',       makeProxy(services.DOCTOR,       '/api/doctors'));
app.use('/api/appointments',  makeProxy(services.APPOINTMENT,  '/api/appointments'));
app.use('/api/sessions',      makeProxy(services.TELEMEDICINE, '/api/sessions'));
app.use('/api/payments',      makeProxy(services.PAYMENT,      '/api/payments'));
app.use('/api/notifications', makeProxy(services.NOTIFICATION, '/api/notifications'));
app.use('/api/symptoms',      makeProxy(services.AI_SYMPTOM,   '/api/symptoms'));

// Proxy uploaded files (stored in patient-service) so the browser can reach
// http://localhost:3000/uploads/<filename> directly.
app.use('/uploads', makeProxy(services.PATIENT, '/uploads'));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    services: Object.keys(services).map(k => ({ name: k, url: services[k] })),
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'Healthcare Platform API Gateway', version: '1.0.0' });
});

app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
