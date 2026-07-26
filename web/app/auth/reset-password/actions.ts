"use server";

import { sendEmail } from "@/lib/email";
import { redirect } from "next/navigation";

export async function resetPasswordAction(formData: FormData) {
  const email = formData.get("email") as string;
  if (!email) redirect("/auth/reset-password?error=Email is required");

  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0a2e3f; padding: 20px; text-align: center;">
        <h1 style="color: #fff; margin: 0;">ECP Laboratory</h1>
      </div>
      <div style="padding: 24px; background: #fff; border: 1px solid #dde4ec;">
        <h2 style="color: #0a2e3f;">Password Reset Request</h2>
        <p>You requested a password reset for <strong>${email}</strong>.</p>
        <p>A reset link has been sent to your email. Please check your inbox.</p>
        <p style="color: #666; font-size: 13px;">If you didn't request this, ignore this email.</p>
      </div>
    </div>
  `;

  await sendEmail(email, "Reset Your Password — ECP Laboratory", html);

  redirect(`/auth/login?message=Reset link sent to ${encodeURIComponent(email)}`);
}
