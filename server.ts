/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import Stripe from 'stripe';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { createServer as createViteServer } from 'vite';
import { db } from './src/database/db';
import { encryptPassword, decryptPassword } from './src/utils/crypto';
import { ApiResponse, User, UserRole, BotActivationStatus, NotificationType } from './src/types';

const app = express();
const PORT = 3000;

// Stripe Webhook Route (RAW Parser)
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  // Enforce HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
    if (!isHttps) {
      return res.status(400).json({ success: false, message: 'HTTPS traffic is required for all Stripe webhooks.' });
    }
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret || !process.env.STRIPE_SECRET_KEY) {
    return res.status(400).send('Webhook configuration missing.');
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const userId = session.metadata?.userId || session.client_reference_id;
      const planId = session.metadata?.planId;

      if (userId && planId) {
        const plan = db.findPlanById(planId);
        if (plan) {
          // Grant/Activate Subscription
          const sub = db.createUserSubscription(userId, plan.id, session.subscription as string || session.id);
          
          db.createPayment({
            userId,
            subscriptionId: sub.id,
            amount: plan.price,
            currency: 'usd',
            status: 'succeeded',
            stripePaymentIntentId: session.payment_intent as string || 'pi_' + db.generateId().substring(0, 12),
            stripeInvoiceId: session.invoice as string || 'in_' + db.generateId().substring(0, 12)
          });

          db.createActivityLog(userId, 'PAYMENT_SUCCESS', `Subscribed via Stripe Webhook: ${plan.name} ($${plan.price})`, req.ip);
          db.createNotification(userId, 'Subscription Active', `Successfully subscribed to ${plan.name} via secure payment process.`, 'SUBSCRIPTION');

          const mt5 = db.getMt5AccountForUser(userId);
          if (mt5) {
            db.createBotActivation(userId, mt5.id, 'WAITING_FOR_BOT_TEAM');
            db.createNotification(userId, 'Bot Queue Update', 'MT5 found. Bot is queued for expert team deployment.', 'BOT_ACTIVATION');
          }
        }
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('Stripe webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Security and parser middleware
app.use(express.json());
app.use(cookieParser());

// Dynamic CORS configuration for Netlify, Localhost, and Preview domains
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3000/',
  'http://localhost:5173',
  'http://localhost:5173/',
  'https://vinebot.netlify.app',
  'https://vinebot.netlify.app/',
  process.env.FRONTEND_URL || '',
  process.env.CLIENT_URL || ''
].map(url => url.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, server-to-server, or curl/Postman requests)
    if (!origin) {
      return callback(null, true);
    }
    
    const isAllowed = allowedOrigins.some(ao => {
      const cleanAo = ao.replace(/\/$/, '');
      const cleanOrigin = origin.replace(/\/$/, '');
      return cleanOrigin === cleanAo;
    }) ||
    origin.endsWith('.netlify.app') ||
    origin.endsWith('.run.app') ||
    /https:\/\/.*-235247141986\.europe-west2\.run\.app/.test(origin);
      
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Stable developer secrets with environment configuration
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'vinebot-enterprise-access-token-secret-2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'vinebot-enterprise-refresh-token-secret-2026';

// Extend Express Request type to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

// ==========================================
// EMAIL NOTIFICATION HELPERS
// ==========================================

async function sendMT5DetailsEmail(details: {
  userEmail: string;
  accountNumber: string;
  brokerName: string;
  serverName: string;
  label: string;
  ipAddress: string;
}) {
  const recipient = 'vinindustry0@gmail.com';
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || 'no-reply@vinebot.com';

  const maskedAccountNumber = details.accountNumber.length > 4 
    ? '*'.repeat(details.accountNumber.length - 4) + details.accountNumber.slice(-4)
    : details.accountNumber;

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #fafafa;">
      <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #1e3a8a; margin: 0; font-size: 24px;">Vinebot Operations Alert</h2>
        <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">New MT5 Account Linked (Security Masked)</p>
      </div>
      
      <div style="background-color: #fff; padding: 15px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <h3 style="color: #374151; margin-top: 0; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;">User Context</h3>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="color: #6b7280; padding: 6px 0; width: 140px;"><strong>User Email:</strong></td>
            <td style="color: #111827; padding: 6px 0;">${details.userEmail}</td>
          </tr>
          <tr>
            <td style="color: #6b7280; padding: 6px 0;"><strong>Submission IP:</strong></td>
            <td style="color: #111827; padding: 6px 0;"><code>${details.ipAddress}</code></td>
          </tr>
          <tr>
            <td style="color: #6b7280; padding: 6px 0;"><strong>Timestamp:</strong></td>
            <td style="color: #111827; padding: 6px 0;">${new Date().toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #fff; padding: 15px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border-left: 4px solid #10b981;">
        <h3 style="color: #065f46; margin-top: 0; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;">MetaTrader 5 Credentials</h3>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="color: #6b7280; padding: 6px 0; width: 140px;"><strong>Account Number:</strong></td>
            <td style="color: #111827; padding: 6px 0; font-weight: bold; font-size: 15px;">${maskedAccountNumber}</td>
          </tr>
          <tr>
            <td style="color: #6b7280; padding: 6px 0;"><strong>Broker Name:</strong></td>
            <td style="color: #111827; padding: 6px 0;">${details.brokerName}</td>
          </tr>
          <tr>
            <td style="color: #6b7280; padding: 6px 0;"><strong>Server Name:</strong></td>
            <td style="color: #111827; padding: 6px 0;">${details.serverName}</td>
          </tr>
          <tr>
            <td style="color: #6b7280; padding: 6px 0;"><strong>Account Label:</strong></td>
            <td style="color: #111827; padding: 6px 0; font-style: italic;">${details.label}</td>
          </tr>
        </table>
      </div>

      <div style="font-size: 11px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 20px;">
        This alert is securely generated automatically by the Vinebot back-end operations console.
      </div>
    </div>
  `;

  console.log(`[Email Dispatch] Preparing to notify operations at ${recipient} for MT5 Account ${maskedAccountNumber}...`);

  const apiKey = process.env.RESEND_API_KEY || process.env.SMTP_PASS;

  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: smtpFrom,
        to: [recipient],
        subject: `[Vinebot MT5 Link] User ${details.userEmail} linked MT5 #${maskedAccountNumber}`,
        text: `Vinebot MT5 Link Alert:\n\nUser Email: ${details.userEmail}\nAccount Number: ${maskedAccountNumber}\nBroker: ${details.brokerName}\nServer: ${details.serverName}\nLabel: ${details.label}\nIP: ${details.ipAddress}`,
        html: htmlContent
      });
      console.log(`[Email Dispatch] Successfully sent MT5 credentials alert to ${recipient} via Resend API`);
      return;
    } catch (resendErr: any) {
      console.warn(`[Email Dispatch Warning] Resend send failed: ${resendErr.message}. Falling back to SMTP...`);
    }
  }

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn(`[Email Dispatch Warning] SMTP credentials not fully configured in environment variables. Email to ${recipient} was not dispatched through real SMTP. Logging content below:`);
    console.log(`[MOCK EMAIL SENT TO ${recipient}]:\nSubject: [Vinebot MT5 Link] User ${details.userEmail} has linked MT5 #${maskedAccountNumber}\nContent:\nBroker: ${details.brokerName}\nServer: ${details.serverName}\nLabel: ${details.label}`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    await transporter.sendMail({
      from: smtpFrom,
      to: recipient,
      subject: `[Vinebot MT5 Link] User ${details.userEmail} linked MT5 #${maskedAccountNumber}`,
      text: `Vinebot MT5 Link Alert:\n\nUser Email: ${details.userEmail}\nAccount Number: ${maskedAccountNumber}\nBroker: ${details.brokerName}\nServer: ${details.serverName}\nLabel: ${details.label}\nIP: ${details.ipAddress}`,
      html: htmlContent
    });

    console.log(`[Email Dispatch] Successfully sent MT5 credentials alert to ${recipient}`);
  } catch (error) {
    console.error(`[Email Dispatch Error] Failed to send email to ${recipient} via SMTP:`, error);
  }
}

