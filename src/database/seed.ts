/**
 * Standalone Database Seeding Script for Production
 * Supports dynamic configuration on Railway / Postgres
 */

import { db } from './db';

async function seedDatabase() {
  console.log('[SEED] Starting standalone database seeding check...');
  try {
    // db.init() automatically connects to Postgres (if DATABASE_URL is set) or
    // falls back to the JSON database. It runs count checks and performs auto-seeding
    // if the tables are empty.
    await db.init();
    
    const usersCount = await db.models.User.count();
    const plansCount = await db.models.SubscriptionPlan.count();
    
    console.log(`[SEED] Seeding status: Users: ${usersCount}, Subscription Plans: ${plansCount}`);
    console.log('[SEED] Database verification completed successfully. Ready for operations.');
    process.exit(0);
  } catch (error) {
    console.error('[SEED] Fatal error during standalone database seeding:', error);
    process.exit(1);
  }
}

seedDatabase();
