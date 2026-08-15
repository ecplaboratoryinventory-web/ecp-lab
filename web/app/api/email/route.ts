import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, borrowApprovedEmail, borrowReturnedEmail } from "@/lib/email";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!["admin", "staff"].includes(profile?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (isRateLimited(`email:${user.id}`, 10)) {
      return NextResponse.json(
        { error: "Rate limited. Try again later." },
        { status: 429 },
      );
    }

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
