================================================================================
  HealthCare+ — AI-Enabled Smart Healthcare Platform
  Deployment Guide
================================================================================

  Services:
    - API Gateway          (Port 3000)
    - Patient Service      (Port 3001)
    - Doctor Service       (Port 3002)
    - Appointment Service  (Port 3003)
    - Telemedicine Service (Port 3004)
    - Payment Service      (Port 3005)
    - Notification Service (Port 3006)
    - AI Symptom Checker   (Port 3007)
    - Web App (Next.js)    (Port 3100)
    - MongoDB              (Port 27017)

================================================================================
  PREREQUISITES
================================================================================

  Make sure the following are installed on your machine:

    - Node.js 20+           https://nodejs.org
    - Docker Desktop        https://www.docker.com/products/docker-desktop
    - Docker Compose        (bundled with Docker Desktop)
    - kubectl               https://kubernetes.io/docs/tasks/tools
    - Git                   https://git-scm.com

  Third-party accounts required (free tiers available):
    - PayPal Developer      https://developer.paypal.com       (sandbox payments)
    - Agora                 https://console.agora.io           (video calls)
    - Gmail                 https://mail.google.com            (email notifications)
    - Twilio (optional)     https://console.twilio.com         (SMS notifications)
    - Google AI Studio      https://aistudio.google.com        (Gemini API key)


================================================================================
  OPTION A — LOCAL DEVELOPMENT (Docker Compose)  [Recommended for testing]
================================================================================

  STEP 1 — Clone the repository
  -----------------------------------------------------------------------
    git clone <repository-url>
    cd healthcare-platform-monorepo


  STEP 2 — Configure environment variables
  -----------------------------------------------------------------------
    Copy the example environment file and fill in your credentials:

      cp .env.example .env

    Open .env in a text editor and set the following values:

      PAYPAL_CLIENT_ID       = <your PayPal sandbox client ID>
      PAYPAL_CLIENT_SECRET   = <your PayPal sandbox client secret>
      AGORA_APP_ID           = <your Agora App ID>
      AGORA_APP_CERTIFICATE  = <your Agora App Certificate>
      EMAIL_HOST             = smtp.gmail.com
      EMAIL_PORT             = 587
      EMAIL_USER             = <your Gmail address>
      EMAIL_PASS             = <your Gmail App Password (not your login password)>
      TWILIO_ACCOUNT_SID     = <your Twilio Account SID>      (optional)
      TWILIO_AUTH_TOKEN      = <your Twilio Auth Token>        (optional)
      TWILIO_PHONE_NUMBER    = <your Twilio phone number>      (optional)
      GEMINI_API_KEY         = <your Google Gemini API key>    (optional)

    Note: The AI Symptom Checker works without a Gemini key — it will use
          the built-in rule-based fallback automatically.

    How to get a Gmail App Password:
      1. Go to your Google Account > Security
      2. Enable 2-Step Verification
      3. Go to Security > App Passwords
      4. Generate a new password and paste it as EMAIL_PASS


  STEP 3 — Build and start all services
  -----------------------------------------------------------------------
    docker-compose --env-file .env up --build

    This command will:
      - Pull the MongoDB image
      - Build Docker images for all 8 microservices and the web app
      - Start all containers on the healthcare-network bridge network

    Wait until you see all services print "running on port XXXX" messages.
    This may take 3–5 minutes on the first run.


  STEP 4 — Access the application
  -----------------------------------------------------------------------
    Web Frontend    →  http://localhost:3100
    API Gateway     →  http://localhost:3000
    Health Check    →  http://localhost:3000/health


  STEP 5 — Stop the application
  -----------------------------------------------------------------------
    Press Ctrl+C in the terminal, then run:

      docker-compose down

    To also remove stored data (MongoDB volume):

      docker-compose down -v


================================================================================
  OPTION B — KUBERNETES DEPLOYMENT  [Production / Staging]
