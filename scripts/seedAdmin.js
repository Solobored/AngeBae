#!/usr/bin/env node
/**
 * Seed Admin User Script
 * Hashes password with bcrypt and inserts admin into PostgreSQL
 * 
 * Usage: node scripts/seedAdmin.js [email] [password]
 * Or uses ADMIN_EMAIL and ADMIN_PASSWORD from .env
 */

import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env.example') });

async function main() {
  const email = process.argv[2] || process.env.ADMIN_EMAIL || 'admin@angebae.local';
  const password = process.argv[3] || process.env.ADMIN_PASSWORD || 'admin123';
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    // Connect to database
    console.log('🔗 Connecting to database...');
    await client.connect();

    // Hash password
    console.log('🔐 Hashing password...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Check if admin already exists
    const existingAdmin = await client.query(
      'SELECT id FROM admins WHERE email = $1',
      [email]
    );

    if (existingAdmin.rows.length > 0) {
      // Update existing admin
      console.log(`📝 Updating existing admin: ${email}`);
      await client.query(
        `UPDATE admins 
         SET password = $1, updated_at = NOW() 
         WHERE email = $2`,
        [hashedPassword, email]
      );
      console.log('✅ Admin password updated successfully!');
    } else {
      // Insert new admin
      console.log(`📝 Creating new admin: ${email}`);
      const result = await client.query(
        `INSERT INTO admins (id, email, password, name, active, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, true, NOW(), NOW())
         RETURNING id, email, name, active, created_at`,
        [email, hashedPassword, email.split('@')[0]]
      );

      const admin = result.rows[0];
      console.log('✅ Admin created successfully!');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   Active: ${admin.active}`);
      console.log(`   Created: ${admin.created_at}`);
    }

    console.log('\n🔑 Login credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n⚠️  Remember to change the password after first login!');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
