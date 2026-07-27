const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: "web/.env.local" });

async function main() {
  const email = "ecplaboratoryinventory@gmail.com";
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token + email).digest("hex");
  const expiresAt = new Date(Date.now() + 3600000).toISOString();
  const code = crypto.randomInt(100000, 999999).toString();

  // Store token in Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: user, error: lookupErr } = await supabase
    .from("users").select("id, full_name").eq("email", email).single();

  if (lookupErr || !user) {
    console.error("User not found:", lookupErr?.message);
    process.exit(1);
  }

  const { error: updateErr } = await supabase
    .from("users")
    .update({ reset_token: hashedToken, reset_token_expires: expiresAt, reset_code: code })
    .eq("id", user.id);

  if (updateErr) {
    console.error("Failed to store token:", updateErr.message);
    process.exit(1);
  }

  console.log("Token stored in DB for user:", user.full_name || user.email);

  // Send email
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ecp-lab-web.vercel.app";
  const resetLink = `${baseUrl}/auth/set-password?token=${token}&email=${encodeURIComponent(email)}`;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", port: 587, secure: false,
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });

  await transporter.sendMail({
    from: "ECP Laboratory <ecplaboratoryinventory@gmail.com>",
    to: email,
    subject: "Reset Your Password — ECP Laboratory",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0a2e3f; padding: 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">ECP Laboratory</h1>
        </div>
        <div style="padding: 24px; background: #fff; border: 1px solid #dde4ec;">
          <h2 style="color: #0a2e3f;">Password Reset Request</h2>
          <p>Hello ${user.full_name || ""},</p>
          <p>Click below to set a new password:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetLink}" style="background: #0a2e3f; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #666; font-size: 13px;">Expires in 1 hour. Link: <code>${resetLink}</code></p>
        </div>
      </div>
    `,
  });

  console.log("Email sent to:", email);
  console.log("Reset link:", resetLink);
}

main().catch((err) => console.error("FAILED:", err.message, err.code));