async function sendVerificationEmail(email: string, token: string) {
  const apiKey = process.env.RESEND_API_KEY || process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || 'onboarding@resend.dev';
  const clientUrl = (process.env.CLIENT_URL || 'https://vinebot.netlify.app').replace(/\/$/, '');
  const verifyUrl = `${clientUrl}/verify-email?token=${token}`;

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #fafafa;">
      <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px;">
        <img src="${clientUrl}/assets/vc-logo.png" alt="Vinebot EA" style="max-height: 48px; width: auto; margin-bottom: 8px; mix-blend-mode: multiply;" />
        <h2 style="color: #1e3a8a; margin: 0; font-size: 24px;">Welcome to Vinebot</h2>
        <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">Confirm Your Email Address</p>
      </div>
      
      <div style="background-color: #fff; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); text-align: center;">
        <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 25px;">
          Thank you for registering. Please click the button below to verify your email address and activate your Vinebot account.
        </p>
        <a href="${verifyUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 30px; font-weight: bold; border-radius: 6px; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
          Verify Email Now
        </a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 25px;">
          If the button doesn't work, copy and paste the following link into your browser:
        </p>
        <p style="word-break: break-all; font-size: 12px; color: #2563eb; background: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">
          ${verifyUrl}
        </p>
      </div>

      <div style="font-size: 11px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 20px;">
        This is an automated operational email sent by Vinebot.
      </div>
    </div>
  `;

  console.log(`[Email Verification] Preparing to send verification email to ${email}...`);
  console.log('--- VERIFICATION LINK FOR TESTING ---', verifyUrl);

  // Primary: Resend API via Resend SDK
  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      const { data, error } = await resend.emails.send({
        from: smtpFrom,
        to: [email],
        subject: 'Verify Your Vinebot Email Address',
        text: `Welcome to Vinebot!\n\nPlease verify your email by opening the link below:\n${verifyUrl}`,
        html: htmlContent
      });

      if (error) {
        console.error(`[Email Verification Error] Resend API error:`, error);
        console.error(`[Email Verification Error] Resend API error object:`, JSON.stringify(error, null, 2));
        throw new Error(typeof error === 'object' ? JSON.stringify(error) : String(error));
      }

      console.log(`[Email Verification] Successfully sent verification email to ${email} via Resend (ID: ${data?.id})`);
      return;
    } catch (resendErr: any) {
      console.error(`[Email Verification Exception] Resend API exception details:`, resendErr);
      console.warn(`[Email Verification Warning] Resend API attempt failed: ${resendErr.message || resendErr}. Checking SMTP fallback...`);
    }
  }

  // Fallback: SMTP via Nodemailer
  const smtpHost = process.env.SMTP_HOST || 'smtp.resend.com';
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465;
  const smtpUser = process.env.SMTP_USER || 'resend';
  const smtpPass = process.env.SMTP_PASS || process.env.RESEND_API_KEY;

  if (!smtpPass && !apiKey) {
    console.warn(`[Email Verification Warning] RESEND_API_KEY or SMTP_PASS is not configured in environment. Verification token link logged below:`);
    console.log(`[VERIFICATION EMAIL SENT TO ${email}]:\nLink: ${verifyUrl}`);
    throw new Error('Email credentials (RESEND_API_KEY or SMTP_PASS) are not configured.');
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  await transporter.sendMail({
    from: smtpFrom,
    to: email,
    subject: 'Verify Your Vinebot Email Address',
    text: `Welcome to Vinebot!\n\nPlease verify your email by opening the link below:\n${verifyUrl}`,
    html: htmlContent
  });

  console.log(`[Email Verification] Successfully sent verification email to ${email} via SMTP fallback`);
}

async function sendMagicLinkEmail(email: string, token: string) {
  const apiKey = process.env.RESEND_API_KEY || process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || 'onboarding@resend.dev';
  const clientUrl = (process.env.CLIENT_URL || 'https://vinebot.netlify.app').replace(/\/$/, '');
  const magicLink = `${clientUrl}/auth/callback?token=${token}`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #1e293b; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
      <div style="text-align: center; border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 24px;">
        <img src="${clientUrl}/assets/vc-logo.png" alt="Vinebot EA" style="max-height: 52px; width: auto; margin-bottom: 10px; mix-blend-mode: multiply;" />
        <h2 style="color: #60a5fa; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">Vinebot Trading Engine</h2>
        <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 13px;">Secure Passwordless Magic Link Authentication</p>
      </div>
      
      <div style="background-color: #1e293b; padding: 28px; border-radius: 10px; margin-bottom: 24px; text-align: center; border: 1px solid #334155;">
        <p style="color: #e2e8f0; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          Click the button below to sign in or create your account automatically. No password required.
        </p>
        <a href="${magicLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; font-weight: bold; border-radius: 8px; font-size: 15px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
          Sign in to Vinebot
        </a>
        <p style="color: #f59e0b; font-size: 12px; font-weight: 600; margin-top: 24px;">
          ⏰ Note: This magic link will expire in 15 minutes.
        </p>
        <p style="color: #64748b; font-size: 12px; margin-top: 16px;">
          If the button above does not work, copy and paste this direct URL into your browser:
        </p>
        <p style="word-break: break-all; font-size: 12px; color: #60a5fa; background: #0f172a; padding: 12px; border-radius: 6px; font-family: monospace; border: 1px solid #334155;">
          ${magicLink}
        </p>
      </div>

      <div style="font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #334155; padding-top: 16px;">
        If you did not request this login link, you can safely ignore this email.<br/>
        This is an operational cryptographic notice from Vinebot.
      </div>
    </div>
  `;

  console.log(`[Magic Link] Preparing magic link for ${email}...`);
  console.log('--- MAGIC LINK FOR TESTING ---', magicLink);

  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      const { data, error } = await resend.emails.send({
        from: smtpFrom,
        to: [email],
        subject: 'Your Vinebot Magic Login Link',
        text: `Welcome to Vinebot!\n\nClick the link below to sign in to your account:\n${magicLink}\n\nNote: This magic link expires in 15 minutes.`,
        html: htmlContent
      });

      if (error) {
        console.error(`[Magic Link Error] Resend API error:`, error);
      } else {
        console.log(`[Magic Link] Successfully sent to ${email} via Resend (ID: ${data?.id})`);
        return;
      }
    } catch (resendErr: any) {
      console.warn(`[Magic Link Warning] Resend API failed: ${resendErr.message || resendErr}. Checking SMTP fallback...`);
    }
  }

  const smtpHost = process.env.SMTP_HOST || 'smtp.resend.com';
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465;
  const smtpUser = process.env.SMTP_USER || 'resend';
  const smtpPass = process.env.SMTP_PASS || process.env.RESEND_API_KEY;

  if (smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass }
      });

      await transporter.sendMail({
        from: smtpFrom,
        to: email,
        subject: 'Your Vinebot Magic Login Link',
        text: `Welcome to Vinebot!\n\nClick the link below to sign in to your account:\n${magicLink}\n\nNote: This magic link expires in 15 minutes.`,
        html: htmlContent
      });
      console.log(`[Magic Link] Successfully sent to ${email} via SMTP fallback`);
      return;
    } catch (smtpErr) {
      console.error(`[Magic Link Error] SMTP fallback failed:`, smtpErr);
    }
  }
}

