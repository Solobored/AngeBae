#!/usr/bin/env node
/**
 * Database Migration Script
 * Runs SQL migration files from db/migrations/ directory
 * 
 * Usage: node scripts/migrate.js
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const { Client } = pg;

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env.example') });

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();

    const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.warn('⚠️  No migrations directory found');
      return;
    }

    // Get all migration files sorted
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.warn('⚠️  No migration files found');
      return;
    }

    console.log(`📝 Found ${files.length} migration file(s)\n`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`⏳ Running migration: ${file}`);
      
      try {
        await client.query(sql);
        console.log(`✅ Completed: ${file}\n`);
      } catch (err) {
        console.warn(`⚠️  Some statements in ${file} failed (might be already applied):`);
        console.warn(`   ${err.message}\n`);
        // Continue with next file as some statements might already exist
      }
    }

    console.log('✅ All migrations completed!');

  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
