"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function resetPasswordAction(formData: FormData) {
  const email = formData.get("email") as string;

  const supabase = await createClient();

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  });

  redirect("/auth/login?message=Check your email for the reset link");
}