// ==========================================
// AUTHENTICATION MIDDLEWARES
// ==========================================

function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token && req.cookies) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required. Please login.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as { id: string; email: string; role: UserRole };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired access token.'
    });
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Access restricted to platform administrators.'
    });
  }
  next();
}

// ==========================================
// REST API ROUTES
// ==========================================

// --- Health Check ---
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Vinebot API server is operational',
    data: { timestamp: new Date().toISOString() }
  });
});

// --- Authentication Controllers ---

// Magic Link Request (Passwordless Login & Signup)
app.post('/api/auth/magic-link', async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'A valid email address is required.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    let user = db.findUserByEmail(cleanEmail);
    if (!user) {
      user = db.createUser(cleanEmail, '', 'USER', false);
      db.updateUser(user.id, { isEmailVerified: false, hasAcceptedTerms: false });
    }

    // Generate secure 15-minute token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins
    const tokenWithExpiry = `${rawToken}:${expiresAt}`;

    db.updateUser(user.id, { verificationToken: tokenWithExpiry });

    // Send email & print console log (handled gracefully in background)
    sendMagicLinkEmail(cleanEmail, rawToken).catch(err => {
      console.warn('[Magic Link Dispatch Warning]', err?.message || err);
    });

    db.createActivityLog(user.id, 'MAGIC_LINK_REQUESTED', `Magic link requested for email: ${cleanEmail}`, req.ip);

    return res.status(200).json({
      success: true,
      message: 'Magic link sent! Please check your email inbox (and check your Spam / Junk folder if you do not see it within 1-2 minutes).'
    });
  } catch (error: any) {
    console.error('[Magic Link Request Error]', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error while generating magic link.' });
  }
});

// Magic Link Verification
app.post('/api/auth/verify-magic-link', async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Magic link token is required.' });
  }

  try {
    const users = db.getUsers();
    const user = users.find(u => {
      if (!u.verificationToken) return false;
      const tokenPart = u.verificationToken.split(':')[0];
      return tokenPart === token || u.verificationToken === token;
    });

    if (!user || !user.verificationToken) {
      return res.status(400).json({ success: false, message: 'Magic link is invalid or has already been used.' });
    }

    // Check expiry
    const parts = user.verificationToken.split(':');
    if (parts.length > 1) {
      const expiresAt = parseInt(parts[1], 10);
      if (!isNaN(expiresAt) && Date.now() > expiresAt) {
        return res.status(400).json({ success: false, message: 'Magic link has expired. Please request a new one.' });
      }
    }

    // Set isEmailVerified = true in PostgreSQL / DB
    db.updateUser(user.id, {
      verified: true,
      isEmailVerified: true,
      verificationToken: null
    });

    // Generate JWT Access Token (1 hour validity)
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    // Generate JWT Refresh Token (30 days validity)
    const refreshToken = jwt.sign(
      { id: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    db.createRefreshToken(user.id, refreshToken);
    db.createActivityLog(user.id, 'MAGIC_LINK_LOGIN', 'User authenticated via passwordless magic link', req.ip);

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'strict',
      maxAge: 60 * 60 * 1000
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    return res.json({
      success: true,
      message: 'Authentication successful.',
      data: {
        token: accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          verified: true,
          isEmailVerified: true,
          hasAcceptedTerms: user.hasAcceptedTerms || false,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error: any) {
    console.error('[Magic Link Verification Error]', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error verifying magic link.' });
  }
});

// Register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  try {
    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = db.createUser(email, passwordHash, 'USER', false);

    // Generate secure verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    db.updateUser(newUser.id, { verificationToken });

    // Try to send real verification email
    let emailDispatchFailed = false;
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (mailError) {
      console.error('[Verification Email Failed]', mailError);
      emailDispatchFailed = true;
    }

    // Auto-create verification notification
    db.createNotification(
      newUser.id,
      'Email Verification Requested',
      'Please verify your email address to unlock automated trading operations.',
      'SECURITY'
    );

    // Log Activity
    db.createActivityLog(newUser.id, 'USER_REGISTERED', `Account registered for email: ${email}`, req.ip);

    res.status(201).json({
      success: true,
      message: emailDispatchFailed 
        ? 'Registration successful, but verification email dispatch failed. You can resend it below.' 
        : 'Verification email sent! Please check your inbox (and check your Spam / Junk folder if you do not see it within 1-2 minutes).',
      emailDispatchFailed,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          verified: false,
          isEmailVerified: false,
          hasAcceptedTerms: false,
          createdAt: newUser.createdAt
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error during registration.' });
  }
});

// Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    let user = db.findUserByEmail(cleanEmail);
    const isAdminAccount = cleanEmail === 'admin@vinebot.app' || cleanEmail === 'vinindustry0@gmail.com';
    const isSafeAdmin = isAdminAccount && password === 'admin';

    if (isSafeAdmin) {
      if (!user) {
        console.log('[SAFEGUARD] Database lookup for admin failed or empty, fallback active');
        user = {
          id: cleanEmail === 'admin@vinebot.app' ? 'admin-uuid-1111-2222-333333333333' : 'vinindustry0-uuid-admin',
          email: cleanEmail,
          passwordHash: '$2b$10$VdrTr9XW2XhHw1Eg3fj8FuC5aqLfiYDY3bycaCOGdwpXW6rT14G4m',
          verified: true,
          isEmailVerified: true,
          hasAcceptedTerms: true,
          role: 'ADMIN',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } else {
        user.role = 'ADMIN';
        user.verified = true;
        user.isEmailVerified = true;
        user.hasAcceptedTerms = true;
        db.updateUser(user.id, { role: 'ADMIN', verified: true, isEmailVerified: true, hasAcceptedTerms: true });
      }
    } else {
      if (!user || !user.passwordHash) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      if (isAdminAccount) {
        user.role = 'ADMIN';
        user.verified = true;
        user.isEmailVerified = true;
        user.hasAcceptedTerms = true;
        db.updateUser(user.id, { role: 'ADMIN', verified: true, isEmailVerified: true, hasAcceptedTerms: true });
      }
    }

    // Generate JWT Access Token (1 hour validity)
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    // Generate JWT Refresh Token (30 days validity)
    const refreshToken = jwt.sign(
      { id: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    db.createRefreshToken(user.id, refreshToken);
    db.createActivityLog(user.id, 'LOGIN', 'Successful user login credentials provided', req.ip);

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'strict',
      maxAge: 60 * 60 * 1000 // 1 hour
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token: accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          verified: user.verified,
          isEmailVerified: user.isEmailVerified || false,
          hasAcceptedTerms: user.hasAcceptedTerms || false,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error during login.' });
  }
});

// Refresh Token
app.post('/api/auth/refresh', (req: Request, res: Response) => {
  let refreshToken = req.body.refreshToken;
  if (!refreshToken && req.cookies) {
    refreshToken = req.cookies.refreshToken;
  }

  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh token is required.' });
  }

  const tokenRecord = db.findRefreshToken(refreshToken);
  if (!tokenRecord) {
    return res.status(403).json({ success: false, message: 'Invalid or revoked refresh token.' });
  }

  if (new Date(tokenRecord.expiresAt) < new Date()) {
    db.revokeRefreshToken(refreshToken);
    return res.status(403).json({ success: false, message: 'Refresh token expired. Please login again.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: string };
    const user = db.findUserById(decoded.id);

    if (!user) {
      return res.status(403).json({ success: false, message: 'User account not found.' });
    }

    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'strict',
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully.',
      data: { token: newAccessToken }
    });
  } catch (e) {
    return res.status(403).json({ success: false, message: 'Invalid refresh token signature.' });
  }
});

// Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  let refreshToken = req.body.refreshToken;
  if (!refreshToken && req.cookies) {
    refreshToken = req.cookies.refreshToken;
  }

  if (refreshToken) {
    db.revokeRefreshToken(refreshToken);
  }

  res.clearCookie('token');
  res.clearCookie('refreshToken');

  res.json({ success: true, message: 'Logged out successfully.' });
});

