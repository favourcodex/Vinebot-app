# Vinebot Enterprise-Grade SaaS Trading Platform

Vinebot is a modern, high-security, enterprise-grade subscription SaaS platform. It bridges qualitative quantitative automated trading and consumer-facing broker management. 

Our core directive: **The user does not execute trade parameters directly.** Instead, users subscribe, securely input and encrypt their MetaTrader 5 (MT5) credentials, and our background server administration provisions low-latency VPS instances to execute quantitative expert advisors on their behalf.

---

## 🏗️ Architectural Core

The platform utilizes a modern full-stack decoupled Architecture:

- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons, and Framer Motion layout state-routing.
- **Backend:** Node.js, Express, TypeScript, and cryptographically secure cryptographic libraries.
- **Relational Database:** Self-contained JSON-backed Relational Database engine (`vinebot_db.json`) preloaded with standard subscription plans, auditing logs, and pre-seeded administrative profiles.
- **Cryptosystem:** Secure AES-256-GCM passwords symmetric vault encryption and double JWT tokens (Access/Refresh) authorization.

---

## 🔒 Security & Cryptographic Specifications

1. **MT5 Password Encryption (AES-256-GCM):**
   - Credentials submitted by subscribers undergo instant symmetric encryption at the database layer.
   - Utilizes random 12-byte Initialization Vectors (IV) and a secure Auth Tag for ciphertext authentication.
   - Decrypted credentials remain localized within server memories and are completely omitted from client-facing REST API payloads.
   
2. **Double Token Auth (JWT):**
   - Standard logins yield a 1-hour access token and a 30-day refresh token.
   - Expired sessions automatically execute client-side logging out to secure broker credentials.

3. **Role-Based Authorization (RBAC):**
   - Endpoints in the `/api/admin/*` route namespace are secured with strict admin-token middleware checks.

---

## 🛠️ Commands & Running Locally

Ensure Node.js 18+ is installed.

### 1. Install dependencies
```bash
npm install
```

### 2. Launch Development server
```bash
npm run dev
```
The app mounts the Express backend on `http://localhost:3000` and proxies hot asset-rendering via Vite middleware.

### 3. Compile Production Bundle
```bash
npm run build
```
This builds React static files into `/dist` and compiles/bundles the server.ts TypeScript script into a single self-contained CommonJS file at `/dist/server.cjs` using `esbuild`.

### 4. Production Start
```bash
npm run start
```

### 5. Running with Docker Compose
```bash
docker compose up --build
```

---

## 💎 Premium Sandboxed Features

To allow immediate, risk-free interaction inside the AI Studio sandboxed preview frame:
- **Test Accounts Pre-loaded:**
  - **Demo User:** `user@vinebot.com` / `AdminPassword123!`
  - **Demo Admin:** `admin@vinebot.com` / `AdminPassword123!`
- **Stripe Sandbox Fallbacks:** Selecting subscription plans creates instant Stripe sessions, mock payment invoices, and securely updates bot timeline queues automatically without requiring external Stripe token integrations.
- **Audit Exports:** Download full CSV audit trails from the administrative logs.
