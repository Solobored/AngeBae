import bcrypt from "bcrypt";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Use your Supabase service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateAdminPassword() {
  try {
    const email = process.env.ADMIN_EMAIL || "admin@skincarepro.com";
    const plainPassword = process.env.ADMIN_PASSWORD || "admin123";

    // Hash the password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Update the admin user in Supabase
    const { data, error } = await supabase
      .from("admins")
      .update({ password: hashedPassword })
      .eq("email", email);

    if (error) throw error;

    console.log("Admin password updated successfully:", data);
    process.exit(0);
  } catch (err) {
    console.error("Error updating admin password:", err);
    process.exit(1);
  }
}

updateAdminPassword();
