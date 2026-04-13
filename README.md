# HealthCare+ — AI-Enabled Smart Healthcare Platform

A cloud-native telemedicine platform built with microservices architecture. Patients can book appointments, attend video consultations (Agora), pay online (PayPal), upload medical reports, and use an AI symptom checker. Doctors can manage availability, conduct sessions, and issue digital prescriptions.

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           Next.js Web App (3100)                         │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    │ HTTP
                           ┌────────▼────────┐
                           │   API Gateway   │  Port 3000 (entry point)
                           └────────┬────────┘
                ┌───────────────────┼───────────────────┐
                │           ┌───────┼───────┐           │
                ▼           ▼       ▼       ▼           ▼
     ┌──────────────┐ ┌──────┐ ┌───────┐ ┌─────────┐ ┌────────┐
     │Patient Svc   │ │Doctor│ │Appt   │ │Telemed  │ │Payment │
     │Port 3001     │ │:3002 │ │:3003  │ │:3004    │ │:3005   │
     └──────┬───────┘ └──┬───┘ └───┬───┘ └────┬────┘ └───┬────┘
            │             │         │           │           │
     ┌──────┴─────────────┴─────────┴───────────┴───────────┴──────┐
     │                      MongoDB (27017)                          │
     └───────────────────────────────────────────────────────────────┘
                ┌────────────────┐  ┌─────────────────────┐
                │ Notification   │  │  AI Symptom Checker  │
                │ Svc :3006      │  │  :3007 (OpenAI)      │
                └────────────────┘  └─────────────────────┘
```

## Services

| Service               | Port | Database           | Description                             |
|-----------------------|------|--------------------|-----------------------------------------|
| api-gateway           | 3000 | —                  | Routes all requests to microservices    |
| patient-service       | 3001 | patient_db         | Auth, profile, reports, prescriptions   |
| doctor-service        | 3002 | doctor_db          | Auth, availability, prescriptions       |
| appointment-service   | 3003 | appointment_db     | Booking, status tracking                |
| telemedicine-service  | 3004 | telemedicine_db    | Agora video sessions                    |
| payment-service       | 3005 | payment_db         | PayPal sandbox payments                 |
| notification-service  | 3006 | notification_db    | Email (Nodemailer) + SMS (Twilio)       |
| ai-symptom-checker    | 3007 | symptom_db         | AI symptom analysis (OpenAI + fallback) |
| web-app (Next.js)     | 3100 | —                  | React frontend                          |

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- kubectl (for Kubernetes deployment)
- MongoDB (handled by Docker)

## Quick Start (Docker Compose)

### 1. Clone and configure

```bash
# Copy environment file
cp .env.example .env

# Fill in your credentials:
# - PAYPAL_CLIENT_ID + PAYPAL_CLIENT_SECRET (from PayPal Developer sandbox)
# - AGORA_APP_ID + AGORA_APP_CERTIFICATE (from console.agora.io)
# - EMAIL_USER + EMAIL_PASS (Gmail + App Password)
# - TWILIO_* (optional, SMS)
# - OPENAI_API_KEY (optional, AI uses built-in fallback if missing)
nano .env
```

### 2. Build and start all services

```bash
docker-compose --env-file .env up --build
```

### 3. Access the application

| URL                         | Description          |
|-----------------------------|----------------------|
| http://localhost:3100       | Web frontend         |
| http://localhost:3000       | API Gateway          |
| http://localhost:3000/health| Gateway health check |

## Development (without Docker)

Install and run each service individually:

```bash
# Start MongoDB locally first
mongod --dbpath /tmp/mongodb

# Terminal 1 — Patient Service
cd apps/patient-service && npm install && npm run dev

# Terminal 2 — Doctor Service
cd apps/doctor-service && npm install && npm run dev

# Terminal 3 — Appointment Service
cd apps/appointment-service && npm install && npm run dev

# Terminal 4 — Telemedicine Service
cd apps/telemedicine-service && npm install && npm run dev

# Terminal 5 — Payment Service
cd apps/payment-service && npm install && npm run dev

# Terminal 6 — Notification Service
cd apps/notification-service && npm install && npm run dev