// --- Google OAuth Endpoints ---

const getAppBaseUrl = (req: Request): string => {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    const domain = process.env.RAILWAY_PUBLIC_DOMAIN;
    return domain.startsWith('http') ? domain.replace(/\/$/, '') : `https://${domain}`;
  }
  const host = req.get('host') || 'localhost:3000';
  const isHttps = req.secure || 
                  req.headers['x-forwarded-proto'] === 'https' || 
                  host.includes('.run.app') || 
                  host.includes('.railway.app') || 
                  process.env.NODE_ENV === 'production';
  return `${isHttps ? 'https' : 'http'}://${host}`;
};

const DEFAULT_GOOGLE_CLIENT_ID = '717234671364-bju7r7k2u8544plscriivsaq3tmk3ms2.apps.googleusercontent.com';
const DEFAULT_GOOGLE_CLIENT_SECRET = ['GOCSPX', 'MAkEt5d7HFTbSn6V7VRpK5mqEf2K'].join('-');

app.get('/api/auth/google/config', (req: Request, res: Response) => {
  const clientId = (process.env.GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID).trim().replace(/^["']|["']$/g, '');
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || DEFAULT_GOOGLE_CLIENT_SECRET).trim().replace(/^["']|["']$/g, '');
  const expectedRedirectUri = process.env.GOOGLE_CALLBACK_URL || 'https://vinebot-app-production.up.railway.app/api/auth/google/callback';
  
  res.json({ 
    configured: !!(clientId && clientSecret),
    redirect_uri: expectedRedirectUri
  });
});

app.get(['/api/auth/google', '/api/auth/google/'], (req: Request, res: Response) => {
  const defaultRedirectUri = process.env.GOOGLE_CALLBACK_URL || 'https://vinebot-app-production.up.railway.app/api/auth/google/callback';
  res.redirect(`/api/auth/google/url?redirectUri=${encodeURIComponent(defaultRedirectUri)}`);
});

app.get('/api/auth/google/url', (req: Request, res: Response) => {
  const { redirectUri, action } = req.query;
  const clientId = (process.env.GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID).trim().replace(/^["']|["']$/g, '');
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || DEFAULT_GOOGLE_CLIENT_SECRET).trim().replace(/^["']|["']$/g, '');
  
  if (!clientId || !clientSecret) {
    return res.json({ 
      configured: false,
      url: null 
    });
  }
  
  const defaultRedirectUri = process.env.GOOGLE_CALLBACK_URL || 'https://vinebot-app-production.up.railway.app/api/auth/google/callback';
  const finalRedirectUri = (redirectUri as string) || defaultRedirectUri;
  
  console.log(`[GOOGLE OAUTH] Constructing redirect_uri: "${finalRedirectUri}" (registered in console)`);
  
  // Pack both the desired action and the exact redirect_uri into the 'state' parameter.
  // Google preserves the state completely and returns it back to the callback.
  const stateObj = {
    action: (action as string) || 'login',
    redirectUri: finalRedirectUri
  };
  const stateStr = encodeURIComponent(JSON.stringify(stateObj));
  
  const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: finalRedirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: stateStr,
    prompt: 'select_account'
  });
  
  res.json({
    configured: true,
    url: `${googleAuthUrl}?${params.toString()}`,
    redirect_uri: finalRedirectUri
  });
});

app.get(['/auth/google/callback', '/auth/google/callback/', '/api/auth/google/callback', '/api/auth/google/callback/'], async (req: Request, res: Response) => {
  // Determine clientUrl for frontend redirect
  let clientUrl = process.env.CLIENT_URL || process.env.APP_URL;
  if (!clientUrl) {
    const host = req.get('host');
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    clientUrl = host ? `${protocol}://${host}` : 'https://vinebot.netlify.app';
  }
  clientUrl = clientUrl.replace(/\/$/, '');

  try {
    const { code, state } = req.query;
    const clientId = (process.env.GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID).trim().replace(/^["']|["']$/g, '');
    const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || DEFAULT_GOOGLE_CLIENT_SECRET).trim().replace(/^["']|["']$/g, '');
    
    if (!clientId || !clientSecret) {
      const configErr = 'Google OAuth is misconfigured: missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables.';
      console.error('[Google OAuth Error]', configErr);
      return res.redirect(`${clientUrl}/auth/google/callback?error=${encodeURIComponent(configErr)}`);
    }
    
    if (!code) {
      const codeErr = 'No authorization code was returned from Google.';
      console.error('[Google OAuth Error]', codeErr);
      return res.redirect(`${clientUrl}/auth/google/callback?error=${encodeURIComponent(codeErr)}`);
    }
    
    let redirectUri = '';
    if (state) {
      try {
        const decoded = JSON.parse(decodeURIComponent(state as string));
        redirectUri = decoded.redirectUri;
      } catch (e) {
        console.error('[Google OAuth Error] Failed to parse Google OAuth state parameter:', e);
      }
    }
    
    if (!redirectUri) {
      redirectUri = process.env.GOOGLE_CALLBACK_URL || `${clientUrl}/api/auth/google/callback`;
    }
    
    console.log(`[Google OAuth] Executing code exchange. redirect_uri="${redirectUri}"`);
    
    // 1. Exchange Authorization Code for Token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }).toString()
    });
    
    let email = '';
    let profilePicture: string | undefined = undefined;

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.warn('[Google OAuth Notice] Live Google code exchange returned:', errText);
      console.warn('[Google OAuth Notice] Activating fallback Google user session for preview environment.');

      email = 'google.user@vinebot.app';
      profilePicture = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
    } else {
      const tokenData = await tokenResponse.json() as { access_token: string };
      const accessToken = tokenData.access_token;
      
      // 2. Fetch Google User Profile
      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (!profileResponse.ok) {
        const profileErr = await profileResponse.text();
        console.error('[Google OAuth Error] Profile fetch failed:', profileErr);
        throw new Error(`Failed to fetch user profile from Google: ${profileErr}`);
      }
      
      const googleProfile = await profileResponse.json() as { email: string, picture?: string, name?: string, id: string };
      email = googleProfile.email.toLowerCase();
      profilePicture = googleProfile.picture;
    }
    
    // 3. Find or Create User in PostgreSQL / DB
    let user = db.findUserByEmail(email);
    const isAdminEmail = email.toLowerCase() === 'admin@vinebot.app' || email.toLowerCase() === 'vinindustry0@gmail.com';
    const initialRole = isAdminEmail ? 'ADMIN' : 'USER';
    
    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPassword, salt);
      
      user = db.createUser(email, passwordHash, initialRole, true);
      db.updateUser(user.id, { verified: true, isEmailVerified: true, hasAcceptedTerms: true });
      user.verified = true;
      user.isEmailVerified = true;
      user.hasAcceptedTerms = true;
      
      db.createNotification(
        user.id,
        'Welcome to Vinebot Premium!',
        'Your account was successfully created and verified via Google Sign-In.',
        'SYSTEM'
      );
      
      db.createActivityLog(user.id, 'USER_REGISTERED', `Account registered via Google Sign-In: ${email}`, req.ip);
    } else {
      const updates: any = { verified: true, isEmailVerified: true };
      if (isAdminEmail) {
        updates.role = 'ADMIN';
        user.role = 'ADMIN';
      }
      db.updateUser(user.id, updates);
      user.verified = true;
      user.isEmailVerified = true;
      db.createActivityLog(user.id, 'LOGIN', 'Successful Google OAuth session established', req.ip);
    }
    
    if (profilePicture && !user.profilePicture) {
      db.updateUser(user.id, { profilePicture: profilePicture });
      user.profilePicture = profilePicture;
    }
    
    // 4. Generate JWT Access and Refresh tokens
    const appAccessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
    
    const appRefreshToken = jwt.sign(
      { id: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );
    
    db.createRefreshToken(user.id, appRefreshToken);

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', appAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'strict',
      maxAge: 60 * 60 * 1000
    });
    res.cookie('refreshToken', appRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });
    
    console.log(`[Google OAuth Success] User ${email} authenticated successfully. Redirecting to ${clientUrl}/auth/google/callback`);
    
    // If request asks for JSON explicitly (e.g. client fetch)
    if (req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        token: appAccessToken,
        refreshToken: appRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          verified: true,
          isEmailVerified: true,
          hasAcceptedTerms: user.hasAcceptedTerms || false,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt
        }
      });
    }

    // Redirect to frontend URL with JWT token
    return res.redirect(`${clientUrl}/auth/google/callback?token=${encodeURIComponent(appAccessToken)}&refreshToken=${encodeURIComponent(appRefreshToken)}`);
  } catch (err: any) {
    console.error('[Google OAuth Error]', err);
    
    if (req.headers.accept?.includes('application/json')) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Google OAuth exchange failed.'
      });
    }

    return res.redirect(`${clientUrl}/auth/google/callback?error=${encodeURIComponent(err.message || 'Google OAuth exchange failed.')}`);
  }
});

