# Vinebot Enterprise-Grade Automated MT5 Trading Platform

Vinebot is a high-security, production-ready, automated MetaTrader 5 (MT5) bot deployment and trading platform. It bridges algorithmic trading execution with a consumer-facing SaaS platform.

**Core Operations:** Subscribers select a subscription tier, securely link and encrypt their MetaTrader 5 (MT5) broker credentials, and our operations team provisions low-latency dedicated VPS instances to run expert advisors on their behalf.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 6, Tailwind CSS v4, Framer Motion, Lucide Icons, Recharts.
- **Backend**: Node.js, Express, TypeScript, JWT (`jsonwebtoken`), bcryptjs, AES-256-GCM Encryption (`crypto`), Nodemailer, Resend SDK.
- **Security & Hardening**: `express-rate-limit`, `helmet`, strict CORS protection.
- **Database**:
  - **Primary / Local**: Atomic, mutex-locked JSON file database engine (`vinebot_db.json`) with atomic tmp-file rename write protection.
  - **Production Relational**: PostgreSQL support via Sequelize ORM when `DATABASE_URL` is set.
- **Deployment & Hosting**: Vercel (Frontend SPA / Edge distribution) & Railway / Cloud Run (Node.js Express backend).
- **Payment Gateway**: Stripe & Paystack integrations.

---

## 🔒 Security & Scaling Hardening

1. **Rate Limiting (`express-rate-limit`)**:
   - All `/api/*` endpoints are protected by an express rate limiter enforcing a maximum of 100 requests per 15 minutes per IP address to prevent brute-force attacks and DDoS abuse.
2. **Security Headers (`helmet`)**:
   - Integrated Helmet middleware enforces security headers including XSS protection, MIME sniffing protection (`X-Content-Type-Options`), clickjacking protection (`X-Frame-Options`), and Strict-Transport-Security (HSTS).
3. **CORS Isolation**:
   - CORS is configured to strictly restrict cross-origin access to `process.env.FRONTEND_URL` / `process.env.CLIENT_URL` (defaulting to `https://vinebot-app.vercel.app`) along with local development ports.
4. **Database File Write Mutex & Atomic Locks**:
   - `vinebot_db.json` reads and writes are guarded by a write lock and atomic temporary file writes (`fs.renameSync`) to guarantee data integrity during concurrent request spikes.
5. **AES-256-GCM Credentials Encryption**:
   - All user MT5 passwords are encrypted symmetrically at rest using AES-256-GCM with unique 12-byte initialization vectors and authentication tags. Passwords are never sent back in REST responses.
6. **Dual JWT Token Authentication**:
   - Short-lived Access Tokens (1 hour) paired with Refresh Tokens (30 days) stored in HTTP-only, Secure cookies and localStorage.

---

## 🔑 Environment Variables Setup Guide

Create a `.env` file in the root directory for local development, or set these variables in Railway and Vercel:

### Backend Environment Variables (Railway / Cloud Run)

```env
# Server Runtime
PORT=3000
NODE_ENV=production

# Frontend Application Origin (CORS & Email Links)
FRONTEND_URL=https://vinebot-app.vercel.app
CLIENT_URL=https://vinebot-app.vercel.app

# JWT Secrets
JWT_ACCESS_SECRET=your_production_jwt_access_secret_here
JWT_REFRESH_SECRET=your_production_jwt_refresh_secret_here

# Payment Gateway (Stripe & Paystack)
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PRICE_PRO=price_1TyWQWEAAe7A6uScDtJotb0V
VITE_STRIPE_PRICE_VIP=price_1TyWWuEAAe7A6uScQMi6hlWY

PAYSTACK_SECRET_KEY=sk_test_... (or sk_live_...)
PAYSTACK_PUBLIC_KEY=pk_test_... (or pk_live_...)

# Email Notifications (Resend API or SMTP)
RESEND_API_KEY=re_...
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_...
SMTP_FROM=onboarding@resend.dev

# Database (Optional PostgreSQL override)
DATABASE_URL=postgres://user:password@host:5432/dbname
```

### Frontend Environment Variables (Vercel)

