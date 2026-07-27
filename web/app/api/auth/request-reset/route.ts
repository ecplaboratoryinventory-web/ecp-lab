import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

    const supabase = await createServiceClient();

    const { data: user } = await supabase
      .from("users")
      .select("id, email, full_name")
      .eq("email", email)
      .single();

    if (!user) {
      return NextResponse.json({ error: "No account found with this email address." }, { status: 404 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token + email).digest("hex");
    const expiresAt = new Date(Date.now() + 3600000).toISOString();
    const code = crypto.randomInt(100000, 999999).toString();

    await supabase
      .from("users")
      .update({ reset_token: hashedToken, reset_token_expires: expiresAt, reset_code: code } as Record<string, unknown>)
      .eq("id", user.id);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/auth/set-password?token=${token}&email=${encodeURIComponent(email)}`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0a2e3f; padding: 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">ECP Laboratory</h1>
        </div>
        <div style="padding: 24px; background: #fff; border: 1px solid #dde4ec;">
          <h2 style="color: #0a2e3f;">Password Reset Request</h2>
          <p>Hello${user.full_name ? ` ${user.full_name}` : ""},</p>
          <p>Click below to set a new password:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetLink}" style="background: #0a2e3f; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #666; font-size: 13px;">Expires in 1 hour.</p>
        </div>
      </div>
    `;

    await sendEmail(email, "Reset Your Password — ECP Laboratory", html);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Request reset error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
