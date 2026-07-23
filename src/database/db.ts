/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Sequelize, DataTypes } from 'sequelize';
import {
  User, RefreshToken, OAuthAccount, Session, StripeCustomer,
  SubscriptionPlan, UserSubscription, Payment, WebhookEvent,
  Mt5Account, BotActivation, Notification, ActivityLog,
  AdminNote, LookupItem, UserRole, BotActivationStatus, NotificationType,
  Trade
} from '../types';

const DB_FILE = path.join(process.cwd(), 'vinebot_db.json');

// Interface representing the entire relational state
interface RelationalState {
  users: User[];
  refreshTokens: RefreshToken[];
  oauthAccounts: OAuthAccount[];
  sessions: Session[];
  stripeCustomers: StripeCustomer[];
  subscriptionPlans: SubscriptionPlan[];
  userSubscriptions: UserSubscription[];
  payments: Payment[];
  webhookEvents: WebhookEvent[];
  mt5Accounts: Mt5Account[];
  botActivations: BotActivation[];
  notifications: Notification[];
  activityLogs: ActivityLog[];
  adminNotes: AdminNote[];
  lookupItems: LookupItem[];
  trades: Trade[];
}

class VinebotDatabase {
  private state: RelationalState;
  private isPostgres = false;
  public models: any = {};

  constructor() {
    this.state = this.loadOrCreateDb();
  }

  // Generates safe cryptographically secure UUIDs
  public generateId(): string {
    return crypto.randomUUID();
  }

  public async init(): Promise<void> {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl || dbUrl === 'disabled' || dbUrl === 'null' || dbUrl === 'undefined' || !dbUrl.startsWith('postgres')) {
      console.log('[PG DB INFO] DATABASE_URL is not set, is disabled, or is invalid. Running completely with local JSON file database.');
      return;
    }

