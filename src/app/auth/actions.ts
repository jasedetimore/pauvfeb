"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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
      data: {
        username,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
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

  return { success: true, message: "Check your email for confirmation link!" };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  
  // Revalidate all paths to clear cached data after logout
  revalidatePath("/", "layout");
  
  redirect("/");
}
