import { createClient } from "@/lib/supabase/client";

export async function logActivity(
  userId: string | undefined,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>,
) {
  const supabase = createClient();
  if (!userId) {
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id;
  }
  if (!userId) return;

  await supabase.from("activity_logs").insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId || null,
    details: details || null,
  });
}