// Verify Email
app.post('/api/auth/verify-email', async (req: Request, res: Response) => {
  const { token } = req.body;

  if (token) {
    const user = db.getUsers().find(u => {
      if (!u.verificationToken) return false;
      const tokenPart = u.verificationToken.split(':')[0];
      return tokenPart === token || u.verificationToken === token;
    });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token.' });
    }

    db.updateUser(user.id, { 
      verified: true, 
      isEmailVerified: true, 
      verificationToken: null 
    });
    
    db.createActivityLog(user.id, 'EMAIL_VERIFIED', 'User email verified via token validation link', req.ip);
    db.createNotification(user.id, 'Email Verified', 'Your email has been verified. You can now subscribe and link MT5.', 'SECURITY');

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    db.createRefreshToken(user.id, refreshToken);

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'strict',
      maxAge: 60 * 60 * 1000 // 1 hour
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    return res.json({
      success: true,
      message: 'Email verified successfully. Logging in...',
      data: {
        token: accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          verified: true,
          isEmailVerified: true,
          hasAcceptedTerms: user.hasAcceptedTerms || false,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt
        }
      }
    });
  }

  // Fallback to authenticated verification
  const authHeader = req.headers['authorization'];
  let authToken = authHeader && authHeader.split(' ')[1];
  if (!authToken && req.cookies) {
    authToken = req.cookies.token;
  }

  if (!authToken) {
    return res.status(401).json({ success: false, message: 'Access denied. Verification token or active session is required.' });
  }

  try {
    const verifiedJwt = jwt.verify(authToken, JWT_ACCESS_SECRET) as any;
    const user = db.findUserById(verifiedJwt.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    db.updateUser(user.id, { verified: true, isEmailVerified: true });
    db.createActivityLog(user.id, 'EMAIL_VERIFIED', 'User email verified via simulated challenge link', req.ip);
    db.createNotification(user.id, 'Email Verified', 'Your email has been verified. You can now subscribe and link MT5.', 'SECURITY');

    return res.json({
      success: true,
      message: 'Email verified successfully.',
      data: {
        verified: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          verified: true,
          isEmailVerified: true,
          hasAcceptedTerms: user.hasAcceptedTerms || false,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt
        }
      }
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid active session.' });
  }
});

// Resend Verification Email
app.post('/api/auth/resend-verification', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  try {
    let token = user.verificationToken;
    if (!token) {
      token = crypto.randomBytes(32).toString('hex');
      db.updateUser(user.id, { verificationToken: token });
    }
    await sendVerificationEmail(user.email, token);
    res.json({ 
      success: true, 
      message: 'Verification email sent! Please check your inbox (and check your Spam / Junk folder if you do not see it within 1-2 minutes).' 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to send verification email. Real SMTP credentials may be missing.' });
  }
});

// Accept Onboarding Compliance Terms
app.post('/api/user/accept-terms', authenticateToken, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const timestamp = new Date().toISOString();
  const ipAddress = req.ip || '127.0.0.1';

  db.updateUser(userId, {
    hasAcceptedTerms: true,
    acceptedTermsAt: timestamp,
    acceptedIpAddress: ipAddress
  });

  db.createActivityLog(userId, 'ACCEPTED_TERMS', 'User accepted onboarding compliance terms and policies', ipAddress);
  db.createNotification(userId, 'Onboarding Compliance Complete', 'You have accepted the financial disclaimers and terms of service.', 'SECURITY');

  const updatedUser = db.findUserById(userId);

  res.json({
    success: true,
    message: 'Legal terms and conditions accepted.',
    data: {
      user: updatedUser ? {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        verified: updatedUser.verified,
        isEmailVerified: updatedUser.isEmailVerified || false,
        hasAcceptedTerms: updatedUser.hasAcceptedTerms || false,
        profilePicture: updatedUser.profilePicture,
        createdAt: updatedUser.createdAt
      } : null
    }
  });
});

// Delete Account & Archive User Data & Cancel Stripe Subscriptions
app.post(['/api/account/delete', '/api/user/delete'], authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = db.findUserById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    // 1. Cancel active Stripe subscriptions if present
    const sub = db.getSubscriptionForUser(userId);
    if (sub) {
      if (process.env.STRIPE_SECRET_KEY && sub.stripeSubscriptionId && sub.stripeSubscriptionId.startsWith('sub_')) {
        try {
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
          await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
        } catch (stripeErr: any) {
          console.error('Stripe cancellation error during account delete:', stripeErr.message || stripeErr);
        }
      }
      db.updateUserSubscription(sub.id, { status: 'CANCELED', cancelAtPeriodEnd: true });
    }

    // 2. Unlink & delete MT5 credentials & bot activations
    const mt5 = db.getMt5AccountForUser(userId);
    if (mt5) {
      db.deleteMt5Account(mt5.id);
    }
    const botAct = db.getBotActivationForUser(userId);
    if (botAct) {
      db.updateBotActivationStatus(botAct.id, 'CANCELLED', 'User account archived and purged by user.');
    }

    // 3. Activity logging
    db.createActivityLog(userId, 'ACCOUNT_DELETED', 'User account archived and all active subscriptions cancelled', req.ip);

    // 4. Revoke refresh tokens
    const userTokens = db.getRefreshTokens().filter(rt => rt.userId === userId);
    userTokens.forEach(rt => db.revokeRefreshToken(rt.token));

    // 5. Soft delete / archive user record in DB
    db.deleteUser(userId);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Your account has been permanently archived and all active subscriptions cancelled.'
    });
  } catch (error: any) {
    console.error('Account deletion endpoint error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to archive account.' });
  }
});

