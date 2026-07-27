import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { token, email, password } = await req.json();

    if (!token || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const supabase = await createServiceClient();
    const hashedToken = crypto.createHash("sha256").update(token + email).digest("hex");

    // Find user with valid reset token
    const { data: user } = await supabase
      .from("users")
      .select("id, reset_token, reset_token_expires")
      .eq("email", email)
      .eq("reset_token", hashedToken)
      .single();

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    if (user.reset_token_expires && new Date(user.reset_token_expires) < new Date()) {
      return NextResponse.json({ error: "Reset link has expired. Please request a new one." }, { status: 400 });
    }

    // Update password using admin API
    const { error: authError } = await supabase.auth.admin.updateUserById(user.id, { password });

    if (authError) {
      console.error("Failed to update password:", authError);
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
    }

    // Clear reset tokens
    await supabase
      .from("users")
      .update({ reset_token: null, reset_token_expires: null, reset_code: null } as Record<string, unknown>)
      .eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Complete reset error:", err);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