    try {
      console.log('[PG DB INFO] DATABASE_URL detected. Initializing Sequelize...');
      const dialectOptions = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')
        ? {}
        : {
            ssl: {
              require: true,
              rejectUnauthorized: false
            }
          };

      const sequelize = new Sequelize(dbUrl, {
        dialect: 'postgres',
        logging: false,
        dialectOptions
      });

      // Define Sequelize Models
      const UserMod = sequelize.define('User', {
        id: { type: DataTypes.STRING, primaryKey: true },
        email: { type: DataTypes.STRING, unique: true, allowNull: false },
        passwordHash: { type: DataTypes.STRING, allowNull: true },
        verified: { type: DataTypes.BOOLEAN, defaultValue: false },
        isEmailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
        hasAcceptedTerms: { type: DataTypes.BOOLEAN, defaultValue: false },
        acceptedTermsAt: { type: DataTypes.STRING, allowNull: true },
        acceptedIpAddress: { type: DataTypes.STRING, allowNull: true },
        verificationToken: { type: DataTypes.STRING, allowNull: true },
        role: { type: DataTypes.STRING, allowNull: false },
        profilePicture: { type: DataTypes.STRING, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        deletedAt: { type: DataTypes.STRING, allowNull: true }
      }, { timestamps: true });

      const RefreshTokenMod = sequelize.define('RefreshToken', {
        id: { type: DataTypes.STRING, primaryKey: true },
        token: { type: DataTypes.STRING, unique: true, allowNull: false },
        userId: { type: DataTypes.STRING, allowNull: false },
        expiresAt: { type: DataTypes.STRING, allowNull: false },
        createdAt: { type: DataTypes.STRING, allowNull: false }
      }, { timestamps: false });

      const OAuthAccountMod = sequelize.define('OAuthAccount', {
        id: { type: DataTypes.STRING, primaryKey: true },
        provider: { type: DataTypes.STRING, allowNull: false },
        providerId: { type: DataTypes.STRING, allowNull: false },
        userId: { type: DataTypes.STRING, allowNull: false },
        createdAt: { type: DataTypes.STRING, allowNull: false }
      }, { timestamps: false });

      const SessionMod = sequelize.define('Session', {
        id: { type: DataTypes.STRING, primaryKey: true },
        userId: { type: DataTypes.STRING, allowNull: false },
        token: { type: DataTypes.STRING, allowNull: false },
        ipAddress: { type: DataTypes.STRING, allowNull: true },
        userAgent: { type: DataTypes.STRING, allowNull: true },
        expiresAt: { type: DataTypes.STRING, allowNull: false },
        createdAt: { type: DataTypes.STRING, allowNull: false }
      }, { timestamps: false });

      const StripeCustomerMod = sequelize.define('StripeCustomer', {
        id: { type: DataTypes.STRING, primaryKey: true },
        stripeCustomerId: { type: DataTypes.STRING, allowNull: false },
        userId: { type: DataTypes.STRING, allowNull: false },
        createdAt: { type: DataTypes.STRING, allowNull: false }
      }, { timestamps: false });

      const SubscriptionPlanMod = sequelize.define('SubscriptionPlan', {
        id: { type: DataTypes.STRING, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: false },
        price: { type: DataTypes.DOUBLE, allowNull: false },
        interval: { type: DataTypes.STRING, allowNull: false },
        features: { type: DataTypes.TEXT, allowNull: false, defaultValue: '[]' },
        stripePriceId: { type: DataTypes.STRING, allowNull: false }
      }, { timestamps: true });

      const UserSubscriptionMod = sequelize.define('UserSubscription', {
        id: { type: DataTypes.STRING, primaryKey: true },
        userId: { type: DataTypes.STRING, allowNull: false },
        planId: { type: DataTypes.STRING, allowNull: false },
        status: { type: DataTypes.STRING, allowNull: false },
        stripeSubscriptionId: { type: DataTypes.STRING, allowNull: true },
        cancelAtPeriodEnd: { type: DataTypes.BOOLEAN, defaultValue: false },
        currentPeriodEnd: { type: DataTypes.STRING, allowNull: false },
        createdAt: { type: DataTypes.STRING, allowNull: false }
      }, { timestamps: false });

      const PaymentMod = sequelize.define('Payment', {
        id: { type: DataTypes.STRING, primaryKey: true },
        userId: { type: DataTypes.STRING, allowNull: false },
        subscriptionId: { type: DataTypes.STRING, allowNull: true },
        amount: { type: DataTypes.DOUBLE, allowNull: false },
        currency: { type: DataTypes.STRING, allowNull: false },
        status: { type: DataTypes.STRING, allowNull: false },
        stripePaymentIntentId: { type: DataTypes.STRING, allowNull: true },
        stripeInvoiceId: { type: DataTypes.STRING, allowNull: true },
        createdAt: { type: DataTypes.STRING, allowNull: false }
      }, { timestamps: false });

      const WebhookEventMod = sequelize.define('WebhookEvent', {
        id: { type: DataTypes.STRING, primaryKey: true },
        stripeEventId: { type: DataTypes.STRING, allowNull: false },
        eventType: { type: DataTypes.STRING, allowNull: false },
        processedAt: { type: DataTypes.STRING, allowNull: false }
      }, { timestamps: false });

      const Mt5AccountMod = sequelize.define('Mt5Account', {
        id: { type: DataTypes.STRING, primaryKey: true },
        userId: { type: DataTypes.STRING, allowNull: false },
        accountNumber: { type: DataTypes.STRING, allowNull: false },
        brokerName: { type: DataTypes.STRING, allowNull: false },
        serverName: { type: DataTypes.STRING, allowNull: false },
        encryptedPassword: { type: DataTypes.TEXT, allowNull: false },
        iv: { type: DataTypes.STRING, allowNull: false },
        authTag: { type: DataTypes.STRING, allowNull: false },
        label: { type: DataTypes.STRING, allowNull: true },
        createdAt: { type: DataTypes.STRING, allowNull: false },
        updatedAt: { type: DataTypes.STRING, allowNull: false }
      }, { timestamps: false });

      const BotActivationMod = sequelize.define('BotActivation', {
        id: { type: DataTypes.STRING, primaryKey: true },
        userId: { type: DataTypes.STRING, allowNull: false },
        mt5AccountId: { type: DataTypes.STRING, allowNull: false },
        status: { type: DataTypes.STRING, allowNull: false },
        timeline: { type: DataTypes.TEXT, allowNull: false, defaultValue: '[]' },
        adminNotes: { type: DataTypes.TEXT, allowNull: true },
        createdAt: { type: DataTypes.STRING, allowNull: false },
        updatedAt: { type: DataTypes.STRING, allowNull: false }
      }, { timestamps: false });

      const NotificationMod = sequelize.define('Notification', {
        id: { type: DataTypes.STRING, primaryKey: true },
        userId: { type: DataTypes.STRING, allowNull: false },
        title: { type: DataTypes.STRING, allowNull: false },
        message: { type: DataTypes.TEXT, allowNull: false },
        read: { type: DataTypes.BOOLEAN, defaultValue: false },
        type: { type: DataTypes.STRING, allowNull: false },
        createdAt: { type: DataTypes.STRING, allowNull: false }
      }, { timestamps: false });

      const ActivityLogMod = sequelize.define('ActivityLog', {
        id: { type: DataTypes.STRING, primaryKey: true },
        userId: { type: DataTypes.STRING, allowNull: false },
        action: { type: DataTypes.STRING, allowNull: false },
        ipAddress: { type: DataTypes.STRING, allowNull: true },
        details: { type: DataTypes.TEXT, allowNull: true },
        createdAt: { type: DataTypes.STRING, allowNull: false }
      }, { timestamps: false });

      const AdminNoteMod = sequelize.define('AdminNote', {
        id: { type: DataTypes.STRING, primaryKey: true },
        targetId: { type: DataTypes.STRING, allowNull: false },
        targetType: { type: DataTypes.STRING, allowNull: false },
        note: { type: DataTypes.TEXT, allowNull: false },
        adminId: { type: DataTypes.STRING, allowNull: false },
        adminEmail: { type: DataTypes.STRING, allowNull: false },
        createdAt: { type: DataTypes.STRING, allowNull: false }
      }, { timestamps: false });

      const LookupItemMod = sequelize.define('LookupItem', {
        id: { type: DataTypes.STRING, primaryKey: true },
        key: { type: DataTypes.STRING, allowNull: false },
        value: { type: DataTypes.TEXT, allowNull: false }
      }, { timestamps: false });

      const TradeMod = sequelize.define('Trade', {
        id: { type: DataTypes.STRING, primaryKey: true },
        userId: { type: DataTypes.STRING, allowNull: false },
        symbol: { type: DataTypes.STRING, allowNull: false },
        type: { type: DataTypes.STRING, allowNull: false },
        volume: { type: DataTypes.DOUBLE, allowNull: false },
        entryPrice: { type: DataTypes.DOUBLE, allowNull: false },
        exitPrice: { type: DataTypes.DOUBLE, allowNull: false },
        pnl: { type: DataTypes.DOUBLE, allowNull: false },
        status: { type: DataTypes.STRING, allowNull: false },
        createdAt: { type: DataTypes.STRING, allowNull: false },
        closedAt: { type: DataTypes.STRING, allowNull: true }
      }, { timestamps: false });

      this.models = {
        User: UserMod,
        RefreshToken: RefreshTokenMod,
        OAuthAccount: OAuthAccountMod,
        Session: SessionMod,
        StripeCustomer: StripeCustomerMod,
        SubscriptionPlan: SubscriptionPlanMod,
        UserSubscription: UserSubscriptionMod,
        Payment: PaymentMod,
        WebhookEvent: WebhookEventMod,
        Mt5Account: Mt5AccountMod,
        BotActivation: BotActivationMod,
        Notification: NotificationMod,
        ActivityLog: ActivityLogMod,
        AdminNote: AdminNoteMod,
        LookupItem: LookupItemMod,
        Trade: TradeMod
      };

      // Authenticate & Sync
      await sequelize.authenticate();
      try {
        await sequelize.sync({ alter: true });
        console.log('[PG DB INFO] PostgreSQL connection established and schema synced.');
      } catch (syncErr: any) {
        console.warn('[PG DB WARN] Failed to sync schema with { alter: true }. Retrying with { alter: false }...', syncErr);
        try {
          await sequelize.sync({ alter: false });
          console.log('[PG DB INFO] PostgreSQL connection established with schema sync fallback { alter: false }.');
        } catch (fallbackErr: any) {
          console.error('[PG DB ERROR] Critical failure syncing schema even with { alter: false }:', fallbackErr);
          throw fallbackErr;
        }
      }

      // Check if seeded
      const usersCount = await UserMod.count();
      const initialSeed = this.getInitialSeedState();

      if (usersCount === 0) {
        console.log('[PG DB INFO] PostgreSQL database is empty. Performing initial data seed...');
        
        // Seed each table sequentially
        for (const user of initialSeed.users) {
          await UserMod.create(user as any);
        }
        for (const plan of initialSeed.subscriptionPlans) {
          await SubscriptionPlanMod.create({
            ...plan,
            features: JSON.stringify(plan.features),
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        for (const log of initialSeed.activityLogs) {
          await ActivityLogMod.create(log as any);
        }
        for (const cust of initialSeed.stripeCustomers) {
          await StripeCustomerMod.create(cust as any);
        }
        for (const sub of initialSeed.userSubscriptions) {
          await UserSubscriptionMod.create(sub as any);
        }
        for (const pay of initialSeed.payments) {
          await PaymentMod.create(pay as any);
        }
        for (const mt5 of initialSeed.mt5Accounts) {
          await Mt5AccountMod.create(mt5 as any);
        }
        for (const act of initialSeed.botActivations) {
          await BotActivationMod.create({
            ...act,
            timeline: JSON.stringify(act.timeline)
          });
        }
        for (const note of initialSeed.adminNotes) {
          await AdminNoteMod.create(note as any);
        }
        for (const notif of initialSeed.notifications) {
          await NotificationMod.create(notif as any);
        }
        for (const trade of initialSeed.trades) {
          await TradeMod.create(trade as any);
        }
        console.log('[PG DB INFO] Seeding complete.');
      } else {
        // Safe-seeding check for specific records: Ensure default Admins exist
        const adminEmails = ['admin@vinebot.app', 'vinindustry0@gmail.com'];
        for (const adminEmail of adminEmails) {
          const existingAdmin = await UserMod.findOne({ where: { email: adminEmail } });
          if (!existingAdmin) {
            console.log(`[PG DB INFO] Admin user "${adminEmail}" is missing. Safe-seeding admin account...`);
            const seedAdmin = {
              id: adminEmail === 'admin@vinebot.app' ? 'admin-uuid-1111-2222-333333333333' : 'vinindustry0-uuid-admin',
              email: adminEmail,
              passwordHash: '$2b$10$VdrTr9XW2XhHw1Eg3fj8FuC5aqLfiYDY3bycaCOGdwpXW6rT14G4m', // password: admin
              verified: true,
              isEmailVerified: true,
              hasAcceptedTerms: true,
              role: 'ADMIN',
              profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            await UserMod.create(seedAdmin as any);
          } else {
            console.log(`[PG DB INFO] Admin user "${adminEmail}" exists. Verifying/resetting credentials and role...`);
            await existingAdmin.update({
              passwordHash: '$2b$10$VdrTr9XW2XhHw1Eg3fj8FuC5aqLfiYDY3bycaCOGdwpXW6rT14G4m', // password: admin
              role: 'ADMIN',
              verified: true,
              isEmailVerified: true,
              hasAcceptedTerms: true
            });
          }
        }

        // Safe-seeding check: Ensure SubscriptionPlans exist
        const plansCount = await SubscriptionPlanMod.count();
        if (plansCount === 0) {
          console.log('[PG DB INFO] SubscriptionPlans table is empty. Safe-seeding plans...');
          for (const plan of initialSeed.subscriptionPlans) {
            await SubscriptionPlanMod.create({
              ...plan,
              features: JSON.stringify(plan.features),
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      }

      // Display clear and beautiful credentials printout in server logs
      console.log('\n======================================================');
      console.log('🛡️  VINEBOT DEPLOYMENT SECURITY CREDENTIALS CHECK');
      console.log('------------------------------------------------------');
      console.log('👤 ADMIN USERS VERIFIED / READY:');
      console.log('👉 Email:    admin@vinebot.app | vinindustry0@gmail.com');
      console.log('👉 Password: admin');
      console.log('👉 Role:     ADMIN');
      console.log('======================================================\n');

      // Load all data from PostgreSQL into cache
      const usersData = (await UserMod.findAll()).map(r => {
        const u = r.get({ plain: true });
        return {
          ...u,
          createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
          updatedAt: u.updatedAt instanceof Date ? u.updatedAt.toISOString() : u.updatedAt,
          deletedAt: u.deletedAt instanceof Date ? u.deletedAt.toISOString() : u.deletedAt
        };
      }) as User[];
      const refreshTokensData = (await RefreshTokenMod.findAll()).map(r => r.get({ plain: true })) as RefreshToken[];
      const oauthAccountsData = (await OAuthAccountMod.findAll()).map(r => r.get({ plain: true })) as OAuthAccount[];
      const sessionsData = (await SessionMod.findAll()).map(r => r.get({ plain: true })) as Session[];
      const stripeCustomersData = (await StripeCustomerMod.findAll()).map(r => r.get({ plain: true })) as StripeCustomer[];
      const subscriptionPlansRaw = (await SubscriptionPlanMod.findAll()).map(r => r.get({ plain: true })) as any[];
      const subscriptionPlansData = subscriptionPlansRaw.map(p => ({
        ...p,
        features: p.features ? JSON.parse(p.features) : []
      })) as SubscriptionPlan[];
      
      const userSubscriptionsData = (await UserSubscriptionMod.findAll()).map(r => r.get({ plain: true })) as UserSubscription[];
      const paymentsData = (await PaymentMod.findAll()).map(r => r.get({ plain: true })) as Payment[];
      const webhookEventsData = (await WebhookEventMod.findAll()).map(r => r.get({ plain: true })) as WebhookEvent[];
      const mt5AccountsData = (await Mt5AccountMod.findAll()).map(r => r.get({ plain: true })) as Mt5Account[];
      const botActivationsRaw = (await BotActivationMod.findAll()).map(r => r.get({ plain: true })) as any[];
      const botActivationsData = botActivationsRaw.map(b => ({
        ...b,
        timeline: b.timeline ? JSON.parse(b.timeline) : []
      })) as BotActivation[];

      const notificationsData = (await NotificationMod.findAll()).map(r => r.get({ plain: true })) as Notification[];
      const activityLogsData = (await ActivityLogMod.findAll()).map(r => r.get({ plain: true })) as ActivityLog[];
      const adminNotesData = (await AdminNoteMod.findAll()).map(r => r.get({ plain: true })) as AdminNote[];
      const lookupItemsData = (await LookupItemMod.findAll()).map(r => r.get({ plain: true })) as LookupItem[];
      const tradesData = (await TradeMod.findAll()).map(r => r.get({ plain: true })) as Trade[];

      this.state = {
        users: usersData,
        refreshTokens: refreshTokensData,
        oauthAccounts: oauthAccountsData,
        sessions: sessionsData,
        stripeCustomers: stripeCustomersData,
        subscriptionPlans: subscriptionPlansData,
        userSubscriptions: userSubscriptionsData,
        payments: paymentsData,
        webhookEvents: webhookEventsData,
        mt5Accounts: mt5AccountsData,
        botActivations: botActivationsData,
        notifications: notificationsData,
        activityLogs: activityLogsData,
        adminNotes: adminNotesData,
        lookupItems: lookupItemsData,
        trades: tradesData
      };

      this.isPostgres = true;
      console.log(`[PG DB INFO] Cache pre-populated successfully with ${usersData.length} users and ${subscriptionPlansData.length} plans.`);

    } catch (err) {
      console.error('[PG DB ERROR] Failed to connect or initialize PostgreSQL. Falling back to local file database.', err);
      this.isPostgres = false;
    }
  }

  private async saveToPostgres(modelName: string, data: any, operation: 'insert' | 'update' | 'delete'): Promise<void> {
    if (!this.isPostgres) return;
    try {
      const model = this.models[modelName];
      if (!model) return;

      if (operation === 'insert') {
        const dbData = { ...data };
        if (dbData.features && Array.isArray(dbData.features)) {
          dbData.features = JSON.stringify(dbData.features);
        }
        if (dbData.timeline && Array.isArray(dbData.timeline)) {
          dbData.timeline = JSON.stringify(dbData.timeline);
        }
        await model.create(dbData);
      } else if (operation === 'update') {
        const dbData = { ...data };
        if (dbData.features && Array.isArray(dbData.features)) {
          dbData.features = JSON.stringify(dbData.features);
        }
        if (dbData.timeline && Array.isArray(dbData.timeline)) {
          dbData.timeline = JSON.stringify(dbData.timeline);
        }
        await model.update(dbData, { where: { id: data.id } });
      } else if (operation === 'delete') {
        await model.destroy({ where: { id: data.id } });
      }
    } catch (error) {
      console.error(`[PG DB SYNC ERROR] Failed to ${operation} on ${modelName}:`, error);
    }
  }

  private loadOrCreateDb(): RelationalState {
    const defaultState = this.getInitialSeedState();
    let state: RelationalState;
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Guarantee all arrays are initialized to prevent undefined '.push' errors
        state = {
          ...defaultState,
          ...parsed,
          users: parsed.users || defaultState.users || [],
          refreshTokens: parsed.refreshTokens || defaultState.refreshTokens || [],
          oauthAccounts: parsed.oauthAccounts || defaultState.oauthAccounts || [],
          sessions: parsed.sessions || defaultState.sessions || [],
          stripeCustomers: parsed.stripeCustomers || defaultState.stripeCustomers || [],
          subscriptionPlans: parsed.subscriptionPlans || defaultState.subscriptionPlans || [],
          userSubscriptions: parsed.userSubscriptions || defaultState.userSubscriptions || [],
          payments: parsed.payments || defaultState.payments || [],
          webhookEvents: parsed.webhookEvents || defaultState.webhookEvents || [],
          mt5Accounts: parsed.mt5Accounts || defaultState.mt5Accounts || [],
          botActivations: parsed.botActivations || defaultState.botActivations || [],
          notifications: parsed.notifications || defaultState.notifications || [],
          activityLogs: parsed.activityLogs || defaultState.activityLogs || [],
          adminNotes: parsed.adminNotes || defaultState.adminNotes || [],
          lookupItems: parsed.lookupItems || defaultState.lookupItems || [],
          trades: parsed.trades || defaultState.trades || []
        };
      } else {
        state = defaultState;
      }
    } catch (e) {
      console.error('Error loading DB file, rebuilding...', e);
      state = defaultState;
    }

    // Force seed / update admins in local state
    const adminEmails = ['admin@vinebot.app', 'vinindustry0@gmail.com'];
    for (const adminEmail of adminEmails) {
      const adminIndex = state.users.findIndex(u => u.email.toLowerCase() === adminEmail);
      if (adminIndex === -1) {
        state.users.push({
          id: adminEmail === 'admin@vinebot.app' ? 'admin-uuid-1111-2222-333333333333' : 'vinindustry0-uuid-admin',
          email: adminEmail,
          passwordHash: '$2b$10$VdrTr9XW2XhHw1Eg3fj8FuC5aqLfiYDY3bycaCOGdwpXW6rT14G4m', // password: admin
          verified: true,
          isEmailVerified: true,
          hasAcceptedTerms: true,
          role: 'ADMIN',
          profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        state.users[adminIndex].passwordHash = '$2b$10$VdrTr9XW2XhHw1Eg3fj8FuC5aqLfiYDY3bycaCOGdwpXW6rT14G4m'; // password: admin
        state.users[adminIndex].role = 'ADMIN';
        state.users[adminIndex].verified = true;
        state.users[adminIndex].isEmailVerified = true;
        state.users[adminIndex].hasAcceptedTerms = true;
      }
    }

    this.saveState(state);
    return state;
  }

  private save(): void {
    if (this.isPostgres) {
      // Background async save to PG handles DB, cache updated synchronously
      return;
    }
    this.saveState(this.state);
  }

  private saveState(state: RelationalState): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving state to DB file', e);
    }
  }

  private getInitialSeedState(): RelationalState {
    const now = new Date().toISOString();
    
    // Seed standard plans
    const plans: SubscriptionPlan[] = [
      {
        id: 'plan-premium-month',
        name: 'PREMIUM ACCESS',
        description: 'Standard automated MetaTrader 5 bot deployment with dedicated VPS hosting.',
        price: 100.00,
        interval: 'month',
        features: [
          'Up to 3 Linked MT5 Accounts',
          'Standard Drawdown Safeguards',
          'Dedicated VPS Hosting Included',
          'Low-Latency Execution',
          'Standard Support'
        ],
        stripePriceId: 'price_premium_monthly'
      },
      {
        id: 'plan-vip-month',
        name: 'VIP UNLIMITED',
        description: 'Unlimited bot access. 20% profit-sharing fee applies to trading profits generated by the bot.',
        price: 200.00,
        interval: 'month',
        features: [
          'Unlimited Linked MT5 Accounts',
          'Custom High-Frequency Bot Strategies',
          'Dedicated High-Priority VPS',
          '20% Monthly Profit Share Settlement Agreement',
          '1-on-1 VIP Setup & Telegram Priority Support'
        ],
        stripePriceId: 'price_vip_monthly'
      }
    ];

    const adminUser: User = {
      id: 'admin-uuid-1111-2222-333333333333',
      email: 'admin@vinebot.app',
      passwordHash: '$2b$10$VdrTr9XW2XhHw1Eg3fj8FuC5aqLfiYDY3bycaCOGdwpXW6rT14G4m', // password: admin
      verified: true,
      isEmailVerified: true,
      hasAcceptedTerms: true,
      acceptedTermsAt: now,
      acceptedIpAddress: '127.0.0.1',
      role: 'ADMIN',
      profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      createdAt: now,
      updatedAt: now
    };

    const vinindustryUser: User = {
      id: 'vinindustry0-uuid-admin',
      email: 'vinindustry0@gmail.com',
      passwordHash: '$2b$10$VdrTr9XW2XhHw1Eg3fj8FuC5aqLfiYDY3bycaCOGdwpXW6rT14G4m', // password: admin
      verified: true,
      isEmailVerified: true,
      hasAcceptedTerms: true,
      acceptedTermsAt: now,
      acceptedIpAddress: '127.0.0.1',
      role: 'ADMIN',
      profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      createdAt: now,
      updatedAt: now
    };

    const regularUser: User = {
      id: 'user-uuid-1111-2222-333333333333',
      email: 'user@vinebot.com',
      passwordHash: '$2b$10$VdrTr9XW2XhHw1Eg3fj8FuC5aqLfiYDY3bycaCOGdwpXW6rT14G4m', // password: admin
      verified: true,
      isEmailVerified: true,
      hasAcceptedTerms: true,
      acceptedTermsAt: now,
      acceptedIpAddress: '127.0.0.1',
      role: 'USER',
      profilePicture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      createdAt: now,
      updatedAt: now
    };

    // Seed some activity logs
    const logs: ActivityLog[] = [
      {
        id: 'log-1',
        userId: 'admin-uuid-1111-2222-333333333333',
        action: 'SYSTEM_STARTUP',
        ipAddress: '127.0.0.1',
        details: 'Enterprise relDB seed state initiated.',
        createdAt: now
      },
      {
        id: 'log-2',
        userId: 'user-uuid-1111-2222-333333333333',
        action: 'USER_REGISTERED',
        ipAddress: '127.0.0.1',
        details: 'User account pre-seeded successfully.',
        createdAt: now
      }
    ];

    // Seed some notifications
    const notifications: Notification[] = [
      {
        id: 'notif-1',
        userId: 'user-uuid-1111-2222-333333333333',
        title: 'Welcome to Vinebot Premium!',
        message: 'Your automated bot dashboard is pre-configured. Subscribe to a trading plan to get started.',
        read: false,
        type: 'SYSTEM',
        createdAt: now
      }
    ];

    return {
      users: [adminUser, vinindustryUser, regularUser],
      refreshTokens: [],
      oauthAccounts: [],
      sessions: [],
      stripeCustomers: [
        {
          id: 'cust-1',
          userId: 'user-uuid-1111-2222-333333333333',
          stripeCustomerId: 'cus_mock_user_123',
          createdAt: now
        }
      ],
      subscriptionPlans: plans,
      userSubscriptions: [
        {
          id: 'sub-active-user-1',
          userId: 'user-uuid-1111-2222-333333333333',
          planId: 'plan-pro-month',
          status: 'ACTIVE',
          stripeSubscriptionId: 'sub_mock_active_123',
          cancelAtPeriodEnd: false,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: now
        }
      ],
      payments: [
        {
          id: 'pay-1',
          userId: 'user-uuid-1111-2222-333333333333',
          subscriptionId: 'sub-active-user-1',
          amount: 99.00,
          currency: 'usd',
          status: 'succeeded',
          stripePaymentIntentId: 'pi_mock_pay_123',
          stripeInvoiceId: 'in_mock_pay_123',
          createdAt: now
        }
      ],
      webhookEvents: [],
      mt5Accounts: [
        {
          id: 'mt5-active-user-1',
          userId: 'user-uuid-1111-2222-333333333333',
          accountNumber: '8392819',
          brokerName: 'IC Markets Ltd',
          serverName: 'ICMarkets-Demo03',
          encryptedPassword: 'gZPyX4S0P74WunWp0E3Z8g==', // mock encrypted string
          iv: 'fFfFfFfFfFfFfFfFfFfFfQ==',
          authTag: 'aBaBaBaBaBaBaBaBaBaBaB==',
          label: 'My Principal Forex Bot Account',
          createdAt: now,
          updatedAt: now
        }
      ],
      botActivations: [
        {
          id: 'bot-act-user-1',
          userId: 'user-uuid-1111-2222-333333333333',
          mt5AccountId: 'mt5-active-user-1',
          status: 'WAITING_FOR_BOT_TEAM',
          timeline: [
            {
              status: 'PENDING_PAYMENT',
              timestamp: now,
              title: 'Subscription Purchase',
              description: 'Professional Bot subscription purchased successfully.',
              completed: true
            },
            {
              status: 'PAYMENT_CONFIRMED',
              timestamp: now,
              title: 'Invoice Verified',
              description: 'Payment of $99.00 confirmed.',
              completed: true
            },
            {
              status: 'WAITING_FOR_BOT_TEAM',
              timestamp: now,
              title: 'Pending Expert Activation',
              description: 'MT5 Credentials submitted. Waiting for Bot Deployment Team.',
              completed: true
            },
            {
              status: 'IN_PROGRESS',
              timestamp: '',
              title: 'Server Provisioning',
              description: 'VPS allocation and EA deployment.',
              completed: false
            },
            {
              status: 'ACTIVE',
              timestamp: '',
              title: 'Trading Bot Activated',
              description: 'EA running successfully with live risk controls.',
              completed: false
            }
          ],
          createdAt: now,
          updatedAt: now
        }
      ],
      adminNotes: [
        {
          id: 'note-1',
          targetId: 'bot-act-user-1',
          targetType: 'BOT_ACTIVATION',
          note: 'Allocated server Node-IC-04. Deploying automated trailing-stops EA parameters.',
          adminId: 'admin-uuid-1111-2222-333333333333',
          adminEmail: 'admin@vinebot.com',
          createdAt: now
        }
      ],
      notifications,
      activityLogs: logs,
      lookupItems: [],
      trades: [
        {
          id: 'trade-1',
          userId: 'user-uuid-1111-2222-333333333333',
          symbol: 'EURUSD',
          type: 'BUY',
          volume: 1.0,
          entryPrice: 1.0854,
          exitPrice: 1.0912,
          pnl: 580.00,
          status: 'CLOSED',
          createdAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
          closedAt: new Date(Date.now() - 9.5 * 3600 * 1000).toISOString()
        },
        {
          id: 'trade-2',
          userId: 'user-uuid-1111-2222-333333333333',
          symbol: 'GBPUSD',
          type: 'SELL',
          volume: 0.5,
          entryPrice: 1.2741,
          exitPrice: 1.2690,
          pnl: 255.00,
          status: 'CLOSED',
          createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
          closedAt: new Date(Date.now() - 7.2 * 3600 * 1000).toISOString()
        },
        {
          id: 'trade-3',
          userId: 'user-uuid-1111-2222-333333333333',
          symbol: 'USDJPY',
          type: 'BUY',
          volume: 2.0,
          entryPrice: 154.20,
          exitPrice: 153.85,
          pnl: -450.00,
          status: 'CLOSED',
          createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
          closedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
        },
        {
          id: 'trade-4',
          userId: 'user-uuid-1111-2222-333333333333',
          symbol: 'XAUUSD',
          type: 'BUY',
          volume: 0.2,
          entryPrice: 2350.50,
          exitPrice: 2368.20,
          pnl: 354.00,
          status: 'CLOSED',
          createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
          closedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
        },
        {
          id: 'trade-5',
          userId: 'user-uuid-1111-2222-333333333333',
          symbol: 'BTCUSD',
          type: 'BUY',
          volume: 0.1,
          entryPrice: 64200.00,
          exitPrice: 64850.00,
          pnl: 65.00,
          status: 'CLOSED',
          createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
          closedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
        },
        {
          id: 'trade-6',
          userId: 'user-uuid-1111-2222-333333333333',
          symbol: 'USDCAD',
          type: 'SELL',
          volume: 1.0,
          entryPrice: 1.3620,
          exitPrice: 1.3655,
          pnl: -350.00,
          status: 'CLOSED',
          createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          closedAt: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString()
        },
        {
          id: 'trade-7',
          userId: 'user-uuid-1111-2222-333333333333',
          symbol: 'AUDUSD',
          type: 'BUY',
          volume: 1.5,
          entryPrice: 0.6620,
          exitPrice: 0.6655,
          pnl: 525.00,
          status: 'CLOSED',
          createdAt: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString(),
          closedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
        },
        {
          id: 'trade-8',
          userId: 'user-uuid-1111-2222-333333333333',
          symbol: 'NZDUSD',
          type: 'SELL',
          volume: 0.8,
          entryPrice: 0.6120,
          exitPrice: 0.6085,
          pnl: 280.00,
          status: 'CLOSED',
          createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
          closedAt: new Date(Date.now() - 0.8 * 3600 * 1000).toISOString()
        },
        {
          id: 'trade-9',
          userId: 'user-uuid-1111-2222-333333333333',
          symbol: 'EURGBP',
          type: 'BUY',
          volume: 1.0,
          entryPrice: 0.8420,
          exitPrice: 0.8405,
          pnl: -150.00,
          status: 'CLOSED',
          createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          closedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          id: 'trade-10',
          userId: 'user-uuid-1111-2222-333333333333',
          symbol: 'USDCHF',
          type: 'SELL',
          volume: 1.2,
          entryPrice: 0.8940,
          exitPrice: 0.8890,
          pnl: 600.00,
          status: 'CLOSED',
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          closedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
        },
        {
          id: 'trade-11',
          userId: 'user-uuid-1111-2222-333333333333',
          symbol: 'GBPUSD',
          type: 'BUY',
          volume: 0.5,
          entryPrice: 1.2720,
          exitPrice: 1.2770,
          pnl: 250.00,
          status: 'CLOSED',
          createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          closedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        },
        {
          id: 'trade-12',
          userId: 'user-uuid-1111-2222-333333333333',
          symbol: 'XAUUSD',
          type: 'SELL',
          volume: 0.15,
          entryPrice: 2375.00,
          exitPrice: 2382.00,
          pnl: -105.00,
          status: 'CLOSED',
          createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          closedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString()
        },
        {
          id: 'trade-13',
          userId: 'user-uuid-1111-2222-333333333333',
          symbol: 'EURUSD',
          type: 'BUY',
          volume: 1.0,
          entryPrice: 1.0920,
          exitPrice: 0,
          pnl: 34.00,
          status: 'OPEN',
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        }
      ]
    };
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.state.users.filter(u => !u.deletedAt);
  }

  public findUserById(id: string): User | undefined {
    return this.state.users.find(u => u.id === id && !u.deletedAt);
  }

  public findUserByEmail(email: string): User | undefined {
    return this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase() && !u.deletedAt);
  }

  public createUser(email: string, passwordHash: string, role: UserRole = 'USER', verified: boolean = false): User {
    const user: User = {
      id: this.generateId(),
      email: email.toLowerCase(),
      passwordHash,
      verified,
      isEmailVerified: false,
      hasAcceptedTerms: false,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.state.users.push(user);
    this.save();
    
    this.saveToPostgres('User', user, 'insert');
    return user;
  }

  public updateUser(id: string, updates: Partial<Omit<User, 'id' | 'email' | 'createdAt'>>): User | null {
    const user = this.findUserById(id);
    if (!user) return null;
    Object.assign(user, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    this.save();

    this.saveToPostgres('User', user, 'update');
    return user;
  }

  public deleteUser(id: string): boolean {
    const user = this.findUserById(id);
    if (!user) return false;
    user.deletedAt = new Date().toISOString();
    this.save();

    this.saveToPostgres('User', user, 'update');
    return true;
  }

  // --- Refresh Tokens ---
  public getRefreshTokens(): RefreshToken[] {
    return this.state.refreshTokens;
  }

  public createRefreshToken(userId: string, token: string, expiresDays = 30): RefreshToken {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresDays);
    const rt: RefreshToken = {
      id: this.generateId(),
      token,
      userId,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    };
    this.state.refreshTokens.push(rt);
    this.save();

    this.saveToPostgres('RefreshToken', rt, 'insert');
    return rt;
  }

  public findRefreshToken(token: string): RefreshToken | undefined {
    return this.state.refreshTokens.find(rt => rt.token === token);
  }

  public revokeRefreshToken(token: string): void {
    this.state.refreshTokens = this.state.refreshTokens.filter(rt => rt.token !== token);
    this.save();

    if (this.isPostgres) {
      this.models.RefreshToken.destroy({ where: { token } }).catch((err: any) => console.error(err));
    }
  }

  public revokeUserRefreshTokens(userId: string): void {
    this.state.refreshTokens = this.state.refreshTokens.filter(rt => rt.userId !== userId);
    this.save();

    if (this.isPostgres) {
      this.models.RefreshToken.destroy({ where: { userId } }).catch((err: any) => console.error(err));
    }
  }

  // --- MT5 Accounts ---
  public getMt5Accounts(): Mt5Account[] {
    return this.state.mt5Accounts;
  }

  public getMt5AccountForUser(userId: string): Mt5Account | undefined {
    return this.state.mt5Accounts.find(a => a.userId === userId);
  }

  public createMt5Account(data: Omit<Mt5Account, 'id' | 'createdAt' | 'updatedAt'>): Mt5Account {
    // Delete any existing MT5 for this user (only 1 MT5 allowed)
    this.state.mt5Accounts = this.state.mt5Accounts.filter(a => a.userId !== data.userId);
    
    const mt5: Mt5Account = {
      ...data,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.state.mt5Accounts.push(mt5);
    this.save();

    if (this.isPostgres) {
      this.models.Mt5Account.destroy({ where: { userId: data.userId } })
        .then(() => this.saveToPostgres('Mt5Account', mt5, 'insert'))
        .catch((err: any) => console.error(err));
    }
    return mt5;
  }

  public updateMt5Account(id: string, updates: Partial<Omit<Mt5Account, 'id' | 'userId' | 'createdAt'>>): Mt5Account | null {
    const mt5 = this.state.mt5Accounts.find(a => a.id === id);
    if (!mt5) return null;
    Object.assign(mt5, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    this.save();

    this.saveToPostgres('Mt5Account', mt5, 'update');
    return mt5;
  }

  public deleteMt5Account(id: string): boolean {
    const index = this.state.mt5Accounts.findIndex(a => a.id === id);
    if (index === -1) return false;
    this.state.mt5Accounts.splice(index, 1);
    this.save();

    if (this.isPostgres) {
      this.models.Mt5Account.destroy({ where: { id } }).catch((err: any) => console.error(err));
    }
    return true;
  }

  // --- Bot Activations ---
  public getBotActivations(): BotActivation[] {
    return this.state.botActivations;
  }

  public getBotActivationForUser(userId: string): BotActivation | undefined {
    return this.state.botActivations.find(b => b.userId === userId);
  }

  public createBotActivation(userId: string, mt5AccountId: string, initialStatus: BotActivationStatus = 'PENDING_PAYMENT'): BotActivation {
    // Check if one already exists
    this.state.botActivations = this.state.botActivations.filter(b => b.userId !== userId);

    const now = new Date().toISOString();
    const botAct: BotActivation = {
      id: this.generateId(),
      userId,
      mt5AccountId,
      status: initialStatus,
      timeline: [
        {
          status: 'PENDING_PAYMENT',
          timestamp: now,
          title: 'Subscription Started',
          description: 'Payment status initialized.',
          completed: true
        }
      ],
      createdAt: now,
      updatedAt: now
    };
    this.state.botActivations.push(botAct);
    this.save();

    if (this.isPostgres) {
      this.models.BotActivation.destroy({ where: { userId } })
        .then(() => this.saveToPostgres('BotActivation', botAct, 'insert'))
        .catch((err: any) => console.error(err));
    }
    return botAct;
  }

  public updateBotActivationStatus(id: string, status: BotActivationStatus, adminNotes?: string, byUserEmail?: string): BotActivation | null {
    const act = this.state.botActivations.find(a => a.id === id);
    if (!act) return null;
    
    act.status = status;
    act.updatedAt = new Date().toISOString();
    if (adminNotes !== undefined) act.adminNotes = adminNotes;

    // Check if this status is already in timeline, if so complete it, else add it
    const existingIndex = act.timeline.findIndex(t => t.status === status);
    if (existingIndex !== -1) {
      act.timeline[existingIndex].completed = true;
      act.timeline[existingIndex].timestamp = new Date().toISOString();
    } else {
      // Add custom timeline titles & description based on state
      let title = 'Bot State Updated';
      let description = `Bot transitioned to state ${status}.`;

      switch(status) {
        case 'PAYMENT_CONFIRMED':
          title = 'Payment Confirmed';
          description = 'Transaction processed and subcription verified.';
          break;
        case 'WAITING_FOR_BOT_TEAM':
          title = 'Awaiting Deployment';
          description = 'Credentials verified. Queueing for MetaTrader 5 bot attachment.';
          break;
        case 'IN_PROGRESS':
          title = 'VPS Installation';
          description = 'Configuring expert advisors and security trailing stops on dedicated VPS.';
          break;
        case 'ACTIVE':
          title = 'Bot Active';
          description = 'Expert Advisor is running, listening to buy/sell signals with live constraints.';
          break;
        case 'PAUSED':
          title = 'Bot Paused';
          description = 'Operations put on hold temporarily.';
          break;
        case 'FAILED':
          title = 'Activation Failed';
          description = 'Credentials failed to connect or broker server threw timeout.';
          break;
        case 'CANCELLED':
          title = 'Bot Terminated';
          description = 'Trading execution cancelled.';
          break;
      }

      act.timeline.push({
        status,
        timestamp: new Date().toISOString(),
        title,
        description,
        completed: true,
        byUser: byUserEmail
      });
    }

    this.save();
    this.saveToPostgres('BotActivation', act, 'update');
    return act;
  }

  // --- Plans ---
  public getSubscriptionPlans(): SubscriptionPlan[] {
    const requiredPlans: SubscriptionPlan[] = [
      {
        id: 'plan-premium-month',
        name: 'PREMIUM ACCESS',
        description: 'Standard automated MetaTrader 5 bot deployment with dedicated VPS hosting.',
        price: 100.00,
        interval: 'month',
        features: [
          'Up to 3 Linked MT5 Accounts',
          'Standard Drawdown Safeguards',
          'Dedicated VPS Hosting Included',
          'Low-Latency Execution',
          'Standard Support'
        ],
        stripePriceId: 'price_premium_monthly'
      },
      {
        id: 'plan-vip-month',
        name: 'VIP UNLIMITED',
        description: 'Unlimited bot access. 20% profit-sharing fee applies to trading profits generated by the bot.',
        price: 200.00,
        interval: 'month',
        features: [
          'Unlimited Linked MT5 Accounts',
          'Custom High-Frequency Bot Strategies',
          'Dedicated High-Priority VPS',
          '20% Monthly Profit Share Settlement Agreement',
          '1-on-1 VIP Setup & Telegram Priority Support'
        ],
        stripePriceId: 'price_vip_monthly'
      }
    ];

    if (!this.state.subscriptionPlans || this.state.subscriptionPlans.length < 2 || !this.state.subscriptionPlans.some(p => p.id === 'plan-vip-month')) {
      this.state.subscriptionPlans = requiredPlans;
      this.save();
    }

    return this.state.subscriptionPlans;
  }

  public findPlanById(id: string): SubscriptionPlan | undefined {
    if (id === 'plan-pro-month') {
      return this.getSubscriptionPlans().find(p => p.id === 'plan-premium-month');
    }
    return this.getSubscriptionPlans().find(p => p.id === id);
  }

  // --- Subscriptions ---
  public getSubscriptions(): UserSubscription[] {
    return this.state.userSubscriptions;
  }

  public getSubscriptionForUser(userId: string): UserSubscription | undefined {
    return this.state.userSubscriptions.find(s => s.userId === userId && s.status !== 'CANCELED');
  }

  public createUserSubscription(userId: string, planId: string, stripeSubId?: string): UserSubscription {
    this.state.userSubscriptions = this.state.userSubscriptions.filter(s => s.userId !== userId);
    const sub: UserSubscription = {
      id: this.generateId(),
      userId,
      planId,
      status: 'ACTIVE',
      stripeSubscriptionId: stripeSubId,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    };
    this.state.userSubscriptions.push(sub);
    this.save();

    if (this.isPostgres) {
      this.models.UserSubscription.destroy({ where: { userId } })
        .then(() => this.saveToPostgres('UserSubscription', sub, 'insert'))
        .catch((err: any) => console.error(err));
    }
    return sub;
  }

  public updateUserSubscription(id: string, updates: Partial<Omit<UserSubscription, 'id' | 'userId'>>): UserSubscription | null {
    const sub = this.state.userSubscriptions.find(s => s.id === id);
    if (!sub) return null;
    Object.assign(sub, updates);
    this.save();

    this.saveToPostgres('UserSubscription', sub, 'update');
    return sub;
  }

  // --- Payments ---
  public getPayments(): Payment[] {
    return this.state.payments;
  }

  public createPayment(data: Omit<Payment, 'id' | 'createdAt'>): Payment {
    const pay: Payment = {
      ...data,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    };
    this.state.payments.push(pay);
    this.save();

    this.saveToPostgres('Payment', pay, 'insert');
    return pay;
  }

  // --- Notifications ---
  public getNotificationsForUser(userId: string): Notification[] {
    return this.state.notifications.filter(n => n.userId === userId);
  }

  public createNotification(userId: string, title: string, message: string, type: NotificationType = 'SYSTEM'): Notification {
    const notif: Notification = {
      id: this.generateId(),
      userId,
      title,
      message,
      read: false,
      type,
      createdAt: new Date().toISOString()
    };
    this.state.notifications.push(notif);
    this.save();

    this.saveToPostgres('Notification', notif, 'insert');
    return notif;
  }

  public markNotificationAsRead(id: string): boolean {
    const notif = this.state.notifications.find(n => n.id === id);
    if (!notif) return false;
    notif.read = true;
    this.save();

    this.saveToPostgres('Notification', notif, 'update');
    return true;
  }

  public markAllNotificationsAsRead(userId: string): void {
    this.state.notifications
      .filter(n => n.userId === userId)
      .forEach(n => n.read = true);
    this.save();

    if (this.isPostgres) {
      this.models.Notification.update({ read: true }, { where: { userId } }).catch((err: any) => console.error(err));
    }
  }

  // --- Activity Logs ---
  public getActivityLogs(): ActivityLog[] {
    return this.state.activityLogs;
  }

  public createActivityLog(userId: string, action: string, details?: string, ipAddress?: string): ActivityLog {
    const log: ActivityLog = {
      id: this.generateId(),
      userId,
      action,
      details,
      ipAddress,
      createdAt: new Date().toISOString()
    };
    this.state.activityLogs.push(log);
    this.save();

    this.saveToPostgres('ActivityLog', log, 'insert');
    return log;
  }

  // --- Admin Notes ---
  public getAdminNotesForTarget(targetId: string): AdminNote[] {
    return this.state.adminNotes.filter(n => n.targetId === targetId);
  }

  public createAdminNote(targetId: string, targetType: 'USER' | 'MT5' | 'BOT_ACTIVATION', note: string, adminId: string, adminEmail: string): AdminNote {
    const adminNote: AdminNote = {
      id: this.generateId(),
      targetId,
      targetType,
      note,
      adminId,
      adminEmail,
      createdAt: new Date().toISOString()
    };
    this.state.adminNotes.push(adminNote);
    this.save();

    this.saveToPostgres('AdminNote', adminNote, 'insert');
    return adminNote;
  }

  // --- Trades ---
  public getTradesForUser(userId: string): Trade[] {
    return this.state.trades.filter(t => t.userId === userId);
  }

  public getPaginatedTradesForUser(userId: string, page: number, limit: number): { trades: Trade[]; total: number; pages: number; page: number } {
    const userTrades = this.state.trades
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const total = userTrades.length;
    const startIndex = (page - 1) * limit;
    const paginatedTrades = userTrades.slice(startIndex, startIndex + limit);
    const pages = Math.max(1, Math.ceil(total / limit));

    return {
      trades: paginatedTrades,
      total,
      pages,
      page
    };
  }

  public createTrade(data: Omit<Trade, 'id' | 'createdAt'>): Trade {
    const trade: Trade = {
      ...data,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    };
    this.state.trades.push(trade);
    this.save();

    this.saveToPostgres('Trade', trade, 'insert');
    return trade;
  }
}

export const db = new VinebotDatabase();
