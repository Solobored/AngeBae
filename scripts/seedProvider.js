#!/usr/bin/env node
/**
 * Seed example provider (AngeBae) and owner user
 * Usage: node scripts/seedProvider.js
 */

const bcrypt = require('bcrypt')
const pg = require('pg')
const path = require('path')
const dotenv = require('dotenv')

const { Client } = pg

dotenv.config({ path: path.join(__dirname, '..', '.env') })
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })
dotenv.config({ path: path.join(__dirname, '..', '.env.example') })

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set')
    process.exit(1)
  }

  const client = new Client({ connectionString: databaseUrl })

  const email = process.env.PROVIDER_SEED_EMAIL || 'angebae.provider@local'
  const password = process.env.PROVIDER_SEED_PASSWORD || 'Provider@123456'
  const providerName = process.env.PROVIDER_SEED_NAME || 'AngeBae'
  const providerSlug = 'angebae'

  try {
    await client.connect()
    console.log('🔗 Connected to database')

    const passwordHash = await bcrypt.hash(password, 10)

    // Upsert user
    const userResult = await client.query(
      `INSERT INTO users (id, email, password_hash, name, is_verified, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, true, now(), now())
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = now()
       RETURNING id`,
      [email, passwordHash, providerName],
    )
    const userId = userResult.rows[0].id
    console.log(`👤 User ready: ${email} (${userId})`)

    // Upsert provider
    const providerResult = await client.query(
      `INSERT INTO providers (id, owner_user_id, name, slug, description, is_published, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, 'Proveedor de ejemplo AngeBae', true, now(), now())
       ON CONFLICT (slug) DO UPDATE SET owner_user_id = EXCLUDED.owner_user_id, name = EXCLUDED.name, updated_at = now()
       RETURNING id`,
      [userId, providerName, providerSlug],
    )
    const providerId = providerResult.rows[0].id
    console.log(`🏪 Provider ready: ${providerName} (${providerId})`)

    // Upsert provider_users
    await client.query(
      `INSERT INTO provider_users (id, provider_id, user_id, role, created_at)
       VALUES (gen_random_uuid(), $1, $2, 'owner', now())
       ON CONFLICT (provider_id, user_id) DO NOTHING`,
      [providerId, userId],
    )

    // Upsert brand_settings
    await client.query(
      `INSERT INTO brand_settings (id, provider_id, logo_url, site_title, subtitle, colors, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, '', $2, 'Parte de Beauty Therapist', '{}'::jsonb, now(), now())
       ON CONFLICT (provider_id) DO UPDATE SET site_title = EXCLUDED.site_title, subtitle = EXCLUDED.subtitle, updated_at = now()`,
      [providerId, providerName],
    )

    console.log('✅ Seed complete')
    console.log(`   Login email: ${email}`)
    console.log(`   Password:    ${password}`)
    console.log(`   Provider ID: ${providerId}`)
  } catch (err) {
    console.error('❌ Seed error:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('❌ Fatal:', err)
  process.exit(1)
})
