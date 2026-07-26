import { createClient } from "@/lib/supabase/client";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: "borrow_status" | "damage_report" | "system" | "announcement",
  referenceType?: "borrow_request" | "damage_report" | "announcement",
  referenceId?: string,
) {
  const supabase = createClient();
  await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    reference_type: referenceType || null,
    reference_id: referenceId || null,
  });
}

export async function notifyRole(
  role: "admin" | "faculty" | "student",
  title: string,
  message: string,
  type: "borrow_status" | "damage_report" | "system" | "announcement",
  referenceType?: "borrow_request" | "damage_report" | "announcement",
  referenceId?: string,
) {
  const supabase = createClient();
  await supabase.from("notifications").insert({
    role,
    title,
    message,
    type,
    reference_type: referenceType || null,
    reference_id: referenceId || null,
  });
}