# Terminal 7 — AI Symptom Checker
cd apps/ai-symptom-checker && npm install && npm run dev

# Terminal 8 — API Gateway
cd apps/api-gateway && npm install && npm run dev

# Terminal 9 — Frontend
cd client/web-app && npm install && npm run dev
```

## Kubernetes Deployment

### 1. Build Docker images

```bash
# Build all images
docker build -t healthcare/api-gateway:latest ./apps/api-gateway
docker build -t healthcare/patient-service:latest ./apps/patient-service
docker build -t healthcare/doctor-service:latest ./apps/doctor-service
docker build -t healthcare/appointment-service:latest ./apps/appointment-service
docker build -t healthcare/telemedicine-service:latest ./apps/telemedicine-service
docker build -t healthcare/payment-service:latest ./apps/payment-service
docker build -t healthcare/notification-service:latest ./apps/notification-service
docker build -t healthcare/ai-symptom-checker:latest ./apps/ai-symptom-checker
docker build -t healthcare/web-app:latest ./client/web-app
```

### 2. Update secrets

Edit `k8s/secrets.yaml` with your real API credentials, then apply:

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Apply ConfigMap and Secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# Deploy MongoDB
kubectl apply -f k8s/mongodb.yaml

# Deploy microservices (wait for MongoDB to be ready first)
kubectl apply -f k8s/patient-service.yaml
kubectl apply -f k8s/doctor-service.yaml
kubectl apply -f k8s/appointment-service.yaml
kubectl apply -f k8s/telemedicine-service.yaml
kubectl apply -f k8s/payment-service.yaml
kubectl apply -f k8s/notification-service.yaml
kubectl apply -f k8s/ai-symptom-checker.yaml
kubectl apply -f k8s/api-gateway.yaml
kubectl apply -f k8s/web-app.yaml

# Apply HPA (auto-scaling)
kubectl apply -f k8s/hpa.yaml

# Apply Ingress (requires nginx ingress controller)
kubectl apply -f k8s/ingress.yaml
```

### 3. Or apply everything at once

```bash
kubectl apply -f k8s/
```

### 4. Check deployment status

```bash
kubectl get pods -n healthcare
kubectl get services -n healthcare
kubectl get hpa -n healthcare
```

### 5. Access via NodePort

- Frontend: http://\<node-ip\>:30100
- API Gateway: http://\<node-ip\>:30000

### 6. Access via Ingress (add to /etc/hosts)

```
127.0.0.1  healthcare.local
```

Then visit: http://healthcare.local

## API Reference

### Authentication
All protected endpoints require: `Authorization: Bearer <token>`

### Patient Service (via gateway: /api/patients/...)

| Method | Endpoint                    | Auth     | Description                    |
|--------|-----------------------------|----------|--------------------------------|
| POST   | /api/patients/auth/register | Public   | Register patient                |
| POST   | /api/patients/auth/login    | Public   | Login patient                   |
| GET    | /api/patients/profile       | Patient  | Get own profile                 |
| PUT    | /api/patients/profile       | Patient  | Update profile                  |
| POST   | /api/patients/reports       | Patient  | Upload medical report           |
| GET    | /api/patients/reports       | Patient  | Get all reports                 |
| GET    | /api/patients/prescriptions | Patient  | Get all prescriptions           |
| GET    | /api/patients/admin/patients| Admin    | List all patients               |

### Doctor Service (via gateway: /api/doctors/...)

| Method | Endpoint                    | Auth     | Description                    |
|--------|-----------------------------|----------|--------------------------------|
| POST   | /api/doctors/auth/register  | Public   | Register doctor                 |
| POST   | /api/doctors/auth/login     | Public   | Login doctor                    |
| GET    | /api/doctors/search         | Public   | Search doctors by specialty     |
| GET    | /api/doctors/:id            | Public   | Get doctor details              |
| GET    | /api/doctors/profile/me     | Doctor   | Get own profile                 |
| PUT    | /api/doctors/profile/me     | Doctor   | Update profile                  |
| PUT    | /api/doctors/availability   | Doctor   | Set availability schedule       |
| POST   | /api/doctors/prescriptions  | Doctor   | Issue prescription              |
| PUT    | /api/doctors/admin/:id/verify| Admin   | Verify doctor                   |

