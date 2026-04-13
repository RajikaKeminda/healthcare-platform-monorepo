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
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: 'Too many requests' });
app.use(limiter);

const services = {
  PATIENT: process.env.PATIENT_SERVICE_URL || 'http://localhost:3001',
  DOCTOR: process.env.DOCTOR_SERVICE_URL || 'http://localhost:3002',
  APPOINTMENT: process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3003',
  TELEMEDICINE: process.env.TELEMEDICINE_SERVICE_URL || 'http://localhost:3004',
  PAYMENT: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005',
  NOTIFICATION: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006',
  AI_SYMPTOM: process.env.AI_SYMPTOM_SERVICE_URL || 'http://localhost:3007',
};

const proxy = (target) => createProxyMiddleware({ target, changeOrigin: true, on: {
  error: (err, req, res) => {
    console.error(`Proxy error to ${target}:`, err.message);
    res.status(502).json({ message: 'Service temporarily unavailable', service: target });
  }
}});

app.use('/api/patients/auth', proxy(services.PATIENT));
app.use('/api/patients', proxy(services.PATIENT));
app.use('/api/doctors/auth', proxy(services.DOCTOR));
app.use('/api/doctors', proxy(services.DOCTOR));
app.use('/api/appointments', proxy(services.APPOINTMENT));
app.use('/api/sessions', proxy(services.TELEMEDICINE));
app.use('/api/payments', proxy(services.PAYMENT));
app.use('/api/notifications', proxy(services.NOTIFICATION));
app.use('/api/symptoms', proxy(services.AI_SYMPTOM));

app.use('/api/auth/patient', proxy(services.PATIENT));
app.use('/api/auth/doctor', proxy(services.DOCTOR));

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
