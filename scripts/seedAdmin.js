// scripts/seedAdmin.js
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';

async function seedAdmin() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or Service Role Key is missing in your .env');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Hash the admin password
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

    // Insert admin user
    const { data, error } = await supabase.from('admins').insert({
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      created_at: new Date(),
      updated_at: new Date(),
    });

    if (error) {
      console.error('Error seeding admin:', error);
    } else {
      console.log('Admin user seeded successfully:', data);
    }
  } catch (err) {
    console.error('Error seeding admin:', err);
  }
}

// Run the script
seedAdmin();