### Appointment Service (via gateway: /api/appointments/...)

| Method | Endpoint                       | Auth     | Description                 |
|--------|--------------------------------|----------|-----------------------------|
| POST   | /api/appointments              | Patient  | Book appointment            |
| GET    | /api/appointments/patient/my   | Patient  | Get patient's appointments  |
| GET    | /api/appointments/doctor/my    | Doctor   | Get doctor's appointments   |
| GET    | /api/appointments/:id          | Auth     | Get appointment details     |
| PUT    | /api/appointments/:id/status   | Doctor   | Update appointment status   |
| PUT    | /api/appointments/:id/cancel   | Auth     | Cancel appointment          |

### Telemedicine Service (via gateway: /api/sessions/...)

| Method | Endpoint                          | Auth  | Description              |
|--------|-----------------------------------|-------|--------------------------|
| POST   | /api/sessions/token               | Auth  | Generate Agora RTC token |
| POST   | /api/sessions/:appointmentId/join | Auth  | Join session             |
| PUT    | /api/sessions/:appointmentId/end  | Auth  | End session              |

### Payment Service (via gateway: /api/payments/...)

| Method | Endpoint                              | Auth    | Description              |
|--------|---------------------------------------|---------|--------------------------|
| POST   | /api/payments/create-order            | Patient | Create PayPal order      |
| POST   | /api/payments/capture/:orderId        | Patient | Capture PayPal payment   |
| GET    | /api/payments/my                      | Patient | Get my payments          |
| GET    | /api/payments/appointment/:id         | Auth    | Get payment by appt      |

### AI Symptom Checker (via gateway: /api/symptoms/...)

| Method | Endpoint              | Auth     | Description              |
|--------|-----------------------|----------|--------------------------|
| POST   | /api/symptoms/check   | Optional | Analyze symptoms         |
| GET    | /api/symptoms/history | Auth     | Get symptom check history|

## Third-Party Service Setup

### PayPal Sandbox
1. Go to https://developer.paypal.com
2. Create a sandbox application
3. Copy Client ID and Secret to your `.env`

### Agora
1. Go to https://console.agora.io
2. Create a new project (enable App Certificate)
3. Copy App ID and App Certificate to your `.env`

### Gmail SMTP
1. Enable 2-Step Verification on your Google account
2. Go to Google Account → Security → App Passwords
3. Generate a new app password and use it as `EMAIL_PASS`

### Twilio (optional SMS)
1. Sign up at https://console.twilio.com
2. Copy Account SID and Auth Token
3. Get a Twilio phone number

## Security
- JWT authentication with 7-day token expiry
- Passwords hashed with bcrypt (10 rounds)
- Role-based access control (patient / doctor / admin)
- Rate limiting on API Gateway (200 req/15 min)
- CORS enabled for all origins (restrict in production)
- Secrets managed via Kubernetes Secrets / environment variables

## Project Structure

```
healthcare-platform-monorepo/
├── apps/
│   ├── api-gateway/         # Express proxy gateway (port 3000)
│   ├── patient-service/     # Patient management (port 3001)
│   ├── doctor-service/      # Doctor management (port 3002)
│   ├── appointment-service/ # Appointment booking (port 3003)
│   ├── telemedicine-service/# Agora video sessions (port 3004)
│   ├── payment-service/     # PayPal payments (port 3005)
│   ├── notification-service/# Email + SMS (port 3006)
│   └── ai-symptom-checker/  # AI health insights (port 3007)
├── client/
│   └── web-app/             # Next.js 14 frontend (port 3100)
├── k8s/                     # Kubernetes manifests
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   ├── mongodb.yaml
│   ├── *-service.yaml       # One per microservice
│   ├── api-gateway.yaml
│   ├── web-app.yaml
│   ├── ingress.yaml
│   └── hpa.yaml             # Horizontal Pod Autoscaler
├── docker-compose.yml       # Local development
├── .env.example             # Environment template
└── README.md
```