```env
VITE_API_URL=https://vinebot-backend.up.railway.app
VITE_STRIPE_PRICE_PRO=price_1TyWQWEAAe7A6uScDtJotb0V
VITE_STRIPE_PRICE_VIP=price_1TyWWuEAAe7A6uScQMi6hlWY
VITE_PAYSTACK_PUBLIC_KEY=pk_live_...
```

---

## 🚀 Production Deployment Guide

### 1. Switching Payment Gateways to Live Mode (Stripe / Paystack)
- **Paystack**:
  1. Login to your Paystack Dashboard.
  2. Toggle the switch from **Test Mode** to **Live Mode**.
  3. Copy your `sk_live_...` Secret Key and `pk_live_...` Public Key.
  4. Update `PAYSTACK_SECRET_KEY` in Railway/backend environment variables to `sk_live_...`.
  5. Update `PAYSTACK_PUBLIC_KEY` in Vercel/frontend environment variables to `pk_live_...`.
- **Stripe**:
  1. Toggle Stripe Dashboard to **Live Mode**.
  2. Obtain `sk_live_...` and configure `STRIPE_SECRET_KEY`.
  3. Set up Webhook Endpoint pointing to `https://your-backend.railway.app/api/payments/webhook` listening for `checkout.session.completed`.

### 2. Deploying Backend to Railway
1. Connect your GitHub repository to Railway.
2. Select the repository and choose **Deploy from Repo**.
3. Add environment variables listed in the Backend section above.
4. Set build command: `npm run build` and start command: `npm run start`.

### 3. Deploying Frontend to Vercel
1. Import repository into Vercel.
2. Set Environment Variables (`VITE_API_URL` pointing to your Railway URL).
3. Build Command: `npm run build`, Output Directory: `dist`.

---

## 📡 API Endpoint Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register new user account with email verification.
- `POST /api/auth/login` — Login with password credentials.
- `POST /api/auth/magic-link` — Request passwordless magic link email.
- `POST /api/auth/verify-magic-link` — Verify magic link token and authenticate session.
- `POST /api/auth/refresh` — Refresh access token using valid refresh token.
- `POST /api/auth/logout` — Revoke refresh token and invalidate session.

### MetaTrader 5 Account Management (`/api/mt5`)
- `GET /api/mt5` — Retrieve linked MT5 account metadata (passwords masked).
- `POST /api/mt5` — Encrypt and link new MT5 credentials (triggers operations email).
- `DELETE /api/mt5` — Unlink MT5 account and wipe credentials from active vault.

### Billing & Payments (`/api/payments`)
- `GET /api/plans` — Fetch active subscription plans.
- `POST /api/payments/checkout` — Initialize Stripe/Paystack checkout session.
- `POST /api/payments/webhook` — Stripe webhook receiver for automated subscription fulfillment.
- `POST /api/payments/confirm` — Manual payment confirmation fallback endpoint.
- `GET /api/payments/subscription` — Retrieve current user subscription status.

### Bot Activation & Timeline (`/api/bot-activation`)
- `GET /api/bot-activation` — Get user bot activation timeline and deployment status.
- `POST /api/bot-activation` — Submit request to queue trading bot for VPS deployment.

### Admin Controls (`/api/admin/*`)
- `GET /api/admin/stats` — Admin dashboard summary statistics.
- `GET /api/admin/users` — List registered users with live subscription and MT5 status.
- `PUT /api/admin/users/:id` — Update user parameters (verified, role, bot status).
- `GET /api/admin/mt5-accounts` — Operations desk view of linked MT5 accounts.
- `POST /api/admin/activate-bot` — Toggle bot execution state (ACTIVE / PAUSED).

---

## 🧪 CI/CD Workflow

The repository includes a GitHub Actions workflow `.github/workflows/deploy-check.yml` that automatically runs on every `push` or `pull_request` to `main`:
1. Installs clean dependencies via `npm ci`.
2. Runs TypeScript type checking via `npm run lint` (`tsc --noEmit`).
3. Verifies full production bundle compilation via `npm run build`.

---

## 🛠️ Local Development Commands

```bash
# Install dependencies
npm install

# Start development server (Port 3000)
npm run dev

# Run TypeScript type checks
npm run lint

# Compile production bundle
npm run build

# Start production server
npm run start
```
