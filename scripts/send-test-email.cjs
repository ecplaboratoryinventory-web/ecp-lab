const nodemailer = require("nodemailer");
const crypto = require("crypto");
require("dotenv").config({ path: "web/.env.local" });

async function main() {
  const email = "ecplaboratoryinventory@gmail.com";
  const token = crypto.randomBytes(32).toString("hex");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetLink = `${baseUrl}/auth/set-password?token=${token}&email=${encodeURIComponent(email)}`;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
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
          <p>You requested a password reset. Click below to set a new password:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetLink}" style="background: #0a2e3f; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #666; font-size: 13px;">This link expires in 1 hour.</p>
          <p style="color: #666; font-size: 13px;">Or: <code>${resetLink}</code></p>
        </div>
      </div>
    `,
  });

  console.log("Sent to:", email);
  console.log("Reset link:", resetLink);
  console.log("Token:", token);
}

main().catch((err) => console.error("FAILED:", err.message, err.code));
