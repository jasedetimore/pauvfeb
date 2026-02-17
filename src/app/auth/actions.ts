"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getURL } from "@/lib/utils/get-url";

const REQUIRE_EMAIL_CONFIRMATION =
  process.env.AUTH_REQUIRE_EMAIL_CONFIRMATION === "true" ||
  process.env.NODE_ENV === "production";

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = formData.get("username") as string;

  // Sign up with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getURL()}auth/callback?next=/auth/verified`,
      data: {
        username,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  // Safety guard: in environments where confirmations are required,
  // ensure we don't keep an authenticated session even if provider config drifts.
  if (REQUIRE_EMAIL_CONFIRMATION && authData.session) {
    await supabase.auth.signOut();
  }

  // If sign up was successful, create a user record in the users table
  if (authData.user) {
    const { error: userError } = await supabase.from("users").insert({
      user_id: authData.user.id,
      username,
      usdp_balance: 1000, // Give new users 1000 USDP to start
    });

    if (userError) {
      console.error("Error creating user record:", userError);
      // Don't fail the signup if user record creation fails
      // The user can still log in and we can create the record later
    }
  }

  return {
    success: true,
    requiresEmailConfirmation: REQUIRE_EMAIL_CONFIRMATION,
    message: REQUIRE_EMAIL_CONFIRMATION
      ? "Check your email for confirmation link!"
      : "Account created successfully! You can now sign in.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  
  // Revalidate all paths to clear cached data after logout
  revalidatePath("/", "layout");
  
  redirect("/");
}

/**
 * Invite an issuer by email using Supabase's built-in invite flow.
 * Uses the service_role client to call auth.admin.inviteUserByEmail.
 * The user will receive an email with a {{ .ConfirmationURL }} that
 * redirects to /auth/confirm-invite where the PKCE code is exchanged.
 *
 * IMPORTANT: This must only be called from the admin dashboard.
 */
export async function inviteIssuer(email: string): Promise<{ success: boolean; error?: string }> {
  if (!email || typeof email !== "string") {
    return { success: false, error: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Invalid email address" };
  }

  try {
    const adminClient = createAdminClient();

    const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${getURL()}auth/confirm-invite`,
    });

    if (error) {
      console.error("inviteIssuer error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("inviteIssuer unexpected error:", err);
    return { success: false, error: "Failed to send invitation" };
  }
}
