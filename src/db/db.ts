import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let dbInstance: any = null;

export const getDb = () => {
  if (!dbInstance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.error('CRITICAL: DATABASE_URL is missing from environment variables.');
      throw new Error('DATABASE_URL environment variable is required. Please add it to your project settings.');
    }
    
    try {
      console.log('[DB] Initializing database client...');
      const client = postgres(connectionString, {
        ssl: 'allow', // Supabase often requires SSL
        connect_timeout: 10
      });
      dbInstance = drizzle(client, { schema });
    } catch (err) {
      console.error('[DB] Failed to initialize Postgres client:', err);
      throw err;
    }
  }
  return dbInstance;
};