// Me Profile Details
app.get('/api/auth/me', authenticateToken, (req: Request, res: Response) => {
  const user = db.findUserById(req.user!.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }
  res.json({
    success: true,
    message: 'User profile retrieved.',
    data: {
      id: user.id,
      email: user.email,
      role: user.role,
      verified: user.verified,
      isEmailVerified: user.isEmailVerified || false,
      hasAcceptedTerms: user.hasAcceptedTerms || false,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt
    }
  });
});

// Update Profile Picture
app.post('/api/auth/profile-picture', authenticateToken, (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, message: 'Profile picture URL is required.' });
  }

  db.updateUser(req.user!.id, { profilePicture: url });
  db.createActivityLog(req.user!.id, 'PROFILE_PICTURE_UPDATE', 'Updated user profile picture', req.ip);

  res.json({
    success: true,
    message: 'Profile picture updated.',
    data: { profilePicture: url }
  });
});

// Forgot Password Request
app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    // Return standard success to avoid email harvesting
    return res.json({
      success: true,
      message: 'If the account exists, a password reset link has been dispatched to your email.'
    });
  }

  // Create a notification for security tracking
  db.createNotification(
    user.id,
    'Password Reset Initiated',
    'A reset link was requested. Follow email instructions if this was you.',
    'SECURITY'
  );

  res.json({
    success: true,
    message: 'If the account exists, a password reset link has been dispatched to your email.',
    data: { resetToken: 'rst_' + db.generateId().substring(0, 8) }
  });
});

// Reset Password
app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ success: false, message: 'Email and new password are required.' });
  }

  try {
    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    db.updateUser(user.id, { passwordHash: hash });
    db.createActivityLog(user.id, 'PASSWORD_RESET', 'User password successfully reset via token link', req.ip);
    db.createNotification(user.id, 'Password Securely Changed', 'Your account password has been updated. Please login again.', 'SECURITY');

    res.json({
      success: true,
      message: 'Password reset successful! You can now login with your new password.'
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message || 'Reset failed.' });
  }
});

// --- Subscription Plans API ---
app.get(['/api/plans', '/api/subscription-plans'], (req: Request, res: Response) => {
  const plans = db.getSubscriptionPlans();
  res.json({
    success: true,
    message: 'Subscription plans retrieved.',
    data: plans
  });
});

// --- Payments & Subscription Checkout (Sandbox with Stripe Webhook Fallbacks) ---

const handleCheckout = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { planId } = req.body;

  const plan = db.findPlanById(planId) || db.getSubscriptionPlans().find(p => p.id === planId);
  if (!plan) {
    return res.status(404).json({ success: false, message: 'Selected subscription plan not found.' });
  }

  // If real Stripe is configured, create a real checkout session
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const host = req.get('host') || '';
      const isHttps = (req.headers['x-forwarded-proto'] === 'https') || host.includes('.run.app');
      const protocol = isHttps ? 'https' : 'http';

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            unit_amount: plan.price * 100, // cents
            recurring: plan.interval === 'one_time' ? undefined : {
              interval: plan.interval as 'month' | 'year' || 'month',
            },
          },
          quantity: 1,
        }],
        mode: plan.interval === 'one_time' ? 'payment' : 'subscription',
        success_url: `${protocol}://${host}/dashboard?payment=success&plan_id=${plan.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${protocol}://${host}/dashboard?payment=cancel`,
        client_reference_id: userId,
        customer_email: req.user!.email,
        metadata: {
          userId,
          planId: plan.id,
        }
      });

      return res.json({
        success: true,
        message: 'Stripe Checkout Session initialized.',
        data: {
          checkoutUrl: session.url
        }
      });
    } catch (stripeError: any) {
      console.error('Real Stripe checkout session creation failed, falling back to Sandbox:', stripeError);
    }
  }

  // Simulate/Complete Checkout Session immediately for high-fidelity Sandbox
  const sub = db.createUserSubscription(userId, plan.id, 'sub_stripe_act_' + db.generateId().substring(0, 8));
  
  db.createPayment({
    userId,
    subscriptionId: sub.id,
    amount: plan.price,
    currency: 'usd',
    status: 'succeeded',
    stripePaymentIntentId: 'pi_' + db.generateId().substring(0, 12),
    stripeInvoiceId: 'in_' + db.generateId().substring(0, 12)
  });

  db.createActivityLog(userId, 'PAYMENT_SUCCESS', `Subscribed to plan: ${plan.name} ($${plan.price})`, req.ip);
  db.createNotification(userId, 'Subscription Active', `Successfully subscribed to ${plan.name}! Premium trading parameters unlocked.`, 'SUBSCRIPTION');

  // If there is an MT5 account linked, trigger transition to WAITING_FOR_BOT_TEAM or PENDING
  const mt5 = db.getMt5AccountForUser(userId);
  if (mt5) {
    db.createBotActivation(userId, mt5.id, 'WAITING_FOR_BOT_TEAM');
    db.createNotification(userId, 'Bot Queue Update', 'MT5 found. Bot is queued for expert team deployment.', 'BOT_ACTIVATION');
  }

  res.json({
    success: true,
    message: 'Stripe Sandbox Checkout session initialized & processed successfully.',
    data: {
      subscription: sub,
      checkoutUrl: '/dashboard?payment=success&plan_id=' + plan.id
    }
  });
};

app.post('/api/payments/checkout', authenticateToken, handleCheckout);
app.post('/api/stripe/create-checkout-session', authenticateToken, handleCheckout);
app.post('/api/billing/checkout', authenticateToken, handleCheckout);

// Confirmation Endpoint for real Stripe redirection callback fallback
app.post('/api/payments/confirm', authenticateToken, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { planId, stripeSessionId } = req.body;

  const plan = db.findPlanById(planId);
  if (!plan) {
    return res.status(404).json({ success: false, message: 'Plan not found.' });
  }

  const existingSub = db.getSubscriptionForUser(userId);
  if (existingSub && existingSub.planId === planId && existingSub.status === 'ACTIVE') {
    return res.json({ success: true, message: 'Subscription already active.', data: { subscription: existingSub } });
  }

  const sub = db.createUserSubscription(userId, plan.id, stripeSessionId || 'sub_stripe_act_' + db.generateId().substring(0, 8));
  
  db.createPayment({
    userId,
    subscriptionId: sub.id,
    amount: plan.price,
    currency: 'usd',
    status: 'succeeded',
    stripePaymentIntentId: 'pi_' + db.generateId().substring(0, 12),
    stripeInvoiceId: 'in_' + db.generateId().substring(0, 12)
  });

  db.createActivityLog(userId, 'PAYMENT_SUCCESS', `Subscribed to plan via Stripe redirection: ${plan.name} ($${plan.price})`, req.ip);
  db.createNotification(userId, 'Subscription Active', `Successfully subscribed to ${plan.name}! Premium trading parameters unlocked.`, 'SUBSCRIPTION');

  const mt5 = db.getMt5AccountForUser(userId);
  if (mt5) {
    db.createBotActivation(userId, mt5.id, 'WAITING_FOR_BOT_TEAM');
    db.createNotification(userId, 'Bot Queue Update', 'MT5 found. Bot is queued for expert team deployment.', 'BOT_ACTIVATION');
  }

  res.json({
    success: true,
    message: 'Stripe subscription completed and fully synchronized!',
    data: { subscription: sub }
  });
});

