import nodemailer from "nodemailer";

const FROM_EMAIL = "ECP Laboratory <ecplaboratoryinventory@gmail.com>";

function getTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER || "ecplaboratoryinventory@gmail.com",
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.GMAIL_APP_PASSWORD) {
    console.warn("GMAIL_APP_PASSWORD not configured — skipping email to", to);
    return;
  }
  try {
    const transporter = getTransporter();
    await transporter.sendMail({ from: FROM_EMAIL, to, subject, html });
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

export function borrowApprovedEmail(studentName: string, equipmentName: string, quantity: number) {
  const subject = `Your borrow request has been approved`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0a2e3f; padding: 20px; text-align: center;">
        <h1 style="color: #fff; margin: 0;">ECP Laboratory</h1>
      </div>
      <div style="padding: 24px; background: #fff; border: 1px solid #dde4ec;">
        <h2 style="color: #0a2e3f;">Borrow Request Approved</h2>
        <p>Hello ${studentName},</p>
        <p>Your borrow request has been <strong style="color: #10b981;">approved</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Equipment</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${equipmentName}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Quantity</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${quantity}</td></tr>
        </table>
        <p>Please return the equipment on time. Thank you!</p>
      </div>
    </div>
  `;
  return { subject, html };
}

export function borrowReturnedEmail(studentName: string, equipmentName: string) {
  const subject = `Equipment return confirmed`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0a2e3f; padding: 20px; text-align: center;">
        <h1 style="color: #fff; margin: 0;">ECP Laboratory</h1>
      </div>
      <div style="padding: 24px; background: #fff; border: 1px solid #dde4ec;">
        <h2 style="color: #0a2e3f;">Return Confirmed</h2>
        <p>Hello ${studentName},</p>
        <p>Your return of <strong>${equipmentName}</strong> has been <strong style="color: #10b981;">confirmed</strong>.</p>
        <p>Thank you for returning the equipment!</p>
      </div>
    </div>
  `;
  return { subject, html };
}