================================================================================

  STEP 1 — Clone the repository
  -----------------------------------------------------------------------
    git clone <repository-url>
    cd healthcare-platform-monorepo


  STEP 2 — Build Docker images for all services
  -----------------------------------------------------------------------
    Run the following commands from the project root:

      docker build -t healthcare/api-gateway:latest         ./apps/api-gateway
      docker build -t healthcare/patient-service:latest     ./apps/patient-service
      docker build -t healthcare/doctor-service:latest      ./apps/doctor-service
      docker build -t healthcare/appointment-service:latest ./apps/appointment-service
      docker build -t healthcare/telemedicine-service:latest ./apps/telemedicine-service
      docker build -t healthcare/payment-service:latest     ./apps/payment-service
      docker build -t healthcare/notification-service:latest ./apps/notification-service
      docker build -t healthcare/ai-symptom-checker:latest  ./apps/ai-symptom-checker
      docker build -t healthcare/web-app:latest             ./client/web-app

    If using a remote registry (e.g. Docker Hub or AWS ECR), tag and push:

      docker tag  healthcare/api-gateway:latest <your-registry>/api-gateway:latest
      docker push <your-registry>/api-gateway:latest
      (repeat for each service)

    Then update the image: fields in each k8s/*.yaml file to point to
    your registry before applying.


  STEP 3 — Update Kubernetes Secrets
  -----------------------------------------------------------------------
    Open k8s/secrets.yaml and replace the placeholder values with your
    real credentials:

      PAYPAL_CLIENT_ID
      PAYPAL_CLIENT_SECRET
      AGORA_APP_ID
      AGORA_APP_CERTIFICATE
      EMAIL_USER
      EMAIL_PASS
      TWILIO_ACCOUNT_SID
      TWILIO_AUTH_TOKEN
      TWILIO_PHONE_NUMBER
      GEMINI_API_KEY

    Do NOT commit k8s/secrets.yaml to a public repository.


  STEP 4 — Create the Kubernetes namespace
  -----------------------------------------------------------------------
    kubectl apply -f k8s/namespace.yaml


  STEP 5 — Apply ConfigMap and Secrets
  -----------------------------------------------------------------------
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/secrets.yaml


  STEP 6 — Deploy MongoDB
  -----------------------------------------------------------------------
    kubectl apply -f k8s/mongodb.yaml

    Wait for MongoDB to be ready before deploying services:

      kubectl get pods -n healthcare -w

    Wait until the mongodb pod shows STATUS = Running.


  STEP 7 — Deploy all microservices
  -----------------------------------------------------------------------
    kubectl apply -f k8s/patient-service.yaml
    kubectl apply -f k8s/doctor-service.yaml
    kubectl apply -f k8s/appointment-service.yaml
    kubectl apply -f k8s/telemedicine-service.yaml
    kubectl apply -f k8s/payment-service.yaml
    kubectl apply -f k8s/notification-service.yaml
    kubectl apply -f k8s/ai-symptom-checker.yaml
    kubectl apply -f k8s/api-gateway.yaml
    kubectl apply -f k8s/web-app.yaml

    Or apply everything at once:

      kubectl apply -f k8s/


  STEP 8 — Apply Horizontal Pod Autoscalers
  -----------------------------------------------------------------------
    kubectl apply -f k8s/hpa.yaml

    This enables auto-scaling:
      API Gateway       → 2 to 5 replicas (CPU threshold: 70%)
      Appointment Svc   → 2 to 5 replicas (CPU threshold: 70%)
      Patient Svc       → 2 to 4 replicas (CPU threshold: 70%)
      Doctor Svc        → 2 to 4 replicas (CPU threshold: 70%)


  STEP 9 — Apply Ingress (requires NGINX Ingress Controller)
  -----------------------------------------------------------------------
    Install NGINX Ingress Controller if not already present:

      kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml

    Then apply the ingress rules:

      kubectl apply -f k8s/ingress.yaml

    Add the following entry to your /etc/hosts file (Linux/macOS) or
    C:\Windows\System32\drivers\etc\hosts (Windows):

      127.0.0.1  healthcare.local

    Access the application at:

      http://healthcare.local           → Web Frontend
      http://healthcare.local/api       → API Gateway


  STEP 10 — Verify all pods are running
  -----------------------------------------------------------------------
    kubectl get pods -n healthcare
    kubectl get services -n healthcare
    kubectl get hpa -n healthcare

    All pods should show STATUS = Running and READY = 1/1 (or 2/2 if
    replicas have scaled).


  STEP 11 — Access via NodePort (alternative to Ingress)
  -----------------------------------------------------------------------
    If Ingress is not configured, access via NodePort:

      Web Frontend   →  http://<node-ip>:30100
      API Gateway    →  http://<node-ip>:30000

    Get your node IP:

      kubectl get nodes -o wide


  STEP 12 — Remove the deployment
  -----------------------------------------------------------------------
    kubectl delete -f k8s/
    kubectl delete namespace healthcare


================================================================================
  OPTION C — LOCAL DEVELOPMENT (Without Docker)
================================================================================

  Requires MongoDB running locally first:

    mongod --dbpath /tmp/mongodb

  Then open a separate terminal for each service and run:

    Terminal 1:  cd apps/patient-service      && npm install && npm run dev
    Terminal 2:  cd apps/doctor-service       && npm install && npm run dev
    Terminal 3:  cd apps/appointment-service  && npm install && npm run dev
    Terminal 4:  cd apps/telemedicine-service && npm install && npm run dev
    Terminal 5:  cd apps/payment-service      && npm install && npm run dev
    Terminal 6:  cd apps/notification-service && npm install && npm run dev
    Terminal 7:  cd apps/ai-symptom-checker   && npm install && npm run dev
    Terminal 8:  cd apps/api-gateway          && npm install && npm run dev
    Terminal 9:  cd client/web-app            && npm install && npm run dev

  Set environment variables for each service by creating a .env file
  inside each service folder based on the root .env.example.

  Access the application at:

    Web Frontend  →  http://localhost:3100
    API Gateway   →  http://localhost:3000


================================================================================
  TROUBLESHOOTING
================================================================================

  Problem:  A service shows "Service temporarily unavailable" (502)
  Fix:      The upstream microservice has not started yet. Wait a few
            seconds and retry. Check logs with:
              docker-compose logs <service-name>
              kubectl logs -n healthcare <pod-name>

  Problem:  MongoDB connection refused
  Fix:      Ensure MongoDB container/pod is running and healthy before
            starting microservices.

  Problem:  Email notifications not sending
  Fix:      Check that EMAIL_USER and EMAIL_PASS are set correctly.
            Ensure a Gmail App Password is used (not the account password).
            Check that "Less secure app access" restrictions are not blocking.

  Problem:  PayPal payment failing
  Fix:      Verify PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are from the
            sandbox environment at https://developer.paypal.com.
            Ensure PAYPAL_MODE=sandbox is set.

  Problem:  Agora video not connecting
  Fix:      Verify AGORA_APP_ID and AGORA_APP_CERTIFICATE are correct.
            In development without a certificate, the service returns a
            placeholder dev_token which allows testing the UI flow.

  Problem:  AI symptom checker returns basic results
  Fix:      This is expected behaviour when GEMINI_API_KEY is not set.
            The service uses the built-in rule-based fallback automatically.
            Set a valid Gemini API key to enable full AI analysis.

  Problem:  kubectl pods stuck in Pending state
  Fix:      Check available cluster resources:
              kubectl describe pod <pod-name> -n healthcare
            Common causes: insufficient CPU/memory, image pull errors.


================================================================================
  PORT REFERENCE
================================================================================

    Service                Port    NodePort (K8s)
    ─────────────────────────────────────────────
    Web App (Next.js)      3100    30100
    API Gateway            3000    30000
    Patient Service        3001    (internal only)
    Doctor Service         3002    (internal only)
    Appointment Service    3003    (internal only)
    Telemedicine Service   3004    (internal only)
    Payment Service        3005    (internal only)
    Notification Service   3006    (internal only)
    AI Symptom Checker     3007    (internal only)
    MongoDB                27017   (internal only)


================================================================================
  END OF DEPLOYMENT GUIDE
================================================================================