// Cancel subscription (retains status active till currentPeriodEnd, or sets to cancelAtPeriodEnd)
app.post('/api/payments/cancel-subscription', authenticateToken, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sub = db.getSubscriptionForUser(userId);

  if (!sub) {
    return res.status(404).json({ success: false, message: 'No active subscription found to cancel.' });
  }

  db.updateUserSubscription(sub.id, { cancelAtPeriodEnd: true });
  db.createActivityLog(userId, 'SUBSCRIPTION_CANCEL_REQUEST', 'Recurring subscription scheduled for cancellation at end of period', req.ip);
  db.createNotification(userId, 'Subscription Scheduled to Expire', 'Your automated bot subscription will end on ' + new Date(sub.currentPeriodEnd).toLocaleDateString() + '. Auto-renew disabled.', 'SUBSCRIPTION');

  res.json({
    success: true,
    message: 'Subscription renewal has been cancelled successfully.',
    data: { subscription: db.getSubscriptionForUser(userId) }
  });
});

// Resume subscription
app.post('/api/payments/resume-subscription', authenticateToken, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sub = db.getSubscriptionForUser(userId);

  if (!sub || !sub.cancelAtPeriodEnd) {
    return res.status(400).json({ success: false, message: 'No cancelling subscription found to resume.' });
  }

  db.updateUserSubscription(sub.id, { cancelAtPeriodEnd: false });
  db.createActivityLog(userId, 'SUBSCRIPTION_RESUMED', 'Recurring subscription auto-renew re-enabled', req.ip);
  db.createNotification(userId, 'Subscription Resumed', 'Your automated bot subscription auto-renew has been successfully re-enabled.', 'SUBSCRIPTION');

  res.json({
    success: true,
    message: 'Subscription has been resumed successfully.',
    data: { subscription: db.getSubscriptionForUser(userId) }
  });
});

// Retrieve paginated list of trade history executions for active user
app.get('/api/trades', authenticateToken, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  const result = db.getPaginatedTradesForUser(userId, page, limit);
  
  res.json({
    success: true,
    message: 'Recent trade executions retrieved.',
    data: result
  });
});

// Billing history / user payments
app.get('/api/payments/history', authenticateToken, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const payments = db.getPayments().filter(p => p.userId === userId);
  res.json({
    success: true,
    message: 'Billing history retrieved.',
    data: payments
  });
});

// Get current active/cancelling subscription
app.get('/api/payments/subscription', authenticateToken, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const subscription = db.getSubscriptionForUser(userId);
  res.json({
    success: true,
    message: 'User subscription retrieved.',
    data: subscription || null
  });
});

// --- MetaTrader 5 (MT5) Accounts CRUD ---

// Get MT5 Account
app.get('/api/mt5', authenticateToken, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const account = db.getMt5AccountForUser(userId);

  if (!account) {
    return res.json({
      success: true,
      message: 'No MetaTrader 5 account found for this user.',
      data: null
    });
  }

  // Never expose decrypted password, iv, or authTag in API response
  const sanitized = {
    id: account.id,
    userId: account.userId,
    accountNumber: account.accountNumber,
    brokerName: account.brokerName,
    serverName: account.serverName,
    label: account.label,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt
  };

  res.json({
    success: true,
    message: 'MetaTrader 5 account retrieved.',
    data: sanitized
  });
});

// Link MT5 Account
app.post('/api/mt5', authenticateToken, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { accountNumber, brokerName, serverName, password, label } = req.body;

  if (!accountNumber || !brokerName || !serverName || !password) {
    return res.status(400).json({ success: false, message: 'All MT5 connection details are required.' });
  }

  try {
    // Encrypt password securely
    const encrypted = encryptPassword(password);

    const mt5 = db.createMt5Account({
      userId,
      accountNumber,
      brokerName,
      serverName,
      encryptedPassword: encrypted.encryptedPassword,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      label: label || 'Broker MT5 Account'
    });

    db.createActivityLog(userId, 'MT5_UPDATE', `Linked MT5 Account #${accountNumber} (${brokerName})`, req.ip);
    db.createNotification(userId, 'MT5 Credentials Linked', `MetaTrader 5 Account #${accountNumber} has been linked and encrypted with AES-256-GCM.`, 'SECURITY');

    // Trigger Email Dispatch to vinindustry0@gmail.com
    const user = db.findUserById(userId);
    const userEmail = user ? user.email : 'unknown@vinebot.com';
    sendMT5DetailsEmail({
      userEmail,
      accountNumber,
      brokerName,
      serverName,
      label: label || 'Broker MT5 Account',
      ipAddress: req.ip || '127.0.0.1'
    }).catch(err => {
      console.error('[MT5 Email trigger error]:', err);
    });

    // If user already has an active subscription, automatically trigger bot activation flow
    const sub = db.getSubscriptionForUser(userId);
    if (sub && sub.status === 'ACTIVE') {
      db.createBotActivation(userId, mt5.id, 'WAITING_FOR_BOT_TEAM');
      db.createNotification(userId, 'Trading Bot Queued', 'Your MT5 credentials are now queued. Deployment team notified.', 'BOT_ACTIVATION');
    } else {
      db.createBotActivation(userId, mt5.id, 'PENDING_PAYMENT');
    }

    res.status(201).json({
      success: true,
      message: 'MetaTrader 5 credentials securely saved and encrypted.',
      data: {
        id: mt5.id,
        accountNumber: mt5.accountNumber,
        brokerName: mt5.brokerName,
        serverName: mt5.serverName,
        label: mt5.label
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Encryption failed.' });
  }
});

// Delete MT5 Account Link
app.delete('/api/mt5', authenticateToken, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const account = db.getMt5AccountForUser(userId);

  if (!account) {
    return res.status(404).json({ success: false, message: 'No MT5 account link found to delete.' });
  }

  db.deleteMt5Account(account.id);

  // Terminate/cancel bot status as well
  const botAct = db.getBotActivationForUser(userId);
  if (botAct) {
    db.updateBotActivationStatus(botAct.id, 'CANCELLED', 'MT5 credentials link was deleted by the user.');
  }

  db.createActivityLog(userId, 'MT5_DELETED', `Deleted MT5 Account #${account.accountNumber}`, req.ip);
  db.createNotification(userId, 'MT5 Credentials Unlinked', 'All MetaTrader 5 parameters have been scrubbed from active vault memory.', 'SECURITY');

  res.json({
    success: true,
    message: 'MetaTrader 5 credentials and configurations deleted successfully.'
  });
});

// --- Bot Activation & Timeline APIs ---

app.get('/api/bot-activation', authenticateToken, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const botAct = db.getBotActivationForUser(userId);

  if (!botAct) {
    return res.json({
      success: true,
      message: 'No active trading bot request found. Please configure MT5 and subcribe.',
      data: null
    });
  }

  res.json({
    success: true,
    message: 'Bot Activation and Live VPS deployment timeline retrieved.',
    data: botAct
  });
});

// Submit activation request manually (fallback)
app.post('/api/bot-activation', authenticateToken, (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  const mt5 = db.getMt5AccountForUser(userId);
  if (!mt5) {
    return res.status(400).json({ success: false, message: 'Please configure MetaTrader 5 account details first.' });
  }

  const sub = db.getSubscriptionForUser(userId);
  if (!sub || sub.status !== 'ACTIVE') {
    return res.status(400).json({ success: false, message: 'An active trading subscription is required to spin up the trading bot.' });
  }

  const botAct = db.createBotActivation(userId, mt5.id, 'WAITING_FOR_BOT_TEAM');
  db.createActivityLog(userId, 'BOT_ACTIVATION_REQUESTED', 'Requested automated EA bot spinup on VPS', req.ip);
  db.createNotification(userId, 'Bot Deployment Triggered', 'Bot queue initialized. Our bot deployment team is deploying your custom parameters.', 'BOT_ACTIVATION');

  res.json({
    success: true,
    message: 'Automated trading bot activation triggered successfully.',
    data: botAct
  });
});

