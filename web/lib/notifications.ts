import { createClient } from "@/lib/supabase/client";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: "borrow_status" | "damage_report" | "system" | "announcement" | "overdue_reminder",
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
  type: "borrow_status" | "damage_report" | "system" | "announcement" | "overdue_reminder",
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

// Convenience: send notification via DB RPC (bypasses RLS, works from mobile too)
export async function notifyUserRpc(
  userId: string,
  title: string,
  message: string,
  type: string = "borrow_status",
  referenceType?: string,
  referenceId?: string,
) {
  const supabase = createClient();
  await supabase.rpc("notify_user" as never, {
    p_user_id: userId,
    p_title: title,
    p_message: message,
    p_type: type,
    p_reference_type: referenceType || null,
    p_reference_id: referenceId || null,
  } as never);
}

export async function notifyRoleRpc(
  role: string,
  title: string,
  message: string,
  type: string = "borrow_status",
  referenceType?: string,
  referenceId?: string,
) {
  const supabase = createClient();
  await supabase.rpc("notify_role_users" as never, {
    p_role: role,
    p_title: title,
    p_message: message,
    p_type: type,
    p_reference_type: referenceType || null,
    p_reference_id: referenceId || null,
  } as never);
}
