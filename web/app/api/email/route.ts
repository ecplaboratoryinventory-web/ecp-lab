import { NextRequest, NextResponse } from "next/server";
import { sendEmail, borrowApprovedEmail, borrowReturnedEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, email, studentName, equipmentName, quantity } = body;

    if (!email || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let subject: string;
    let html: string;

    switch (type) {
      case "approved":
        ({ subject, html } = borrowApprovedEmail(studentName, equipmentName, quantity));
        break;
      case "returned":
        ({ subject, html } = borrowReturnedEmail(studentName, equipmentName));
        break;
      default:
        return NextResponse.json({ error: "Invalid email type" }, { status: 400 });
    }

    await sendEmail(email, subject, html);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email API error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