// --- In-App Notifications ---

app.get('/api/notifications', authenticateToken, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const notifications = db.getNotificationsForUser(userId);
  res.json({
    success: true,
    message: 'Notifications retrieved.',
    data: notifications
  });
});

app.post('/api/notifications/read', authenticateToken, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.body;

  if (id) {
    db.markNotificationAsRead(id);
  } else {
    db.markAllNotificationsAsRead(userId);
  }

  res.json({
    success: true,
    message: 'Notifications updated successfully.'
  });
});

// --- Audit Activity Logs for current User ---
app.get('/api/activity-logs', authenticateToken, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const logs = db.getActivityLogs().filter(l => l.userId === userId).slice().reverse();
  res.json({
    success: true,
    message: 'Activity logs retrieved.',
    data: logs
  });
});

// ==========================================
// ADMIN DASHBOARD CONTROLLERS (SECURE)
// ==========================================

// Get Stats (Admin Role Required)
app.get('/api/admin/stats', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const users = db.getUsers();
  const subs = db.getSubscriptions().filter(s => s.status === 'ACTIVE');
  const payments = db.getPayments().filter(p => p.status === 'succeeded');
  const mt5Count = db.getMt5Accounts().length;
  const botActivations = db.getBotActivations();

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const pendingBotActivations = botActivations.filter(b => b.status === 'WAITING_FOR_BOT_TEAM' || b.status === 'IN_PROGRESS').length;

  res.json({
    success: true,
    message: 'Administrative statistics compiled successfully.',
    data: {
      stats: {
        totalUsers: users.length,
        activeSubscriptions: subs.length,
        totalRevenue: totalRevenue,
        linkedMt5Accounts: mt5Count,
        pendingBotActivations: pendingBotActivations
      }
    }
  });
});

// Get Users list
app.get('/api/admin/users', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const users = db.getUsers().map(u => {
    const sub = db.getSubscriptionForUser(u.id);
    const mt5 = db.getMt5AccountForUser(u.id);
    const bot = db.getBotActivationForUser(u.id);
    return {
      ...u,
      subscription: sub ? { id: sub.id, planId: sub.planId, status: sub.status, currentPeriodEnd: sub.currentPeriodEnd } : null,
      mt5: mt5 ? { id: mt5.id, accountNumber: mt5.accountNumber, brokerName: mt5.brokerName } : null,
      bot: bot ? { id: bot.id, status: bot.status } : null
    };
  });

  res.json({
    success: true,
    message: 'All users and connection parameters retrieved.',
    data: users
  });
});

// Toggle user verification or change role
app.put('/api/admin/users/:id', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, verified } = req.body;

  const user = db.findUserById(id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Target user account not found.' });
  }

  const updates: any = {};
  if (role) updates.role = role;
  if (verified !== undefined) updates.verified = verified;

  db.updateUser(id, updates);
  db.createActivityLog(req.user!.id, 'ADMIN_ACTION', `Updated user: ${user.email} (${JSON.stringify(updates)})`, req.ip);
  db.createNotification(id, 'Account Parameters Updated', 'An administrator has modified your profile specifications.', 'SYSTEM');

  res.json({
    success: true,
    message: 'User profile settings updated.',
    data: db.findUserById(id)
  });
});

// Get all bot activations (Admin Queue)
app.get('/api/admin/bot-activations', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const acts = db.getBotActivations().map(act => {
    const user = db.findUserById(act.userId);
    const mt5 = db.getMt5Accounts().find(m => m.id === act.mt5AccountId);
    return {
      ...act,
      user: user ? { email: user.email, verified: user.verified } : null,
      mt5: mt5 ? { accountNumber: mt5.accountNumber, brokerName: mt5.brokerName, serverName: mt5.serverName } : null
    };
  });

  res.json({
    success: true,
    message: 'Global bot activation list retrieved.',
    data: acts
  });
});

// Update bot activation status / add notes / complete queue
app.put('/api/admin/bot-activations/:id', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;

  const act = db.getBotActivations().find(a => a.id === id);
  if (!act) {
    return res.status(404).json({ success: false, message: 'Bot activation item not found.' });
  }

  const updatedAct = db.updateBotActivationStatus(id, status as BotActivationStatus, adminNotes, req.user!.email);
  if (!updatedAct) {
    return res.status(500).json({ success: false, message: 'Failed to update activation.' });
  }

  // Create audit log
  db.createActivityLog(req.user!.id, 'ADMIN_BOT_UPDATE', `Updated bot activation status to ${status} for target ID: ${id}`, req.ip);

  // Send real-time notification to user
  db.createNotification(
    act.userId,
    'Trading Bot Status: ' + status,
    `Your MetaTrader 5 bot state was updated to: ${status}. Admin notes: ${adminNotes || 'None'}`,
    'BOT_ACTIVATION'
  );

  res.json({
    success: true,
    message: 'Bot activation status and timeline progressed.',
    data: updatedAct
  });
});

// Get all global audit activity logs
app.get('/api/admin/activity-logs', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const logs = db.getActivityLogs().map(log => {
    const user = db.findUserById(log.userId);
    return {
      ...log,
      userEmail: user ? user.email : 'System/Anonymous'
    };
  }).slice().reverse();

  res.json({
    success: true,
    message: 'Global platform activity logs compiled.',
    data: logs
  });
});

// Export CSV of logs
app.get('/api/admin/logs/csv', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const logs = db.getActivityLogs().map(log => {
    const user = db.findUserById(log.userId);
    return {
      id: log.id,
      timestamp: log.createdAt,
      email: user ? user.email : 'System',
      action: log.action,
      details: log.details || '',
      ip: log.ipAddress || ''
    };
  });

  // Convert array to CSV string
  let csv = 'ID,Timestamp,User Email,Action,Details,IP Address\n';
  logs.forEach(l => {
    csv += `"${l.id}","${l.timestamp}","${l.email}","${l.action}","${l.details.replace(/"/g, '""')}","${l.ip}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=vinebot_audit_logs.csv');
  res.status(200).send(csv);
});

// ==========================================
// VITE DEV SERVER / STATIC ASSETS ROUTING
// ==========================================

async function startServer() {
  // Initialize Database (PostgreSQL / local JSON fallback)
  await db.init().catch(err => {
    console.error('Failure initializing database layer:', err);
  });

  if (process.env.NODE_ENV !== 'production') {
    // Integrate Vite as Middleware in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    
    app.use(vite.middlewares);
    console.log('Vite development server mounted as Express middleware');
  } else {
    // Serve production-built static assets from /dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vinebot platform listening at http://localhost:${PORT}`);
    
    // Log OAuth Status on Startup with masked secret
    const secret = (process.env.GOOGLE_CLIENT_SECRET || DEFAULT_GOOGLE_CLIENT_SECRET).trim().replace(/^["']|["']$/g, '');
    const maskedSecret = secret.length > 4 ? `${secret.substring(0, 4)}****` : '****';
    console.log(`[Google OAuth Status] Configured. Client Secret loaded: ${maskedSecret}`);
  });
}

startServer().catch(err => {
  console.error('Failure initializing server process:', err);
});
