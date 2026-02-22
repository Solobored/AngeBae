import pkg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

const { Pool } = pkg;
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:admin123@localhost:5432/angebae',
  ssl: process.env.DATABASE_SSL === 'true',
});

async function updateAdminPassword() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@angebae.com';
    const plainPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

    // Hash the password (10 rounds)
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Update admin password in PostgreSQL
    const result = await pool.query(
      'UPDATE admins SET password = $1, updated_at = NOW() WHERE email = $2 RETURNING id, email',
      [hashedPassword, email]
    );

    if (result.rows.length === 0) {
      console.error(`❌ Admin user with email ${email} not found`);
      process.exit(1);
    }

    console.log(`✓ Admin password updated successfully for ${email}`);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating admin password:', err.message);
    await pool.end();
    process.exit(1);
  }
}

updateAdminPassword();
