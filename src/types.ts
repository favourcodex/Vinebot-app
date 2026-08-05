/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Enterprise Models & Schema definitions

export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  verified: boolean;
  isEmailVerified: boolean;
  hasAcceptedTerms: boolean;
  isBotActive?: boolean;
  acceptedTermsAt?: string | null;
  acceptedIpAddress?: string | null;
  verificationToken?: string | null;
  role: UserRole;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface RefreshToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export interface OAuthAccount {
  id: string;
  provider: string; // e.g., 'google'
  providerId: string;
  userId: string;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: string;
  createdAt: string;
}

export interface StripeCustomer {
  id: string;
  stripeCustomerId: string;
  userId: string;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year' | 'one_time';
  features: string[];
  stripePriceId: string;
}

export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' | 'TRIALING' | 'INACTIVE';

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  stripeSubscriptionId?: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending';
  stripePaymentIntentId?: string;
  stripeInvoiceId?: string;
  createdAt: string;
}

export interface WebhookEvent {
  id: string;
  stripeEventId: string;
  eventType: string;
  processedAt: string;
}

export interface Mt5Account {
  id: string;
  userId: string;
  accountNumber: string;
  brokerName: string;
  serverName: string;
  encryptedPassword: string; // Base64
  iv: string; // Base64
  authTag: string; // Base64
  label?: string;
  createdAt: string;
  updatedAt: string;
}

export type BotActivationStatus = 
  | 'PENDING_PAYMENT' 
  | 'PAYMENT_CONFIRMED' 
  | 'WAITING_FOR_BOT_TEAM' 
  | 'IN_PROGRESS' 
  | 'ACTIVE' 
  | 'PAUSED' 
  | 'FAILED' 
  | 'CANCELLED';

export interface TimelineEvent {
  status: BotActivationStatus;
  timestamp: string;
  title: string;
  description: string;
  completed: boolean;
  byUser?: string;
}

export interface BotActivation {
  id: string;
  userId: string;
  mt5AccountId: string;
  status: BotActivationStatus;
  timeline: TimelineEvent[];
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 'PAYMENT' | 'SUBSCRIPTION' | 'BOT_ACTIVATION' | 'SECURITY' | 'SYSTEM';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: NotificationType;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string; // e.g., 'LOGIN', 'LOGOUT', 'PAYMENT_SUCCESS', 'MT5_UPDATE', 'BOT_ACTIVATED'
  ipAddress?: string;
  details?: string;
  createdAt: string;
}

export interface AdminNote {
  id: string;
  targetId: string;
  targetType: 'USER' | 'MT5' | 'BOT_ACTIVATION';
  note: string;
  adminId: string;
  adminEmail: string;
  createdAt: string;
}

export interface LookupItem {
  id: string;
  category: string;
  key: string;
  value: string;
  label: string;
}

export interface Trade {
  id: string;
  userId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  closedAt?: string;
}

// REST API Response structures
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// Context/State types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}
