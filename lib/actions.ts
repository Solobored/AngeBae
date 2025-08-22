"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Server Actions for auth flows.
 * You can call these from forms or client components via startTransition/fetch.
 */

export async function signIn(_: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = createServerSupabaseClient();

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  // Optional: support ?redirect=...
  const redirectTo = String(formData.get("redirect") ?? "/admin");
  redirect(redirectTo);
}

export async function signUp(_: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = createServerSupabaseClient();

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  return { success: "Check your email to confirm your account." };
}

export async function signOut() {
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
